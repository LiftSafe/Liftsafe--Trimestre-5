import { describe, it, expect } from 'vitest'
import { claveSucursal, edificiosDelCliente, sucursalesDeAscensores, tieneEdificios } from './sucursales'

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
    expect(resultado.map((s) => s.nombre)).toEqual(['Principal', 'Sin edificio asignado'])
  })

  it('should return an empty list when there are no elevators', () => {
    expect(sucursalesDeAscensores()).toEqual([])
  })

  it('should list every building of the client, even without elevators', () => {
    const sedes = [{ id_sede: 1, nombre: 'Torre Norte' }, { id_sede: 2, nombre: 'Edificio Sol' }]
    const ascensores = [{ id_ascensor: 1, id_sede: 1, sede: 'Torre Norte' }, { id_ascensor: 2, id_sede: null }]
    const edificios = edificiosDelCliente(sedes, ascensores)
    expect(edificios).toEqual([
      { clave: '2', nombre: 'Edificio Sol', total: 0 },
      { clave: '1', nombre: 'Torre Norte', total: 1 },
      { clave: 'sin-sucursal', nombre: 'Sin edificio asignado', total: 1 },
    ])
    expect(tieneEdificios(edificios)).toBe(true)
    expect(tieneEdificios(edificiosDelCliente([], [{ id_ascensor: 3, id_sede: null }]))).toBe(false)
  })
})
