const STATUS_COLORS = {
  Aprobada: '#0E7C4A',
  Finalizada: '#1ABC9C',
  Completada: '#16A085',
  Programada: '#0066CC',
  'En Proceso': '#E67E22',
  Borrador: '#C97B1A',
  Pendiente: '#C97B1A',
  Observaciones: '#C0392B',
  Cancelada: '#6B7A8C',
};

export function inspectionStatusChart(inspecciones = []) {
  const counts = {};
  inspecciones.forEach((item) => {
    const name = item.status || 'Sin estado';
    counts[name] = (counts[name] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name] || '#6B7A8C',
  }));
}

export function inspectionsByBuildingChart(inspecciones = []) {
  const counts = {};
  inspecciones.forEach((item) => {
    const building = item.building || 'Sin edificio';
    counts[building] = (counts[building] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([building, total]) => ({
      building: building.length > 22 ? `${building.slice(0, 20)}…` : building,
      inspecciones: total,
    }));
}
