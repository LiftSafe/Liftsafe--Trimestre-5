import type { NextFunction, Request, Response } from 'express';
import {
  createElevatorSchema,
  idParamSchema,
  paginationSchema,
  updateElevatorSchema,
} from '../schemas/elevator.schema';
import { elevatorsService } from '../services/elevators.service';

// Controlador delgado: valida la entrada, llama al servicio y responde.
// Cualquier error pasa al errorHandler con next(err).

// Valida :id; si no es válido responde 400 y devuelve null
function leerId(req: Request, res: Response): number | null {
  const resultado = idParamSchema.safeParse(req.params);
  if (!resultado.success) {
    res.status(400).json({ status: 'error', message: 'Id inválido', issues: resultado.error.issues });
    return null;
  }
  return resultado.data.id;
}

export const elevatorsController = {
  list(req: Request, res: Response, next: NextFunction): void {
    try {
      // parse lanza ZodError si page/limit no son válidos → errorHandler responde 400
      const query = paginationSchema.parse(req.query);
      res.json(elevatorsService.list(query));
    } catch (err) {
      next(err);
    }
  },

  getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = leerId(req, res);
      if (id === null) return;
      res.json({ data: elevatorsService.getById(id) });
    } catch (err) {
      next(err);
    }
  },

  create(req: Request, res: Response, next: NextFunction): void {
    try {
      const resultado = createElevatorSchema.safeParse(req.body);
      if (!resultado.success) {
        res.status(400).json({ status: 'error', message: 'Datos inválidos', issues: resultado.error.issues });
        return;
      }
      res.status(201).json({ data: elevatorsService.create(resultado.data) });
    } catch (err) {
      next(err);
    }
  },

  update(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = leerId(req, res);
      if (id === null) return;
      const resultado = updateElevatorSchema.safeParse(req.body);
      if (!resultado.success) {
        res.status(400).json({ status: 'error', message: 'Datos inválidos', issues: resultado.error.issues });
        return;
      }
      res.json({ data: elevatorsService.update(id, resultado.data) });
    } catch (err) {
      next(err);
    }
  },

  remove(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = leerId(req, res);
      if (id === null) return;
      elevatorsService.remove(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
