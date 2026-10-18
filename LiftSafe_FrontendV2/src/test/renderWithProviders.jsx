import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Monta un componente dentro de un router en memoria (los de la app lo necesitan).
// El AuthContext se simula en cada test con vi.mock, por eso aquí solo va el router.
export function renderWithProviders(ui, { route = '/', ...options } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>, options)
}