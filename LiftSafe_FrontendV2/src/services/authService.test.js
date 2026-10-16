import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  eliminarUsuario,
  loginRequest,
  registerRequest,
  updateUserRequest,
} from './authService'

const respuesta = ({ ok = true, body = {} } = {}) => ({ ok, json: () => Promise.resolve(body) })
const cuerpoEnviado = () => JSON.parse(fetch.mock.calls[0][1].body)

describe('authService', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  describe('registerRequest (reglas de NIT)', () => {
    const base = { name: 'Ana', email: 'ana@x.com', password: 'Abcdefg1', document: '900123', phone: '', businessName: 'ACME' }

    it('should send nit and razon_social only when the document type is NIT', async () => {
      fetch.mockResolvedValue(respuesta())
      await registerRequest({ ...base, documentType: 'NIT' })
      expect(cuerpoEnviado()).toMatchObject({ nit: '900123', razon_social: 'ACME' })
    })

    it('should send nit and razon_social as null for a person (CC)', async () => {
      fetch.mockResolvedValue(respuesta())
      await registerRequest({ ...base, documentType: 'CC' })
      expect(cuerpoEnviado()).toMatchObject({ nit: null, razon_social: null })
    })

    it('should always register as Cliente and send an empty phone as null', async () => {
      fetch.mockResolvedValue(respuesta())
      await registerRequest({ ...base, documentType: 'CC' })
      expect(cuerpoEnviado()).toMatchObject({ id_rol: 6, telefono: null })
    })
  })

  describe('updateUserRequest (contraseña opcional)', () => {
    const datos = { name: 'Ana', email: 'ana@x.com', documentType: 'CC', document: '1', role: 'Inspector', status: 'Activo' }

    it('should not send the password when the admin leaves it empty', async () => {
      fetch.mockResolvedValue(respuesta())
      await updateUserRequest(5, { ...datos, password: '' })
      expect(cuerpoEnviado()).not.toHaveProperty('contrasena')
    })

    it('should send the password when the admin writes a new one', async () => {
      fetch.mockResolvedValue(respuesta())
      await updateUserRequest(5, { ...datos, password: 'Nueva1234' })
      expect(cuerpoEnviado().contrasena).toBe('Nueva1234')
    })

    it('should map the role name to its database id', async () => {
      fetch.mockResolvedValue(respuesta())
      await updateUserRequest(5, { ...datos, password: '' })
      expect(cuerpoEnviado().id_rol).toBe(4)
    })
  })

  describe('manejo de errores', () => {
    it('should throw the backend detail when the login fails', async () => {
      fetch.mockResolvedValue(respuesta({ ok: false, body: { detail: 'Credenciales incorrectas' } }))
      await expect(loginRequest('a@x.com', 'mala')).rejects.toThrow('Credenciales incorrectas')
    })

    it('should throw a default message when the error body is not JSON', async () => {
      fetch.mockResolvedValue({ ok: false, json: () => Promise.reject(new Error('no json')) })
      await expect(loginRequest('a@x.com', 'mala')).rejects.toThrow('Error en la solicitud')
    })

    it('should throw a default message when deleting a user fails without detail', async () => {
      fetch.mockResolvedValue({ ok: false, json: () => Promise.reject(new Error('no json')) })
      await expect(eliminarUsuario(9)).rejects.toThrow('Error al eliminar usuario')
    })
  })
})
