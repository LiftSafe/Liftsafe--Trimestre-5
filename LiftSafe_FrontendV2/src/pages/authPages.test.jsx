import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ForgotPassword from './ForgotPassword'
import Login from './Login'
import Register from './Register'
import ResetPassword from './ResetPassword'
import { recoverPasswordRequest, resetPasswordRequest, resetPasswordWithCodeRequest } from '../services/authService'

const auth = { user: null, login: vi.fn(), register: vi.fn() }
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../services/authService', () => ({
  recoverPasswordRequest: vi.fn(),
  resetPasswordRequest: vi.fn(),
  resetPasswordWithCodeRequest: vi.fn(),
}))

function montar(pantalla, ruta, estado) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: ruta.split('?')[0], search: ruta.includes('?') ? `?${ruta.split('?')[1]}` : '', state: estado }]}>
      <Routes>
        <Route path={ruta.split('?')[0]} element={pantalla} />
        <Route path="/dashboard" element={<p>panel</p>} />
        <Route path="/dashboard/reportes" element={<p>reportes</p>} />
        <Route path="/login" element={<p>pantalla de login</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const escribir = (etiqueta, valor) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })
const enviar = () => fireEvent.submit(document.querySelector('form'))

beforeEach(() => {
  auth.user = null
  auth.login.mockReset()
  auth.register.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('<Login />', () => {
  it('should send the typed credentials and go to the dashboard', async () => {
    // Arrange
    auth.login.mockResolvedValue({ success: true })
    montar(<Login />, '/login')

    // Act
    escribir(/^Correo electrónico/, 'ana@x.com')
    escribir(/^Contraseña/, 'Abcdefg1')
    enviar()

    // Assert
    expect(await screen.findByText('panel')).toBeInTheDocument()
    expect(auth.login).toHaveBeenCalledWith('ana@x.com', 'Abcdefg1')
  })

  it('should return to the page the user was trying to open', async () => {
    auth.login.mockResolvedValue({ success: true })
    montar(<Login />, '/login', { from: { pathname: '/dashboard/reportes' } })
    enviar()
    expect(await screen.findByText('reportes')).toBeInTheDocument()
  })

  it.each([
    [{ success: false, message: 'Usuario inactivo' }, 'Usuario inactivo'],
    [{ success: false }, 'Correo o contraseña incorrectos'],
  ])('should show the login error and stay on the page (%j)', async (resultado, mensaje) => {
    auth.login.mockResolvedValue(resultado)
    montar(<Login />, '/login')
    enviar()
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
  })

  it('should show a generic error when login throws', async () => {
    auth.login.mockRejectedValue(new Error('caído'))
    montar(<Login />, '/login')
    enviar()
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos')
  })

  it('should send an already logged user to the dashboard', async () => {
    auth.user = { name: 'Ana' }
    montar(<Login />, '/login')
    expect(await screen.findByText('panel')).toBeInTheDocument()
  })
})

describe('<Register />', () => {
  const llenar = ({ password = 'Abcdefg1', confirm = password } = {}) => {
    escribir(/^Nombre/, 'Cliente')
    escribir(/^Apellidos/, 'Prueba')
    escribir(/^Correo electrónico/, 'c@example.com')
    escribir(/^Número de documento/, '1098765432')
    escribir(/^Contraseña/, password)
    escribir(/^Confirmar contraseña/, confirm)
  }

  it('should ask for the required fields', async () => {
    montar(<Register />, '/register')
    enviar()
    expect(await screen.findByRole('alert')).toHaveTextContent('Completa los campos obligatorios')
    expect(auth.register).not.toHaveBeenCalled()
  })

  it.each([
    ['abc', 'abc', 'La contraseña no cumple los requisitos de seguridad'],
    ['Abcdefg1', 'Abcdefg2', 'Las contraseñas no coinciden'],
  ])('should reject %s / %s before calling the backend', async (password, confirm, mensaje) => {
    montar(<Register />, '/register')
    llenar({ password, confirm })
    enviar()
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
    expect(auth.register).not.toHaveBeenCalled()
  })

  it('should register with the full name and go to the dashboard', async () => {
    // Arrange
    auth.register.mockResolvedValue({ success: true })
    montar(<Register />, '/register')

    // Act
    llenar()
    enviar()

    // Assert
    expect(await screen.findByText('panel')).toBeInTheDocument()
    expect(auth.register).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Cliente Prueba', email: 'c@example.com', documentType: 'CC', password: 'Abcdefg1',
    }))
  })

  it.each([
    [{ success: false, message: 'Correo ya registrado' }, 'Correo ya registrado'],
    [{ success: false }, 'No se pudo crear la cuenta'],
  ])('should show the backend error (%j)', async (resultado, mensaje) => {
    auth.register.mockResolvedValue(resultado)
    montar(<Register />, '/register')
    llenar()
    enviar()
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
  })

  it('should ask for the NIT and the business name when the document type is NIT', async () => {
    // Arrange
    const user = userEvent.setup()
    montar(<Register />, '/register')
    expect(screen.queryByLabelText(/^Razón social/)).toBeNull()

    // Act
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: /NIT/ }))

    // Assert
    expect(screen.getByLabelText(/^Número de NIT/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Razón social/)).toBeInTheDocument()
  })
})

describe('<ForgotPassword />', () => {
  const pedirCodigo = async () => {
    escribir(/^Correo electrónico/, 'ana@x.com')
    enviar()
  }

  it('should request the code and move to the second step', async () => {
    // Arrange
    recoverPasswordRequest.mockResolvedValue({ message: 'Código enviado' })
    montar(<ForgotPassword />, '/forgot-password')

    // Act
    await pedirCodigo()

    // Assert
    expect(await screen.findByText('Ingresa tu código')).toBeInTheDocument()
    expect(screen.getByText('Código enviado a ana@x.com')).toBeInTheDocument()
    expect(recoverPasswordRequest).toHaveBeenCalledWith('ana@x.com')
  })

  it.each([
    [{ message: 'Error enviando el correo' }, 'Error enviando el correo'],
  ])('should stay on the first step when the answer says Error (%j)', async (respuesta, mensaje) => {
    recoverPasswordRequest.mockResolvedValue(respuesta)
    montar(<ForgotPassword />, '/forgot-password')
    await pedirCodigo()
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
    expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument()
  })

  it.each([
    [new Error('Servidor caído'), 'Servidor caído'],
    [new Error(''), 'No se pudo enviar la solicitud'],
  ])('should show the request error (%s)', async (error, mensaje) => {
    recoverPasswordRequest.mockRejectedValue(error)
    montar(<ForgotPassword />, '/forgot-password')
    await pedirCodigo()
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
  })

  describe('second step', () => {
    beforeEach(async () => {
      recoverPasswordRequest.mockResolvedValue({})
      montar(<ForgotPassword />, '/forgot-password')
      await pedirCodigo()
      await screen.findByText('Ingresa tu código')
    })

    it('should keep only digits in the code', () => {
      escribir(/^Código de 6 dígitos/, '12a3-45')
      expect(screen.getByLabelText(/^Código de 6 dígitos/)).toHaveValue('12345')
    })

    it.each([
      ['abc', 'abc', 'La contraseña no cumple los requisitos de seguridad'],
      ['Abcdefg1', 'Abcdefg2', 'Las contraseñas no coinciden'],
    ])('should reject %s / %s without calling the backend', async (password, confirm, mensaje) => {
      escribir(/^Nueva contraseña/, password)
      escribir(/^Confirmar contraseña/, confirm)
      enviar()
      expect(await screen.findByText(mensaje)).toBeInTheDocument()
      expect(resetPasswordWithCodeRequest).not.toHaveBeenCalled()
    })

    it('should change the password with the code and then go to login', async () => {
      // Arrange
      resetPasswordWithCodeRequest.mockResolvedValue({})
      escribir(/^Código de 6 dígitos/, '123456')
      escribir(/^Nueva contraseña/, 'Abcdefg1')
      escribir(/^Confirmar contraseña/, 'Abcdefg1')

      // Act
      enviar()

      // Assert
      expect(await screen.findByText('Contraseña actualizada correctamente')).toBeInTheDocument()
      expect(resetPasswordWithCodeRequest).toHaveBeenCalledWith('ana@x.com', '123456', 'Abcdefg1')
      expect(await screen.findByText('pantalla de login', {}, { timeout: 3000 })).toBeInTheDocument()
    })

    it('should show the error when the code is rejected', async () => {
      resetPasswordWithCodeRequest.mockRejectedValue(new Error('Código inválido o vencido'))
      escribir(/^Nueva contraseña/, 'Abcdefg1')
      escribir(/^Confirmar contraseña/, 'Abcdefg1')
      enviar()
      expect(await screen.findByText('Código inválido o vencido')).toBeInTheDocument()
    })

    it('should go back to the first step to change the email', async () => {
      fireEvent.click(screen.getByText('← Cambiar correo'))
      expect(await screen.findByText('Recuperar contraseña')).toBeInTheDocument()
    })
  })
})

describe('<ResetPassword />', () => {
  const llenar = (password, confirm = password) => {
    escribir(/^Nueva contraseña/, password)
    escribir(/^Confirmar contraseña/, confirm)
  }

  it('should reject a link without token', async () => {
    montar(<ResetPassword />, '/reset-password')
    llenar('Abcdefg1')
    enviar()
    expect(await screen.findByRole('alert')).toHaveTextContent('El enlace no es válido. Solicita uno nuevo.')
    expect(resetPasswordRequest).not.toHaveBeenCalled()
  })

  it.each([
    ['abc', 'abc', 'La contraseña no cumple los requisitos de seguridad'],
    ['Abcdefg1', 'Abcdefg2', 'Las contraseñas no coinciden'],
  ])('should reject %s / %s', async (password, confirm, mensaje) => {
    montar(<ResetPassword />, '/reset-password?token=t1')
    llenar(password, confirm)
    enviar()
    expect(await screen.findByRole('alert')).toHaveTextContent(mensaje)
  })

  it('should send the token from the link and the new password', async () => {
    resetPasswordRequest.mockResolvedValue({ message: 'Listo' })
    montar(<ResetPassword />, '/reset-password?token=t1')
    llenar('Abcdefg1')
    enviar()
    expect(await screen.findByText('Listo')).toBeInTheDocument()
    expect(resetPasswordRequest).toHaveBeenCalledWith('t1', 'Abcdefg1')
  })

  it.each([
    [new Error('Token vencido'), 'Token vencido'],
    [new Error(''), 'No se pudo restablecer la contraseña'],
  ])('should show the error from the backend (%s)', async (error, mensaje) => {
    resetPasswordRequest.mockRejectedValue(error)
    montar(<ResetPassword />, '/reset-password?token=t1')
    llenar('Abcdefg1')
    enviar()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(mensaje))
  })
})
