// El correo nunca lleva espacios: se quitan mientras la persona escribe o pega.
export const sinEspacios = (valor) => String(valor ?? '').replace(/\s+/g, '');
