import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
async function abrirCrear(user) {
  await screen.findByText('Ana Pérez')
  await user.click(screen.getByRole('button', { name: 'Nuevo usuario' }))
}

async function llenarCrear(user, { password = 'Abcdefg1', confirm = password } = {}) {
  await user.type(screen.getByLabelText('Nombre completo'), 'Nuevo Usuario')
  await user.type(screen.getByLabelText('Correo electrónico'), 'nuevo@x.com')
  await user.type(screen.getByLabelText('Número de documento'), '1098765432')
  await user.type(screen.getByLabelText('Contraseña'), password)
  await user.type(screen.getByLabelText('Confirmar contraseña'), confirm)
}

describe('<UsersPage /> crear usuario: validaciones', () => {
  it('should ask for the required fields when the form is empty', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)
    await abrirCrear(user)

    // Act
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }))

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent('Completa los campos obligatorios')
    expect(createUserRequest).not.toHaveBeenCalled()
  })

  it('should warn when the passwords do not match', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)
    await abrirCrear(user)

    await llenarCrear(user, { password: 'Abcdefg1', confirm: 'Abcdefg2' })
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Las contraseñas no coinciden')
    expect(createUserRequest).not.toHaveBeenCalled()
  })
})