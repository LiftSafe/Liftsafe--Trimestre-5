import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ChecklistNorma from './ChecklistNorma'
import { checklistAdminService } from '../services/checklistService'

vi.mock('../services/checklistService', () => ({
  checklistAdminService: { listar: vi.fn(), crearGrupo: vi.fn(), editarGrupo: vi.fn(), crearItem: vi.fn(), editarItem: vi.fn() },
}))

const grupos = () => [
  { id_categoria: 22, nombre_categoria: '6.1 Puertas de piso', descripcion: null, orden_visualizacion: 1, norma_referencia: 'NTC 5926-1:2012', activo: true, items: [
    { id_item: 1, id_categoria: 22, codigo_item: 'NTC-6.1-01', descripcion: 'Enclavamiento de las puertas', criterio_cumplimiento: null, nivel_criticidad: 'Muy grave', obligatorio: true, orden_visualizacion: 1, activo: true, usos: 4 },
    { id_item: 2, id_categoria: 22, codigo_item: 'NTC-6.1-02', descripcion: 'Contactos eléctricos', criterio_cumplimiento: null, nivel_criticidad: 'Grave', obligatorio: true, orden_visualizacion: 2, activo: false, usos: 0 },
  ] },
  { id_categoria: 1, nombre_categoria: 'Cuarto de Máquinas', orden_visualizacion: 1, activo: false, items: [] },
]

describe('ChecklistNorma (RNF-011)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    checklistAdminService.listar.mockResolvedValue(grupos())
  })

  it('should show only active groups and items with the totals', async () => {
    render(<MemoryRouter><ChecklistNorma /></MemoryRouter>)
    expect(await screen.findByText('6.1 Puertas de piso')).toBeInTheDocument()
    expect(screen.getByText(/1 grupos y 1 ítems activos/)).toBeInTheDocument()
    expect(screen.queryByText('Cuarto de Máquinas')).not.toBeInTheDocument()
    expect(screen.queryByText('NTC-6.1-02')).not.toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Ver desactivados'))
    expect(screen.getByText('Cuarto de Máquinas')).toBeInTheDocument()
    expect(screen.getByText('NTC-6.1-02')).toBeInTheDocument()
  })

  it('should propose the next code when adding an item and save it', async () => {
    checklistAdminService.crearItem.mockResolvedValue({})
    render(<MemoryRouter><ChecklistNorma /></MemoryRouter>)
    fireEvent.click(await screen.findByText('6.1 Puertas de piso'))
    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByLabelText(/Código/)).toHaveValue('NTC-6.1-03')
    fireEvent.change(within(dialogo).getByLabelText(/Qué se revisa/), { target: { value: 'Holgura de las puertas' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Guardar' }))
    await vi.waitFor(() => expect(checklistAdminService.crearItem).toHaveBeenCalledWith(expect.objectContaining({
      id_categoria: 22, codigo_item: 'NTC-6.1-03', descripcion: 'Holgura de las puertas', nivel_criticidad: 'Grave', orden_visualizacion: 3,
    })))
    await vi.waitFor(() => expect(checklistAdminService.listar).toHaveBeenCalledTimes(2))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should show the server error inside the form', async () => {
    checklistAdminService.crearGrupo.mockRejectedValue(new Error('Ya existe un grupo llamado «6.1 Puertas de piso»'))
    render(<MemoryRouter><ChecklistNorma /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo grupo' }))
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText(/Nombre del grupo/), { target: { value: '6.1 Puertas de piso' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Guardar' }))
    expect(await within(dialogo).findByText(/Ya existe un grupo/)).toBeInTheDocument()
  })

  it('should deactivate an item with its switch', async () => {
    checklistAdminService.editarItem.mockResolvedValue({})
    render(<MemoryRouter><ChecklistNorma /></MemoryRouter>)
    fireEvent.click(await screen.findByText('6.1 Puertas de piso'))
    fireEvent.click(screen.getByLabelText('Activo NTC-6.1-01'))
    await vi.waitFor(() => expect(checklistAdminService.editarItem).toHaveBeenCalledWith(1, { activo: false }))
  })
})
