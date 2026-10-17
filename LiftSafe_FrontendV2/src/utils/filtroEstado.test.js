import { describe, it, expect } from 'vitest'
import { leerEstados, filtrarPorEstado, rutaConEstados } from './filtroEstado'

describe('filtroEstado', () => {
  it('should read the states from the query string', () => {
    expect(leerEstados('?estado=Programada,Borrador')).toEqual(['Programada', 'Borrador'])
    expect(leerEstados('?estado=En%20Proceso')).toEqual(['En Proceso'])
    expect(leerEstados('')).toEqual([])
  })

  it('should keep only the rows with those states, using estado or status', () => {
    const lista = [{ estado: 'Finalizada' }, { status: 'Programada' }, { estado: 'Cancelada' }]
    expect(filtrarPorEstado(lista, ['Finalizada', 'Programada'])).toHaveLength(2)
    expect(filtrarPorEstado(lista, [])).toBe(lista)
  })

  it('should build the link with the states encoded', () => {
    expect(rutaConEstados('/dashboard/inspecciones', ['En Proceso', 'Borrador']))
      .toBe('/dashboard/inspecciones?estado=En%20Proceso%2CBorrador')
    expect(rutaConEstados('/dashboard/inspecciones')).toBe('/dashboard/inspecciones')
  })
})
