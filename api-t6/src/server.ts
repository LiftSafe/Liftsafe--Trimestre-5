import { env } from './config/env'; // valida el .env antes de todo
import { app } from './app';
import { logger } from './config/logger';
import { prisma } from './lib/prisma';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 LiftSafe 4.° backend (API de integración con JWT) en http://localhost:${PORT}/api/v1`);
  logger.info(`Entorno: ${env.NODE_ENV}`);
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
