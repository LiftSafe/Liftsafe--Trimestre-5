import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

// AuthProvider real hablaría con el backend: aquí la sesión la decide cada test
const auth = { user: null, isAuthenticated: false, login: vi.fn(), register: vi.fn() }
vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => auth,
}))
// El layout real tiene menú, notificaciones, etc. (ya tiene su propia prueba): aquí solo importa la ruta
vi.mock('./layouts/DashboardLayout', async () => {
  const { createElement } = await import('react')
  const { Outlet } = await import('react-router-dom')
  return { default: () => createElement(Outlet) }
})
vi.mock('./pages/DashboardHome', () => ({ default: () => 'inicio-del-panel' }))

const irA = (ruta) => {
  window.history.pushState({}, '', ruta)
  return render(<App />)
}

beforeEach(() => {
  auth.user = null
  auth.isAuthenticated = false
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('<App /> (rutas)', () => {
  it('should send a visitor without session from the dashboard to the login', () => {
    irA('/dashboard')

    expect(screen.getByLabelText(/^Correo electrónico/)).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('should send a visitor from any unknown address to the login', () => {
    irA('/no-existe')

    expect(window.location.pathname).toBe('/login')
  })

  it('should show the dashboard home to a logged user', () => {
    auth.user = { name: 'Ana', role: 'Administrador' }
    auth.isAuthenticated = true

    irA('/dashboard')

    expect(screen.getByText('inicio-del-panel')).toBeInTheDocument()
  })

  it('should send a role without permission back to the dashboard home', () => {
    auth.user = { name: 'Ana', role: 'Coordinador' }
    auth.isAuthenticated = true

    irA('/dashboard/usuarios')

    expect(screen.getByText('inicio-del-panel')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/dashboard')
  })

  it('should send an unknown address of a logged user to the dashboard', () => {
    auth.user = { name: 'Ana', role: 'Administrador' }
    auth.isAuthenticated = true

    irA('/no-existe')

    expect(screen.getByText('inicio-del-panel')).toBeInTheDocument()
  })

  it.each([
    ['/register', /^Correo electrónico/],
    ['/forgot-password', /Correo electrónico/],
  ])('should open the public page %s', (ruta, etiqueta) => {
    irA(ruta)
    expect(screen.getByLabelText(etiqueta)).toBeInTheDocument()
  })
})
