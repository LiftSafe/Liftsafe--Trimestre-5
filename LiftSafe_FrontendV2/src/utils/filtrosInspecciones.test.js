import { describe, it, expect } from 'vitest'
import { FILTROS_VACIOS, contarFiltros, fechaInspeccion, filtrarInspecciones, opcionesDe } from './filtrosInspecciones'

const lista = [
  { id_inspeccion: 1, nombre_cliente: 'Camila', nombre_inspector: 'Daniela', ciudad: 'Bogotá', tipo_servicio: 'Periódica', estado: 'Finalizada', fecha_programada: '2026-10-05' },
  { id_inspeccion: 2, nombre_cliente: 'Torres', nombre_inspector: 'Andrés', ciudad: 'Medellín', tipo_servicio: 'Inicial', estado: 'Programada', fecha_inicio: '2026-11-02T08:00:00' },
  { id_inspeccion: 3, nombre_cliente: 'Camila', inspector: 'Andrés', ciudad: 'Bogotá', type: 'Inicial', status: 'Programada', fecha_programada: '2026-11-20' },
]
const ids = (l) => l.map((i) => i.id_inspeccion)

describe('filtros de inspecciones (RF-017)', () => {
  it('should not filter when nothing is chosen', () => {
    expect(filtrarInspecciones(lista)).toHaveLength(3)
    expect(contarFiltros()).toBe(0)
  })

  it('should filter by client, technician, city, type and state', () => {
    expect(ids(filtrarInspecciones(lista, { ...FILTROS_VACIOS, cliente: 'Camila' }))).toEqual([1, 3])
    expect(ids(filtrarInspecciones(lista, { ...FILTROS_VACIOS, inspector: 'Andrés' }))).toEqual([2, 3])
    expect(ids(filtrarInspecciones(lista, { ...FILTROS_VACIOS, ciudad: 'Medellín' }))).toEqual([2])
    expect(ids(filtrarInspecciones(lista, { ...FILTROS_VACIOS, tipo: 'Inicial', estado: 'Programada', cliente: 'Camila' }))).toEqual([3])
    expect(contarFiltros({ ...FILTROS_VACIOS, tipo: 'Inicial', estado: 'Programada' })).toBe(2)
  })

  it('should filter by a date range', () => {
    expect(fechaInspeccion(lista[1])).toBe('2026-11-02')
    expect(ids(filtrarInspecciones(lista, { ...FILTROS_VACIOS, desde: '2026-11-01' }))).toEqual([2, 3])
    expect(ids(filtrarInspecciones(lista, { ...FILTROS_VACIOS, desde: '2026-11-01', hasta: '2026-11-10' }))).toEqual([2])
    expect(ids(filtrarInspecciones([{ id_inspeccion: 9 }], { ...FILTROS_VACIOS, hasta: '2026-11-10' }))).toEqual([])
  })

  it('should list the distinct values of each filter, sorted', () => {
    expect(opcionesDe(lista, 'cliente')).toEqual(['Camila', 'Torres'])
    expect(opcionesDe(lista, 'inspector')).toEqual(['Andrés', 'Daniela'])
    expect(opcionesDe(lista, 'estado')).toEqual(['Finalizada', 'Programada'])
  })
})
