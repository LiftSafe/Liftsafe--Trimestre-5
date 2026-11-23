import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

// Cualquier ruta que no exista responde 404 en JSON (no la página HTML de Express)
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}
