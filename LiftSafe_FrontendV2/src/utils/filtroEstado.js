// Filtro por estado que llega en la dirección: /dashboard/inspecciones?estado=Programada,Borrador
// Lo usan las tarjetas de resumen para llevar a una lista ya filtrada.

export function leerEstados(search = '') {
  return (new URLSearchParams(search).get('estado') || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

export function filtrarPorEstado(lista = [], estados = [], campo = (x) => x.estado || x.status) {
  if (!estados.length) return lista;
  return lista.filter((x) => estados.includes(campo(x)));
}

export function rutaConEstados(base, estados = []) {
  return estados.length ? `${base}?estado=${encodeURIComponent(estados.join(','))}` : base;
}
