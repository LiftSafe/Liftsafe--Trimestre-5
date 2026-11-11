import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InspectorDashboard from './InspectorDashboard'
import { useDashboardData } from '../../hooks/useDashboardData'
import { fetchCharts, fetchInspecciones } from '../../services/dashboardService'
import { renderWithProviders } from '../../test/renderWithProviders'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Carlos Pérez', role: 'Inspector' } }),
}))
vi.mock('../../hooks/useDashboardData', () => ({ useDashboardData: vi.fn() }))
vi.mock('../../services/dashboardService', () => ({
  fetchInspecciones: vi.fn(),
  fetchCharts: vi.fn(),
}))
// La gráfica usa Recharts, que no dibuja en jsdom; se reemplaza por un texto simple.
vi.mock('../../components/dashboard/DashboardCharts', () => ({
  InspectionTrendChart: ({ data }) => <p>Gráfica con {data.length} meses</p>,
}))

const inspecciones = [
  { id: 1, status: 'Programada', building: 'Torre Norte', elevator: 'ASC-01', date: '2026-10-20' },
  { id: 2, status: 'En Proceso', building: 'Edificio Sol', elevator: 'ASC-02', date: '2026-10-18' },
  { id: 3, status: 'Borrador', building: 'Plaza Real', elevator: 'ASC-03', date: '2026-10-17' },
  { id: 4, status: 'Finalizada', building: 'Centro Andino', elevator: 'ASC-04', date: '2026-10-10' },
  { id: 5, status: 'Aprobada', building: 'Torre Sur', elevator: 'ASC-05', date: '2026-10-05' },
]
const charts = { monthlyInspections: [{ month: 'Sep' }, { month: 'Oct' }, { month: 'Nov' }] }

// El componente llama dos veces a useDashboardData: una con fetchInspecciones y otra con fetchCharts.
const datos = ({ insp = {}, graf = {} } = {}) =>
  useDashboardData.mockImplementation((fetcher) =>
    fetcher === fetchInspecciones
      ? { data: inspecciones, loading: false, error: null, ...insp }
      : { data: charts, loading: false, error: null, ...graf },
  )

describe('<InspectorDashboard />', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    datos()
  })

  it('should greet the inspector by role and first name in the welcome banner', () => {
    renderWithProviders(<InspectorDashboard />)

    expect(screen.getByRole('heading', { name: 'Hola, Inspector Carlos' })).toBeInTheDocument()
  })

  it('should count the inspections by state in the summary cards', () => {
    renderWithProviders(<InspectorDashboard />)

    expect(screen.getByRole('button', { name: 'Programadas: ver lista' })).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: 'En proceso: ver lista' })).toHaveTextContent('2')
    expect(screen.getByRole('button', { name: 'Completadas: ver lista' })).toHaveTextContent('2')
    expect(screen.getByRole('button', { name: 'Total: ver lista' })).toHaveTextContent('5')
  })

  it('should list the scheduled and the completed inspections in their own panels', () => {
    renderWithProviders(<InspectorDashboard />)

    expect(screen.getByText('Torre Norte')).toBeInTheDocument()
    expect(screen.getByText('ASC-01 · Fecha: 2026-10-20')).toBeInTheDocument()
    expect(screen.getByText('Centro Andino')).toBeInTheDocument()
    expect(screen.getByText('ASC-04 · Completada: 2026-10-10')).toBeInTheDocument()
    // Una inspección "En Proceso" no aparece en ninguno de los dos paneles
    expect(screen.queryByText('Edificio Sol')).not.toBeInTheDocument()
  })

  it('should show zeros and no activity when the inspector has no inspections', () => {
    datos({ insp: { data: undefined } })

    renderWithProviders(<InspectorDashboard />)

    expect(screen.getByRole('button', { name: 'Total: ver lista' })).toHaveTextContent('0')
    expect(screen.queryByText('Torre Norte')).not.toBeInTheDocument()
  })

  it('should show the error returned by the API', () => {
    datos({ insp: { error: 'No se pudieron cargar las inspecciones' } })

    renderWithProviders(<InspectorDashboard />)

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar las inspecciones')
  })

  it('should hide the chart while loading and show it when the data arrives', () => {
    datos({ insp: { loading: true } })
    const { unmount } = renderWithProviders(<InspectorDashboard />)
    expect(screen.queryByText(/Gráfica con/)).not.toBeInTheDocument()
    unmount()

    datos()
    renderWithProviders(<InspectorDashboard />)
    expect(screen.getByText('Gráfica con 3 meses')).toBeInTheDocument()
  })

  it('should open the inspections list when the user clicks a summary card', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <Routes>
        <Route path="/" element={<InspectorDashboard />} />
        <Route path="/dashboard/inspecciones" element={<p>Lista de inspecciones</p>} />
      </Routes>,
    )

    await user.click(screen.getByRole('button', { name: 'Total: ver lista' }))

    expect(await screen.findByText('Lista de inspecciones')).toBeInTheDocument()
  })
})