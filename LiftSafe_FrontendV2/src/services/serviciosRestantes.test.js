import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { auditoriaService } from './auditoriaService'
import {
  createUserRequest,
  recoverPasswordRequest,
  resetPasswordRequest,
  resetPasswordWithCodeRequest,
} from './authService'
import { checklistService } from './checklistService'
import { clienteService } from './clienteService'
import { encuestaService } from './encuestaService'
import { firmaService } from './firmaService'
import { fotografiaService } from './fotografiaService'
import { informeService } from './informeService'
import { inspeccionesService } from './inspeccionesService'
import { observacionService } from './observacionService'
import { programacionService } from './programacionService'
import { usuarioAscensorService } from './usuarioAscensorService'

const respuesta = ({ ok = true, status = 200, body = {} } = {}) => ({ ok, status, json: () => Promise.resolve(body) })
const BASE = 'http://localhost:8000'

describe('servicios que delegan en apiClient', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta()))
  })
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    ['checklistService.calificar', () => checklistService.calificar({}), '/checklist/', 'POST'],
    ['checklistService.listarPorInspeccion', () => checklistService.listarPorInspeccion(3), '/checklist/inspeccion/3', 'GET'],
    ['checklistService.obtenerCategorias', () => checklistService.obtenerCategorias(), '/checklist/categorias', 'GET'],
    ['checklistService.obtenerCumplimiento', () => checklistService.obtenerCumplimiento(3), '/checklist/cumplimiento/3', 'GET'],
    ['checklistService.eliminar', () => checklistService.eliminar(8), '/checklist/8', 'DELETE'],
    ['clienteService.crear', () => clienteService.crear({}), '/clientes/', 'POST'],
    ['clienteService.listar', () => clienteService.listar(), '/clientes/', 'GET'],
    ['clienteService.obtener', () => clienteService.obtener(2), '/clientes/2', 'GET'],
    ['clienteService.modificar', () => clienteService.modificar(2, {}), '/clientes/2', 'PUT'],
    ['programacionService.asignar', () => programacionService.asignar({}), '/programacion/', 'POST'],
    ['programacionService.listar', () => programacionService.listar(), '/programacion/', 'GET'],
    ['programacionService.reasignar', () => programacionService.reasignar(4, {}), '/programacion/4/reasignar', 'PUT'],
    ['usuarioAscensorService.asignar', () => usuarioAscensorService.asignar({}), '/usuario-ascensor/', 'POST'],
    ['usuarioAscensorService.listar', () => usuarioAscensorService.listar(), '/usuario-ascensor/', 'GET'],
    ['usuarioAscensorService.obtener', () => usuarioAscensorService.obtener(5), '/usuario-ascensor/5', 'GET'],
    ['usuarioAscensorService.desasignar', () => usuarioAscensorService.desasignar(5, {}), '/usuario-ascensor/5/desasignar', 'PUT'],
    ['auditoriaService.listar', () => auditoriaService.listar(), '/auditoria/', 'GET'],
    ['auditoriaService.filtrarPorTabla', () => auditoriaService.filtrarPorTabla('usuario'), '/auditoria/?tabla=usuario', 'GET'],
    ['auditoriaService.filtrarPorUsuario', () => auditoriaService.filtrarPorUsuario(3), '/auditoria/?usuario=3', 'GET'],
    ['informeService.generar', () => informeService.generar(9), '/informes/9/generar', 'POST'],
    ['informeService.listar', () => informeService.listar(), '/informes/', 'GET'],
    ['informeService.obtenerPorInspeccion', () => informeService.obtenerPorInspeccion(9), '/informes/inspeccion/9', 'GET'],
    ['informeService.enviar', () => informeService.enviar(1), '/informes/1/enviar', 'PUT'],
    ['informeService.eliminar', () => informeService.eliminar(1), '/informes/1', 'DELETE'],
    ['encuestaService.listarMias', () => encuestaService.listarMias(), '/encuestas/', 'GET'],
    ['encuestaService.responder', () => encuestaService.responder(2, {}), '/encuestas/2/responder', 'PUT'],
    ['firmaService.firmarInspector', () => firmaService.firmarInspector(4, {}), '/inspecciones/4/firma-inspector', 'PUT'],
    ['firmaService.firmarCliente', () => firmaService.firmarCliente(4, {}), '/inspecciones/4/firma-cliente', 'PUT'],
    ['firmaService.verificarFirmas', () => firmaService.verificarFirmas(4), '/inspecciones/4/firmas', 'GET'],
    ['inspeccionesService.misInspecciones', () => inspeccionesService.misInspecciones(), '/inspecciones/mis-inspecciones', 'GET'],
    ['observacionService.crear', () => observacionService.crear({}), '/observaciones/', 'POST'],
    ['observacionService.listarPorInforme', () => observacionService.listarPorInforme(6), '/observaciones/6', 'GET'],
    ['observacionService.modificar', () => observacionService.modificar(6, {}), '/observaciones/6', 'PUT'],
    ['observacionService.eliminar', () => observacionService.eliminar(6), '/observaciones/6', 'DELETE'],
    ['fotografiaService.listarPorInforme', () => fotografiaService.listarPorInforme(6), '/fotografias/informe/6', 'GET'],
    ['fotografiaService.eliminar', () => fotografiaService.eliminar(6), '/fotografias/6', 'DELETE'],
  ])('%s should call %s with %s', async (_nombre, llamar, ruta, metodo) => {
    // Act
    await llamar()

    // Assert
    const [url, opciones] = fetch.mock.calls[0]
    expect(url).toBe(`${BASE}${ruta}`)
    expect(opciones.method ?? 'GET').toBe(metodo)
  })

  it.each([
    ['aprobar', 'Aprobado'],
    ['rechazar', 'Rechazado'],
  ])('informeService.%s should send the decision %s with the technical concept', async (accion, decision) => {
    await informeService[accion](3, { concepto_tecnico: 'Conforme', observaciones_revision: 'ok' })
    const [url, opciones] = fetch.mock.calls[0]
    expect(url).toBe(`${BASE}/informes/3/revisar`)
    expect(JSON.parse(opciones.body)).toEqual({ decision, concepto_tecnico: 'Conforme', observaciones_revision: 'ok' })
  })

  it.each([
    ['con descripción', 'Fachada', ['id_informe', 'file', 'descripcion']],
    ['sin descripción', '', ['id_informe', 'file']], // límite: la descripción vacía no se envía
  ])('fotografiaService.subir should build the form data %s', async (_caso, descripcion, campos) => {
    const archivo = new Blob(['x'], { type: 'image/png' })
    await fotografiaService.subir(5, archivo, descripcion)
    const cuerpo = fetch.mock.calls[0][1].body
    expect(cuerpo).toBeInstanceOf(FormData)
    expect([...cuerpo.keys()]).toEqual(campos)
  })
})

describe('authService: recuperación de clave y creación de usuarios', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    ['recoverPasswordRequest', () => recoverPasswordRequest('a@x.com'), '/auth/recuperar-clave', { correo: 'a@x.com' }],
    ['resetPasswordRequest', () => resetPasswordRequest('tok', 'Abcdefg1'), '/auth/reset-clave', { token: 'tok', nueva_contrasena: 'Abcdefg1' }],
    ['resetPasswordWithCodeRequest', () => resetPasswordWithCodeRequest('a@x.com', '123456', 'Abcdefg1'), '/auth/reset-clave',
      { correo: 'a@x.com', code: '123456', nueva_contrasena: 'Abcdefg1' }],
  ])('%s should POST the right body', async (_nombre, llamar, ruta, cuerpo) => {
    fetch.mockResolvedValue(respuesta({ body: { message: 'ok' } }))
    await expect(llamar()).resolves.toEqual({ message: 'ok' })
    const [url, opciones] = fetch.mock.calls[0]
    expect(url).toBe(`${BASE}${ruta}`)
    expect(opciones.method).toBe('POST')
    expect(JSON.parse(opciones.body)).toEqual(cuerpo)
  })

  it('should use the message field when the error has no detail', async () => {
    fetch.mockResolvedValue(respuesta({ ok: false, status: 400, body: { message: 'Correo no registrado' } }))
    await expect(recoverPasswordRequest('x@x.com')).rejects.toThrow('Correo no registrado')
  })

  it('createUserRequest should map the form, the role id and the token', async () => {
    // Arrange
    fetch.mockResolvedValue(respuesta({ body: { id_usuario: 1 } }))

    // Act
    await createUserRequest({ name: 'Ana', email: 'a@x.com', password: 'Abcdefg1', documentType: 'CC', document: '1', role: 'Inspector' }, 'tok')

    // Assert
    const [url, opciones] = fetch.mock.calls[0]
    expect(url).toBe(`${BASE}/usuarios`)
    expect(opciones.headers.Authorization).toBe('Bearer tok')
    expect(JSON.parse(opciones.body)).toMatchObject({ nombre_completo: 'Ana', id_rol: 4, nit: null, razon_social: null, telefono: null })
  })
})
