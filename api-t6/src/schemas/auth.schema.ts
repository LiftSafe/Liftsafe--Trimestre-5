import { z } from 'zod';

// POST /api/v1/auth/login
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('El correo no es válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
});

export type LoginDto = z.infer<typeof loginSchema>;
