// RF-024: utilidades del reporte de productividad

const fmt = (v, sufijo = '') => (v === null || v === undefined ? '' : `${v}${sufijo}`);

// Fecha AAAA-MM-DD de hoy menos n días (hora local)
export function fechaHaceDias(dias, hoy = new Date()) {
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dias);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const COLUMNAS = [
  ['Inspector', (r) => r.inspector],
  ['Asignadas', (r) => r.asignadas],
  ['Terminadas', (r) => r.terminadas],
  ['En curso', (r) => r.en_curso],
  ['Canceladas', (r) => r.canceladas],
  ['Aprobadas', (r) => r.aprobadas],
  ['Rechazadas', (r) => r.rechazadas],
  ['Cumplimiento (%)', (r) => fmt(r.tasa_cumplimiento)],
  ['Aprobación (%)', (r) => fmt(r.tasa_aprobacion)],
  ['Horas promedio', (r) => fmt(r.horas_promedio)],
];

const celda = (v) => {
  const t = String(v ?? '');
  return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

// CSV con ";" (Excel en español lo abre en columnas)
export function productividadACsv(datos) {
  const filas = [
    [`Reporte de productividad LiftSafe (${datos.desde} a ${datos.hasta})`],
    COLUMNAS.map(([t]) => t),
    ...(datos.inspectores || []).map((r) => COLUMNAS.map(([, f]) => f(r))),
    COLUMNAS.map(([, f], i) => (i === 0 ? 'TOTAL' : f({ ...datos.total, inspector: 'TOTAL' }))),
  ];
  return '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n');
}
