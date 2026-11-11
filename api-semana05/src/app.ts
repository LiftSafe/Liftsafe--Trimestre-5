import express from 'express';
import { morganMiddleware } from './config/logger';
import { elevatorsRouter } from './routes/elevators.routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

export const app = express();

app.use(express.json());
app.use(morganMiddleware);

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api/v1/elevators', elevatorsRouter);

app.use(notFound); // 404 en JSON para rutas que no existen
app.use(errorHandler); // siempre el último
