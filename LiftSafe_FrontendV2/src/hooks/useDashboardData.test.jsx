import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDashboardData } from './useDashboardData'

const logout = vi.fn()
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ logout }) }))

describe('useDashboardData', () => {
  beforeEach(() => {
    logout.mockClear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('should start loading and then expose the list returned by the service', async () => {
    // Arrange
    const servicio = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }])

    // Act
    const { result } = renderHook(() => useDashboardData(servicio))

    // Assert
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }])
    expect(result.current.error).toBeNull()
  })

  it('should keep an object response as an object (stats and charts)', async () => {
    const servicio = vi.fn().mockResolvedValue({ usuarios_activos: 5 })
    const { result } = renderHook(() => useDashboardData(servicio))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual({ usuarios_activos: 5 })
  })

  it.each([[null], [undefined], ['texto'], [42]])('should fall back to an empty list when the response is %j', async (valor) => {
    const servicio = vi.fn().mockResolvedValue(valor)
    const { result } = renderHook(() => useDashboardData(servicio))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('should expose the error message and an empty list when the service fails', async () => {
    const servicio = vi.fn().mockRejectedValue(new Error('Servidor caído'))
    const { result } = renderHook(() => useDashboardData(servicio))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Servidor caído')
    expect(result.current.data).toEqual([])
    expect(logout).not.toHaveBeenCalled()
  })

  it('should use a default message when the error has none', async () => {
    const servicio = vi.fn().mockRejectedValue(new Error(''))
    const { result } = renderHook(() => useDashboardData(servicio))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Error al cargar datos')
  })

  it.each([
    [Object.assign(new Error('x'), { status: 401 })],
    [new Error('Request failed 401')],
    [new Error('Unauthorized')],
    [new Error('Token expired')],
    [new Error('Not authenticated')],
  ])('should log out on an authentication error (%s)', async (error) => {
    const servicio = vi.fn().mockRejectedValue(error)
    renderHook(() => useDashboardData(servicio))
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1))
  })

  it('should call the service again when refetch is used', async () => {
    const servicio = vi.fn().mockResolvedValue([])
    const { result } = renderHook(() => useDashboardData(servicio))
    await waitFor(() => expect(servicio).toHaveBeenCalledTimes(1))

    act(() => result.current.refetch())

    await waitFor(() => expect(servicio).toHaveBeenCalledTimes(2))
  })
})
