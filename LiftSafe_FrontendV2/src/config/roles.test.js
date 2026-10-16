import { describe, expect, it } from 'vitest'
import { canAccess, canDo, getMenuForRole, getPermissions } from './roles'

describe('roles: permisos de pantallas', () => {
  it('should give an unknown role only dashboard and configuracion', () => {
    // Arrange
    const rolDesconocido = 'Visitante'

    // Act
    const permisos = getPermissions(rolDesconocido)

    // Assert
    expect(permisos).toEqual(['dashboard', 'configuracion'])
  })

  it.each([
    ['Administrador', 'auditoria', true],
    ['Director Técnico', 'auditoria', false], // la auditoría es solo del Administrador
    ['Cliente', 'inspecciones', true], // el Cliente firma desde Inspecciones
    ['Cliente', 'usuarios', false],
    ['Asesor', 'inspecciones', false],
    ['Inspector', 'ascensores', true],
    ['Visitante', 'usuarios', false],
  ])('canAccess(%s, %s) should be %s', (rol, pantalla, esperado) => {
    expect(canAccess(rol, pantalla)).toBe(esperado)
  })

  it('should build the menu in the same order as MENU_ITEMS and only with allowed screens', () => {
    // Arrange
    const rol = 'Asesor'

    // Act
    const claves = getMenuForRole(rol).map((item) => item.key)

    // Assert: el orden lo define MENU_ITEMS, no la lista de permisos del rol
    expect(claves).toEqual(['dashboard', 'solicitudes', 'reportes', 'configuracion'])
  })
})

describe('roles: acciones', () => {
  it.each([
    ['createInspection', 'Coordinador', true],
    ['createInspection', 'Inspector', true],
    ['createInspection', 'Asesor', false], // el backend no los autoriza a crear
    ['createInspection', 'Director Técnico', false],
    ['createUser', 'Administrador', true],
    ['createUser', 'Coordinador', false],
  ])('canDo(%s, %s) should be %s', (accion, rol, esperado) => {
    expect(canDo(rol, accion)).toBe(esperado)
  })

  it('should deny an action that does not exist', () => {
    expect(canDo('Administrador', 'accionInventada')).toBe(false)
  })
})
