import { describe, expect, it } from 'vitest'
import { ESTADO_PENDIENTE_FIRMA, ESTADO_PENDIENTE_REVISION, statusColor, statusLabels } from './statusHelpers'

describe('statusHelpers', () => {
  it('should expose the exact names of the pending states', () => {
    expect(ESTADO_PENDIENTE_FIRMA).toBe('Pendiente firma cliente')
    expect(ESTADO_PENDIENTE_REVISION).toBe('Pendiente revisión')
  })

  it.each([
    ['Aprobada', 'success'],
    ['Observaciones', 'error'],
    ['Programada', 'info'],
    ['Borrador', 'default'],
    ['Suspendido', 'warning'],
    ['default', 'default'],
  ])('should paint the state %s with the %s color', (estado, color) => {
    expect(statusColor[estado]).toBe(color)
  })

  it('should show a friendlier label for the states with observations', () => {
    expect(statusLabels.Observaciones).toBe('Con observaciones')
    expect(statusLabels['En Proceso']).toBe('En proceso')
  })

  it('should have a color for every state that has a label', () => {
    Object.keys(statusLabels).forEach((estado) => {
      expect(statusColor[estado], `falta color para ${estado}`).toBeDefined()
    })
  })
})
