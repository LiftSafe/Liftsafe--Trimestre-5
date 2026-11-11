// Semana 4 · Revisado por Luz (API): API Express de ascensores: 400 con issues[] (Zod), id no
// numérico, paginación y JSON inválidos; 404 por id o ruta inexistente, CRUD y 409.
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { elevatorsRepository } from '../src/repositories/elevators.repository';

const BASE = '/api/v1/elevators';
const nuevo = { internalCode: 'asc-100', brand: 'Otis', model: 'Gen3', type: 'Eléctrico', capacityKg: 630, floors: 12 };

beforeEach(() => elevatorsRepository.reset());

describe('Validación con Zod', () => {
  it('POST con body inválido → 400 con issues[]', async () => {
    const res = await request(app).post(BASE).send({ internalCode: 'X', brand: '', type: 'Cohete', capacityKg: -5, floors: 1.5 });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.issues)).toBe(true);
    const campos = res.body.issues.map((i: { path: string[] }) => i.path[0]);
    expect(campos).toEqual(expect.arrayContaining(['internalCode', 'brand', 'model', 'type', 'capacityKg', 'floors']));
  });

  it('GET /:id con id no numérico → 400', async () => {
    const res = await request(app).get(`${BASE}/abc`);
    expect(res.status).toBe(400);
    expect(res.body.issues[0].path).toEqual(['id']);
  });

  it('paginación inválida → 400 por el errorHandler (ZodError)', async () => {
    const res = await request(app).get(`${BASE}?page=0`);
    expect(res.status).toBe(400);
    expect(res.body.issues).toBeDefined();
  });

  it('JSON mal formado → 400 en JSON', async () => {
    const res = await request(app).post(BASE).set('Content-Type', 'application/json').send('{"brand":');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/JSON/);
  });
});

describe('Errores con AppError', () => {
  it('GET /:id con id inexistente → 404', async () => {
    const res = await request(app).get(`${BASE}/999`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 'error', message: 'No existe un ascensor con id 999' });
  });

  it('GET /ruta-inexistente → 404 JSON (no HTML)', async () => {
    const res = await request(app).get('/ruta-inexistente');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.message).toContain('/ruta-inexistente');
  });

  it('código interno repetido → 409', async () => {
    const res = await request(app).post(BASE).send({ ...nuevo, internalCode: 'ASC-001' });
    expect(res.status).toBe(409);
  });

  it('no deja eliminar un ascensor activo → 409', async () => {
    const res = await request(app).delete(`${BASE}/1`);
    expect(res.status).toBe(409);
  });
});

describe('CRUD de ascensores', () => {
  it('lista con paginación', async () => {
    const res = await request(app).get(`${BASE}?page=2&limit=2`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('crea, consulta, actualiza y elimina', async () => {
    const creado = await request(app).post(BASE).send(nuevo);
    expect(creado.status).toBe(201);
    expect(creado.body.data).toMatchObject({ internalCode: 'ASC-100', status: 'Activo' });
    const id = creado.body.data.id;

    expect((await request(app).get(`${BASE}/${id}`)).body.data.brand).toBe('Otis');

    const actualizado = await request(app).put(`${BASE}/${id}`).send({ status: 'Fuera de servicio', floors: 14 });
    expect(actualizado.status).toBe(200);
    expect(actualizado.body.data).toMatchObject({ status: 'Fuera de servicio', floors: 14, brand: 'Otis' });

    expect((await request(app).put(`${BASE}/${id}`).send({ capacityKg: 'mucho' })).status).toBe(400);
    expect((await request(app).delete(`${BASE}/${id}`)).status).toBe(204);
    expect((await request(app).get(`${BASE}/${id}`)).status).toBe(404);
  });
});
