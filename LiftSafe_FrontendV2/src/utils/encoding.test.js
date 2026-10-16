import { describe, expect, it } from 'vitest'
import { decodeDeep, decodeMojibake } from './encoding'

describe('decodeMojibake', () => {
  it.each([
    ['VerificaciÃ³n', 'Verificación'],
    ['AndrÃ©s', 'Andrés'],
  ])('should repair %s', (entrada, esperado) => {
    expect(decodeMojibake(entrada)).toBe(esperado)
  })

  it.each([
    ['Verificación', 'texto ya correcto'],
    ['', 'cadena vacía'],
  ])('should leave %j untouched (%s)', (entrada) => {
    expect(decodeMojibake(entrada)).toBe(entrada)
  })

  it.each([[null], [undefined], [42], [{ a: 1 }]])('should return %j as is when it is not a string', (valor) => {
    expect(decodeMojibake(valor)).toBe(valor)
  })
})

describe('decodeDeep', () => {
  it('should repair strings inside nested objects and arrays', () => {
    // Arrange
    const dato = { nombre: 'AndrÃ©s', items: ['VerificaciÃ³n', { ok: 'sí' }], total: 3 }

    // Act
    const resultado = decodeDeep(dato)

    // Assert
    expect(resultado).toEqual({ nombre: 'Andrés', items: ['Verificación', { ok: 'sí' }], total: 3 })
  })

  it.each([[null], [undefined], [5], [true]])('should return %j unchanged', (valor) => {
    expect(decodeDeep(valor)).toBe(valor)
  })
})
