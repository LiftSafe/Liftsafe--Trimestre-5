import { Router } from 'express';
import { elevatorsController } from '../controllers/elevators.controller';

export const elevatorsRouter = Router();

elevatorsRouter.get('/', elevatorsController.list);
elevatorsRouter.get('/:id', elevatorsController.getById);
elevatorsRouter.post('/', elevatorsController.create);
elevatorsRouter.put('/:id', elevatorsController.update);
elevatorsRouter.delete('/:id', elevatorsController.remove);
