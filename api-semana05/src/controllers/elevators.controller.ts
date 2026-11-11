import type { NextFunction, Request, Response } from 'express';
import {
  createElevatorSchema,
  idParamSchema,
  paginationSchema,
  updateElevatorSchema,
} from '../schemas/elevator.schema';
import { elevatorsService } from '../services/elevators.service';

// Capa HTTP: valida la entrada con Zod (parse lanza ZodError → 400 en el errorHandler),
// llama al servicio y responde. Todo error termina en next(err).
export const elevatorsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = paginationSchema.parse(req.query);
      res.json(await elevatorsService.list(query));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      res.json({ data: await elevatorsService.getById(id) });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createElevatorSchema.parse(req.body);
      res.status(201).json({ data: await elevatorsService.create(data) });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = updateElevatorSchema.parse(req.body);
      res.json({ data: await elevatorsService.update(id, data) });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      await elevatorsService.remove(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
