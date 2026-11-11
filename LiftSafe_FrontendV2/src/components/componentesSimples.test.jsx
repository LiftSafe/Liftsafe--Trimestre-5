import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ChartCard from './dashboard/ChartCard'
import ConfirmDialog from './ConfirmDialog'
import PageHeader from './PageHeader'
import SearchBar from './SearchBar'
import StatCard from './StatCard'

describe('<StatCard />', () => {
  const montar = (props) =>
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<StatCard title="Ascensores" value={12} icon={<span>i</span>} {...props} />} />
          <Route path="/lista" element={<p>pantalla de la lista</p>} />
        </Routes>
      </MemoryRouter>,
    )

  it('should show the title, the value and the subtitle', () => {
    montar({ subtitle: 'activos' })
    expect(screen.getByText('Ascensores')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('activos')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should show a positive and a negative trend', () => {
    const { unmount } = montar({ trend: 5, trendLabel: 'vs mes pasado' })
    expect(screen.getByText('+5%')).toBeInTheDocument()
    expect(screen.getByText('vs mes pasado')).toBeInTheDocument()
    unmount()

    montar({ trend: -3 })
    expect(screen.getByText('-3%')).toBeInTheDocument()
  })

  it('should go to the given route when the card is clicked', async () => {
    const user = userEvent.setup()
    montar({ to: '/lista' })
    await user.click(screen.getByRole('button', { name: 'Ascensores: ver lista' }))
    expect(await screen.findByText('pantalla de la lista')).toBeInTheDocument()
  })

  it('should go to the given route with the keyboard', async () => {
    const user = userEvent.setup()
    montar({ to: '/lista' })
    await user.tab()
    await user.keyboard('{Enter}')
    expect(await screen.findByText('pantalla de la lista')).toBeInTheDocument()
  })
})

describe('<PageHeader />', () => {
  it('should show the title, the subtitle and the breadcrumbs', () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Encuestas"
          subtitle="Tus opiniones"
          breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Encuestas' }]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Encuestas' })).toBeInTheDocument()
    expect(screen.getByText('Tus opiniones')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/dashboard')
  })

  it('should not render breadcrumbs when there are none', () => {
    render(<MemoryRouter><PageHeader title="Solo título" /></MemoryRouter>)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})

describe('<SearchBar />', () => {
  it('should report what the user types', async () => {
    // SPY: onChange registra lo que sale del componente
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SearchBar value="" onChange={onChange} />)

    await user.type(screen.getByPlaceholderText('Buscar...'), 'a')

    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('should use the given placeholder', () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="Buscar ascensor" />)
    expect(screen.getByPlaceholderText('Buscar ascensor')).toBeInTheDocument()
  })
})

describe('<ConfirmDialog />', () => {
  it('should render nothing while it is closed', () => {
    render(<ConfirmDialog open={false} onClose={() => {}} onConfirm={() => {}} />)
    expect(screen.queryByText('Confirmar acción')).not.toBeInTheDocument()
  })

  it('should confirm or cancel with the default texts', async () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ConfirmDialog open onClose={onClose} onConfirm={onConfirm} />)

    expect(screen.getByText('Confirmar acción')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Aceptar' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should disable both buttons while loading', () => {
    render(<ConfirmDialog open loading onClose={() => {}} onConfirm={() => {}} />)
    expect(screen.getByRole('button', { name: 'Eliminando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})

describe('<ChartCard />', () => {
  it('should show the title, the subtitle, the action and the content', () => {
    render(
      <ChartCard title="Inspecciones" subtitle="Últimos 30 días" action={<button>Exportar</button>}>
        <p>contenido del gráfico</p>
      </ChartCard>,
    )
    expect(screen.getByText('Inspecciones')).toBeInTheDocument()
    expect(screen.getByText('Últimos 30 días')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument()
    expect(screen.getByText('contenido del gráfico')).toBeInTheDocument()
  })
})