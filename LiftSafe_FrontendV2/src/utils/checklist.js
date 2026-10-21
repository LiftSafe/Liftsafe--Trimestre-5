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

// Los ítems calificados "No Aplica" deben llevar al menos una foto.
export const RESULTADO_FOTO_OBLIGATORIA = 'No Aplica';

export function itemsSinFotoObligatoria(categorias = [], detalles = {}, fotos = []) {
  const conFoto = new Set(fotos.map((f) => f.id_item));
  return categorias
    .flatMap((c) => c.items || [])
    .filter((i) => detalles[i.id_item]?.resultado === RESULTADO_FOTO_OBLIGATORIA && !conFoto.has(i.id_item));
}
