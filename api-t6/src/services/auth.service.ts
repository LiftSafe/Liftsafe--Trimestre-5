import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../errors/AppError';
import { usersRepository } from '../repositories/users.repository';
import type { LoginDto } from '../schemas/auth.schema';
import type { AuthUser, Role } from '../types';

// Mismo mensaje para "no existe" y "clave errada": no revela qué correos existen.
const CREDENCIALES_INVALIDAS = 'Correo o contraseña incorrectos';

interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export const authService = {
  async login({ email, password }: LoginDto): Promise<{ token: string; expiresIn: string; user: AuthUser }> {
    const user = await usersRepository.findByEmail(email);
    const claveOk = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !claveOk) {
      logger.warn(`Login fallido para ${email}`);
      throw new AppError(401, CREDENCIALES_INVALIDAS);
    }
    if (!user.active) throw new AppError(403, 'La cuenta está desactivada');

    const authUser: AuthUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    const payload: TokenPayload = { sub: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
    logger.info(`Login correcto: ${user.email} (${user.role})`);
    return { token, expiresIn: env.JWT_EXPIRES_IN, user: authUser };
  },

  // Verifica la firma y la vigencia del token; cualquier problema → 401
  verificarToken(token: string): TokenPayload {
    try {
      const datos = jwt.verify(token, env.JWT_SECRET);
      if (typeof datos === 'string' || !datos.sub) throw new Error('payload inválido');
      return datos as unknown as TokenPayload;
    } catch (err) {
      const vencido = err instanceof jwt.TokenExpiredError;
      throw new AppError(401, vencido ? 'El token venció, inicia sesión de nuevo' : 'Token inválido');
    }
  },

  async perfil(id: string): Promise<AuthUser> {
    const user = await usersRepository.findById(id);
    if (!user || !user.active) throw new AppError(401, 'La cuenta ya no existe o está desactivada');
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  },
};
