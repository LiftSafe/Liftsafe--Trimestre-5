import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { AppError } from '../src/errors/AppError';
import { traducirErrorPrisma } from '../src/errors/prismaErrors';

const errorPrisma = (code: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError('error de prueba', { code, clientVersion: '6.19.3', meta });

describe('traducirErrorPrisma', () => {
  it('P2025 (no existe) se vuelve AppError 404', () => {
    const err = traducirErrorPrisma(errorPrisma('P2025'));
    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 404, message: 'Recurso no encontrado' });
  });

  it('P2002 (valor repetido) se vuelve AppError 409 con el campo', () => {
    const err = traducirErrorPrisma(errorPrisma('P2002', { target: ['internal_code'] }));
    expect(err).toMatchObject({ statusCode: 409, message: 'Ya existe un registro con ese valor (internal_code)' });
  });

  it('P2003 (edificio inexistente) se vuelve AppError 400', () => {
    expect(traducirErrorPrisma(errorPrisma('P2003'))).toMatchObject({ statusCode: 400 });
  });

  it('otros errores pasan igual (el errorHandler responde 500)', () => {
    const otro = new Error('se cayó la base');
    expect(traducirErrorPrisma(otro)).toBe(otro);
    const desconocido = errorPrisma('P1001');
    expect(traducirErrorPrisma(desconocido)).toBe(desconocido);
  });
});
