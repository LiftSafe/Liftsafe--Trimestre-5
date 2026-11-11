import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/renderWithProviders'
import Auditoria from './Auditoria'
import { auditoriaService } from '../services/auditoriaService'

let sesion
vi.mock('../context/AuthContext', () => ({ useAuth: () => sesion }))
vi.mock('../services/auditoriaService', () => ({
  auditoriaService: { listar: vi.fn(), filtrarPorTabla: vi.fn() },
}))

const admin = { user: { role: 'Administrador', name: 'Admin' }, isAuthenticated: true }

const registro = (id, usuario, tabla, operacion) => ({
  id_auditoria: id,
  fecha_evento: '2026-10-01T10:00:00',
  usuario_nombre: usuario,
  tabla_afectada: tabla,
  operacion,
  id_registro: id,
})

describe('Auditoria', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sesion = admin
  })

  it('muestra los registros de auditoría que devuelve la API', async () => {
    auditoriaService.listar.mockResolvedValue([
      registro(1, 'Ana Pérez', 'usuario', 'INSERT'),
      registro(2, 'Luis Gómez', 'edificios', 'UPDATE'),
    ])

    renderWithProviders(<Auditoria />)

    expect(await screen.findByRole('cell', { name: 'Ana Pérez' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Luis Gómez' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Auditoría del sistema' })).toBeInTheDocument()
  })

  it('muestra un mensaje cuando no hay registros', async () => {
    auditoriaService.listar.mockResolvedValue([])

    renderWithProviders(<Auditoria />)

    expect(await screen.findByText('No hay registros de auditoría todavía')).toBeInTheDocument()
  })

  it('muestra el error cuando la API falla', async () => {
    auditoriaService.listar.mockRejectedValue(new Error('Servidor no disponible'))

    renderWithProviders(<Auditoria />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Servidor no disponible')
    expect(screen.queryByRole('cell', { name: 'Ana Pérez' })).not.toBeInTheDocument()
  })

  it('bloquea la página a quien no es Administrador', () => {
    sesion = { user: { role: 'Inspector' }, isAuthenticated: true }

    renderWithProviders(<Auditoria />)

    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permisos para ver esta página')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('filtra la tabla al escribir en el buscador', async () => {
    const user = userEvent.setup()
    auditoriaService.listar.mockResolvedValue([
      registro(1, 'Ana Pérez', 'usuario', 'INSERT'),
      registro(2, 'Luis Gómez', 'edificios', 'UPDATE'),
    ])
    renderWithProviders(<Auditoria />)
    await screen.findByRole('cell', { name: 'Ana Pérez' })

    await user.type(screen.getByRole('textbox', { name: 'Buscar en la auditoría' }), 'Luis')

    expect(screen.getByRole('cell', { name: 'Luis Gómez' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Ana Pérez' })).not.toBeInTheDocument()
  })

  it('pide a la API solo los registros de la tabla elegida en el filtro', async () => {
    const user = userEvent.setup()
    auditoriaService.listar.mockResolvedValue([])
    auditoriaService.filtrarPorTabla.mockResolvedValue([registro(3, 'Ana Pérez', 'usuario', 'DELETE')])
    renderWithProviders(<Auditoria />)
    await screen.findByText('No hay registros de auditoría todavía')

    await user.click(screen.getByRole('combobox', { name: 'Filtrar por tabla' }))
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'usuario' }))

    expect(auditoriaService.filtrarPorTabla).toHaveBeenCalledWith('usuario')
    expect(await screen.findByRole('cell', { name: 'DELETE' })).toBeInTheDocument()
  })
})