import { Prisma } from '@prisma/client';
import { AppError } from './AppError';

// Traduce los errores conocidos de Prisma a errores de la aplicación (AppError).
// Cualquier otro error sigue igual y el errorHandler lo responde como 500.
export function traducirErrorPrisma(err: unknown): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2025': // el registro a actualizar/eliminar no existe
        return new AppError(404, 'Recurso no encontrado');
      case 'P2002': { // valor repetido en un campo @unique
        const campos = (err.meta?.target as string[] | undefined)?.join(', ');
        return new AppError(409, `Ya existe un registro con ese valor${campos ? ` (${campos})` : ''}`);
      }
      case 'P2003': // la llave foránea apunta a algo que no existe (buildingId)
        return new AppError(400, 'El edificio indicado no existe');
      default:
        return err;
    }
  }
  return err;
}
