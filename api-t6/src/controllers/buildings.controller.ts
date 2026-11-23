import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const buildingsController = {
  // Edificios con cuántos ascensores tiene cada uno
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const edificios = await prisma.building.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { elevators: true } } },
      });
      res.json({
        data: edificios.map(({ _count, ...b }) => ({ ...b, totalElevators: _count.elevators })),
      });
    } catch (err) {
      next(err);
    }
  },
};
