import { describe, it, expect } from 'vitest'
import { claveSucursal, sucursalesDeAscensores } from './sucursales'

describe('sucursales', () => {
  it('should use the sede id as key, or a fixed key when there is no sede', () => {
    expect(claveSucursal({ id_sede: 4 })).toBe('4')
    expect(claveSucursal({ id_sede: null })).toBe('sin-sucursal')
  })

  it('should group elevators by sede and count them, sorted by name', () => {
    // Arrange
    const ascensores = [
      { id_ascensor: 1, id_sede: 2, sede: 'Sede Sur' },
      { id_ascensor: 2, id_sede: 1, sede: 'Sede Norte' },
      { id_ascensor: 3, id_sede: 2, sede: 'Sede Sur' },
    ]
    // Act
    const resultado = sucursalesDeAscensores(ascensores)
    // Assert
    expect(resultado).toEqual([
      { clave: '1', nombre: 'Sede Norte', total: 1 },
      { clave: '2', nombre: 'Sede Sur', total: 2 },
    ])
  })

  it('should put elevators without sede last', () => {
    const resultado = sucursalesDeAscensores([
      { id_ascensor: 1, id_sede: null },
      { id_ascensor: 2, id_sede: 5, sede: 'Principal' },
    ])
    expect(resultado.map((s) => s.nombre)).toEqual(['Principal', 'Sin sucursal asignada'])
  })

  it('should return an empty list when there are no elevators', () => {
    expect(sucursalesDeAscensores()).toEqual([])
  })
})
