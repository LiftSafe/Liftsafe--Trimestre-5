import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PasswordRequirements from './PasswordRequirements'

describe('<PasswordRequirements />', () => {
  it('muestra las 5 reglas de contraseña', () => {
    render(<PasswordRequirements password="" />)

    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument()
    expect(screen.getByText('Al menos una mayúscula')).toBeInTheDocument()
    expect(screen.getByText('Al menos una minúscula')).toBeInTheDocument()
    expect(screen.getByText('Al menos un número')).toBeInTheDocument()
    expect(
      screen.getByText('Sin dígitos consecutivos (ej: 123, 456)'),
    ).toBeInTheDocument()
  })

  it('marca en verde las reglas que sí se cumplen', () => {
    render(<PasswordRequirements password="Abcdefg1" />)

    // #4CAF50 = color de regla cumplida en el componente
    expect(screen.getByText('Mínimo 8 caracteres')).toHaveStyle({ color: 'rgb(76, 175, 80)' })
  })

  it('deja en gris la regla que no se cumple', () => {
    render(<PasswordRequirements password="abc" />)

    // #B0B8C4 = color de regla pendiente
    expect(screen.getByText('Al menos una mayúscula')).toHaveStyle({ color: 'rgb(176, 184, 196)' })
  })
})
