import { Router } from 'express';
import { buildingsController } from '../controllers/buildings.controller';

export const buildingsRouter = Router();

buildingsRouter.get('/', buildingsController.list);
