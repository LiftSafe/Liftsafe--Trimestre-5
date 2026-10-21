import { describe, it, expect } from 'vitest'
import { itemsSinFotoObligatoria } from './checklist'

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
