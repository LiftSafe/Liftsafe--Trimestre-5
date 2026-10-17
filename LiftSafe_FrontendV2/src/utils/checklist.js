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
