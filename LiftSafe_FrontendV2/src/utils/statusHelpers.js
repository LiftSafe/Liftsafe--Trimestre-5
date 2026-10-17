// Estado de la inspección cuando el inspector ya terminó y falta la firma del cliente
export const ESTADO_PENDIENTE_FIRMA = 'Pendiente firma cliente';

// ✅ Colores de estado centralizados (sin datos de demo)
export const statusColor = {
  // Inspecciones
  Aprobada: 'success',
  Pendiente: 'warning',
  Observaciones: 'error',
  'En Proceso': 'warning',
  Programada: 'info',
  Borrador: 'default',
  Finalizada: 'success',
  'Pendiente firma cliente': 'warning',
  
  // Ascensores
  Operativo: 'success',
  'En inspección': 'warning',
  'Con observaciones': 'error',
  Activo: 'success',
  Inactivo: 'error',
  
  // Usuarios
  Activo: 'success',
  Inactivo: 'error',
  Suspendido: 'warning',
  
  // Informes
  Aprobado: 'success',
  'Pendiente Revisión': 'warning',
  'Aprobado con observaciones': 'warning',
  
  // Default
  default: 'default',
};

// ✅ Mapeo de estados para mostrar al usuario
export const statusLabels = {
  Aprobada: 'Aprobada',
  Pendiente: 'Pendiente',
  Observaciones: 'Con observaciones',
  'En Proceso': 'En proceso',
  Programada: 'Programada',
  Borrador: 'Borrador',
  Finalizada: 'Finalizada',
  'Pendiente firma cliente': 'Pendiente firma cliente',
  Operativo: 'Operativo',
  Activo: 'Activo',
  Inactivo: 'Inactivo',
};