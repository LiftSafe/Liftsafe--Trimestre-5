import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiDelete, apiGet, apiPost } from './apiClient'

const respuesta = ({ ok = true, status = 200, body = {} } = {}) => ({
  ok,
  status,
  json: () => Promise.resolve(body),
})

describe('apiClient', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('should send the Bearer token when there is a session', async () => {
    // Arrange
    sessionStorage.setItem('token', 'abc')
    fetch.mockResolvedValue(respuesta({ body: { ok: true } }))

    // Act
    await apiGet('/ascensores')

    // Assert
    const [, opciones] = fetch.mock.calls[0]
    expect(opciones.headers.Authorization).toBe('Bearer abc')
  })

  it('should not send Authorization without a token', async () => {
    fetch.mockResolvedValue(respuesta())
    await apiGet('/ascensores')
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('should repair mojibake in the response body', async () => {
    fetch.mockResolvedValue(respuesta({ body: { nombre: 'AndrÃ©s' } }))
    await expect(apiGet('/usuarios')).resolves.toEqual({ nombre: 'Andrés' })
  })

  it('should return null for a 204 response', async () => {
    fetch.mockResolvedValue(respuesta({ status: 204 }))
    await expect(apiDelete('/usuarios/1')).resolves.toBeNull()
  })

  it('should throw an Error with the backend detail and the HTTP status', async () => {
    // Arrange
    fetch.mockResolvedValue(respuesta({ ok: false, status: 403, body: { detail: 'No autorizado' } }))

    // Act + Assert
    await expect(apiGet('/usuarios')).rejects.toMatchObject({ message: 'No autorizado', status: 403 })
  })

  it('should join the messages when the detail is a list of validation errors', async () => {
    fetch.mockResolvedValue(
      respuesta({ ok: false, status: 422, body: { detail: [{ msg: 'campo requerido' }, { msg: 'correo inválido' }] } }),
    )
    await expect(apiPost('/auth/register', {})).rejects.toThrow('campo requerido, correo inválido')
  })

  it('should use a default message when the error has no detail', async () => {
    fetch.mockResolvedValue(respuesta({ ok: false, status: 500, body: {} }))
    await expect(apiGet('/x')).rejects.toThrow('Error en la petición')
  })

  it('should send FormData as is, without Content-Type', async () => {
    // Arrange
    fetch.mockResolvedValue(respuesta())
    const datos = new FormData()
    datos.append('foto', 'x')

    // Act
    await apiPost('/fotografias', datos)

    // Assert
    const [, opciones] = fetch.mock.calls[0]
    expect(opciones.body).toBe(datos)
    expect(opciones.headers['Content-Type']).toBeUndefined()
  })

  it('should serialize plain objects as JSON', async () => {
    fetch.mockResolvedValue(respuesta())
    await apiPost('/x', { a: 1 })
    expect(fetch.mock.calls[0][1].body).toBe('{"a":1}')
  })
})
