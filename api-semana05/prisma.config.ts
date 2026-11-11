import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Configuración de Prisma: dónde están el schema, las migraciones y el seed
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
});
