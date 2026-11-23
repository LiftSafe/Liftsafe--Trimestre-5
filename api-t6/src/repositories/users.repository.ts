import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma';

// Acceso a la tabla users (solo lo que necesita la autenticación)
export const usersRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },
};
