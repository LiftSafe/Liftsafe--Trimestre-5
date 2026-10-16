import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitudService } from './solicitudService'

describe('solicitudService', () => {
  beforeEach(() => {
    sessionStorage.setItem('token', 'tkn')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: 1 }) }))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('should cancel a request by changing its state to Cancelada', async () => {
    // Act
    await solicitudService.cancelar(12)

    // Assert
    const [url, opciones] = fetch.mock.calls[0]
    expect(url).toMatch(/\/solicitudes\/12$/)
    expect(opciones.method).toBe('PUT')
    expect(JSON.parse(opciones.body)).toEqual({ estado: 'Cancelada' })
  })

  it('should send the Bearer token in every call', async () => {
    await solicitudService.listar()
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tkn')
  })

  it('should throw the backend detail when the request fails', async () => {
    fetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({ detail: 'Solicitud no encontrada' }) })
    await expect(solicitudService.obtener(99)).rejects.toThrow('Solicitud no encontrada')
  })

  it('should use a default message when the failure has no detail', async () => {
    fetch.mockResolvedValue({ ok: false, json: () => Promise.reject(new Error('x')) })
    await expect(solicitudService.listar()).rejects.toThrow('Error en la petición')
  })
})
