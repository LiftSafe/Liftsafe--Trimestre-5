import type { NextFunction, Request, Response } from 'express';
import { loginSchema } from '../schemas/auth.schema';
import { authService } from '../services/auth.service';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const datos = loginSchema.parse(req.body);
      res.json({ data: await authService.login(datos) });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ data: await authService.perfil(req.user!.id) });
    } catch (err) {
      next(err);
    }
  },
};
