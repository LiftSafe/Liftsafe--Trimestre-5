import express from 'express';
import { morganMiddleware } from './config/logger';
import { requireAuth } from './middlewares/auth';
import { authRouter } from './routes/auth.routes';
import { buildingsRouter } from './routes/buildings.routes';
import { elevatorsRouter } from './routes/elevators.routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

export const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(morganMiddleware);

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api/v1/auth', authRouter);
// Desde aquí todo exige un token JWT válido
app.use('/api/v1/elevators', requireAuth, elevatorsRouter);
app.use('/api/v1/buildings', requireAuth, buildingsRouter);

app.use(notFound); // 404 en JSON para rutas que no existen
app.use(errorHandler); // siempre el último
