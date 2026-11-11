import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CancelarVisitaDialog from './CancelarVisitaDialog'
import { programacionService } from '../services/programacionService'

vi.mock('../services/programacionService', () => ({ programacionService: { cancelarVisita: vi.fn() } }))

const solicitud = { id_solicitud: 12, ascensor: { codigo_interno: 'ASC-S002' }, cliente: { nombre_completo: 'Camila' } }

describe('CancelarVisitaDialog', () => {
  it('should ask for the reason before cancelling', () => {
    render(<CancelarVisitaDialog solicitud={solicitud} onClose={() => {}} onCancelada={() => {}} />)
    expect(screen.getByRole('button', { name: 'Cancelar visita' })).toBeDisabled()
  })

  it('should send the reason and whether the request is cancelled too', async () => {
    programacionService.cancelarVisita.mockResolvedValue({})
    const onCancelada = vi.fn()
    render(<CancelarVisitaDialog solicitud={solicitud} onClose={() => {}} onCancelada={onCancelada} />)
    fireEvent.change(screen.getByLabelText(/Motivo/), { target: { value: 'El cliente no estará' } })
    fireEvent.click(screen.getByLabelText(/Se cancela la solicitud/))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar visita' }))
    await vi.waitFor(() => expect(onCancelada).toHaveBeenCalled())
    expect(programacionService.cancelarVisita).toHaveBeenCalledWith(12, 'El cliente no estará', true)
  })

  it('should show the server error', async () => {
    programacionService.cancelarVisita.mockRejectedValue(new Error('No se puede cancelar: la inspección ya está en estado "En Progreso"'))
    render(<CancelarVisitaDialog solicitud={solicitud} onClose={() => {}} onCancelada={() => {}} />)
    fireEvent.change(screen.getByLabelText(/Motivo/), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar visita' }))
    expect(await screen.findByText(/ya está en estado/)).toBeInTheDocument()
  })
})
