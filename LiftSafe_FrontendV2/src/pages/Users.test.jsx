import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UsersPage from './Users'
import { renderWithProviders } from '../test/renderWithProviders'
import { fetchUsuarios } from '../services/dashboardService'
import { createUserRequest, updateUserRequest, eliminarUsuario } from '../services/authService'

const auth = { user: { token: 'tok' }, hasAction: () => true, logout: vi.fn() }
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../services/dashboardService', () => ({ fetchUsuarios: vi.fn() }))
vi.mock('../services/authService', () => ({
  createUserRequest: vi.fn(),
  updateUserRequest: vi.fn(),
  eliminarUsuario: vi.fn(),
}))

const usuarios = [
  { id: 1, name: 'Ana Pérez', email: 'ana@x.com', role: 'Inspector', status: 'Activo',
    document: '1098765432', tipo_documento: 'CC', documento_identidad: '1098765432', phone: '3001234567' },
  { id: 2, name: 'Luis Gómez', email: 'luis@x.com', role: 'Administrador', status: 'Inactivo',
    document: '1010101010', tipo_documento: 'CC', documento_identidad: '1010101010' },
]

beforeEach(() => {
  ;[fetchUsuarios, createUserRequest, updateUserRequest, eliminarUsuario, auth.logout].forEach((m) => m.mockReset())
  fetchUsuarios.mockResolvedValue(usuarios)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('<UsersPage /> listado', () => {
  it('should list the users returned by the API', async () => {
    // Arrange + Act
    renderWithProviders(<UsersPage />)

    // Assert
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('luis@x.com')).toBeInTheDocument()
  })

  it('should show the empty message when there are no users', async () => {
    fetchUsuarios.mockResolvedValue([])
    renderWithProviders(<UsersPage />)
    expect(await screen.findByText('No hay usuarios registrados')).toBeInTheDocument()
  })

  it('should show the error alert when the API fails', async () => {
    fetchUsuarios.mockRejectedValue(new Error('Error de servidor'))
    renderWithProviders(<UsersPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Error de servidor')
  })
})