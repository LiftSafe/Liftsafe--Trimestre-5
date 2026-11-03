import { app } from './app';
import { logger } from './config/logger';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 API de ascensores LiftSafe escuchando en http://localhost:${PORT}/api/v1/elevators`);
  logger.info(`Entorno: ${process.env.NODE_ENV ?? 'development'}`);
});
