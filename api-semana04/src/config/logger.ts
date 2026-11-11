import fs from 'node:fs';
import path from 'node:path';
import morgan from 'morgan';
import winston from 'winston';

const entorno = process.env.NODE_ENV ?? 'development';
const esProduccion = entorno === 'production';

// Formato de desarrollo: colores y una línea legible por evento
const formatoDesarrollo = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${extra}`;
  }),
);

// Formato de producción: JSON estructurado (fácil de procesar por otras herramientas)
const formatoProduccion = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const transportes: winston.transport[] = [new winston.transports.Console()];

// En producción, además, los errores se guardan en logs/error.log
if (esProduccion) {
  const carpeta = path.resolve(process.cwd(), 'logs');
  fs.mkdirSync(carpeta, { recursive: true });
  transportes.push(new winston.transports.File({ filename: path.join(carpeta, 'error.log'), level: 'error' }));
}

export const logger = winston.createLogger({
  // http en desarrollo (incluye las peticiones de Morgan), warn en producción
  level: esProduccion ? 'warn' : 'http',
  format: esProduccion ? formatoProduccion : formatoDesarrollo,
  transports: transportes,
  // En las pruebas automáticas no se ensucia la salida
  silent: entorno === 'test',
});

// Morgan escribe cada petición HTTP en Winston (nivel http)
const stream = { write: (mensaje: string) => logger.http(mensaje.trim()) };

export const morganMiddleware = morgan(esProduccion ? 'combined' : 'dev', { stream });
