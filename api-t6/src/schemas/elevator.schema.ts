import { z } from 'zod';

export const ELEVATOR_TYPES = ['ELECTRICO', 'HIDRAULICO', 'PANORAMICO', 'MONTACARGAS'] as const;
export const ELEVATOR_STATUSES = ['ACTIVO', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO'] as const;

// Schema de creación de un ascensor (recurso principal)
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
  stops: z
    .number({ invalid_type_error: 'El número de paradas debe ser un número' })
    .int('El número de paradas debe ser entero')
    .min(2, 'Un ascensor tiene al menos 2 paradas')
    .max(200),
  status: z.enum(ELEVATOR_STATUSES).default('ACTIVO'),
  installedAt: z.coerce.date({ invalid_type_error: 'La fecha de instalación no es válida' }).optional(),
  buildingId: z.string().uuid('buildingId debe ser un UUID'),
});

// Actualización: los mismos campos, todos opcionales
export const updateElevatorSchema = createElevatorSchema.partial();

// :id de la URL (las llaves son UUID)
export const idParamSchema = z.object({ id: z.string().uuid('El id debe ser un UUID válido') });

// ?page=1&limit=10
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateElevatorDto = z.infer<typeof createElevatorSchema>;
export type UpdateElevatorDto = z.infer<typeof updateElevatorSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
