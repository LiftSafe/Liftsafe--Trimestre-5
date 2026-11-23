import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Prueba UNITARIA del módulo crítico (autenticación): sin base de datos.
vi.mock('../src/lib/prisma', () => ({ prisma: {} }));
vi.mock('../src/repositories/users.repository', () => ({
  usersRepository: { findByEmail: vi.fn(), findById: vi.fn() },
}));

import { usersRepository } from '../src/repositories/users.repository';
import { authService } from '../src/services/auth.service';
import { AppError } from '../src/errors/AppError';
import { leerEnv } from '../src/config/env';

const SECRETO = 'clave-solo-para-pruebas-automaticas-0123456789';
const repo = vi.mocked(usersRepository);
const hash = bcrypt.hashSync('Secreta123!', 4);
const usuario = (extra = {}) => ({
  id: '11111111-1111-4111-8111-111111111111', email: 'admin@liftsafe.test', name: 'Admin',
  passwordHash: hash, role: 'ADMIN' as const, active: true, createdAt: new Date(), updatedAt: new Date(), ...extra,
});

beforeEach(() => vi.clearAllMocks());

describe('authService.login', () => {
  it('CP-API-01 credenciales correctas → token JWT firmado con el rol', async () => {
    repo.findByEmail.mockResolvedValue(usuario());
    const r = await authService.login({ email: 'admin@liftsafe.test', password: 'Secreta123!' });
    const datos = jwt.verify(r.token, SECRETO) as jwt.JwtPayload;
    expect(datos.sub).toBe(usuario().id);
    expect(datos.role).toBe('ADMIN');
    expect(r.user).not.toHaveProperty('passwordHash');
  });

  it('CP-API-02 contraseña errada → 401', async () => {
    repo.findByEmail.mockResolvedValue(usuario());
    await expect(authService.login({ email: 'admin@liftsafe.test', password: 'Otra12345' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('CP-API-03 correo inexistente → 401 con el MISMO mensaje (no revela qué correos existen)', async () => {
    repo.findByEmail.mockResolvedValue(usuario());
    const errClave = await authService.login({ email: 'admin@liftsafe.test', password: 'Otra12345' }).catch((e) => e);
    repo.findByEmail.mockResolvedValue(null);
    const errCorreo = await authService.login({ email: 'nadie@liftsafe.test', password: 'Secreta123!' }).catch((e) => e);
    expect(errCorreo).toBeInstanceOf(AppError);
    expect(errCorreo.message).toBe(errClave.message);
  });

  it('CP-API-04 cuenta desactivada → 403', async () => {
    repo.findByEmail.mockResolvedValue(usuario({ active: false }));
    await expect(authService.login({ email: 'admin@liftsafe.test', password: 'Secreta123!' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('authService.verificarToken', () => {
  it('token firmado con otra clave → 401 "Token inválido"', () => {
    const falso = jwt.sign({ sub: 'x', role: 'ADMIN' }, 'otra-clave-cualquiera-de-32-caracteres!!');
    expect(() => authService.verificarToken(falso)).toThrow('Token inválido');
  });

  it('CP-API-05 token vencido → 401 pidiendo iniciar sesión de nuevo', () => {
    const vencido = jwt.sign({ sub: 'x', role: 'ADMIN', exp: Math.floor(Date.now() / 1000) - 60 }, SECRETO);
    expect(() => authService.verificarToken(vencido)).toThrow('venció');
  });

  it('token sin "sub" → 401', () => {
    const sinSub = jwt.sign({ role: 'ADMIN' }, SECRETO);
    expect(() => authService.verificarToken(sinSub)).toThrow(AppError);
  });
});

describe('authService.perfil', () => {
  it('devuelve el usuario sin la contraseña', async () => {
    repo.findById.mockResolvedValue(usuario());
    expect(await authService.perfil(usuario().id)).toEqual({ id: usuario().id, email: 'admin@liftsafe.test', name: 'Admin', role: 'ADMIN' });
  });

  it('usuario borrado o desactivado → 401', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(authService.perfil('x')).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('configuración (.env)', () => {
  it('CP-API-06 JWT_SECRET corto → el servidor no arranca y explica por qué', () => {
    expect(() => leerEnv({ JWT_SECRET: 'corta' })).toThrow(/JWT_SECRET/);
  });

  it('valores por defecto de puerto y vigencia del token', () => {
    const e = leerEnv({ JWT_SECRET: SECRETO });
    expect(e.PORT).toBe(3100);
    expect(e.JWT_EXPIRES_IN).toBe('1h');
  });
});
