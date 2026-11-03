import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Productividad from './Productividad'
import { reporteService } from '../services/reporteService'

vi.mock('../services/reporteService', () => ({ reporteService: { productividad: vi.fn() } }))

const datos = {
  desde: '2026-10-04', hasta: '2026-11-03',
  total: { asignadas: 5, terminadas: 3, en_curso: 1, canceladas: 1, aprobadas: 2, rechazadas: 1, tasa_cumplimiento: 60, tasa_aprobacion: 67, horas_promedio: 3 },
  inspectores: [
    { id_inspector: 1, inspector: 'Daniela Torres', asignadas: 3, terminadas: 2, en_curso: 1, canceladas: 0, aprobadas: 2, rechazadas: 0, tasa_cumplimiento: 67, tasa_aprobacion: 100, horas_promedio: 2.5 },
  ],
}

describe('Productividad (RF-024)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should show the summary and a row per inspector', async () => {
    reporteService.productividad.mockResolvedValue(datos)
    render(<MemoryRouter><Productividad /></MemoryRouter>)
    expect(await screen.findByText('Daniela Torres')).toBeInTheDocument()
    expect(screen.getByText('Tasa de aprobación')).toBeInTheDocument()
    expect(screen.getAllByText('67 %').length).toBeGreaterThan(0)
    expect(screen.getByText('3 h')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Descargar Excel/ })).toBeEnabled()
  })

  it('should ask again when the dates change', async () => {
    reporteService.productividad.mockResolvedValue({ ...datos, inspectores: [] })
    render(<MemoryRouter><Productividad /></MemoryRouter>)
    expect(await screen.findByText('No hay inspecciones en este periodo.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-01-01' } })
    await vi.waitFor(() => expect(reporteService.productividad).toHaveBeenLastCalledWith('2026-01-01', expect.any(String)))
  })

  it('should show the error', async () => {
    reporteService.productividad.mockRejectedValue(new Error('Solo el Coordinador o el Director Técnico pueden ver este reporte'))
    render(<MemoryRouter><Productividad /></MemoryRouter>)
    expect(await screen.findByText(/Solo el Coordinador/)).toBeInTheDocument()
  })
})
