import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Encuestas from './Encuestas'
import { encuestaService } from '../services/encuestaService'

// STUB del módulo de servicio: el test controla lo que "responde el backend"
vi.mock('../services/encuestaService', () => ({
  encuestaService: { listarMias: vi.fn(), responder: vi.fn() },
}))

const pendiente = { id_encuesta: 1, codigo_ascensor: 'ASC-001', respondida: false }
const respondida = { id_encuesta: 2, codigo_ascensor: 'ASC-002', respondida: true, calificacion: 5, comentario: 'Todo bien' }

const montar = () => render(<MemoryRouter><Encuestas /></MemoryRouter>)

beforeEach(() => {
  encuestaService.listarMias.mockReset()
  encuestaService.responder.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('<Encuestas />', () => {
  it('should tell the client when there are no surveys yet', async () => {
    encuestaService.listarMias.mockResolvedValue([])
    montar()
    expect(await screen.findByText(/Todavía no tienes encuestas/)).toBeInTheDocument()
  })

  it('should show the error when the surveys cannot be loaded', async () => {
    encuestaService.listarMias.mockRejectedValue(new Error('Sin conexión'))
    montar()
    expect(await screen.findByText('Sin conexión')).toBeInTheDocument()
  })

  it('should separate the pending surveys from the answered ones', async () => {
    encuestaService.listarMias.mockResolvedValue([pendiente, respondida])
    montar()

    expect(await screen.findByText('Pendientes (1)')).toBeInTheDocument()
    expect(screen.getByText('Respondidas (1)')).toBeInTheDocument()
    expect(screen.getByText('Ascensor ASC-001')).toBeInTheDocument()
    expect(screen.getByText('Ascensor ASC-002')).toBeInTheDocument()
    expect(screen.getByText('"Todo bien"')).toBeInTheDocument()
  })

  it('should ask for a rating before sending and not call the backend', async () => {
    encuestaService.listarMias.mockResolvedValue([pendiente])
    const user = userEvent.setup()
    montar()

    await user.click(await screen.findByRole('button', { name: 'Enviar respuesta' }))

    expect(await screen.findByText('Selecciona una calificación de 1 a 5 estrellas antes de enviar')).toBeInTheDocument()
    expect(encuestaService.responder).not.toHaveBeenCalled()
  })

  it('should send the rating and the comment and reload the list', async () => {
    encuestaService.listarMias
      .mockResolvedValueOnce([pendiente])
      .mockResolvedValueOnce([{ ...pendiente, respondida: true, calificacion: 4, comentario: 'Excelente' }])
    encuestaService.responder.mockResolvedValue({})
    const user = userEvent.setup()
    montar()

    fireEvent.click(await screen.findByLabelText('4 Stars'))
    await user.type(screen.getByLabelText('Comentario (opcional)'), 'Excelente')
    await user.click(screen.getByRole('button', { name: 'Enviar respuesta' }))

    expect(await screen.findByText('¡Gracias por tu respuesta!')).toBeInTheDocument()
    expect(encuestaService.responder).toHaveBeenCalledWith(1, { calificacion: 4, comentario: 'Excelente' })
    expect(encuestaService.listarMias).toHaveBeenCalledTimes(2)
  })

  it('should send a null comment when the client writes none and show the backend error', async () => {
    encuestaService.listarMias.mockResolvedValue([pendiente])
    encuestaService.responder.mockRejectedValue(new Error('Esta encuesta ya fue respondida'))
    const user = userEvent.setup()
    montar()

    fireEvent.click(await screen.findByLabelText('3 Stars'))
    await user.click(screen.getByRole('button', { name: 'Enviar respuesta' }))

    expect(await screen.findByText('Esta encuesta ya fue respondida')).toBeInTheDocument()
    expect(encuestaService.responder).toHaveBeenCalledWith(1, { calificacion: 3, comentario: null })
  })
})