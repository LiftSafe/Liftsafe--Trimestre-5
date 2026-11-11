import { describe, expect, it } from 'vitest'
import { sinEspacios } from './correo'

describe('sinEspacios', () => {
  it('should remove spaces at the start, the end and in the middle', () => {
    expect(sinEspacios('  juan.perez@elevatec.com ')).toBe('juan.perez@elevatec.com')
    expect(sinEspacios('juan perez@elevatec .com')).toBe('juanperez@elevatec.com')
  })

  it('should remove tabs and line breaks pasted with the email', () => {
    expect(sinEspacios('\tana@x.com\n')).toBe('ana@x.com')
  })

  it('should return an empty text for null or undefined', () => {
    expect(sinEspacios(null)).toBe('')
    expect(sinEspacios(undefined)).toBe('')
  })
})
