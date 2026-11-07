// Enlaces del reporte de Productividad (RF-024) a la lista de Inspecciones.
// Usa exactamente los mismos criterios que el reporte (reportes.py y
// productividad_controller.py), para que la lista muestre la misma cantidad
// que la tarjeta o la celda en la que se hizo clic.

export const ESTADOS_TERMINADA = ['Pendiente firma cliente', 'Pendiente revisión', 'Finalizada', 'Aprobada', 'Completada'];
const INFORME_APROBADO = ['Aprobado', 'Enviado'];
// Le rechazaron el informe alguna vez (el backend lo saca del log de auditoría)
const fueRechazada = (i) => (i.rechazos || 0) > 0 || i.estado_informe === 'Rechazado';

export const GRUPOS = {
  asignadas: { nombre: 'Asignadas', cumple: () => true },
  terminadas: { nombre: 'Terminadas', cumple: (i) => ESTADOS_TERMINADA.includes(i.estado) },
  en_curso: { nombre: 'En curso', cumple: (i) => !ESTADOS_TERMINADA.includes(i.estado) && i.estado !== 'Cancelada' },
  aprobadas: { nombre: 'Aprobadas', cumple: (i) => INFORME_APROBADO.includes(i.estado_informe) },
  // Rechazada alguna vez (aunque después se corrigiera y aprobara)
  rechazadas: { nombre: 'Rechazadas', cumple: (i) => fueRechazada(i) },
  revisadas: { nombre: 'Informes revisados', cumple: (i) => INFORME_APROBADO.includes(i.estado_informe) || fueRechazada(i) },
};

// Ruta a la lista: /dashboard/inspecciones?prod=terminadas&desde=…&hasta=…&insp=4&inspNombre=…
export function rutaProductividad({ grupo, desde, hasta, idInspector, inspector }) {
  const q = new URLSearchParams({ prod: grupo });
  if (desde) q.set('desde', desde);
  if (hasta) q.set('hasta', hasta);
  if (idInspector) { q.set('insp', String(idInspector)); q.set('inspNombre', inspector || ''); }
  return `/dashboard/inspecciones?${q.toString()}`;
}

export function leerFiltroProductividad(search = '') {
  const q = new URLSearchParams(search);
  const grupo = q.get('prod');
  if (!grupo || !GRUPOS[grupo]) return null;
  return {
    grupo,
    desde: q.get('desde') || '',
    hasta: q.get('hasta') || '',
    idInspector: q.get('insp') ? Number(q.get('insp')) : null,
    inspector: q.get('inspNombre') || '',
  };
}

// El reporte cuenta por la fecha de inicio de la inspección
export function filtrarPorProductividad(lista = [], f = null) {
  if (!f) return lista;
  return lista.filter((i) => {
    const fecha = String(i.fecha_inicio || '').slice(0, 10);
    if (f.desde && (!fecha || fecha < f.desde)) return false;
    if (f.hasta && (!fecha || fecha > f.hasta)) return false;
    if (f.idInspector && Number(i.id_inspector) !== f.idInspector) return false;
    return GRUPOS[f.grupo].cumple(i);
  });
}

const fechaCorta = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '');

export function etiquetaProductividad(f) {
  if (!f) return '';
  const partes = [GRUPOS[f.grupo].nombre];
  if (f.inspector) partes.push(f.inspector);
  if (f.desde || f.hasta) partes.push(`${fechaCorta(f.desde) || '…'} a ${fechaCorta(f.hasta) || '…'}`);
  return `Productividad: ${partes.join(' · ')}`;
}
