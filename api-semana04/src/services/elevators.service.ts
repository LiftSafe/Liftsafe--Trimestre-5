import { AppError } from '../errors/AppError';
import { logger } from '../config/logger';
import { elevatorsRepository } from '../repositories/elevators.repository';
import type { CreateElevatorDto, PaginationQuery, UpdateElevatorDto } from '../schemas/elevator.schema';
import type { Elevator, PaginatedResponse } from '../types';

// Lógica de negocio de los ascensores. Lanza AppError cuando algo no se puede hacer.
export const elevatorsService = {
  list({ page, limit }: PaginationQuery): PaginatedResponse<Elevator> {
    const total = elevatorsRepository.count();
    const data = elevatorsRepository.findAll((page - 1) * limit, limit);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  getById(id: number): Elevator {
    const elevator = elevatorsRepository.findById(id);
    if (!elevator) throw new AppError(404, `No existe un ascensor con id ${id}`);
    return elevator;
  },

  create(data: CreateElevatorDto): Elevator {
    // Regla de negocio: el código interno no se puede repetir
    if (elevatorsRepository.findByInternalCode(data.internalCode)) {
      throw new AppError(409, `El código interno ${data.internalCode} ya está registrado`);
    }
    const elevator = elevatorsRepository.create(data);
    logger.info(`Ascensor creado: ${elevator.internalCode} (id ${elevator.id})`);
    return elevator;
  },

  update(id: number, data: UpdateElevatorDto): Elevator {
    this.getById(id); // 404 si no existe
    if (data.internalCode) {
      const otro = elevatorsRepository.findByInternalCode(data.internalCode);
      if (otro && otro.id !== id) {
        throw new AppError(409, `El código interno ${data.internalCode} ya está registrado`);
      }
    }
    const actualizado = elevatorsRepository.update(id, data) as Elevator;
    logger.info(`Ascensor actualizado: id ${id}`);
    return actualizado;
  },

  remove(id: number): void {
    const elevator = this.getById(id); // 404 si no existe
    // Regla de negocio: no se elimina un ascensor que está en servicio
    if (elevator.status === 'Activo') {
      throw new AppError(409, 'No se puede eliminar un ascensor activo; ponlo fuera de servicio primero');
    }
    elevatorsRepository.delete(id);
    logger.info(`Ascensor eliminado: id ${id}`);
  },
};
