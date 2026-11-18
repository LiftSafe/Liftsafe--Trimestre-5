// Semana 6 · ángulo FRONT: ¿mienten los handlers de MSW de la semana 5?
// Las respuestas de test/respuestas-reales.json las capturó el backend REAL
// corriendo contra la BD de pruebas (liftsafe-backend/tests/integration/
// capturar_respuestas.py). Aquí los handlers de MSW devuelven EXACTAMENTE esas
// respuestas, así que si el backend cambia su formato y se vuelve a capturar,
// estos tests avisan al frontend.
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ascensorService } from './ascensorService';
import { fetchEdificios } from './dashboardService';
import { apiPost, apiPut } from './apiClient';
import real from '../test/respuestas-reales.json';

const BASE = 'http://localhost:8000';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  sessionStorage.clear();
});
afterAll(() => server.close());

// STUB con la respuesta REAL capturada (mismo status y mismo cuerpo)
const servir = (metodo, ruta, caso) =>
  server.use(http[metodo](`${BASE}${ruta}`, () => HttpResponse.json(real[caso].body, { status: real[caso].status })));

describe('contraste con el backend real', () => {
  it('el listado real trae las claves que Buildings/Inspecciones usan', async () => {
    servir('get', '/ascensores/listado', 'listado_ok');

    const lista = await ascensorService.listar();

    expect(lista).toHaveLength(2);
    expect(Object.keys(lista[0]).sort()).toEqual(
      ['capacidad_kg', 'ciudad', 'cliente', 'codigo_interno', 'estado', 'id_ascensor', 'id_sede', 'marca', 'modelo', 'sede', 'tipo_ascensor'],
    );
  });

  it('fetchEdificios traduce TODOS los campos reales (el handler de la semana 5 solo traía 3)', async () => {
    servir('get', '/ascensores/edificios', 'edificios_ok');

    const [edificio] = await fetchEdificios();

    expect(edificio).toMatchObject({
      name: 'Torre Norte', address: 'Calle 100 # 15-20', city: 'Bogotá', status: 'Activo',
      email: 'torre@example.com', phone: '3001234567', tipoDocumento: 'NIT', documento: '900123456',
      razonSocial: 'Torre Norte SAS', nit: '900123456', elevators: 2,
    });
    expect(edificio.id).toBe(real.edificios_ok.body[0].id_cliente);
  });

  it('404 real al crear con un cliente inexistente: el usuario ve el detalle del backend', async () => {
    servir('post', '/ascensores/', 'crear_cliente_inexistente');

    await expect(apiPost('/ascensores/', {})).rejects.toMatchObject({ message: 'Cliente no encontrado', status: 404 });
  });

  it('409 real por código repetido', async () => {
    servir('post', '/ascensores/', 'crear_codigo_repetido');

    await expect(apiPost('/ascensores/', {})).rejects.toThrow('El código interno ya está registrado');
  });

  it('403 real al crear sin permiso', async () => {
    servir('post', '/ascensores/', 'crear_sin_permiso');

    await expect(apiPost('/ascensores/', {})).rejects.toMatchObject({ status: 403 });
  });

  it('422 NUEVO (hallazgo corregido): campo demasiado largo muestra el mensaje de validación', async () => {
    servir('post', '/ascensores/', 'crear_marca_81');

    const error = await apiPost('/ascensores/', {}).catch((e) => e);

    expect(error.status).toBe(422);
    expect(error.message).toBe('String should have at most 80 characters');
  });

  it('404 real al editar con un id que no existe', async () => {
    servir('put', '/ascensores/2147483648', 'editar_inexistente');

    await expect(apiPut('/ascensores/2147483648', { estado: 'x' })).rejects.toMatchObject({ message: 'Ascensor no encontrado' });
  });

  it('sin token el backend real responde 401 "Not authenticated" (en inglés)', async () => {
    servir('get', '/ascensores/listado', 'sin_token');

    await expect(ascensorService.listar()).rejects.toThrow('Not authenticated');
  });
});
