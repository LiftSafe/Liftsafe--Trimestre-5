// Ascensores que el Asesor registra dentro de un edificio (sede) del cliente.
export const TIPOS_ASCENSOR = ['Eléctrico', 'Hidráulico', 'Panorámico', 'Montacargas'];

export const ASCENSOR_VACIO = {
  codigo_interno: '',
  marca: '',
  modelo: '',
  numero_serie: '',
  tipo_ascensor: 'Eléctrico',
  capacidad_kg: '',
  capacidad_personas: '',
  numero_pisos: '',
  ubicacion_exacta: '',
};

const OBLIGATORIOS = {
  codigo_interno: 'el código',
  marca: 'la marca',
  modelo: 'el modelo',
  numero_serie: 'el número de serie',
  capacidad_kg: 'la capacidad (kg)',
  numero_pisos: 'el número de pisos',
};

// Devuelve el primer error del formulario o '' si está completo.
export function validarAscensor(form) {
  const falta = Object.keys(OBLIGATORIOS).find((k) => !String(form[k] ?? '').trim());
  if (falta) return `Escribe ${OBLIGATORIOS[falta]} del ascensor`;
  if (Number(form.capacidad_kg) <= 0) return 'La capacidad debe ser mayor que 0';
  if (!Number.isInteger(Number(form.numero_pisos)) || Number(form.numero_pisos) <= 0) return 'El número de pisos debe ser un entero mayor que 0';
  return '';
}

// Datos que espera POST /ascensores/: la dirección y la ciudad salen del edificio.
export function ascensorDesdeEdificio(form, sede, idCliente) {
  return {
    id_cliente: idCliente,
    id_sede: sede.id_sede,
    codigo_interno: form.codigo_interno.trim(),
    marca: form.marca.trim(),
    modelo: form.modelo.trim(),
    numero_serie: form.numero_serie.trim(),
    tipo_ascensor: form.tipo_ascensor,
    capacidad_kg: Number(form.capacidad_kg),
    capacidad_personas: form.capacidad_personas ? Number(form.capacidad_personas) : null,
    numero_pisos: Number(form.numero_pisos),
    ubicacion_exacta: form.ubicacion_exacta.trim() || sede.nombre,
    direccion_completa: sede.direccion || sede.nombre,
    ciudad: sede.ciudad || 'Sin ciudad',
    estado: 'Activo',
  };
}

// Formulario lleno con los datos de un ascensor existente (para editarlo)
export function formDesdeAscensor(a) {
  const texto = (v) => (v === null || v === undefined ? '' : String(v));
  return {
    codigo_interno: texto(a.codigo_interno),
    marca: texto(a.marca),
    modelo: texto(a.modelo),
    numero_serie: texto(a.numero_serie),
    tipo_ascensor: a.tipo_ascensor || 'Eléctrico',
    capacidad_kg: texto(a.capacidad_kg),
    capacidad_personas: texto(a.capacidad_personas),
    numero_pisos: texto(a.numero_pisos),
    ubicacion_exacta: texto(a.ubicacion_exacta),
  };
}

// Datos que espera PUT /ascensores/{id}: solo los campos del formulario
export function datosEdicionAscensor(form) {
  return {
    codigo_interno: form.codigo_interno.trim(),
    marca: form.marca.trim(),
    modelo: form.modelo.trim(),
    numero_serie: form.numero_serie.trim(),
    tipo_ascensor: form.tipo_ascensor,
    capacidad_kg: Number(form.capacidad_kg),
    capacidad_personas: form.capacidad_personas ? Number(form.capacidad_personas) : null,
    numero_pisos: Number(form.numero_pisos),
    ubicacion_exacta: form.ubicacion_exacta.trim(),
  };
}
