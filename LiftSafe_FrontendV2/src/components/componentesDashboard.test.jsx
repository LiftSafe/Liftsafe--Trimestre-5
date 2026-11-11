import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import ConfirmDialog from './ConfirmDialog'
import PageHeader from './PageHeader'
import SearchBar from './SearchBar'
import StatCard from './StatCard'
import ActivityPanel from './dashboard/ActivityPanel'
import ChartCard from './dashboard/ChartCard'
import {
  BuildingBarChart, ComplianceLineChart, InspectionTrendChart, SalesPipelineChart,
  StatusDonutChart, WeeklyActivityChart,
} from './dashboard/DashboardCharts'
import StatusPieChart from './dashboard/StatusPieChart'

// jsdom no trae ResizeObserver y recharts (ResponsiveContainer) lo necesita
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('<PageHeader />', () => {
  it('should show the title and the subtitle', () => {
    render(<MemoryRouter><PageHeader title="Usuarios" subtitle="Gestión de cuentas" /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Usuarios' })).toBeInTheDocument()
    expect(screen.getByText('Gestión de cuentas')).toBeInTheDocument()
  })

  it('should render links for crumbs with a path and plain text for the last one', () => {
    render(
      <MemoryRouter>
        <PageHeader title="Mi cuenta" breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Mi cuenta' }]} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByRole('link', { name: 'Mi cuenta' })).not.toBeInTheDocument()
  })
})

describe('<SearchBar />', () => {
  it('should send the typed text to onChange', () => {
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} placeholder="Buscar usuario" />)

    fireEvent.change(screen.getByPlaceholderText('Buscar usuario'), { target: { value: 'ana' } })

    expect(onChange).toHaveBeenCalledWith('ana')
  })

  it('should use "Buscar..." as the default placeholder', () => {
    render(<SearchBar value="" onChange={() => {}} />)
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
  })
})

describe('<StatCard />', () => {
  const montar = (props) => render(
    <MemoryRouter initialEntries={['/inicio']}>
      <Routes>
        <Route path="/inicio" element={<StatCard title="Ascensores" value="12" {...props} />} />
        <Route path="/dashboard/ascensores" element={<p>lista de ascensores</p>} />
      </Routes>
    </MemoryRouter>,
  )

  it('should show title, value and subtitle', () => {
    montar({ subtitle: 'En sistema' })

    expect(screen.getByText('Ascensores')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('En sistema')).toBeInTheDocument()
  })

  it('should not behave as a button when it has no destination', () => {
    montar({})
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should navigate to its destination on click and with the keyboard', () => {
    montar({ to: '/dashboard/ascensores' })

    fireEvent.keyDown(screen.getByRole('button', { name: 'Ascensores: ver lista' }), { key: 'Enter' })

    expect(screen.getByText('lista de ascensores')).toBeInTheDocument()
  })

  it('should navigate with a click', () => {
    montar({ to: '/dashboard/ascensores' })

    fireEvent.click(screen.getByRole('button', { name: 'Ascensores: ver lista' }))

    expect(screen.getByText('lista de ascensores')).toBeInTheDocument()
  })

  it.each([
    [12, '+12%'],
    [-3, '-3%'],
  ])('should show the trend %i as %s', (trend, texto) => {
    montar({ trend, trendLabel: 'vs mes anterior' })

    expect(screen.getByText(texto)).toBeInTheDocument()
    expect(screen.getByText('vs mes anterior')).toBeInTheDocument()
  })
})

describe('<ConfirmDialog />', () => {
  it('should call onConfirm and onClose from its two buttons', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(<ConfirmDialog open onClose={onClose} onConfirm={onConfirm} title="Eliminar usuario" message="Esta acción no se deshace" confirmText="Eliminar" />)

    expect(screen.getByText('Eliminar usuario')).toBeInTheDocument()
    expect(screen.getByText('Esta acción no se deshace')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should block both buttons while it is loading', () => {
    render(<ConfirmDialog open onClose={() => {}} onConfirm={() => {}} loading />)

    expect(screen.getByRole('button', { name: 'Eliminando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })

  it('should render nothing when it is closed', () => {
    render(<ConfirmDialog open={false} onClose={() => {}} onConfirm={() => {}} />)
    expect(screen.queryByText('Confirmar acción')).not.toBeInTheDocument()
  })
})

describe('<ChartCard />', () => {
  it('should show title, subtitle, action and content', () => {
    render(<ChartCard title="Tendencia" subtitle="Mensual" action={<button>Exportar</button>}><p>grafica</p></ChartCard>)

    expect(screen.getByText('Tendencia')).toBeInTheDocument()
    expect(screen.getByText('Mensual')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument()
    expect(screen.getByText('grafica')).toBeInTheDocument()
  })
})

describe('<ActivityPanel />', () => {
  const items = [
    { id: 1, title: 'Torre A', subtitle: 'E1 · Programada', chip: 'Programada', chipColor: 'info', type: 'info', time: 'hoy' },
    { id: 2, title: 'Torre B', subtitle: 'E2 · Observaciones', type: 'error', actionBtn: <button>Revisar</button> },
    { id: 3, action: 'Nuevo usuario', detail: 'ana@x.com', type: 'desconocido', avatar: 'A' },
  ]

  it('should list every item with its detail, chip, time and action', () => {
    render(<ActivityPanel title="Actividad" subtitle="Reciente" items={items} />)

    expect(screen.getByText('Actividad')).toBeInTheDocument()
    expect(screen.getByText('Reciente')).toBeInTheDocument()
    expect(screen.getByText('Torre A')).toBeInTheDocument()
    expect(screen.getByText('Programada')).toBeInTheDocument()
    expect(screen.getByText('hoy')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Revisar' })).toBeInTheDocument()
    // un item usa action/detail en lugar de title/subtitle
    expect(screen.getByText('Nuevo usuario')).toBeInTheDocument()
    expect(screen.getByText('ana@x.com')).toBeInTheDocument()
  })

  it('should show the avatar letter only when showAvatars is on', () => {
    const { rerender } = render(<ActivityPanel title="Usuarios" items={items} />)
    expect(screen.queryByText('A')).not.toBeInTheDocument()

    rerender(<ActivityPanel title="Usuarios" items={items} showAvatars />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('should render the header action', () => {
    render(<ActivityPanel title="Pendientes" items={[]} action={<button>Ver todas</button>} />)
    expect(screen.getByRole('button', { name: 'Ver todas' })).toBeInTheDocument()
  })
})

describe('gráficas del dashboard (recharts)', () => {
  const contenedor = (ui) => render(ui).container.querySelector('.recharts-responsive-container')

  it.each([
    ['InspectionTrendChart', <InspectionTrendChart data={[{ month: 'Ene', total: 3, aprobadas: 2 }]} />],
    ['BuildingBarChart', <BuildingBarChart data={[{ name: 'Torre A', total: 3 }]} />],
    ['WeeklyActivityChart', <WeeklyActivityChart data={[{ day: 'Lun', total: 3 }]} />],
    ['ComplianceLineChart', <ComplianceLineChart data={[{ month: 'Ene', cumplimiento: 80 }]} />],
    ['SalesPipelineChart', <SalesPipelineChart data={[{ stage: 'Nuevo', total: 3 }]} />],
  ])('should mount %s without breaking', (_nombre, ui) => {
    expect(contenedor(ui)).toBeInTheDocument()
  })

  it('should show the center label of the donut chart', () => {
    render(<StatusDonutChart data={[{ name: 'Aprobada', value: 3, color: '#0E7C4A' }]} centerLabel="Total" centerValue="3" />)

    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should not draw the center label of the donut chart when none is given', () => {
    render(<StatusDonutChart data={[]} />)
    expect(screen.queryByText('Total')).not.toBeInTheDocument()
  })

  it.each([
    ['with data', [{ name: 'Aprobadas', value: 4, color: '#0E7C4A' }]],
    ['without data (default series)', undefined],
  ])('should mount StatusPieChart %s', (_caso, data) => {
    expect(contenedor(<StatusPieChart data={data} />)).toBeInTheDocument()
  })
})
