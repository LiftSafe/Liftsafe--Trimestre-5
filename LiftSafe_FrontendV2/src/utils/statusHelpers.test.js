import { describe, expect, it } from 'vitest'
import {
  ESTADO_PENDIENTE_FIRMA,
  ESTADO_PENDIENTE_REVISION,
  statusColor,
  statusLabels,
} from './statusHelpers'

describe('statusHelpers', () => {
  it('should expose the two states that wait for a person', () => {
    expect(ESTADO_PENDIENTE_FIRMA).toBe('Pendiente firma cliente')
    expect(ESTADO_PENDIENTE_REVISION).toBe('Pendiente revisión')
  })

  it('should give every waiting state its own color', () => {
    expect(statusColor[ESTADO_PENDIENTE_FIRMA]).toBe('warning')
    expect(statusColor[ESTADO_PENDIENTE_REVISION]).toBe('secondary')
  })

  it('should color the main inspection states', () => {
    expect(statusColor.Finalizada).toBe('success')
    expect(statusColor.Observaciones).toBe('error')
    expect(statusColor.default).toBe('default')
  })

  it('should translate "Observaciones" to a readable label', () => {
    expect(statusLabels.Observaciones).toBe('Con observaciones')
    expect(statusLabels['En Proceso']).toBe('En proceso')
  })
})