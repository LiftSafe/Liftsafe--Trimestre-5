import 'dotenv/config';
import { z } from 'zod';

// Variables de entorno validadas al arrancar: si falta algo, el servidor no inicia
// con un mensaje claro (en vez de fallar más tarde con un error raro).
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3100),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('1h'),
});

export type Env = z.infer<typeof envSchema>;

export function leerEnv(fuente: NodeJS.ProcessEnv = process.env): Env {
  const resultado = envSchema.safeParse(fuente);
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Configuración inválida (.env): ${detalle}`);
  }
  return resultado.data;
}

export const env = leerEnv();
