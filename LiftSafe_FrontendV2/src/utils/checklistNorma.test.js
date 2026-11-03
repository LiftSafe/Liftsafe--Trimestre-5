import { describe, it, expect } from 'vitest'
import { filtrarGrupos, numeralDelGrupo, resumenChecklist, siguienteOrden, sugerirCodigo } from './checklistNorma'

const grupos = [
  { id_categoria: 1, nombre_categoria: '6.1 Puertas de piso', activo: true, orden_visualizacion: 1, items: [
    { id_item: 1, codigo_item: 'NTC-6.1-01', descripcion: 'Enclavamiento de las puertas', activo: true, orden_visualizacion: 1 },
    { id_item: 2, codigo_item: 'NTC-6.1-02', descripcion: 'Contactos eléctricos', activo: false, orden_visualizacion: 2 },
  ] },
  { id_categoria: 2, nombre_categoria: 'Cuarto de Máquinas', activo: false, orden_visualizacion: 1, items: [
    { id_item: 3, codigo_item: 'CM-01', descripcion: 'Iluminación', activo: true },
  ] },
]

describe('checklistNorma (RNF-011)', () => {
  it('siguienteOrden', () => {
    expect(siguienteOrden(grupos)).toBe(2)
    expect(siguienteOrden([])).toBe(1)
  })

  it('numeralDelGrupo y sugerirCodigo', () => {
    expect(numeralDelGrupo('6.12 Ascensores panorámicos')).toBe('6.12')
    expect(numeralDelGrupo('Cuarto de Máquinas')).toBe('')
    expect(sugerirCodigo(grupos[0])).toBe('NTC-6.1-03')
    expect(sugerirCodigo({ nombre_categoria: '6.12 Nuevo', items: [] })).toBe('NTC-6.12-01')
    expect(sugerirCodigo(grupos[1])).toBe('')
  })

  it('oculta lo desactivado salvo que se pida verlo', () => {
    const visibles = filtrarGrupos(grupos)
    expect(visibles).toHaveLength(1)
    expect(visibles[0].items.map((i) => i.id_item)).toEqual([1])
    expect(filtrarGrupos(grupos, { verDesactivados: true })).toHaveLength(2)
  })

  it('busca sin importar tildes ni mayúsculas', () => {
    expect(filtrarGrupos(grupos, { texto: 'ENCLAVAMIENTO' })[0].items).toHaveLength(1)
    expect(filtrarGrupos(grupos, { texto: 'electricos', verDesactivados: true })[0].items[0].id_item).toBe(2)
    expect(filtrarGrupos(grupos, { texto: 'maquinas', verDesactivados: true })[0].id_categoria).toBe(2)
    expect(filtrarGrupos(grupos, { texto: 'nada' })).toEqual([])
  })

  it('resumen cuenta solo lo activo', () => {
    expect(resumenChecklist(grupos)).toEqual({ grupos: 1, items: 1 })
  })
})
