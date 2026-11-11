// Dobles (semana 5): MSW intercepta la petición HTTP real, así que se ejecuta
// TODO el código de apiClient.js (fetch, headers, parseResponse), a diferencia
// de vi.stubGlobal('fetch'), que lo reemplaza.
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { API_BASE_URL, apiGet, apiPost } from './apiClient';

const url = (ruta) => `${API_BASE_URL}${ruta}`;
const ascensor = { id: 1, codigo: 'ASC-001' };

// Respuestas por defecto: el "backend feliz"
const server = setupServer(http.get(url('/ascensores'), () => HttpResponse.json([ascensor])));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  sessionStorage.clear();
});
afterAll(() => server.close());

describe('apiClient con MSW', () => {
  it('should return the parsed body on the happy path', async () => {
    // STUB (handler por defecto). Verifica ESTADO: el dato devuelto.
    await expect(apiGet('/ascensores')).resolves.toEqual([ascensor]);
  });

  it('should throw an error with the HTTP status when the API responds 500', async () => {
    // STUB que responde 500 sin cuerpo.
    server.use(http.get(url('/ascensores'), () => new HttpResponse(null, { status: 500 })));

    await expect(apiGet('/ascensores')).rejects.toMatchObject({
      message: 'Error en la petición',
      status: 500,
    });
  });

  it('should throw the detail sent by the API when validation fails (422)', async () => {
    // STUB que responde 422 con detail como string.
    server.use(
      http.post(url('/ascensores'), () =>
        HttpResponse.json({ detail: 'codigo ya existe' }, { status: 422 }),
      ),
    );

    await expect(apiPost('/ascensores', { codigo: 'X' })).rejects.toMatchObject({
      message: 'codigo ya existe',
      status: 422,
    });
  });

  it('should join the messages when the 422 detail is an array', async () => {
    // STUB con el formato real de errores de FastAPI/Pydantic.
    server.use(
      http.post(url('/ascensores'), () =>
        HttpResponse.json({ detail: [{ msg: 'campo requerido' }, { msg: 'valor inválido' }] }, { status: 422 }),
      ),
    );

    await expect(apiPost('/ascensores', {})).rejects.toThrow('campo requerido, valor inválido');
  });

  it('should show a readable error when the API responds HTML instead of JSON', async () => {
    // STUB con respuesta no JSON. Este es el caso que descubre el mutante.
    server.use(
      http.get(url('/ascensores'), () =>
        new HttpResponse('<!DOCTYPE html><html><body>Error</body></html>', {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    await expect(apiGet('/ascensores')).rejects.toThrow('Error en la petición');
  });

  it('should send the JSON body and the Bearer token on POST', async () => {
    // SPY: el handler captura la petición. COMPORTAMIENTO: qué salió hacia el API.
    sessionStorage.setItem('token', 'abc');
    let recibido;
    server.use(
      http.post(url('/ascensores'), async ({ request }) => {
        recibido = { auth: request.headers.get('Authorization'), body: await request.json() };
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiPost('/ascensores', { codigo: 'ASC-002' });

    expect(recibido).toEqual({ auth: 'Bearer abc', body: { codigo: 'ASC-002' } });
  });
});