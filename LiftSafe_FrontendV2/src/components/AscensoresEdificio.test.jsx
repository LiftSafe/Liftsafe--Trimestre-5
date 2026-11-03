import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AscensoresEdificio from './AscensoresEdificio'
import { clienteService } from '../services/clienteService'
import { ascensorService } from '../services/ascensorService'

vi.mock('../services/clienteService', () => ({ clienteService: { listarAscensoresSede: vi.fn() } }))
vi.mock('../services/ascensorService', () => ({ ascensorService: { crear: vi.fn(), modificar: vi.fn() } }))

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

  it('should edit an elevator from its row, code included', async () => {
    const existente = { id_ascensor: 7, codigo_interno: '111211', marca: 'OTIS', modelo: 'GEN2', numero_serie: '39NE010', tipo_ascensor: 'Hidráulico', capacidad_kg: 630, capacidad_personas: 8, numero_pisos: 6, ubicacion_exacta: 'TORRE 1' }
    clienteService.listarAscensoresSede.mockResolvedValue([existente])
    ascensorService.modificar.mockResolvedValue({})
    const onCambio = vi.fn()
    render(<AscensoresEdificio sede={sede} idCliente={9} onCambio={onCambio} enTarjeta />)
    fireEvent.click(await screen.findByTitle('Editar ascensor 111211'))
    expect(screen.getByText('Editar ascensor 111211')).toBeInTheDocument()
    expect(screen.getByLabelText('Marca *')).toHaveValue('OTIS')
    escribir('Código interno *', 'ASC-150')
    clienteService.listarAscensoresSede.mockResolvedValue([{ ...existente, codigo_interno: 'ASC-150' }])
    fireEvent.click(screen.getByText('Guardar cambios'))
    await waitFor(() => expect(ascensorService.modificar).toHaveBeenCalledWith(7, expect.objectContaining({
      codigo_interno: 'ASC-150', marca: 'OTIS', numero_pisos: 6, capacidad_personas: 8,
    })))
    expect(await screen.findByText('ASC-150')).toBeInTheDocument()
    expect(ascensorService.crear).not.toHaveBeenCalled()
    expect(onCambio).toHaveBeenCalled()
  })

  it('should not show the edit button in read only mode', async () => {
    clienteService.listarAscensoresSede.mockResolvedValue([{ id_ascensor: 7, codigo_interno: 'ASC-007' }])
    render(<AscensoresEdificio sede={sede} soloLectura enTarjeta />)
    expect(await screen.findByText('ASC-007')).toBeInTheDocument()
    expect(screen.queryByTitle('Editar ascensor ASC-007')).not.toBeInTheDocument()
  })
})
