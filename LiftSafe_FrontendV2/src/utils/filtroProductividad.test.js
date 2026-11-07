import { describe, it, expect } from 'vitest'
import { etiquetaProductividad, filtrarPorProductividad, leerFiltroProductividad, rutaProductividad } from './filtroProductividad'

const lista = [
  { id_inspeccion: 1, id_inspector: 4, fecha_inicio: '2026-10-01T09:00:00', estado: 'Finalizada', estado_informe: 'Aprobado' },
  { id_inspeccion: 2, id_inspector: 4, fecha_inicio: '2026-10-05T09:00:00', estado: 'Pendiente revisión', estado_informe: 'Rechazado' },
  { id_inspeccion: 3, id_inspector: 4, fecha_inicio: '2026-10-07T09:00:00', estado: 'En Progreso', estado_informe: null },
  { id_inspeccion: 4, id_inspector: 5, fecha_inicio: '2026-10-08T09:00:00', estado: 'Programada', estado_informe: null },
  { id_inspeccion: 5, id_inspector: 4, fecha_inicio: '2026-10-09T09:00:00', estado: 'Cancelada', estado_informe: null },
  { id_inspeccion: 6, id_inspector: 4, fecha_inicio: '2025-01-01T09:00:00', estado: 'Finalizada', estado_informe: 'Enviado' },
]
const ids = (f) => filtrarPorProductividad(lista, f).map((i) => i.id_inspeccion)

describe('filtroProductividad (RF-024 → lista)', () => {
  it('ida y vuelta por la dirección', () => {
    const ruta = rutaProductividad({ grupo: 'terminadas', desde: '2026-10-01', hasta: '2026-10-31', idInspector: 4, inspector: 'Andrés' })
    const f = leerFiltroProductividad(ruta.split('?')[1])
    expect(f).toEqual({ grupo: 'terminadas', desde: '2026-10-01', hasta: '2026-10-31', idInspector: 4, inspector: 'Andrés' })
    expect(leerFiltroProductividad('?prod=otra')).toBeNull()
    expect(leerFiltroProductividad('')).toBeNull()
  })

  it('cuenta igual que el reporte', () => {
    const base = { desde: '2026-10-01', hasta: '2026-10-31', idInspector: 4 }
    expect(ids({ ...base, grupo: 'asignadas' })).toEqual([1, 2, 3, 5])
    expect(ids({ ...base, grupo: 'terminadas' })).toEqual([1, 2])
    expect(ids({ ...base, grupo: 'en_curso' })).toEqual([3])
    expect(ids({ ...base, grupo: 'aprobadas' })).toEqual([1])
    expect(ids({ ...base, grupo: 'rechazadas' })).toEqual([2])
    expect(ids({ ...base, grupo: 'revisadas' })).toEqual([1, 2])
    expect(ids({ grupo: 'asignadas', desde: '', hasta: '', idInspector: null })).toHaveLength(6)
  })

  it('cuenta como rechazada la que luego se corrigió y aprobó', () => {
    const corregida = [{ id_inspeccion: 9, id_inspector: 4, fecha_inicio: '2026-10-02T09:00:00', estado: 'Finalizada', estado_informe: 'Aprobado', rechazos: 1 }]
    expect(filtrarPorProductividad(corregida, { grupo: 'rechazadas', desde: '', hasta: '', idInspector: null })).toHaveLength(1)
    expect(filtrarPorProductividad(corregida, { grupo: 'aprobadas', desde: '', hasta: '', idInspector: null })).toHaveLength(1)
  })

  it('etiqueta legible', () => {
    expect(etiquetaProductividad({ grupo: 'en_curso', desde: '2026-10-01', hasta: '2026-10-31', inspector: 'Andrés' }))
      .toBe('Productividad: En curso · Andrés · 01/10/2026 a 31/10/2026')
  })
})
