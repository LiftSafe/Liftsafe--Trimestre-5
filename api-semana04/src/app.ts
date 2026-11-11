import express from 'express';
import { morganMiddleware } from './config/logger';
import { elevatorsRouter } from './routes/elevators.routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

export const app = express();

// 1) Middlewares generales
app.use(express.json());
app.use(morganMiddleware);

// 2) Rutas
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api/v1/elevators', elevatorsRouter);

// 3) 404 para rutas inexistentes (antes del errorHandler)
app.use(notFound);

// 4) Manejador de errores (siempre el último)
app.use(errorHandler);
