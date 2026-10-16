import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardLayout from './DashboardLayout'
import { notificacionService } from '../services/notificacionService'

const sesion = { user: { name: 'Carlos Ramírez', role: 'Coordinador' }, logout: vi.fn() }
vi.mock('../context/AuthContext', () => ({ useAuth: () => sesion }))
vi.mock('../services/notificacionService', () => ({
  notificacionService: { listar: vi.fn(), marcarLeida: vi.fn(), marcarTodasLeidas: vi.fn() },
}))

const notif = (id, leida, mensaje, enlace = null) => ({
  id_notificacion: id, leida, mensaje, enlace, fecha_creacion: '2026-10-13T20:00:00',
})

function montar(ruta = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<p>contenido inicio</p>} />
          <Route path="solicitudes" element={<p>contenido solicitudes</p>} />
        </Route>
        <Route path="/login" element={<p>pantalla de login</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const menuLateral = () => screen.getByRole('navigation')
const abrirCampana = async (user) => user.click(screen.getByTestId('NotificationsIcon').closest('button'))

describe('<DashboardLayout />', () => {
  beforeEach(() => {
    sesion.user = { name: 'Carlos Ramírez', role: 'Coordinador' }
    sesion.logout.mockClear()
    notificacionService.listar.mockResolvedValue([])
    notificacionService.marcarLeida.mockResolvedValue({})
    notificacionService.marcarTodasLeidas.mockResolvedValue({})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should render the page inside the layout and show the user role', async () => {
    montar()
    expect(await screen.findByText('contenido inicio')).toBeInTheDocument()
    expect(within(menuLateral()).getByText('COORDINADOR')).toBeInTheDocument()
    expect(within(menuLateral()).getByText('Carlos Ramírez')).toBeInTheDocument()
  })

  it.each([
    ['Coordinador', ['Inicio', 'Inspecciones', 'Solicitudes'], ['Usuarios', 'Auditoría']],
    ['Administrador', ['Usuarios', 'Auditoría'], ['Encuestas']],
    ['Cliente', ['Inspecciones', 'Solicitudes', 'Encuestas'], ['Usuarios', 'Ascensores']],
  ])('should show only the screens allowed for %s', async (rol, visibles, ocultas) => {
    // Arrange
    sesion.user = { name: 'X', role: rol }

    // Act
    montar()

    // Assert
    const menu = within(menuLateral())
    visibles.forEach((texto) => expect(menu.getByRole('link', { name: new RegExp(texto) })).toBeInTheDocument())
    ocultas.forEach((texto) => expect(menu.queryByRole('link', { name: new RegExp(texto) })).toBeNull())
  })

  it('should count only unread notifications in the bell', async () => {
    notificacionService.listar.mockResolvedValue([notif(1, false, 'A'), notif(2, false, 'B'), notif(3, true, 'C')])
    montar()
    const campana = screen.getByTestId('NotificationsIcon').closest('button')
    await waitFor(() => expect(within(campana).getByText('2')).toBeInTheDocument())
  })

  it('should tell the user when there are no notifications', async () => {
    const user = userEvent.setup()
    montar()
    await waitFor(() => expect(notificacionService.listar).toHaveBeenCalled())
    await abrirCampana(user)
    expect(await screen.findByText('No tienes notificaciones')).toBeInTheDocument()
  })

  it('should mark a notification as read and go to its section when clicked', async () => {
    // Arrange
    const user = userEvent.setup()
    notificacionService.listar.mockResolvedValue([notif(7, false, 'Nueva solicitud SOL-1', '/dashboard/solicitudes')])
    montar()
    await waitFor(() => expect(notificacionService.listar).toHaveBeenCalled())

    // Act
    await abrirCampana(user)
    await user.click(await screen.findByText('Nueva solicitud SOL-1'))

    // Assert
    expect(notificacionService.marcarLeida).toHaveBeenCalledWith(7)
    expect(await screen.findByText('contenido solicitudes')).toBeInTheDocument()
  })

  it('should not call the API again for a notification that is already read', async () => {
    const user = userEvent.setup()
    notificacionService.listar.mockResolvedValue([notif(8, true, 'Ya leída')])
    montar()
    await waitFor(() => expect(notificacionService.listar).toHaveBeenCalled())
    await abrirCampana(user)
    await user.click(await screen.findByText('Ya leída'))
    expect(notificacionService.marcarLeida).not.toHaveBeenCalled()
  })

  it('should mark all notifications as read', async () => {
    const user = userEvent.setup()
    notificacionService.listar.mockResolvedValue([notif(1, false, 'A'), notif(2, false, 'B')])
    montar()
    await waitFor(() => expect(notificacionService.listar).toHaveBeenCalled())
    await abrirCampana(user)

    await user.click(await screen.findByText('Marcar todas como leídas'))

    expect(notificacionService.marcarTodasLeidas).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByText('Marcar todas como leídas')).toBeNull())
  })

  it('should keep working when the notifications cannot be loaded', async () => {
    notificacionService.listar.mockRejectedValue(new Error('sin red'))
    montar()
    await waitFor(() => expect(console.error).toHaveBeenCalledWith('Error cargando notificaciones:', expect.any(Error)))
    expect(screen.getByText('contenido inicio')).toBeInTheDocument()
  })

  it('should warn with a message when a new notification arrives while the session is open', async () => {
    // Arrange: primera carga sin alarma, la consulta periódica trae una nueva
    vi.useFakeTimers({ shouldAdvanceTime: true })
    notificacionService.listar
      .mockResolvedValueOnce([notif(1, true, 'Vieja')])
      .mockResolvedValue([notif(1, true, 'Vieja'), notif(2, false, 'Te asignaron ASC-099')])
    montar()
    await waitFor(() => expect(notificacionService.listar).toHaveBeenCalledTimes(1))

    // Act: pasan los 20 s del intervalo de consulta
    await act(async () => { await vi.advanceTimersByTimeAsync(20000) })

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent('Te asignaron ASC-099')
  })

  it('should summarise several new notifications in one message', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    notificacionService.listar
      .mockResolvedValueOnce([])
      .mockResolvedValue([notif(1, false, 'A'), notif(2, false, 'B'), notif(3, false, 'C')])
    montar()
    await waitFor(() => expect(notificacionService.listar).toHaveBeenCalledTimes(1))
    await act(async () => { await vi.advanceTimersByTimeAsync(20000) })
    expect(await screen.findByRole('alert')).toHaveTextContent('Tienes 3 notificaciones nuevas')
  })

  it('should log out from the side menu', async () => {
    const user = userEvent.setup()
    montar()
    await user.click(within(menuLateral()).getByRole('link', { name: /Cerrar sesión/ }))
    expect(sesion.logout).toHaveBeenCalledTimes(1)
  })

  it('should show the name and role in the avatar menu', async () => {
    const user = userEvent.setup()
    montar()
    await user.click(screen.getByText('C', { selector: '.MuiAvatar-root' , ignore: 'nav *' }).closest('button'))
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByText('Carlos Ramírez')).toBeInTheDocument()
    expect(within(menu).getByText('Coordinador')).toBeInTheDocument()
  })
})
