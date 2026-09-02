export const MENU_ITEMS = [
  { key: 'dashboard', text: 'Inicio', path: '/dashboard' },
  { key: 'inspecciones', text: 'Inspecciones', path: '/dashboard/inspecciones' },
<<<<<<< HEAD
=======
  { key: 'solicitudes', text: 'Solicitudes', path: '/dashboard/solicitudes' },
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
  { key: 'ascensores', text: 'Ascensores', path: '/dashboard/ascensores' },
  { key: 'edificios', text: 'Edificios', path: '/dashboard/edificios' },
  { key: 'reportes', text: 'Reportes', path: '/dashboard/reportes' },
  { key: 'usuarios', text: 'Usuarios', path: '/dashboard/usuarios' },
  { key: 'configuracion', text: 'Mi cuenta', path: '/dashboard/configuracion' },
];

export const ROLE_PERMISSIONS = {
<<<<<<< HEAD
  Administrador: ['dashboard', 'inspecciones', 'ascensores', 'edificios', 'reportes', 'usuarios', 'configuracion'],
  Asesor: ['dashboard', 'reportes', 'configuracion'],
  Coordinador: ['dashboard', 'inspecciones', 'ascensores', 'edificios', 'reportes', 'configuracion'],
  'Director Técnico': ['dashboard', 'inspecciones', 'reportes', 'configuracion'],
  Inspector: ['dashboard', 'inspecciones', 'ascensores', 'edificios', 'reportes', 'configuracion'],
  Cliente: ['dashboard', 'reportes', 'configuracion'],
=======
  Administrador: ['dashboard', 'inspecciones', 'solicitudes', 'ascensores', 'edificios', 'reportes', 'usuarios', 'configuracion'],
  Asesor: ['dashboard', 'solicitudes', 'reportes', 'configuracion'],
  Coordinador: ['dashboard', 'inspecciones', 'solicitudes', 'ascensores', 'edificios', 'reportes', 'configuracion'],
  'Director Técnico': ['dashboard', 'inspecciones', 'solicitudes', 'reportes', 'configuracion'],
  Inspector: ['dashboard', 'inspecciones', 'solicitudes', 'ascensores', 'edificios', 'reportes', 'configuracion'],
  Cliente: ['dashboard', 'solicitudes', 'reportes', 'configuracion'],  // <--- AGREGADO 'solicitudes'
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
};

// Acciones específicas (opcional, pero la dejas)
export const ROLE_ACTIONS = {
  createInspection: ['Administrador', 'Inspector'],
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