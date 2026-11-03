import { z } from 'zod';

export const ELEVATOR_TYPES = ['Eléctrico', 'Hidráulico', 'Panorámico', 'Montacargas'] as const;
export const ELEVATOR_STATUSES = ['Activo', 'En mantenimiento', 'Fuera de servicio'] as const;

// Schema de creación de un ascensor (dominio LiftSafe)
export const createElevatorSchema = z.object({
  internalCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^ASC-\d{3,}$/, 'El código interno debe tener el formato ASC-001'),
  brand: z.string().trim().min(1, 'La marca es obligatoria').max(80),
  model: z.string().trim().min(1, 'El modelo es obligatorio').max(80),
  type: z.enum(ELEVATOR_TYPES, {
    errorMap: () => ({ message: `El tipo debe ser uno de: ${ELEVATOR_TYPES.join(', ')}` }),
  }),
  capacityKg: z
    .number({ invalid_type_error: 'La capacidad debe ser un número' })
    .int('La capacidad debe ser un número entero')
    .positive('La capacidad debe ser mayor a 0')
    .max(10000, 'La capacidad no puede superar 10.000 kg'),
  floors: z
    .number({ invalid_type_error: 'El número de pisos debe ser un número' })
    .int('El número de pisos debe ser entero')
    .min(2, 'Un ascensor sirve al menos 2 pisos')
    .max(200),
  status: z.enum(ELEVATOR_STATUSES).default('Activo'),
});

// Schema de actualización: los mismos campos, todos opcionales
export const updateElevatorSchema = createElevatorSchema.partial();

// Parámetro :id de la URL
export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'El id debe ser un número' })
    .int('El id debe ser un número entero')
    .positive('El id debe ser un entero positivo'),
});

// Paginación del listado (?page=1&limit=10)
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Tipos inferidos de los schemas
export type CreateElevatorDto = z.infer<typeof createElevatorSchema>;
export type UpdateElevatorDto = z.infer<typeof updateElevatorSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
