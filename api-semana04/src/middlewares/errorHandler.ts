import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { logger } from '../config/logger';

// Express reconoce un manejador de errores porque recibe exactamente 4 parámetros.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // 1) Datos inválidos (Zod) → 400 con el detalle de cada problema
  if (err instanceof ZodError) {
    logger.warn(`Validación fallida en ${req.method} ${req.originalUrl}`, { issues: err.issues.length });
    res.status(400).json({ status: 'error', message: 'Datos inválidos', issues: err.issues });
    return;
  }

  // 2) Errores esperados de la aplicación → su propio statusCode
  if (err instanceof AppError) {
    logger.warn(`${err.statusCode} ${err.message}`, { method: req.method, path: req.originalUrl });
    res.status(err.statusCode).json({ status: 'error', message: err.message });
    return;
  }

  // JSON mal escrito en el cuerpo (lo detecta express.json) → 400
  if (err instanceof SyntaxError && 'body' in err) {
    logger.warn(`JSON mal formado en ${req.method} ${req.originalUrl}`);
    res.status(400).json({ status: 'error', message: 'El cuerpo de la petición no es un JSON válido' });
    return;
  }

  // 3) Cualquier otro error → 500 sin filtrar detalles internos al cliente
  logger.error('Error no controlado', { error: err instanceof Error ? err.stack : String(err), path: req.originalUrl });
  res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
}
