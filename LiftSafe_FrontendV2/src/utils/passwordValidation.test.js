import { describe, it, expect } from 'vitest'
import {
  getPasswordError,
  getPasswordRuleStatus,
  isPasswordValid,
} from './passwordValidation'
import casos from '../../../shared/password_cases.json'

// Tabla de casos COMPARTIDA con el backend (shared/password_cases.json).
// Si alguien cambia una regla en un solo lado, una de las dos suites falla.
const erroresDe = (password) =>
  getPasswordRuleStatus(password)
    .filter((regla) => !regla.valid)
    .map((regla) => regla.label)

describe('passwordValidation', () => {
  it.each(casos.map((c) => [c.password, c.errors]))(
    'los errores de %j coinciden con la tabla compartida',
    (password, esperados) => {
      expect(erroresDe(password)).toEqual(esperados)
    },
  )

  it('isPasswordValid acepta una contraseña correcta', () => {
    expect(isPasswordValid('Abcdefg1')).toBe(true)
  })

  it('isPasswordValid rechaza una contraseña débil', () => {
    expect(isPasswordValid('abc')).toBe(false)
  })

  it('getPasswordError devuelve null si todo está bien', () => {
    expect(getPasswordError('Abcdefg1')).toBeNull()
  })

  it('getPasswordError devuelve el primer error (igual que el backend)', () => {
    expect(getPasswordError('abc')).toBe('Mínimo 8 caracteres')
  })
})
