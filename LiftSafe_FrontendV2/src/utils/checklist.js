// Resumen del checklist de una inspección (usado por ChecklistInspeccion.jsx)
export function resumenChecklist(categorias = [], detalles = {}) {
  const items = categorias.flatMap((c) => c.items || []);
  const resultado = (item) => detalles[item.id_item]?.resultado || '';
  return {
    total: items.length,
    calificados: items.filter((i) => resultado(i)).length,
    noCumple: items.filter((i) => resultado(i) === 'No Cumple').length,
    noAplica: items.filter((i) => resultado(i) === 'No Aplica').length,
  };
}

// Los ítems calificados "No Cumple" deben llevar al menos una foto.
export const RESULTADO_FOTO_OBLIGATORIA = 'No Cumple';

export function itemsSinFotoObligatoria(categorias = [], detalles = {}, fotos = []) {
  const conFoto = new Set(fotos.map((f) => f.id_item));
  return categorias
    .flatMap((c) => c.items || [])
    .filter((i) => detalles[i.id_item]?.resultado === RESULTADO_FOTO_OBLIGATORIA && !conFoto.has(i.id_item));
}

// Para mostrar cuáles ítems faltan: número continuo, grupo y descripción.
export function describirItems(categorias = [], items = []) {
  const ids = new Set(items.map((i) => i.id_item));
  let numero = 0;
  return categorias.flatMap((c) => (c.items || []).map((item) => {
    numero += 1;
    return ids.has(item.id_item) ? { numero, grupo: c.nombre_categoria, descripcion: item.descripcion, id_item: item.id_item } : null;
  })).filter(Boolean);
}

// Primer ítem del checklist (en orden) que todavía no tiene calificación
export function primerItemSinCalificar(categorias = [], detalles = {}) {
  const item = categorias.flatMap((c) => c.items || []).find((i) => !detalles[i.id_item]?.resultado);
  return item ? item.id_item : null;
}
