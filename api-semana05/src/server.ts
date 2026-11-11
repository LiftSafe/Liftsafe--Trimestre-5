import 'dotenv/config';
import { app } from './app';
import { logger } from './config/logger';
import { prisma } from './lib/prisma';

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 API de ascensores LiftSafe (PostgreSQL + Prisma) en http://localhost:${PORT}/api/v1/elevators`);
  logger.info(`Entorno: ${process.env.NODE_ENV ?? 'development'}`);
});

// Cierre ordenado: deja de recibir peticiones y suelta la conexión a la base
async function cerrar(senal: string): Promise<void> {
  logger.info(`${senal} recibido, cerrando el servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Servidor cerrado');
    process.exit(0);
  });
}
process.on('SIGINT', () => void cerrar('SIGINT'));
process.on('SIGTERM', () => void cerrar('SIGTERM'));
