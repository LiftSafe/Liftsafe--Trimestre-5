import { afterEach, describe, expect, it } from 'vitest'
import {
  ADULT_DOCUMENT_TYPES,
  DOCUMENT_TYPES,
  ROLE_IDS,
  getDocumentLabel,
  getFormDataHeaders,
  getHeaders,
} from './api'

describe('config/api', () => {
  afterEach(() => sessionStorage.clear())

  it('should map every role to the id used by the database', () => {
    expect(ROLE_IDS).toEqual({
      Administrador: 1,
      'Director Técnico': 2,
      Coordinador: 3,
      Inspector: 4,
      Asesor: 5,
      Cliente: 6,
    })
  })

  it('should return the label of a known document type', () => {
    expect(getDocumentLabel('CC')).toBe('Cédula de ciudadanía')
  })

  it('should return the same value when the document type is unknown', () => {
    expect(getDocumentLabel('XYZ')).toBe('XYZ')
  })

  it('should keep only document types for adults (minAge >= 18)', () => {
    expect(ADULT_DOCUMENT_TYPES.length).toBeGreaterThan(0)
    expect(ADULT_DOCUMENT_TYPES.every((doc) => doc.minAge >= 18)).toBe(true)
    expect(ADULT_DOCUMENT_TYPES.length).toBeLessThan(DOCUMENT_TYPES.length) // hay tipos para menores (TI, RC)
  })

  it('should add the Authorization header only when there is a token', () => {
    // Arrange + Act
    const sinToken = getHeaders()
    sessionStorage.setItem('token', 'abc')
    const conToken = getHeaders()

    // Assert
    expect(sinToken).toEqual({ 'Content-Type': 'application/json' })
    expect(conToken).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer abc' })
  })

  it('should not set Content-Type in form data headers (the browser sets the boundary)', () => {
    sessionStorage.setItem('token', 'abc')
    expect(getFormDataHeaders()).toEqual({ Authorization: 'Bearer abc' })
  })
})
