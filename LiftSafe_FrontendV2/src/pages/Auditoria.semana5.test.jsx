import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Auditoria from './Auditoria'
import { auditoriaService } from '../services/auditoriaService'

const auth = { user: { role: 'Administrador' } }
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../services/auditoriaService', () => ({
  auditoriaService: { listar: vi.fn(), filtrarPorTabla: vi.fn() },
}))

const registro = (extra = {}) => ({
  id_auditoria: 1,
  fecha_evento: '2026-11-10T10:00:00',
  usuario_nombre: 'Ana',
  tabla_afectada: 'usuario',
  operacion: 'INSERT',
  id_registro: 5,
  ...extra,
})

beforeEach(() => {
  auth.user = { role: 'Administrador' }
  auditoriaService.listar.mockReset().mockResolvedValue([])
  auditoriaService.filtrarPorTabla.mockReset().mockResolvedValue([])
})

describe('<Auditoria />', () => {
  it('should deny access to anyone who is not an administrator', async () => {
    auth.user = { role: 'Cliente' }
    render(<Auditoria />)
    expect(await screen.findByText('No tienes permisos para ver esta página')).toBeInTheDocument()
  })

  it('should list the audit records with user, operation and affected row', async () => {
    auditoriaService.listar.mockResolvedValue([registro()])
    render(<Auditoria />)

    expect(await screen.findByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('INSERT')).toBeInTheDocument()
    expect(screen.getByText('usuario #5')).toBeInTheDocument()
  })

  it('should show "Sistema" and a dash when the record has no user or id', async () => {
    auditoriaService.listar.mockResolvedValue([registro({ usuario_nombre: null, id_registro: null })])
    render(<Auditoria />)

    expect(await screen.findByText('Sistema')).toBeInTheDocument()
    expect(screen.getByText('usuario #—')).toBeInTheDocument()
  })

  it('should tell the admin when there are no records', async () => {
    render(<Auditoria />)
    expect(await screen.findByText('No hay registros de auditoría todavía')).toBeInTheDocument()
  })

  it('should show the error when the audit cannot be loaded', async () => {
    auditoriaService.listar.mockRejectedValue(new Error('Fallo del servidor'))
    render(<Auditoria />)
    expect(await screen.findByText('Fallo del servidor')).toBeInTheDocument()
  })

  it('should filter by table through the backend', async () => {
    const user = userEvent.setup()
    render(<Auditoria />)

    await user.click(await screen.findByRole('combobox', { name: /Filtrar por tabla/ }))
    await user.click(await screen.findByRole('option', { name: 'ascensor' }))

    await waitFor(() => expect(auditoriaService.filtrarPorTabla).toHaveBeenCalledWith('ascensor'))
  })

  it('should filter the loaded records with the search box', async () => {
    auditoriaService.listar.mockResolvedValue([
      registro({ id_auditoria: 1, usuario_nombre: 'Ana' }),
      registro({ id_auditoria: 2, usuario_nombre: 'Luis' }),
    ])
    const user = userEvent.setup()
    render(<Auditoria />)

    await screen.findByText('Ana')
    await user.type(screen.getByPlaceholderText(/Buscar por usuario/), 'Luis')

    expect(screen.getByText('Luis')).toBeInTheDocument()
    expect(screen.queryByText('Ana')).not.toBeInTheDocument()
  })
})