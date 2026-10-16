import { act, render, renderHook, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { loginRequest, registerRequest } from '../services/authService'

vi.mock('../services/authService', () => ({
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
}))

// JWT de prueba: solo importa el "exp" (segundos). Sin firma real.
const jwtCon = (exp) => `cab.${btoa(JSON.stringify({ exp }))}.firma`
const EN_UNA_HORA = Math.floor(Date.now() / 1000) + 3600
const HACE_UNA_HORA = Math.floor(Date.now() / 1000) - 3600

function Wrapper({ children }) {
  return (
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>pantalla de login</p>} />
          <Route path="*" element={children} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

const usarAuth = () => renderHook(() => useAuth(), { wrapper: Wrapper })

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('should start without a user when there is no saved session', () => {
    const { result } = usarAuth()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should save the session and expose the user after a successful login', async () => {
    // Arrange
    loginRequest.mockResolvedValue({ access_token: jwtCon(EN_UNA_HORA), nombre: 'Ana', rol: 'Coordinador' })
    const { result } = usarAuth()

    // Act
    let respuesta
    await act(async () => { respuesta = await result.current.login('ana@x.com', 'Abcdefg1') })

    // Assert
    expect(respuesta).toEqual({ success: true })
    expect(result.current.user).toMatchObject({ name: 'Ana', email: 'ana@x.com', role: 'Coordinador' })
    expect(result.current.isAuthenticated).toBe(true)
    expect(sessionStorage.getItem('token')).toBe(jwtCon(EN_UNA_HORA))
    expect(JSON.parse(sessionStorage.getItem('liftsafe_user')).role).toBe('Coordinador')
  })

  it('should read name and role from data.user when they are nested', async () => {
    loginRequest.mockResolvedValue({ access_token: jwtCon(EN_UNA_HORA), user: { nombre: 'Beto', rol: 'Inspector' } })
    const { result } = usarAuth()
    await act(async () => { await result.current.login('b@x.com', 'x') })
    expect(result.current.user).toMatchObject({ name: 'Beto', role: 'Inspector' })
  })

  it.each([
    [new Error('Correo o clave mal'), 'Correo o clave mal'],
    [new Error(''), 'Correo o contraseña incorrectos'],
  ])('should return the login error without saving a session (%s)', async (error, mensaje) => {
    loginRequest.mockRejectedValue(error)
    const { result } = usarAuth()
    let respuesta
    await act(async () => { respuesta = await result.current.login('a@x.com', 'mala') })
    expect(respuesta).toEqual({ success: false, message: mensaje })
    expect(sessionStorage.getItem('token')).toBeNull()
  })

  it('should restore a saved session whose token has not expired', () => {
    sessionStorage.setItem('liftsafe_user', JSON.stringify({ name: 'AndrÃ©s', role: 'Cliente', token: jwtCon(EN_UNA_HORA) }))
    const { result } = usarAuth()
    expect(result.current.user).toMatchObject({ name: 'Andrés', role: 'Cliente' }) // repara el texto
  })

  it('should close a saved session whose token already expired', async () => {
    // Arrange: límite, la sesión venció hace una hora
    sessionStorage.setItem('liftsafe_user', JSON.stringify({ name: 'Ana', role: 'Cliente', token: jwtCon(HACE_UNA_HORA) }))
    sessionStorage.setItem('token', jwtCon(HACE_UNA_HORA))

    // Act
    render(<Wrapper><p>panel</p></Wrapper>)

    // Assert
    await screen.findByText('pantalla de login')
    expect(sessionStorage.getItem('liftsafe_user')).toBeNull()
    expect(sessionStorage.getItem('token')).toBeNull()
  })

  it('should close the session when the saved token is malformed', async () => {
    sessionStorage.setItem('liftsafe_user', JSON.stringify({ name: 'Ana', token: 'no-es-un-jwt' }))
    render(<Wrapper><p>panel</p></Wrapper>)
    await screen.findByText('pantalla de login')
  })

  it('should discard a saved user that is not valid JSON', () => {
    sessionStorage.setItem('liftsafe_user', '{roto')
    sessionStorage.setItem('token', 'x')
    const { result } = usarAuth()
    expect(result.current.user).toBeNull()
    expect(sessionStorage.getItem('token')).toBeNull()
  })

  it('should clear the session and go to /login on logout', async () => {
    // Arrange: sesión vigente guardada
    sessionStorage.setItem('liftsafe_user', JSON.stringify({ name: 'Ana', role: 'Cliente', token: jwtCon(EN_UNA_HORA) }))
    sessionStorage.setItem('token', jwtCon(EN_UNA_HORA))
    function Panel() {
      const { user, logout } = useAuth()
      return <button onClick={logout}>salir de {user?.name}</button>
    }
    render(<Wrapper><Panel /></Wrapper>)

    // Act
    act(() => screen.getByRole('button', { name: 'salir de Ana' }).click())

    // Assert
    await screen.findByText('pantalla de login')
    expect(sessionStorage.getItem('liftsafe_user')).toBeNull()
    expect(sessionStorage.getItem('token')).toBeNull()
  })

  it('should log in automatically after registering', async () => {
    registerRequest.mockResolvedValue({ id: 1 })
    loginRequest.mockResolvedValue({ access_token: jwtCon(EN_UNA_HORA), nombre: 'Nuevo', rol: 'Cliente' })
    const { result } = usarAuth()
    let respuesta
    await act(async () => { respuesta = await result.current.register({ email: 'n@x.com', password: 'Abcdefg1' }) })
    expect(respuesta).toEqual({ success: true, data: { id: 1 } })
    expect(loginRequest).toHaveBeenCalledWith('n@x.com', 'Abcdefg1')
    expect(result.current.user.role).toBe('Cliente')
  })

  it('should ask to log in manually when the account was created but the login fails', async () => {
    registerRequest.mockResolvedValue({ id: 2 })
    loginRequest.mockRejectedValue(new Error('caído'))
    const { result } = usarAuth()
    let respuesta
    await act(async () => { respuesta = await result.current.register({ email: 'n@x.com', password: 'x' }) })
    expect(respuesta).toEqual({ success: true, message: 'Cuenta creada. Inicia sesión.' })
  })

  it.each([
    [new Error('Correo ya registrado'), 'Correo ya registrado'],
    [new Error(''), 'No se pudo registrar'],
  ])('should return the register error (%s)', async (error, mensaje) => {
    registerRequest.mockRejectedValue(error)
    const { result } = usarAuth()
    let respuesta
    await act(async () => { respuesta = await result.current.register({ email: 'x', password: 'x' }) })
    expect(respuesta).toEqual({ success: false, message: mensaje })
  })

  it.each([
    ['Administrador', 'createUser', true],
    ['Coordinador', 'createUser', false],
  ])('hasAction should follow the role permissions (%s, %s)', async (rol, accion, esperado) => {
    loginRequest.mockResolvedValue({ access_token: jwtCon(EN_UNA_HORA), nombre: 'X', rol })
    const { result } = usarAuth()
    await act(async () => { await result.current.login('x@x.com', 'x') })
    expect(result.current.hasAction(accion)).toBe(esperado)
  })

  it('should fail clearly when useAuth is used outside the provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth debe usarse dentro de AuthProvider')
  })
})
