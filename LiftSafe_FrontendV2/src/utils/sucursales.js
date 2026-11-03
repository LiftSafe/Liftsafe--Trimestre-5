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
      nombre: a.id_sede ? (a.sede || `Edificio ${a.id_sede}`) : 'Sin edificio asignado',
      total: 0,
    };
    actual.total += 1;
    mapa.set(clave, actual);
  });
  return ordenar([...mapa.values()]);
}

function ordenar(lista) {
  return lista.sort((x, y) => {
    if (x.clave === SIN_SUCURSAL) return 1;
    if (y.clave === SIN_SUCURSAL) return -1;
    return x.nombre.localeCompare(y.nombre);
  });
}

// Edificios del cliente para la nueva solicitud: todos sus edificios (aunque
// todavía no tengan ascensores) con cuántos ascensores tiene cada uno.
export function edificiosDelCliente(sedes = [], ascensores = []) {
  const mapa = new Map(sedes.map((s) => [String(s.id_sede), { clave: String(s.id_sede), nombre: s.nombre, total: 0 }]));
  sucursalesDeAscensores(ascensores).forEach((g) => {
    if (mapa.has(g.clave)) mapa.get(g.clave).total = g.total;
    else mapa.set(g.clave, { ...g });
  });
  return ordenar([...mapa.values()]);
}

export const tieneEdificios = (edificios = []) => edificios.some((e) => e.clave !== SIN_SUCURSAL);
