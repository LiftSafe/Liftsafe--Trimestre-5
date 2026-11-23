import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { authService } from '../services/auth.service';
import type { Role } from '../types';

// Exige "Authorization: Bearer <token>" válido y deja el usuario en req.user
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const cabecera = req.headers.authorization ?? '';
  const [esquema, token] = cabecera.split(' ');
  if (esquema !== 'Bearer' || !token) {
    next(new AppError(401, 'Falta el token: envía Authorization: Bearer <token>'));
    return;
  }
  try {
    const datos = authService.verificarToken(token);
    req.user = { id: datos.sub, email: datos.email, role: datos.role };
    next();
  } catch (err) {
    next(err);
  }
}

// Exige uno de los roles indicados (se usa después de requireAuth)
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'No autenticado'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError(403, 'No tienes permiso para esta acción'));
      return;
    }
    next();
  };
}
