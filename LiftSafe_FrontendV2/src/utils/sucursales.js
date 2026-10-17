// Sucursales (sedes) de un cliente a partir de sus ascensores.
// Se usa en el formulario de nueva solicitud (Solicitudes.jsx).
const SIN_SUCURSAL = 'sin-sucursal';

export const claveSucursal = (ascensor) => (ascensor.id_sede ? String(ascensor.id_sede) : SIN_SUCURSAL);

export function sucursalesDeAscensores(ascensores = []) {
  const mapa = new Map();
  ascensores.forEach((a) => {
    const clave = claveSucursal(a);
    const actual = mapa.get(clave) || {
      clave,
      nombre: a.id_sede ? (a.sede || `Sucursal ${a.id_sede}`) : 'Sin sucursal asignada',
      total: 0,
    };
    actual.total += 1;
    mapa.set(clave, actual);
  });
  return [...mapa.values()].sort((x, y) => {
    if (x.clave === SIN_SUCURSAL) return 1;
    if (y.clave === SIN_SUCURSAL) return -1;
    return x.nombre.localeCompare(y.nombre);
  });
}
