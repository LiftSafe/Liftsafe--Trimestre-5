import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminDashboard from './dashboards/AdminDashboard'
import AsesorDashboard from './dashboards/AsesorDashboard'
import ClientDashboard from './dashboards/ClientDashboard'
import CoordinadorDashboard from './dashboards/CoordinadorDashboard'
import DirectorTecnicoDashboard from './dashboards/DirectorTecnicoDashboard'
import InspectorDashboard from './dashboards/InspectorDashboard'
import {
  fetchAscensores, fetchCharts, fetchInformes, fetchInspecciones, fetchStats, fetchUsuarios,
} from '../services/dashboardService'
import { apiGet } from '../services/apiClient'
import { usuarioAscensorService } from '../services/usuarioAscensorService'
import { solicitudService } from '../services/solicitudService'
import { programacionService } from '../services/programacionService'
import { usuarioService } from '../services/usuarioService'

// useDashboardData tiene `logout` como dependencia: debe ser siempre la misma función
const auth = { user: { name: 'Ana Pérez', role: 'Administrador' }, logout: vi.fn() }
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }))

vi.mock('../services/dashboardService', () => ({
  fetchStats: vi.fn(),
  fetchCharts: vi.fn(),
  fetchUsuarios: vi.fn(),
  fetchInspecciones: vi.fn(),
  fetchAscensores: vi.fn(),
  fetchInformes: vi.fn(),
}))
vi.mock('../services/apiClient', () => ({ apiGet: vi.fn() }))
vi.mock('../services/usuarioAscensorService', () => ({
  usuarioAscensorService: { listar: vi.fn(), asignar: vi.fn(), desasignar: vi.fn() },
}))
vi.mock('../services/solicitudService', () => ({ solicitudService: { listar: vi.fn() } }))
vi.mock('../services/programacionService', () => ({ programacionService: { asignar: vi.fn() } }))
vi.mock('../services/usuarioService', () => ({ usuarioService: { listarInspectores: vi.fn() } }))

// Las gráficas (recharts) se prueban aparte: aquí basta saber que reciben los datos correctos
vi.mock('../components/dashboard/DashboardCharts', () => ({
  InspectionTrendChart: () => 'grafica-tendencia',
  StatusDonutChart: ({ data }) => `dona:${data.length}`,
  BuildingBarChart: () => 'grafica-edificios',
  ComplianceLineChart: () => 'grafica-cumplimiento',
}))
vi.mock('../components/dashboard/StatusPieChart', () => ({
  default: ({ data }) => `pastel:${data.map((d) => d.color).join(',')}`,
}))

const montar = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  fetchInspecciones.mockResolvedValue([])
  fetchCharts.mockResolvedValue({})
  fetchAscensores.mockResolvedValue([])
  fetchInformes.mockResolvedValue([])
  fetchStats.mockResolvedValue({})
  fetchUsuarios.mockResolvedValue([])
})

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

describe('<AsesorDashboard />', () => {
  it('should summarize the portfolio of clients, elevators and pending inspections', async () => {
    fetchAscensores.mockResolvedValue([
      { id: 1, client: 'Acme', building: 'Torre A', elevators: 2 },
      { id: 2, client: 'Acme', building: 'Torre B', elevators: 1 },
      { id: 3, client: 'Beta', building: 'Torre C', elevators: 4 },
    ])
    fetchInspecciones.mockResolvedValue([
      { id: 1, status: 'Programada', building: 'Torre A', elevator: 'E1', nextDate: '2026-11-01' },
      { id: 2, status: 'Finalizada', building: 'Torre B', elevator: 'E2', nextDate: '2026-10-01' },
    ])

    montar(<AsesorDashboard />)

    expect(await screen.findByText('E1 · Programada: 2026-11-01')).toBeInTheDocument()
    expect(await screen.findByText('Cliente: Beta')).toBeInTheDocument()
    expect(await screen.findByText('4 ascensores')).toBeInTheDocument()
    // 3 ascensores, 2 clientes distintos, 1 inspección pendiente
    expect(screen.getByText('Ascensores').parentElement).toHaveTextContent('3')
    expect(screen.getByText('Clientes').parentElement).toHaveTextContent('2')
    expect(screen.getByRole('button', { name: 'Pendientes: ver lista' })).toHaveTextContent('1')
    expect(await screen.findByText('grafica-tendencia')).toBeInTheDocument()
  })

  it('should show the error when the data cannot be loaded', async () => {
    fetchInspecciones.mockRejectedValue(new Error('Servidor caído'))

    montar(<AsesorDashboard />)

    expect(await screen.findByText('Servidor caído')).toBeInTheDocument()
  })
})

describe('<ClientDashboard />', () => {
  it('should list the elevators and inspections of the client', async () => {
    fetchAscensores.mockResolvedValue([
      { id: 1, brand: 'Otis', model: 'Gen2', building: 'Torre A', status: 'Activo' },
      { id: 2, brand: 'Kone', model: 'X', building: 'Torre B', status: 'Inactivo' },
    ])
    fetchInspecciones.mockResolvedValue([
      { id: 1, status: 'Aprobada', building: 'Torre A', elevator: 'E1' },
      { id: 2, status: 'Programada', building: 'Torre B', elevator: 'E2' },
    ])

    montar(<ClientDashboard />)

    expect(await screen.findByText('Otis Gen2')).toBeInTheDocument()
    expect(screen.getByText('Kone X')).toBeInTheDocument()
    expect(screen.getByText('E1 · Estado: Aprobada')).toBeInTheDocument()
    expect(screen.getByText('Activos').parentElement).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: 'Pendientes: ver lista' })).toHaveTextContent('1')
  })

  it('should show the error when the data cannot be loaded', async () => {
    fetchInspecciones.mockRejectedValue(new Error('Sin conexión'))
    montar(<ClientDashboard />)
    expect(await screen.findByText('Sin conexión')).toBeInTheDocument()
  })
})

describe('<InspectorDashboard />', () => {
  it('should split the assigned inspections by state', async () => {
    fetchInspecciones.mockResolvedValue([
      { id: 1, status: 'Programada', building: 'Torre A', elevator: 'E1', date: '2026-11-01' },
      { id: 2, status: 'En Proceso', building: 'Torre B', elevator: 'E2', date: '2026-10-20' },
      { id: 3, status: 'Finalizada', building: 'Torre C', elevator: 'E3', date: '2026-10-01' },
    ])

    montar(<InspectorDashboard />)

    expect(await screen.findByText('E1 · Fecha: 2026-11-01')).toBeInTheDocument()
    expect(screen.getByText('E3 · Completada: 2026-10-01')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Programadas: ver lista' })).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: 'En proceso: ver lista' })).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: 'Completadas: ver lista' })).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: 'Total: ver lista' })).toHaveTextContent('3')
  })

  it('should show the error when the data cannot be loaded', async () => {
    fetchInspecciones.mockRejectedValue(new Error('Sin conexión'))
    montar(<InspectorDashboard />)
    expect(await screen.findByText('Sin conexión')).toBeInTheDocument()
  })
})

describe('<DirectorTecnicoDashboard />', () => {
  it('should list the reports to approve and the ones with observations', async () => {
    fetchInformes.mockResolvedValue([
      { id: 1, status: 'Pendiente Revisión', building: 'Torre A', elevator: 'E1', date: '2026-10-10' },
      { id: 2, status: 'Aprobado con observaciones', building: 'Torre B', elevator: 'E2', inspector: 'Ana' },
      { id: 3, status: 'Aprobado', building: 'Torre C', elevator: 'E3' },
    ])

    montar(<DirectorTecnicoDashboard />)

    expect(await screen.findByText('E1 · Fecha: 2026-10-10')).toBeInTheDocument()
    expect(screen.getByText('E2 · Inspector: Ana')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Revisar' })).toHaveAttribute('href', '/dashboard/reportes')
    expect(screen.getByRole('button', { name: 'Por aprobar: ver lista' })).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: 'Aprobadas: ver lista' })).toHaveTextContent('1')
  })

  it('should give each inspection state its own color in the pie chart', async () => {
    fetchCharts.mockResolvedValue({
      inspectionStatusData: [
        { name: 'Aprobada', value: 3 },
        { name: 'Programada', value: 2 },
        { name: 'Otra', value: 1, color: '#123456' },
        { name: 'Sin color', value: 1 },
      ],
    })

    montar(<DirectorTecnicoDashboard />)

    expect(await screen.findByText('pastel:#0E7C4A,#0066CC,#123456,#888888')).toBeInTheDocument()
    expect(screen.getByText('grafica-edificios')).toBeInTheDocument()
    expect(screen.getByText('grafica-cumplimiento')).toBeInTheDocument()
  })

  it('should show the error when the data cannot be loaded', async () => {
    fetchInspecciones.mockRejectedValue(new Error('Sin conexión'))
    montar(<DirectorTecnicoDashboard />)
    expect(await screen.findByText('Sin conexión')).toBeInTheDocument()
  })
})

describe('<AdminDashboard />', () => {
  beforeEach(() => {
    fetchStats.mockResolvedValue({ usuarios_activos: 7, ascensores_registrados: 12, inspecciones_mes: 4, informes_emitidos: 9 })
    fetchUsuarios.mockResolvedValue([
      { id: 1, name: 'Carlos Admin', email: 'carlos@x.com', role: 'Administrador' },
      { id: 2, name: 'Dora Cliente', email: 'dora@x.com', role: 'Cliente' },
      { id: 3, name: 'Eva Inspectora', email: 'eva@x.com', role: 'Inspector' },
    ])
    fetchInspecciones.mockResolvedValue([
      { id: 1, building: 'Torre A', elevator: 'E1', inspector: 'Eva', status: 'Aprobada' },
      { id: 2, building: 'Torre B', elevator: 'E2', inspector: 'Eva', status: 'Programada' },
      { id: 3, building: 'Torre C', elevator: 'E3', inspector: 'Eva', status: 'En Proceso' },
    ])
    apiGet.mockImplementation(async (ruta) => {
      if (ruta === '/usuarios/listado') {
        return [
          { id_usuario: 1, nombre_completo: 'Eva Inspectora', rol: 'Inspector' },
          { id_usuario: 2, nombre_completo: 'Root', rol: 'Administrador' },
        ]
      }
      return [{ id_ascensor: 10, codigo_interno: 'ASC-010' }]
    })
    usuarioAscensorService.listar.mockResolvedValue([
      { id_usuario_ascensor: 5, id_usuario: 1, id_ascensor: 10, tipo_asignacion: 'Principal', fecha_asignacion: '2026-10-01' },
      { id_usuario_ascensor: 6, id_usuario: 1, id_ascensor: 10, tipo_asignacion: 'Inspector Alterno', fecha_asignacion: '2026-09-01', fecha_desasignacion: '2026-09-15' },
    ])
    usuarioAscensorService.asignar.mockResolvedValue({})
    usuarioAscensorService.desasignar.mockResolvedValue({})
  })

  it('should show the system statistics in its cards', async () => {
    montar(<AdminDashboard />)

    const valorDe = async (titulo, valor) => within(await screen.findByRole('button', { name: `${titulo}: ver lista` })).findByText(valor)
    expect(await valorDe('Usuarios activos', '7')).toBeInTheDocument()
    expect(await valorDe('Ascensores', '12')).toBeInTheDocument()
    expect(await valorDe('Inspecciones mes', '4')).toBeInTheDocument()
    expect(await valorDe('Informes', '9')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Nueva inspección/ })).toHaveAttribute('href', '/dashboard/inspecciones')
  })

  it('should list the recent users and inspections', async () => {
    montar(<AdminDashboard />)

    expect(await screen.findByText('carlos@x.com')).toBeInTheDocument()
    expect(screen.getByText('eva@x.com')).toBeInTheDocument()
    expect(screen.getByText('E1 · Inspector: Eva')).toBeInTheDocument()
    expect(screen.getByText('E2 · Inspector: Eva')).toBeInTheDocument()
  })

  it('should use the default status series when the API sends no chart data', async () => {
    montar(<AdminDashboard />)
    expect(await screen.findByText('dona:5')).toBeInTheDocument()
  })

  it('should use the status series sent by the API', async () => {
    fetchCharts.mockResolvedValue({ inspectionStatusData: [{ name: 'Aprobada', value: 3 }, { name: 'Otra', value: 1 }] })
    montar(<AdminDashboard />)
    expect(await screen.findByText('dona:2')).toBeInTheDocument()
  })

  it('should show only the active assignments with the inspector and elevator names', async () => {
    montar(<AdminDashboard />)

    expect(await screen.findByText('ASC-010', { selector: 'td' })).toBeInTheDocument()
    expect(screen.getByText('Principal', { selector: 'td' })).toBeInTheDocument()
    expect(screen.queryByText('Inspector Alterno', { selector: 'td' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Desasignar' })).toHaveLength(1)
  })

  it('should tell the user when there are no active assignments', async () => {
    usuarioAscensorService.listar.mockResolvedValue([])
    montar(<AdminDashboard />)
    expect(await screen.findByText('No hay asignaciones activas')).toBeInTheDocument()
  })

  it('should end an assignment and confirm it', async () => {
    montar(<AdminDashboard />)

    fireEvent.click(await screen.findByRole('button', { name: 'Desasignar' }))

    expect(await screen.findByText('Inspector desasignado correctamente')).toBeInTheDocument()
    expect(usuarioAscensorService.desasignar).toHaveBeenCalledWith(5, { fecha_desasignacion: expect.any(String) })
  })

  it('should show the error when ending an assignment fails', async () => {
    usuarioAscensorService.desasignar.mockRejectedValue(new Error('No se pudo desasignar'))
    montar(<AdminDashboard />)

    fireEvent.click(await screen.findByRole('button', { name: 'Desasignar' }))

    expect(await screen.findByText('No se pudo desasignar')).toBeInTheDocument()
  })

  it('should ask for an inspector and an elevator before assigning', async () => {
    montar(<AdminDashboard />)
    await screen.findByText('ASC-010', { selector: 'td' })

    fireEvent.click(screen.getByRole('button', { name: 'Asignar' }))

    expect(await screen.findByText('Selecciona un inspector y un ascensor')).toBeInTheDocument()
    expect(usuarioAscensorService.asignar).not.toHaveBeenCalled()
  })

  it('should show the error when the assignment lists cannot be loaded', async () => {
    apiGet.mockRejectedValue(new Error('Error al cargar los datos'))
    montar(<AdminDashboard />)
    expect(await screen.findByText('Error al cargar los datos')).toBeInTheDocument()
  })
})

describe('<CoordinadorDashboard />', () => {
  const solicitud = {
    id_solicitud: 1, estado: 'Pendiente', id_ascensor: 3, prioridad: 'Alta',
    ascensor: { codigo_interno: 'ASC-003', ciudad: 'Cali' }, cliente: { nombre_completo: 'Acme' },
  }

  beforeEach(() => {
    fetchInspecciones.mockResolvedValue([
      { id: 1, status: 'Programada', building: 'Torre A', elevator: 'E1', nextDate: '2026-11-01', type: 'Periódica' },
      { id: 2, status: 'Aprobada', building: 'Torre B', elevator: 'E2', inspector: 'Eva' },
    ])
    solicitudService.listar.mockResolvedValue([solicitud, { ...solicitud, id_solicitud: 2, estado: 'Atendida' }])
    usuarioService.listarInspectores.mockResolvedValue([{ id_usuario: 7, nombre_completo: 'Eva', correo: 'eva@x.com' }])
    programacionService.asignar.mockResolvedValue({})
  })

  const abrirModal = async () => {
    montar(<CoordinadorDashboard />)
    fireEvent.click(await screen.findByRole('button', { name: 'Asignar' }))
    return screen.findByText(/Asignar Inspector — ASC-003 \(Acme\)/)
  }

  it('should show a loading message until the data arrives', async () => {
    montar(<CoordinadorDashboard />)

    expect(screen.getByText('Cargando datos...')).toBeInTheDocument()
    expect(await screen.findByText('Informes por revisar')).toBeInTheDocument()
  })

  it('should list the pending requests with their priority and the reports to review', async () => {
    montar(<CoordinadorDashboard />)

    expect(await screen.findByText('ASC-003 — Cali')).toBeInTheDocument()
    expect(screen.getByText('Cliente: Acme')).toBeInTheDocument()
    expect(screen.getByText('Alta')).toBeInTheDocument()
    expect(screen.getByText('E2 · Eva')).toBeInTheDocument()
    // la solicitud ya atendida no aparece
    expect(screen.getAllByRole('button', { name: 'Asignar' })).toHaveLength(1)
  })

  it('should list the pending inspections when there are no pending requests', async () => {
    solicitudService.listar.mockResolvedValue([])
    montar(<CoordinadorDashboard />)

    expect(await screen.findByText('E1 · Programada: 2026-11-01')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver' })).toHaveAttribute('href', '/dashboard/inspecciones')
  })

  it('should open and close the assignment form', async () => {
    expect(await abrirModal()).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByText(/Asignar Inspector — ASC-003/)).not.toBeInTheDocument())
  })

  it('should not schedule an inspection in the past', async () => {
    await abrirModal()
    fireEvent.change(screen.getByLabelText(/Fecha programada/), { target: { value: '2020-01-01' } })

    fireEvent.submit(document.querySelector('form'))

    expect(await screen.findByText('No se puede agendar en una fecha anterior a hoy')).toBeInTheDocument()
    expect(programacionService.asignar).not.toHaveBeenCalled()
  })

  it('should schedule the inspection, reload the requests and confirm it', async () => {
    await abrirModal()
    fireEvent.change(screen.getByLabelText(/Fecha programada/), { target: { value: '2099-01-01' } })
    fireEvent.change(screen.getByLabelText(/Hora de inicio/), { target: { value: '09:30' } })

    fireEvent.submit(document.querySelector('form'))

    expect(await screen.findByText('Inspector asignado correctamente')).toBeInTheDocument()
    expect(programacionService.asignar).toHaveBeenCalledWith(
      expect.objectContaining({ id_solicitud: 1, fecha_programada: '2099-01-01', hora_inicio: '09:30' }),
    )
    expect(solicitudService.listar).toHaveBeenCalledTimes(2)
  })

  it('should show the error when the assignment fails', async () => {
    programacionService.asignar.mockRejectedValue(new Error('El inspector ya tiene una inspección a esa hora'))
    await abrirModal()
    fireEvent.change(screen.getByLabelText(/Fecha programada/), { target: { value: '2099-01-01' } })

    fireEvent.submit(document.querySelector('form'))

    expect(await screen.findByText('El inspector ya tiene una inspección a esa hora')).toBeInTheDocument()
  })
})
