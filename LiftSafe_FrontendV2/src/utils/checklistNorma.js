// RNF-011: ayudas de la pantalla que mantiene la lista de chequeo (NTC 5926-1)

export const NIVELES = ['Leve', 'Grave', 'Muy grave'];

// Siguiente número de orden: uno más que el mayor de la lista
export function siguienteOrden(lista = []) {
  return lista.reduce((max, x) => Math.max(max, Number(x.orden_visualizacion) || 0), 0) + 1;
}

// "6.12 Ascensores panorámicos" -> "6.12"
export function numeralDelGrupo(nombre = '') {
  const m = String(nombre).trim().match(/^(\d+(?:\.\d+)*)/);
  return m ? m[1] : '';
}

// Propone el código del próximo ítem del grupo: NTC-6.12-03
export function sugerirCodigo(grupo) {
  const numeral = numeralDelGrupo(grupo?.nombre_categoria);
  if (!numeral) return '';
  const prefijo = `NTC-${numeral}-`;
  const usados = (grupo.items || [])
    .map((i) => String(i.codigo_item || ''))
    .filter((c) => c.startsWith(prefijo))
    .map((c) => parseInt(c.slice(prefijo.length), 10))
    .filter((n) => !Number.isNaN(n));
  const siguiente = (usados.length ? Math.max(...usados) : 0) + 1;
  return `${prefijo}${String(siguiente).padStart(2, '0')}`;
}

const normalizar = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Filtra por texto (grupo, código o descripción) y oculta lo desactivado si se pide
export function filtrarGrupos(grupos = [], { texto = '', verDesactivados = false } = {}) {
  const q = normalizar(texto.trim());
  return grupos
    .filter((g) => verDesactivados || g.activo)
    .map((g) => {
      const items = (g.items || []).filter((i) => verDesactivados || i.activo);
      if (!q) return { ...g, items };
      if (normalizar(g.nombre_categoria).includes(q)) return { ...g, items };
      const coinciden = items.filter((i) => normalizar(`${i.codigo_item} ${i.descripcion}`).includes(q));
      return coinciden.length ? { ...g, items: coinciden } : null;
    })
    .filter(Boolean);
}

// Totales para el encabezado
export function resumenChecklist(grupos = []) {
  const activos = grupos.filter((g) => g.activo);
  return {
    grupos: activos.length,
    items: activos.reduce((n, g) => n + (g.items || []).filter((i) => i.activo).length, 0),
  };
}
