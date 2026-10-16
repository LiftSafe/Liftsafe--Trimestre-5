import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as dashboard from './dashboardService'

const respuesta = ({ ok = true, status = 200, statusText = 'OK', body = {}, jsonFalla = false } = {}) => ({
  ok,
  status,
  statusText,
  json: () => (jsonFalla ? Promise.reject(new Error('no es JSON')) : Promise.resolve(body)),
})

describe('dashboardService', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    ['fetchStats', [], '/dashboard/stats'],
    ['fetchCharts', [], '/dashboard/charts'],
    ['fetchInspecciones', [], '/dashboard/inspecciones'],
    ['fetchAscensores', [], '/dashboard/ascensores'],
    ['fetchUsuarios', [], '/dashboard/usuarios'],
    ['fetchInformes', [], '/dashboard/informes'],
    ['fetchReportsSummary', [], '/dashboard/reports-summary'],
    ['getCurrentUser', [], '/auth/me'],
    ['fetchVistaResumen', [], '/vistas/resumen-inspecciones'],
    ['fetchInspeccionesPorEstado', ['Finalizada'], '/vistas/inspecciones-por-estado/Finalizada'],
    ['fetchUserProfile', [7], '/usuarios/perfil/7'],
    ['fetchAdminStats', [], '/usuarios/dashboard/admin'],
    ['fetchClienteAscensores', [3], '/usuarios/dashboard/cliente/3'],
    ['fetchInspectorInspecciones', [4], '/usuarios/dashboard/inspector/4'],
    ['fetchListadoAscensores', [], '/ascensores/listado'],
    ['fetchEdificiosAscensores', [], '/ascensores/edificios'],
    ['fetchMisAscensores', [], '/ascensores/mis-ascensores'],
    ['fetchMisInspecciones', [], '/inspecciones/mis-inspecciones'],
  ])('%s should call the endpoint %s', async (funcion, args, ruta) => {
    // Arrange
    fetch.mockResolvedValue(respuesta({ body: { ok: true } }))

    // Act
    const resultado = await dashboard[funcion](...args)

    // Assert
    expect(fetch.mock.calls[0][0]).toBe(`http://localhost:8000${ruta}`)
    expect(resultado).toEqual({ ok: true })
  })

  it('should send the Bearer token only when there is a session', async () => {
    fetch.mockResolvedValue(respuesta())
    await dashboard.fetchStats()
    sessionStorage.setItem('token', 'abc')
    await dashboard.fetchStats()

    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined()
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer abc')
  })

  it('should throw the backend detail and keep the HTTP status', async () => {
    fetch.mockResolvedValue(respuesta({ ok: false, status: 403, body: { detail: 'Sin permiso' } }))
    await expect(dashboard.fetchStats()).rejects.toMatchObject({ message: 'Sin permiso', status: 403 })
  })

  it('should build a message with the status when the error body is not JSON', async () => {
    fetch.mockResolvedValue(respuesta({ ok: false, status: 500, statusText: 'Internal Server Error', jsonFalla: true }))
    await expect(dashboard.fetchStats()).rejects.toThrow('Error HTTP 500: Internal Server Error')
  })

  it('should use a generic message when the error has no detail', async () => {
    fetch.mockResolvedValue(respuesta({ ok: false, status: 418, body: {} }))
    await expect(dashboard.fetchStats()).rejects.toThrow('Error 418')
  })

  it('should explain that the backend is down when the network fails', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(dashboard.fetchCharts()).rejects.toThrow('No se puede conectar al servidor')
  })

  it('should translate buildings to the field names used by the screen', async () => {
    // Arrange
    fetch.mockResolvedValue(respuesta({ body: [
      { id_cliente: 5, cliente: 'Torres del Río', direccion: 'Calle 1', ciudad: 'Bogotá', total_ascensores: 3 },
      { id_cliente: 6 },
    ] }))

    // Act
    const edificios = await dashboard.fetchEdificios()

    // Assert
    expect(edificios[0]).toMatchObject({ id: 5, name: 'Torres del Río', address: 'Calle 1', city: 'Bogotá', elevators: 3 })
    expect(edificios[1]).toMatchObject({ id: 6, name: null, email: null, elevators: 0 }) // límite: sin datos
  })

  it('should return an empty list of buildings when the backend answers null', async () => {
    fetch.mockResolvedValue(respuesta({ body: null }))
    await expect(dashboard.fetchEdificios()).resolves.toEqual([])
  })

  it('should save the token after a successful login', async () => {
    fetch.mockResolvedValue(respuesta({ body: { access_token: 'tok-1' } }))
    await dashboard.login({ correo: 'a@x.com', contrasena: 'x' })
    expect(sessionStorage.getItem('token')).toBe('tok-1')
  })

  it.each([
    [{ detail: 'Credenciales inválidas' }, 'Credenciales inválidas'],
    [{}, 'Error en login'],
  ])('should reject the login with the right message (%j)', async (body, mensaje) => {
    fetch.mockResolvedValue(respuesta({ ok: false, status: 401, body }))
    await expect(dashboard.login({})).rejects.toThrow(mensaje)
    expect(sessionStorage.getItem('token')).toBeNull()
  })

  it.each([
    ['crearInspeccion', [{ id_ascensor: 1 }], 'POST', '/inspecciones/crear', 'Error al crear inspección'],
    ['eliminarUsuario', [9], 'DELETE', '/usuarios/9', 'Error al eliminar usuario'],
  ])('%s should use %s on %s and fail with a default message', async (funcion, args, metodo, ruta, porDefecto) => {
    // Arrange
    sessionStorage.setItem('token', 'abc')
    fetch.mockResolvedValueOnce(respuesta({ body: { ok: 1 } }))
    fetch.mockResolvedValueOnce(respuesta({ ok: false, status: 400, jsonFalla: true }))

    // Act + Assert
    await expect(dashboard[funcion](...args)).resolves.toEqual({ ok: 1 })
    expect(fetch.mock.calls[0][0]).toBe(`http://localhost:8000${ruta}`)
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: metodo, headers: { Authorization: 'Bearer abc' } })
    await expect(dashboard[funcion](...args)).rejects.toThrow(porDefecto)
  })
})
