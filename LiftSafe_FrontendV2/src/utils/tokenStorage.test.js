import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAuthStorage,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from './tokenStorage'

describe('tokenStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('should save and read the token from sessionStorage', () => {
    // Act
    setToken('abc123')

    // Assert
    expect(getToken()).toBe('abc123')
    expect(localStorage.getItem('token')).toBeNull() // cada pestaña tiene su sesión
  })

  it('should return null when there is no token', () => {
    expect(getToken()).toBeNull()
  })

  it('should save and read the user as an object', () => {
    // Arrange
    const usuario = { id: 7, role: 'Cliente' }

    // Act
    setStoredUser(usuario)

    // Assert
    expect(getStoredUser()).toEqual(usuario)
  })

  it('should return null when the stored user is not valid JSON', () => {
    // Arrange: dato corrupto en el almacenamiento
    sessionStorage.setItem('liftsafe_user', '{no-es-json')

    // Act + Assert
    expect(getStoredUser()).toBeNull()
  })

  it('should clear current and legacy session keys', () => {
    // Arrange
    setToken('abc')
    setStoredUser({ id: 1 })
    localStorage.setItem('token', 'viejo')
    sessionStorage.setItem('user', 'viejo')

    // Act
    clearAuthStorage()

    // Assert
    expect(getToken()).toBeNull()
    expect(getStoredUser()).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    expect(sessionStorage.getItem('user')).toBeNull()
  })
})
