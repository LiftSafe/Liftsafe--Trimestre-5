// El correo nunca lleva espacios: se quitan mientras la persona escribe o pega.
// Ojo: los campos usan type="text" con inputMode="email". Con type="email" el navegador
// entrega el valor ya recortado pero sigue mostrando los espacios en pantalla.
export const sinEspacios = (valor) => String(valor ?? '').replace(/\s+/g, '');
