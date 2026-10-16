import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ListPagination from './ListPagination'
import MessageDialog from './MessageDialog'
import PromptDialog from './PromptDialog'
import RoleRoute from './RoleRoute'
import WelcomeBanner from './WelcomeBanner'

const auth = { user: null, isAuthenticated: false }
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }))

describe('<RoleRoute />', () => {
  const montar = () => render(
    <MemoryRouter initialEntries={['/dashboard/usuarios']}>
      <Routes>
        <Route path="/dashboard/usuarios" element={<RoleRoute permission="usuarios"><p>gestión de usuarios</p></RoleRoute>} />
        <Route path="/dashboard" element={<p>inicio</p>} />
        <Route path="/login" element={<p>login</p>} />
      </Routes>
    </MemoryRouter>,
  )

  it('should send a visitor without session to the login', () => {
    auth.isAuthenticated = false
    auth.user = null
    montar()
    expect(screen.getByText('login')).toBeInTheDocument()
  })

  it.each([
    ['Administrador', 'gestión de usuarios'], // tiene el permiso
    ['Coordinador', 'inicio'], // no lo tiene: vuelve al inicio
  ])('should decide by the role permissions (%s)', (rol, pantalla) => {
    auth.isAuthenticated = true
    auth.user = { role: rol }
    montar()
    expect(screen.getByText(pantalla)).toBeInTheDocument()
  })
})

describe('<ListPagination />', () => {
  it.each([[0], [10]])('should not render when %i items fit in one page (limit 10)', (count) => {
    const { container } = render(<ListPagination count={count} page={0} onPageChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should show the range in Spanish and move to the next page', () => {
    // Arrange: límite, 11 elementos ya necesitan dos páginas
    const onPageChange = vi.fn()
    render(<ListPagination count={11} page={0} onPageChange={onPageChange} />)

    // Act
    fireEvent.click(screen.getByRole('button', { name: /next page/i }))

    // Assert
    expect(screen.getByText('1-10 de 11')).toBeInTheDocument()
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('should respect a custom page size', () => {
    render(<ListPagination count={6} page={1} onPageChange={() => {}} rowsPerPage={5} />)
    expect(screen.getByText('6-6 de 6')).toBeInTheDocument()
  })
})

describe('<PromptDialog />', () => {
  it('should send the typed text when confirming', () => {
    // Arrange
    const onConfirm = vi.fn()
    render(<PromptDialog open title="Cancelar programación" label="Motivo" confirmText="Enviar" onConfirm={onConfirm} onClose={() => {}} />)

    // Act
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Cliente ausente' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    // Assert
    expect(onConfirm).toHaveBeenCalledWith('Cliente ausente')
  })

  it('should start empty every time it opens and close with Cancelar', () => {
    const onClose = vi.fn()
    const { rerender } = render(<PromptDialog open title="T" label="Motivo" onConfirm={() => {}} onClose={onClose} />)
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'algo' } })
    rerender(<PromptDialog open={false} title="T" label="Motivo" onConfirm={() => {}} onClose={onClose} />)
    rerender(<PromptDialog open title="T" label="Motivo" onConfirm={() => {}} onClose={onClose} />)
    expect(screen.getByLabelText('Motivo')).toHaveValue('')
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('<MessageDialog />', () => {
  it.each([
    ['success', 'Éxito'],
    ['error', 'Error'],
    ['warning', 'Atención'],
    ['desconocida', 'Información'], // severidad no prevista: título por defecto
  ])('should use the default title for severity %s', (severity, titulo) => {
    render(<MessageDialog open severity={severity} message="Hecho" onClose={() => {}} />)
    expect(screen.getByText(titulo)).toBeInTheDocument()
  })

  it('should prefer the given title and close with Aceptar', () => {
    const onClose = vi.fn()
    render(<MessageDialog open title="Informe enviado" message="Listo" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }))
    expect(screen.getByText('Informe enviado')).toBeInTheDocument()
    expect(onClose).toHaveBeenCalled()
  })
})

describe('<WelcomeBanner />', () => {
  beforeEach(() => {
    // Fecha fija: el test no depende del día en que se corra
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 14, 10, 0))
  })
  afterEach(() => vi.useRealTimers())

  it('should greet with the role and the first name and show a fixed date', () => {
    render(<WelcomeBanner name="Carlos Andrés Ramírez" role="Coordinador" />)
    expect(screen.getByText(/Hola, Coordinador Carlos/)).toBeInTheDocument()
    expect(screen.getByText('Panel de coordinación · LiftSafe')).toBeInTheDocument()
    expect(screen.getByText('miércoles, 14 de octubre 2026')).toBeInTheDocument()
  })

  it('should use a generic label for an unknown role and render the actions', () => {
    render(<WelcomeBanner role="Visitante" actions={<button>Nueva solicitud</button>} />)
    expect(screen.getByText('Mi panel · LiftSafe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nueva solicitud' })).toBeInTheDocument()
  })
})
