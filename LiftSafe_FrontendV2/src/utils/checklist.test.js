import { describe, it, expect } from 'vitest'
import { describirItems, itemsSinFotoObligatoria, primerItemSinCalificar } from './checklist'

const categorias = [
  { id_categoria: 1, items: [{ id_item: 1 }, { id_item: 2 }] },
  { id_categoria: 2, items: [{ id_item: 3 }] },
]

describe('itemsSinFotoObligatoria', () => {
  it('should list not compliant items without a photo', () => {
    const detalles = { 1: { resultado: 'No Cumple' }, 2: { resultado: 'No Aplica' }, 3: { resultado: 'No Cumple' } }
    expect(itemsSinFotoObligatoria(categorias, detalles, [{ id_item: 3 }])).toEqual([{ id_item: 1 }])
  })

  it('should return nothing when every not compliant item has a photo or there is no data', () => {
    expect(itemsSinFotoObligatoria(categorias, { 1: { resultado: 'No Cumple' } }, [{ id_item: 1 }])).toEqual([])
    expect(itemsSinFotoObligatoria()).toEqual([])
  })
})

describe('describirItems', () => {
  it('should give the continuous number and group of each item', () => {
    const cats = [
      { nombre_categoria: '6.1 Puertas', items: [{ id_item: 1, descripcion: 'A' }, { id_item: 2, descripcion: 'B' }] },
      { nombre_categoria: '6.2 Cables', items: [{ id_item: 3, descripcion: 'C' }] },
    ]
    expect(describirItems(cats, [{ id_item: 3 }, { id_item: 1 }])).toEqual([
      { numero: 1, grupo: '6.1 Puertas', descripcion: 'A', id_item: 1 },
      { numero: 3, grupo: '6.2 Cables', descripcion: 'C', id_item: 3 },
    ])
    expect(describirItems()).toEqual([])
  })
})

describe('primerItemSinCalificar', () => {
  it('should return the first item without a grade, in order', () => {
    const cats = [{ items: [{ id_item: 1 }, { id_item: 2 }] }, { items: [{ id_item: 3 }] }]
    expect(primerItemSinCalificar(cats, { 1: { resultado: 'Cumple' } })).toBe(2)
    expect(primerItemSinCalificar(cats, { 1: { resultado: 'Cumple' }, 2: { resultado: 'No Aplica' }, 3: { resultado: 'Cumple' } })).toBeNull()
    expect(primerItemSinCalificar()).toBeNull()
  })
})
