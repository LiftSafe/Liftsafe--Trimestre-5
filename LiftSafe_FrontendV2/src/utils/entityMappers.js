export function normalizeBuilding(raw, index = 0) {
  const name = raw?.name || raw?.direccion || raw?.address || '';
  const address = raw?.address || raw?.direccion || raw?.name || '';
  return {
    id: raw?.id || raw?.direccion || name || index,
    name: name || 'Sin nombre',
    address: address || 'Sin dirección',
    elevators: raw?.elevators ?? raw?.total_ascensores ?? 0,
    manager: raw?.manager || raw?.cliente || '',
    phone: raw?.phone || raw?.telefono || '',
    status: raw?.status || raw?.estado || 'Activo',
    location: raw?.location || raw?.ubicacion_exacta || '',
    city: raw?.city || raw?.ciudad || '',
  };
}

export function normalizeElevator(raw) {
  return {
    id: raw?.id ?? raw?.id_ascensor,
    brand: raw?.brand || raw?.marca || '',
    model: raw?.model || raw?.modelo || '',
    type: raw?.type || raw?.tipo_ascensor || '',
    building: raw?.building || raw?.direccion_completa || '',
    location: raw?.location || raw?.ubicacion_exacta || '',
    city: raw?.city || raw?.ciudad || '',
    status: raw?.status || raw?.estado || '',
    capacity: raw?.capacity ?? raw?.capacidad_kg,
    floors: raw?.floors ?? raw?.numero_pisos,
    client: raw?.client || raw?.cliente || '',
    lastInspection: raw?.lastInspection || 'No registrada',
    nextInspection: raw?.nextInspection || 'No programada',
  };
}
