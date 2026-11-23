import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Pruebas de la API HTTP con la base simulada: validación, JWT y roles.
vi.mock('../src/lib/prisma', () => ({
  prisma: { building: { findMany: vi.fn() } },
}));
vi.mock('../src/repositories/users.repository', () => ({
  usersRepository: { findByEmail: vi.fn(), findById: vi.fn() },
}));
vi.mock('../src/repositories/elevators.repository', () => ({
  elevatorsRepository: {
    findMany: vi.fn(), count: vi.fn(), countByStatus: vi.fn(), findById: vi.fn(),
    create: vi.fn(), update: vi.fn(), delete: vi.fn(),
  },
}));

import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { usersRepository } from '../src/repositories/users.repository';
import { elevatorsRepository } from '../src/repositories/elevators.repository';

const SECRETO = 'clave-solo-para-pruebas-automaticas-0123456789';
const tokenDe = (role: 'ADMIN' | 'INTEGRADOR') =>
  jwt.sign({ sub: '11111111-1111-4111-8111-111111111111', email: `${role}@liftsafe.test`, role }, SECRETO, { expiresIn: '5m' });
const ADMIN = `Bearer ${tokenDe('ADMIN')}`;
const INTEGRADOR = `Bearer ${tokenDe('INTEGRADOR')}`;
const BUILDING = '22222222-2222-4222-8222-222222222222';
const ascensor = { internalCode: 'ASC-100', brand: 'Otis', model: 'Gen3', type: 'ELECTRICO', capacityKg: 630, stops: 10, buildingId: BUILDING };

const users = vi.mocked(usersRepository);
const elevators = vi.mocked(elevatorsRepository);

beforeEach(() => vi.clearAllMocks());

describe('Salud y rutas', () => {
  it('GET /health → 200 sin token', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
  });

  it('ruta que no existe → 404 en JSON', async () => {
    const res = await request(app).get('/api/v1/no-existe');
    expect(res.status).toBe(404);
  });
});

describe('POST /auth/login', () => {
  it('CP-API-07 correo mal escrito → 400 con el detalle', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'no-es-correo', password: 'Secreta123!' });
    expect(res.status).toBe(400);
    expect(res.body.issues[0].message).toBe('El correo no es válido');
  });

  it('CP-API-08 contraseña de menos de 8 caracteres → 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@liftsafe.test', password: '123' });
    expect(res.status).toBe(400);
  });

  it('CP-API-09 JSON mal formado → 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(res.status).toBe(400);
  });

  it('CP-API-10 credenciales correctas → 200 con token, y el correo se normaliza a minúsculas', async () => {
    users.findByEmail.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111', email: 'admin@liftsafe.test', name: 'Admin', role: 'ADMIN',
      passwordHash: bcrypt.hashSync('Secreta123!', 4), active: true, createdAt: new Date(), updatedAt: new Date(),
    });
    const res = await request(app).post('/api/v1/auth/login').send({ email: '  ADMIN@LiftSafe.test ', password: 'Secreta123!' });
    expect(res.status).toBe(200);
    expect(users.findByEmail).toHaveBeenCalledWith('admin@liftsafe.test');
    expect(res.body.data.token.split('.')).toHaveLength(3);
  });
});

describe('Rutas protegidas con JWT', () => {
  it('CP-API-11 sin token → 401', async () => {
    const res = await request(app).get('/api/v1/elevators');
    expect(res.status).toBe(401);
  });

  it('CP-API-12 cabecera sin "Bearer" → 401', async () => {
    const res = await request(app).get('/api/v1/elevators').set('Authorization', tokenDe('ADMIN'));
    expect(res.status).toBe(401);
  });

  it('CP-API-13 token manipulado → 401', async () => {
    const res = await request(app).get('/api/v1/elevators').set('Authorization', `${ADMIN}x`);
    expect(res.status).toBe(401);
  });

  it('CP-API-14 INTEGRADOR puede consultar el listado paginado', async () => {
    elevators.findMany.mockResolvedValue([]);
    elevators.count.mockResolvedValue(0);
    const res = await request(app).get('/api/v1/elevators?page=1&limit=5').set('Authorization', INTEGRADOR);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], total: 0, page: 1, limit: 5 });
  });

  it('CP-API-15 INTEGRADOR no puede crear → 403', async () => {
    const res = await request(app).post('/api/v1/elevators').set('Authorization', INTEGRADOR).send(ascensor);
    expect(res.status).toBe(403);
    expect(elevators.create).not.toHaveBeenCalled();
  });

  it('CP-API-16 ADMIN con datos inválidos → 400 (código con formato errado)', async () => {
    const res = await request(app).post('/api/v1/elevators').set('Authorization', ADMIN).send({ ...ascensor, internalCode: 'X1' });
    expect(res.status).toBe(400);
  });

  it('CP-API-17 ADMIN con datos válidos → 201', async () => {
    elevators.create.mockResolvedValue({ ...ascensor, id: 'abc', building: { name: 'Torre' } } as never);
    const res = await request(app).post('/api/v1/elevators').set('Authorization', ADMIN).send(ascensor);
    expect(res.status).toBe(201);
  });

  it('CP-API-18 resumen por estado para tableros', async () => {
    elevators.countByStatus.mockResolvedValue({ ACTIVO: 5, EN_MANTENIMIENTO: 2 });
    const res = await request(app).get('/api/v1/elevators/summary').set('Authorization', INTEGRADOR);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ total: 7, byStatus: { ACTIVO: 5, EN_MANTENIMIENTO: 2 } });
  });

  it('CP-API-19 edificios con el total de ascensores', async () => {
    vi.mocked(prisma.building.findMany).mockResolvedValue([{ id: BUILDING, name: 'Torre', _count: { elevators: 3 } }] as never);
    const res = await request(app).get('/api/v1/buildings').set('Authorization', INTEGRADOR);
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ name: 'Torre', totalElevators: 3 });
  });

  it('CP-API-20 GET /auth/me devuelve el usuario del token', async () => {
    users.findById.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111', email: 'admin@liftsafe.test', name: 'Admin', role: 'ADMIN',
      passwordHash: 'x', active: true, createdAt: new Date(), updatedAt: new Date(),
    });
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: 'admin@liftsafe.test', role: 'ADMIN' });
  });
});
