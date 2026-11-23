import { Router } from 'express';
import { elevatorsController } from '../controllers/elevators.controller';
import { requireRole } from '../middlewares/auth';

// Todas las rutas exigen token (requireAuth se aplica en app.ts).
// Consultar: cualquier rol. Crear/editar/borrar: solo ADMIN.
export const elevatorsRouter = Router();

elevatorsRouter.get('/', elevatorsController.list);
elevatorsRouter.get('/summary', elevatorsController.summary);
elevatorsRouter.get('/:id', elevatorsController.getById);
elevatorsRouter.post('/', requireRole('ADMIN'), elevatorsController.create);
elevatorsRouter.put('/:id', requireRole('ADMIN'), elevatorsController.update);
elevatorsRouter.delete('/:id', requireRole('ADMIN'), elevatorsController.remove);
