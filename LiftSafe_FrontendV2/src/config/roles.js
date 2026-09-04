export const MENU_ITEMS = [
  { key: 'dashboard', text: 'Inicio', path: '/dashboard' },
  { key: 'inspecciones', text: 'Inspecciones', path: '/dashboard/inspecciones' },
  { key: 'solicitudes', text: 'Solicitudes', path: '/dashboard/solicitudes' },
  { key: 'ascensores', text: 'Ascensores', path: '/dashboard/ascensores' },
  { key: 'edificios', text: 'Edificios', path: '/dashboard/edificios' },
  { key: 'reportes', text: 'Reportes', path: '/dashboard/reportes' },
  { key: 'usuarios', text: 'Usuarios', path: '/dashboard/usuarios' },
  { key: 'auditoria', text: 'Auditoría', path: '/dashboard/auditoria' },
  { key: 'configuracion', text: 'Mi cuenta', path: '/dashboard/configuracion' },
];

export const ROLE_PERMISSIONS = {
  // La Auditoría queda restringida a Administrador y Director Técnico:
  // antes la página existía en el código pero no tenía ruta ni entrada
  // de menú, así que nadie podía llegar a ella.
  Administrador: ['dashboard', 'inspecciones', 'solicitudes', 'ascensores', 'edificios', 'reportes', 'usuarios', 'auditoria', 'configuracion'],
  Asesor: ['dashboard', 'solicitudes', 'reportes', 'configuracion'],
  Coordinador: ['dashboard', 'inspecciones', 'solicitudes', 'ascensores', 'edificios', 'reportes', 'configuracion'],
  // ✅ FIX: la documentación del rol dice "Ve inspecciones, ascensores,
  // edificios e informes de todo el sistema en modo supervisión", pero
  // 'ascensores' y 'edificios' no estaban en su lista -> ni el menú ni las
  // rutas dejaban llegar a esas pantallas, aunque el backend ya lo
  // autorizaba (ver listado_ascensores/edificios en ascensores.py).
  // ✅ FIX: se había agregado 'auditoria' pensando que Admin y Director
  // Técnico debían compartir esa pantalla, pero tanto Auditoria.jsx
  // (user?.role !== 'Administrador') como el backend (auditoria.py, "solo
  // Administrador") la restringen exclusivamente a Administrador -> Director
  // Técnico veía el ítem en el menú pero siempre chocaba con "No tienes
  // permisos para ver esta página". Se quita del menú para que coincida con
  // el permiso real.
  'Director Técnico': ['dashboard', 'inspecciones', 'solicitudes', 'ascensores', 'edificios', 'reportes', 'configuracion'],
  Inspector: ['dashboard', 'inspecciones', 'solicitudes', 'ascensores', 'edificios', 'reportes', 'configuracion'],
  // ✅ FIX: le faltaba 'inspecciones' -> el Cliente no podía ni siquiera
  // navegar a /dashboard/inspecciones (RoleRoute lo redirigía a /dashboard),
  // así que nunca llegaba a la pantalla donde Inspections.jsx ya tiene
  // implementada su firma (firmarComoCliente). El backend (inspecciones.py)
  // ya filtra correctamente qué inspecciones puede ver un Cliente (solo las
  // de sus propios ascensores), así que este era puramente un bloqueo del
  // lado del frontend.
  Cliente: ['dashboard', 'inspecciones', 'solicitudes', 'reportes', 'configuracion'],
};

// Acciones específicas (opcional, pero la dejas)
export const ROLE_ACTIONS = {
  // ✅ FIX: le faltaba 'Coordinador', que el backend (inspecciones.py) sí
  // autoriza a crear inspecciones. Como esta lista no se usaba en ningún
  // lado, el botón "Nueva inspección" se mostraba con una regla totalmente
  // distinta (userRol !== 'Cliente'), más permisiva que el backend -> los
  // roles Asesor y Director Técnico veían el botón pero siempre recibían
  // "No autorizado para crear inspecciones" al confirmar.
  createInspection: ['Administrador', 'Coordinador', 'Inspector'],
  createElevator: ['Administrador'],
  createBuilding: ['Administrador'],
  createUser: ['Administrador'],
  viewAllInspections: ['Administrador'],
  viewAllReports: ['Administrador', 'Inspector'],
  manageNotifications: ['Administrador', 'Coordinador', 'Director Técnico', 'Inspector', 'Asesor'],
};

export function getPermissions(role) {
  return ROLE_PERMISSIONS[role] || ['dashboard', 'configuracion'];
}

export function canAccess(role, key) {
  return getPermissions(role).includes(key);
}

export function canDo(role, action) {
  return (ROLE_ACTIONS[action] || []).includes(role);
}

export function getMenuForRole(role) {
  return MENU_ITEMS.filter((item) => getPermissions(role).includes(item.key));
}