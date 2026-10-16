import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePaginatedSearch } from './usePaginatedSearch'

const usuarios = [
  { nombre: 'Ana', rol: 'Cliente' },
  { nombre: 'Beto', rol: 'Inspector' },
  { nombre: 'Carla', rol: 'Cliente' },
  { nombre: 'Dario', rol: 'Cliente' },
  { nombre: 'Eva', rol: 'Asesor' },
]
const campos = ['nombre', 'rol']

describe('usePaginatedSearch', () => {
  it('should return the first page and count total pages', () => {
    // Arrange + Act
    const { result } = renderHook(() => usePaginatedSearch(usuarios, campos, 2))

    // Assert
    expect(result.current.paginated.map((u) => u.nombre)).toEqual(['Ana', 'Beto'])
    expect(result.current.totalPages).toBe(3) // 5 ítems / 2 por página
  })

  it('should filter ignoring case and search in every configured field', () => {
    const { result } = renderHook(() => usePaginatedSearch(usuarios, campos, 10))

    act(() => result.current.setSearch('CLIENTE'))

    expect(result.current.totalCount).toBe(3)
  })

  it('should go back to the first page when the search changes', () => {
    const { result } = renderHook(() => usePaginatedSearch(usuarios, campos, 2))
    act(() => result.current.setPage(2))
    expect(result.current.page).toBe(2)

    act(() => result.current.setSearch('a'))

    expect(result.current.page).toBe(0)
  })

  it('should accept a function as search field', () => {
    const { result } = renderHook(() =>
      usePaginatedSearch(usuarios, [(u) => `${u.nombre}-${u.rol}`], 10),
    )

    act(() => result.current.setSearch('beto-inspector'))

    expect(result.current.filtered).toHaveLength(1)
  })

  it('should report one page (never zero) when nothing matches', () => {
    const { result } = renderHook(() => usePaginatedSearch(usuarios, campos, 2))

    act(() => result.current.setSearch('zzz'))

    expect(result.current.totalCount).toBe(0)
    expect(result.current.totalPages).toBe(1)
  })

  it('should ignore a search made only of spaces', () => {
    const { result } = renderHook(() => usePaginatedSearch(usuarios, campos, 10))

    act(() => result.current.setSearch('   '))

    expect(result.current.totalCount).toBe(5)
  })
})
