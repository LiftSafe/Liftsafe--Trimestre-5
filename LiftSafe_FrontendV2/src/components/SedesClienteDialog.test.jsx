import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SedesClienteDialog from './SedesClienteDialog'
import { clienteService } from '../services/clienteService'

vi.mock('../services/clienteService', () => ({
  clienteService: {
    listarSedes: vi.fn(),
    crearSede: vi.fn(),
    modificarSede: vi.fn(),
    eliminarSede: vi.fn(),
  },
}))

const cliente = { id: 8, name: 'Torres del Norte' }
const sedes = [
  { id_sede: 1, nombre: 'Sede Norte', direccion: 'Cra 7', ciudad: 'Bogotá', total_ascensores: 2 },
  { id_sede: 2, nombre: 'Sede Sur', direccion: null, ciudad: 'Bogotá', total_ascensores: 0 },
]

const abrir = () => render(<SedesClienteDialog open cliente={cliente} onClose={vi.fn()} />)

describe('SedesClienteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clienteService.listarSedes.mockResolvedValue(sedes)
  })

  it('should list the client sedes with their elevator count', async () => {
    // Arrange / Act
    abrir()
    // Assert
    expect(await screen.findByText('Sede Norte')).toBeInTheDocument()
    expect(screen.getByText('Cra 7 · Bogotá · 2 ascensor(es)')).toBeInTheDocument()
    expect(screen.getByText('Sedes de Torres del Norte')).toBeInTheDocument()
    expect(clienteService.listarSedes).toHaveBeenCalledWith(8)
  })

  it('should show an empty message when the client has no sedes', async () => {
    clienteService.listarSedes.mockResolvedValue([])
    abrir()
    expect(await screen.findByText('Este cliente todavía no tiene sedes.')).toBeInTheDocument()
  })

  it('should ask for a name before adding a sede', async () => {
    abrir()
    await screen.findByText('Sede Norte')
    fireEvent.click(screen.getByRole('button', { name: 'Agregar sede' }))
    expect(await screen.findByText('Escribe el nombre de la sede')).toBeInTheDocument()
    expect(clienteService.crearSede).not.toHaveBeenCalled()
  })

  it('should add a sede and reload the list', async () => {
    clienteService.crearSede.mockResolvedValue({})
    abrir()
    await screen.findByText('Sede Norte')
    fireEvent.change(screen.getByLabelText(/Nombre de la sede/), { target: { value: 'Sede Centro' } })
    fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Medellín' } })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar sede' }))
    await waitFor(() => expect(clienteService.crearSede).toHaveBeenCalledWith(8, {
      nombre: 'Sede Centro', direccion: '', ciudad: 'Medellín',
    }))
    await waitFor(() => expect(clienteService.listarSedes).toHaveBeenCalledTimes(2))
  })

  it('should show the backend message when a sede cannot be deleted', async () => {
    clienteService.eliminarSede.mockRejectedValue(new Error('No se puede eliminar: la sede tiene 2 ascensor(es).'))
    abrir()
    await screen.findByText('Sede Norte')
    fireEvent.click(screen.getAllByTitle('Eliminar sede')[0])
    expect(await screen.findByText(/la sede tiene 2 ascensor/)).toBeInTheDocument()
  })

  it('should rename a sede', async () => {
    clienteService.modificarSede.mockResolvedValue({})
    abrir()
    await screen.findByText('Sede Sur')
    fireEvent.click(screen.getAllByTitle('Editar sede')[1])
    const nombre = screen.getByDisplayValue('Sede Sur')
    fireEvent.change(nombre, { target: { value: 'Sede Sur Oriente' } })
    fireEvent.click(screen.getByTitle('Guardar sede'))
    await waitFor(() => expect(clienteService.modificarSede).toHaveBeenCalledWith(2, {
      nombre: 'Sede Sur Oriente', direccion: '', ciudad: 'Bogotá',
    }))
  })

  it('should not save an empty name when renaming', async () => {
    abrir()
    await screen.findByText('Sede Sur')
    fireEvent.click(screen.getAllByTitle('Editar sede')[1])
    fireEvent.change(screen.getByDisplayValue('Sede Sur'), { target: { value: '  ' } })
    fireEvent.click(screen.getByTitle('Guardar sede'))
    expect(await screen.findByText('El nombre de la sede no puede quedar vacío')).toBeInTheDocument()
    expect(clienteService.modificarSede).not.toHaveBeenCalled()
  })
})
