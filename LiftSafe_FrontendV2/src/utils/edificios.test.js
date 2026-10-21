import { describe, it, expect } from 'vitest'
import { ASCENSOR_VACIO, ascensorDesdeEdificio, validarAscensor } from './edificios'

const lleno = { ...ASCENSOR_VACIO, codigo_interno: ' ASC-100 ', marca: 'Otis', modelo: 'Gen2', numero_serie: 'S1', capacidad_kg: '630', numero_pisos: '8' }

describe('validarAscensor', () => {
  it('should ask for the first missing field', () => {
    expect(validarAscensor(ASCENSOR_VACIO)).toBe('Escribe el código del ascensor')
    expect(validarAscensor({ ...lleno, marca: ' ' })).toBe('Escribe la marca del ascensor')
  })
  it('should check capacity and floors', () => {
    expect(validarAscensor({ ...lleno, capacidad_kg: '0' })).toMatch(/capacidad/)
    expect(validarAscensor({ ...lleno, numero_pisos: '2.5' })).toMatch(/pisos/)
    expect(validarAscensor(lleno)).toBe('')
  })
})

describe('ascensorDesdeEdificio', () => {
  it('should take the address and city from the building', () => {
    const sede = { id_sede: 3, nombre: 'Torre Norte', direccion: 'Cra 7 #100', ciudad: 'Bogotá' }
    expect(ascensorDesdeEdificio(lleno, sede, 9)).toMatchObject({
      id_cliente: 9, id_sede: 3, codigo_interno: 'ASC-100', capacidad_kg: 630, numero_pisos: 8,
      capacidad_personas: null, ubicacion_exacta: 'Torre Norte', direccion_completa: 'Cra 7 #100', ciudad: 'Bogotá', estado: 'Activo',
    })
  })
  it('should fill address and city when the building has none', () => {
    const datos = ascensorDesdeEdificio({ ...lleno, capacidad_personas: '8', ubicacion_exacta: 'Torre B' }, { id_sede: 1, nombre: 'Edificio Sol' }, 2)
    expect(datos).toMatchObject({ capacidad_personas: 8, ubicacion_exacta: 'Torre B', direccion_completa: 'Edificio Sol', ciudad: 'Sin ciudad' })
  })
})
