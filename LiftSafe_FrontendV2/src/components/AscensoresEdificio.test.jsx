import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AscensoresEdificio from './AscensoresEdificio'
import { clienteService } from '../services/clienteService'
import { ascensorService } from '../services/ascensorService'

vi.mock('../services/clienteService', () => ({ clienteService: { listarAscensoresSede: vi.fn() } }))
vi.mock('../services/ascensorService', () => ({ ascensorService: { crear: vi.fn() } }))

const sede = { id_sede: 3, nombre: 'Torre Norte', direccion: 'Cra 7 #100', ciudad: 'Bogotá', total_ascensores: 0 }
const escribir = (etiqueta, valor) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })

describe('AscensoresEdificio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clienteService.listarAscensoresSede.mockResolvedValue([])
  })

  it('should register an elevator in the building', async () => {
    const onCambio = vi.fn()
    render(<AscensoresEdificio sede={sede} idCliente={9} onCambio={onCambio} />)
    fireEvent.click(screen.getByText('Ascensores (0)'))
    expect(await screen.findByText('Este edificio todavía no tiene ascensores.')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Agregar ascensor'))
    fireEvent.click(screen.getByText('Guardar ascensor'))
    expect(screen.getByText('Escribe el código del ascensor')).toBeInTheDocument()

    escribir('Código interno *', 'ASC-120')
    escribir('Marca *', 'Otis')
    escribir('Modelo *', 'Gen2')
    escribir('Número de serie *', 'S-1')
    escribir('Número de pisos *', '12')
    escribir('Capacidad (kg) *', '630')
    ascensorService.crear.mockResolvedValue({})
    clienteService.listarAscensoresSede.mockResolvedValue([{ id_ascensor: 1, codigo_interno: 'ASC-120', marca: 'Otis', modelo: 'Gen2', numero_pisos: 12 }])
    fireEvent.click(screen.getByText('Guardar ascensor'))

    await waitFor(() => expect(ascensorService.crear).toHaveBeenCalledWith(expect.objectContaining({
      id_cliente: 9, id_sede: 3, codigo_interno: 'ASC-120', direccion_completa: 'Cra 7 #100', ciudad: 'Bogotá',
    })))
    expect(await screen.findByText('ASC-120')).toBeInTheDocument()
    expect(onCambio).toHaveBeenCalled()
  })

  it('should show the server error', async () => {
    render(<AscensoresEdificio sede={sede} idCliente={9} />)
    fireEvent.click(screen.getByText('Ascensores (0)'))
    await screen.findByText('Este edificio todavía no tiene ascensores.')
    fireEvent.click(screen.getByText('Agregar ascensor'))
    ;['Código interno *', 'Marca *', 'Modelo *', 'Número de serie *'].forEach((c) => escribir(c, 'x'))
    escribir('Número de pisos *', '3'); escribir('Capacidad (kg) *', '400')
    ascensorService.crear.mockRejectedValue(new Error('El código interno ya está registrado'))
    fireEvent.click(screen.getByText('Guardar ascensor'))
    expect(await screen.findByText('El código interno ya está registrado')).toBeInTheDocument()
  })
})
