// RF-017: filtros de la lista de inspecciones (fecha, cliente, ubicación,
// técnico, tipo de inspección y estado).

export const FILTROS_VACIOS = {
  desde: '', hasta: '', cliente: '', inspector: '', ciudad: '', tipo: '', estado: '',
};

const CAMPOS = {
  cliente: (i) => i.nombre_cliente,
  inspector: (i) => i.nombre_inspector || i.inspector,
  ciudad: (i) => i.ciudad,
  tipo: (i) => i.tipo_servicio || i.type,
  estado: (i) => i.estado || i.estado_inspeccion || i.status,
};

// Fecha de la inspección: la programada o, si no hay, la de inicio (AAAA-MM-DD)
export const fechaInspeccion = (i) => String(i.fecha_programada || i.fecha_inicio || i.date || '').slice(0, 10);

// Valores distintos de un campo, para llenar cada lista desplegable
export function opcionesDe(lista = [], filtro) {
  const leer = CAMPOS[filtro];
  return [...new Set(lista.map(leer).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
}

export function filtrarInspecciones(lista = [], filtros = FILTROS_VACIOS) {
  return lista.filter((i) => {
    const fecha = fechaInspeccion(i);
    if (filtros.desde && (!fecha || fecha < filtros.desde)) return false;
    if (filtros.hasta && (!fecha || fecha > filtros.hasta)) return false;
    return Object.keys(CAMPOS).every((k) => !filtros[k] || CAMPOS[k](i) === filtros[k]);
  });
}

export const contarFiltros = (filtros = FILTROS_VACIOS) => Object.values(filtros).filter(Boolean).length;
