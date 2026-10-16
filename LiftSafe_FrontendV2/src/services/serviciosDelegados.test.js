import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ascensorService } from './ascensorService'
import { auditoriaService } from './auditoriaService'
import { checklistService } from './checklistService'
import { clienteService } from './clienteService'
import { encuestaService } from './encuestaService'
import { firmaService } from './firmaService'
import { fotografiaService } from './fotografiaService'
import { informeService } from './informeService'
import { notificacionService } from './notificacionService'
import { programacionService } from './programacionService'
import { usuarioAscensorService } from './usuarioAscensorService'
import { usuarioService } from './usuarioService'

const llamada = () => {
  const [url, opciones] = fetch.mock.calls[0]
  return { ruta: url.replace(/^https?:\/\/[^/]+/, ''), metodo: opciones.method, cuerpo: opciones.body }
}

describe('servicios que delegan en apiClient', () => {
  beforeEach(() => {
    sessionStorage.setItem('token', 'tkn')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) }))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it.each([
    ['informeService.generar', () => informeService.generar(3), '/informes/3/generar', 'POST'],
    ['informeService.enviar', () => informeService.enviar(4), '/informes/4/enviar', 'PUT'],
    ['informeService.eliminar', () => informeService.eliminar(4), '/informes/4', 'DELETE'],
    ['firmaService.firmarCliente', () => firmaService.firmarCliente(8, {}), '/inspecciones/8/firma-cliente', 'PUT'],
    ['firmaService.verificarFirmas', () => firmaService.verificarFirmas(8), '/inspecciones/8/firmas', 'GET'],
    ['checklistService.calificar', () => checklistService.calificar({}), '/checklist/', 'POST'],
    ['checklistService.obtenerCumplimiento', () => checklistService.obtenerCumplimiento(2), '/checklist/cumplimiento/2', 'GET'],
    ['encuestaService.responder', () => encuestaService.responder(5, {}), '/encuestas/5/responder', 'PUT'],
    ['clienteService.modificar', () => clienteService.modificar(1, {}), '/clientes/1', 'PUT'],
    ['usuarioAscensorService.desasignar', () => usuarioAscensorService.desasignar(6, {}), '/usuario-ascensor/6/desasignar', 'PUT'],
    ['auditoriaService.filtrarPorTabla', () => auditoriaService.filtrarPorTabla('usuario'), '/auditoria/?tabla=usuario', 'GET'],
    ['notificacionService.marcarTodasLeidas', () => notificacionService.marcarTodasLeidas(), '/notificaciones/leer-todas', 'PUT'],
    ['notificacionService.marcarLeida', () => notificacionService.marcarLeida(9), '/notificaciones/9/leer', 'PUT'],
    ['ascensorService.listar', () => ascensorService.listar(), '/ascensores/listado', 'GET'],
  ])('%s should call the right endpoint', async (_nombre, ejecutar, ruta, metodo) => {
    await ejecutar()
    expect(llamada()).toMatchObject({ ruta, metodo })
  })

  it('should ask for the inspectors of a date only when a date is given', async () => {
    await usuarioService.listarInspectores('2026-10-20')
    expect(llamada().ruta).toBe('/usuarios/inspectores?fecha=2026-10-20')

    fetch.mockClear()
    await usuarioService.listarInspectores()
    expect(llamada().ruta).toBe('/usuarios/inspectores')
  })

  it('should send the decision Aprobado or Rechazado when reviewing a report', async () => {
    await informeService.aprobar(7, { concepto_tecnico: 'ok' })
    expect(JSON.parse(llamada().cuerpo)).toMatchObject({ decision: 'Aprobado', concepto_tecnico: 'ok' })

    fetch.mockClear()
    await informeService.rechazar(7, { observaciones_revision: 'falta firma' })
    expect(JSON.parse(llamada().cuerpo)).toMatchObject({ decision: 'Rechazado' })
  })

  it('should encode the reason when cancelling a scheduling', async () => {
    await programacionService.cancelar(3, 'lluvia & viento')
    expect(llamada().ruta).toBe('/programacion/3/cancelar?motivo=lluvia%20%26%20viento')
  })

  it('should upload a photo as FormData and skip the description when it is empty', async () => {
    // Arrange
    const archivo = new File(['x'], 'foto.png', { type: 'image/png' })

    // Act
    await fotografiaService.subir(11, archivo, '')

    // Assert
    const datos = llamada().cuerpo
    expect(datos).toBeInstanceOf(FormData)
    expect(datos.get('id_informe')).toBe('11')
    expect(datos.has('descripcion')).toBe(false)
  })

  it('should include the description when it is provided', async () => {
    const archivo = new File(['x'], 'foto.png', { type: 'image/png' })
    await fotografiaService.subir(11, archivo, 'cabina')
    expect(llamada().cuerpo.get('descripcion')).toBe('cabina')
  })
})
