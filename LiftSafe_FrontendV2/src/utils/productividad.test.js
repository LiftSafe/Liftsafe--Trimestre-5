import { describe, it, expect } from 'vitest'
import { fechaHaceDias, productividadACsv } from './productividad'

describe('productividad (RF-024)', () => {
  it('should compute a date some days ago', () => {
    expect(fechaHaceDias(30, new Date(2026, 10, 3))).toBe('2026-10-04')
    expect(fechaHaceDias(0, new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('should build a CSV with a row per inspector and the total', () => {
    const csv = productividadACsv({
      desde: '2026-10-01', hasta: '2026-10-31',
      inspectores: [{ inspector: 'Daniela; Torres', asignadas: 3, terminadas: 2, en_curso: 1, canceladas: 0, aprobadas: 2, rechazadas: 0, tasa_cumplimiento: 67, tasa_aprobacion: 100, horas_promedio: 2.5 }],
      total: { asignadas: 3, terminadas: 2, en_curso: 1, canceladas: 0, aprobadas: 2, rechazadas: 0, tasa_cumplimiento: 67, tasa_aprobacion: null, horas_promedio: 2.5 },
    })
    const lineas = csv.replace('﻿', '').split('\r\n')
    expect(lineas[0]).toBe('Reporte de productividad LiftSafe (2026-10-01 a 2026-10-31)')
    expect(lineas[1].split(';')[0]).toBe('Inspector')
    expect(lineas[2]).toBe('"Daniela; Torres";3;2;1;0;2;0;67;100;2.5')
    expect(lineas[3]).toBe('TOTAL;3;2;1;0;2;0;67;;2.5')
  })
})
