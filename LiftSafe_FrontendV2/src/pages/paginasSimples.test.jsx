import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Auditoria from './Auditoria'
import DashboardHome from './DashboardHome'
import Encuestas from './Encuestas'
import Landing from './Landing'
import Settings from './Settings'
import { auditoriaService } from '../services/auditoriaService'
import { encuestaService } from '../services/encuestaService'

const auth = { user: null, hasAction: () => false }
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../services/auditoriaService', () => ({ auditoriaService: { listar: vi.fn(), filtrarPorTabla: vi.fn() } }))
vi.mock('../services/encuestaService', () => ({ encuestaService: { listarMias: vi.fn(), responder: vi.fn() } }))

// DashboardHome solo decide qué panel mostrar según el rol: los paneles se prueban en dashboards.test.jsx
vi.mock('./dashboards/AdminDashboard', () => ({ default: () => 'panel-admin' }))
vi.mock('./dashboards/AsesorDashboard', () => ({ default: () => 'panel-asesor' }))
vi.mock('./dashboards/CoordinadorDashboard', () => ({ default: () => 'panel-coordinador' }))
vi.mock('./dashboards/DirectorTecnicoDashboard', () => ({ default: () => 'panel-director' }))
vi.mock('./dashboards/InspectorDashboard', () => ({ default: () => 'panel-inspector' }))
vi.mock('./dashboards/ClientDashboard', () => ({ default: () => 'panel-cliente' }))

const montar = (ui, ruta = '/') => render(
  <MemoryRouter initialEntries={[ruta]}>
    <Routes>
      <Route path="/" element={ui} />
      <Route path="/login" element={<p>pantalla de login</p>} />
    </Routes>
  </MemoryRouter>,
)

beforeEach(() => {
  auth.user = null
  auth.hasAction = () => false
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

describe('<DashboardHome />', () => {
  it.each([
    ['Administrador', 'panel-admin'],
    ['Asesor', 'panel-asesor'],
    ['Coordinador', 'panel-coordinador'],
    ['Director Técnico', 'panel-director'],
    ['Inspector', 'panel-inspector'],
    ['Cliente', 'panel-cliente'],
  ])('should show the %s panel', (role, panel) => {
    auth.user = { role }
    montar(<DashboardHome />)
    expect(screen.getByText(panel)).toBeInTheDocument()
  })

  it.each([
    ['there is no session', null],
    ['the user has no role', { name: 'Ana' }],
    ['the role is unknown', { role: 'Superusuario' }],
  ])('should send the visitor to the login when %s', (_caso, user) => {
    auth.user = user
    montar(<DashboardHome />)
    expect(screen.getByText('pantalla de login')).toBeInTheDocument()
  })
})

describe('<Settings />', () => {
  it('should show the data of the logged user', () => {
    auth.user = { name: 'Ana Pérez', email: 'ana@x.com', role: 'Coordinador' }
    montar(<Settings />)

    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Ana Pérez')
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('ana@x.com')
    expect(screen.queryByLabelText('Número de licencia')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Edificio')).not.toBeInTheDocument()
  })

  it('should ask the inspector for the license number', () => {
    auth.user = { name: 'Eva', email: 'eva@x.com', role: 'Inspector' }
    montar(<Settings />)
    expect(screen.getByLabelText('Número de licencia')).toBeInTheDocument()
  })

  it('should show the building of a client as a read-only field', () => {
    auth.user = { name: 'Dora', email: 'dora@x.com', role: 'Cliente' }
    montar(<Settings />)
    expect(screen.getByLabelText('Edificio')).toBeDisabled()
  })

  it('should show the notification preferences only to roles that can manage them', () => {
    auth.user = { name: 'Ana', email: 'ana@x.com', role: 'Coordinador' }
    auth.hasAction = (accion) => accion === 'manageNotifications'
    montar(<Settings />)

    expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    expect(screen.getByLabelText('Nuevos reportes')).not.toBeChecked()
    fireEvent.click(screen.getByLabelText('Nuevos reportes'))
    expect(screen.getByLabelText('Nuevos reportes')).toBeChecked()
  })

  it('should hide the reports switch from clients', () => {
    auth.user = { name: 'Dora', email: 'dora@x.com', role: 'Cliente' }
    auth.hasAction = () => true
    montar(<Settings />)

    expect(screen.getByLabelText('Alertas por correo')).toBeChecked()
    fireEvent.click(screen.getByLabelText('Alertas por correo'))
    expect(screen.getByLabelText('Alertas por correo')).not.toBeChecked()
    expect(screen.queryByLabelText('Nuevos reportes')).not.toBeInTheDocument()
  })

  it('should confirm that the changes were saved', () => {
    auth.user = { name: 'Ana', email: 'ana@x.com', role: 'Coordinador' }
    montar(<Settings />)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(screen.getByText('Cambios guardados')).toBeInTheDocument()
  })
})

describe('<Landing />', () => {
  it('should present the system and its four modules', () => {
    montar(<Landing />)

    expect(screen.getByText('Seguridad y confianza en cada ascensor')).toBeInTheDocument()
    ;['Gestión de Inspecciones', 'Registro de Ascensores', 'Certificación', 'Dashboard en Tiempo Real'].forEach((modulo) => {
      expect(screen.getByText(modulo)).toBeInTheDocument()
    })
  })

  it('should offer the login and the registration', () => {
    montar(<Landing />)

    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Registrarse' })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: 'Comenzar ahora' })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: 'Acceder al sistema' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Crear cuenta gratuita' })).toHaveAttribute('href', '/register')
  })
})

describe('<Auditoria />', () => {
  const logs = [
    { id_auditoria: 1, fecha_evento: '2026-10-01T10:00:00', usuario_nombre: 'Ana', tabla_afectada: 'ascensor', operacion: 'INSERT', id_registro: 5 },
    { id_auditoria: 2, fecha_evento: '2026-10-02T11:00:00', usuario_nombre: null, tabla_afectada: 'usuario', operacion: 'DELETE', id_registro: null },
  ]

  it('should not let a non-administrator see the audit log', async () => {
    auth.user = { role: 'Coordinador' }
    auditoriaService.listar.mockResolvedValue(logs)

    montar(<Auditoria />)

    expect(await screen.findByText('No tienes permisos para ver esta página')).toBeInTheDocument()
    expect(screen.queryByText('Auditoría del sistema')).not.toBeInTheDocument()
  })

  it('should list the events with the affected record and "Sistema" when there is no user', async () => {
    auth.user = { role: 'Administrador' }
    auditoriaService.listar.mockResolvedValue(logs)

    montar(<Auditoria />)

    expect(await screen.findByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Sistema')).toBeInTheDocument()
    expect(screen.getByText('ascensor #5')).toBeInTheDocument()
    expect(screen.getByText('usuario #—')).toBeInTheDocument()
    expect(auditoriaService.listar).toHaveBeenCalledTimes(1)
  })

  it('should filter the events with the search box', async () => {
    auth.user = { role: 'Administrador' }
    auditoriaService.listar.mockResolvedValue(logs)
    montar(<Auditoria />)
    await screen.findByText('Ana')

    await userEvent.type(screen.getByPlaceholderText(/Buscar por usuario/), 'ana')

    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.queryByText('Sistema')).not.toBeInTheDocument()
  })

  it('should tell the user when there are no records', async () => {
    auth.user = { role: 'Administrador' }
    auditoriaService.listar.mockResolvedValue([])

    montar(<Auditoria />)

    expect(await screen.findByText('No hay registros de auditoría todavía')).toBeInTheDocument()
  })

  it('should show the error when the log cannot be loaded', async () => {
    auth.user = { role: 'Administrador' }
    auditoriaService.listar.mockRejectedValue(new Error('Sin permisos en el servidor'))

    montar(<Auditoria />)

    expect(await screen.findByText('Sin permisos en el servidor')).toBeInTheDocument()
  })
})

describe('<Encuestas />', () => {
  const pendiente = { id_encuesta: 1, codigo_ascensor: 'ASC-001', respondida: false }
  const respondida = { id_encuesta: 2, codigo_ascensor: 'ASC-002', respondida: true, calificacion: 5, comentario: 'Muy bueno' }

  it('should explain that there are no surveys yet', async () => {
    encuestaService.listarMias.mockResolvedValue([])

    montar(<Encuestas />)

    expect(await screen.findByText(/Todavía no tienes encuestas/)).toBeInTheDocument()
  })

  it('should separate the pending surveys from the answered ones', async () => {
    encuestaService.listarMias.mockResolvedValue([pendiente, respondida])

    montar(<Encuestas />)

    expect(await screen.findByText('Pendientes (1)')).toBeInTheDocument()
    expect(screen.getByText('Respondidas (1)')).toBeInTheDocument()
    expect(screen.getByText('Ascensor ASC-001')).toBeInTheDocument()
    expect(screen.getByText('"Muy bueno"')).toBeInTheDocument()
  })

  it('should ask for a rating before sending', async () => {
    encuestaService.listarMias.mockResolvedValue([pendiente])
    montar(<Encuestas />)

    fireEvent.click(await screen.findByRole('button', { name: 'Enviar respuesta' }))

    expect(await screen.findByText('Selecciona una calificación de 1 a 5 estrellas antes de enviar')).toBeInTheDocument()
    expect(encuestaService.responder).not.toHaveBeenCalled()
  })

  it('should send the rating and the comment, and thank the user', async () => {
    encuestaService.listarMias.mockResolvedValue([pendiente])
    encuestaService.responder.mockResolvedValue({})
    montar(<Encuestas />)
    await screen.findByText('Pendientes (1)')

    fireEvent.click(screen.getByLabelText('4 Stars'))
    fireEvent.change(screen.getByLabelText('Comentario (opcional)'), { target: { value: 'Excelente servicio' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar respuesta' }))

    expect(await screen.findByText('¡Gracias por tu respuesta!')).toBeInTheDocument()
    expect(encuestaService.responder).toHaveBeenCalledWith(1, { calificacion: 4, comentario: 'Excelente servicio' })
    expect(encuestaService.listarMias).toHaveBeenCalledTimes(2)
  })

  it('should show the error when the survey cannot be sent', async () => {
    encuestaService.listarMias.mockResolvedValue([pendiente])
    encuestaService.responder.mockRejectedValue(new Error('La encuesta ya fue respondida'))
    montar(<Encuestas />)
    await screen.findByText('Pendientes (1)')

    fireEvent.click(screen.getByLabelText('5 Stars'))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar respuesta' }))

    expect(await screen.findByText('La encuesta ya fue respondida')).toBeInTheDocument()
  })

  it('should show the error when the surveys cannot be loaded', async () => {
    encuestaService.listarMias.mockRejectedValue(new Error('Sin conexión'))

    montar(<Encuestas />)

    expect(await screen.findByText('Sin conexión')).toBeInTheDocument()
  })
})
