import 'dotenv/config';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

// Pruebas de integración contra PostgreSQL real (necesitan DATABASE_URL y la migración aplicada).
// Usan sus propios datos (código ASC-9xx y un edificio de prueba) y los borran al final.
const hayBase = Boolean(process.env.DATABASE_URL);
const API = '/api/v1/elevators';
const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

describe.skipIf(!hayBase)('API de ascensores con Prisma', () => {
  let buildingId = '';
  const nuevo = () => ({
    internalCode: 'ASC-901', brand: 'Otis', model: 'Gen3', type: 'ELECTRICO',
    capacityKg: 630, stops: 10, installedAt: '2024-05-01', buildingId,
  });

  beforeAll(async () => {
    await prisma.elevator.deleteMany({ where: { internalCode: { startsWith: 'ASC-9' } } });
    await prisma.building.deleteMany({ where: { name: 'Edificio de pruebas' } });
    const b = await prisma.building.create({ data: { name: 'Edificio de pruebas', address: 'Calle 1', city: 'Bogotá', floors: 10 } });
    buildingId = b.id;
  });

  afterAll(async () => {
    await prisma.elevator.deleteMany({ where: { internalCode: { startsWith: 'ASC-9' } } });
    await prisma.building.deleteMany({ where: { name: 'Edificio de pruebas' } });
    await prisma.$disconnect();
  });

  it('lista con el contrato { data, total, page, limit }', async () => {
    const res = await request(app).get(`${API}?page=1&limit=2`);
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'limit', 'page', 'total']);
    expect(res.body).toMatchObject({ page: 1, limit: 2 });
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });

  it('CRUD completo: crear 201, detalle con edificio 200, actualizar 200, eliminar 204 y luego 404', async () => {
    const creado = await request(app).post(API).send(nuevo());
    expect(creado.status).toBe(201);
    const id = creado.body.data.id;
    expect(id).toMatch(/^[0-9a-f-]{36}$/);

    const detalle = await request(app).get(`${API}/${id}`);
    expect(detalle.status).toBe(200);
    expect(detalle.body.data.building.name).toBe('Edificio de pruebas');

    const actualizado = await request(app).put(`${API}/${id}`).send({ status: 'EN_MANTENIMIENTO' });
    expect(actualizado.status).toBe(200);
    expect(actualizado.body.data.status).toBe('EN_MANTENIMIENTO');

    expect((await request(app).delete(`${API}/${id}`)).status).toBe(204);
    expect((await request(app).get(`${API}/${id}`)).status).toBe(404);
  });

  it('código repetido → 409 (P2002)', async () => {
    await request(app).post(API).send({ ...nuevo(), internalCode: 'ASC-902' });
    const res = await request(app).post(API).send({ ...nuevo(), internalCode: 'ASC-902' });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Ya existe un registro con ese valor/);
  });

  it('actualizar o eliminar un id que no existe → 404 (P2025)', async () => {
    expect((await request(app).put(`${API}/${UUID_INEXISTENTE}`).send({ brand: 'X' })).status).toBe(404);
    expect((await request(app).delete(`${API}/${UUID_INEXISTENTE}`)).status).toBe(404);
  });

  it('body inválido → 400 con issues[]; id no UUID → 400; edificio inexistente → 400', async () => {
    const malo = await request(app).post(API).send({ internalCode: 'X', capacityKg: -1 });
    expect(malo.status).toBe(400);
    expect(Array.isArray(malo.body.issues)).toBe(true);
    expect((await request(app).get(`${API}/abc`)).status).toBe(400);
    const sinEdificio = await request(app).post(API).send({ ...nuevo(), internalCode: 'ASC-903', buildingId: UUID_INEXISTENTE });
    expect(sinEdificio.status).toBe(400);
    expect(sinEdificio.body.message).toBe('El edificio indicado no existe');
  });

  it('ruta inexistente → 404 en JSON', async () => {
    const res = await request(app).get('/api/v1/no-existe');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
  });
});
