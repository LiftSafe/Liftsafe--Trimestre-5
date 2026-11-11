import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MisEdificios from './MisEdificios'
import { clienteService } from '../services/clienteService'

vi.mock('../services/clienteService', () => ({ clienteService: { misSedes: vi.fn(), listarAscensoresSede: vi.fn() } }))
vi.mock('../services/ascensorService', () => ({ ascensorService: { crear: vi.fn() } }))

const pintar = () => render(<MemoryRouter><MisEdificios /></MemoryRouter>)

describe('MisEdificios', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should list the client buildings with their elevators, read only', async () => {
    clienteService.misSedes.mockResolvedValue([{ id_sede: 1, nombre: 'Torre Norte', direccion: 'Cra 7', ciudad: 'Bogotá', total_ascensores: 1 }])
    clienteService.listarAscensoresSede.mockResolvedValue([{ id_ascensor: 4, codigo_interno: 'ASC-004', marca: 'Otis', modelo: 'Gen2', numero_pisos: 9 }])
    pintar()
    expect(await screen.findByText('Torre Norte')).toBeInTheDocument()
    expect(screen.getByText('Cra 7 · Bogotá')).toBeInTheDocument()
    expect(await screen.findByText('ASC-004')).toBeInTheDocument()
    expect(screen.queryByText('Agregar ascensor')).not.toBeInTheDocument()
  })

  it('should explain when there are no buildings yet', async () => {
    clienteService.misSedes.mockResolvedValue([])
    pintar()
    expect(await screen.findByText(/Todavía no tienes edificios registrados/)).toBeInTheDocument()
  })
})
