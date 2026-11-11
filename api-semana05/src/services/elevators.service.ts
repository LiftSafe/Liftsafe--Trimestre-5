import { AppError } from '../errors/AppError';
import { logger } from '../config/logger';
import { elevatorsRepository } from '../repositories/elevators.repository';
import type { CreateElevatorDto, PaginationQuery, UpdateElevatorDto } from '../schemas/elevator.schema';
import type { Elevator, ElevatorWithBuilding, PaginatedResponse } from '../types';

// Lógica de negocio de los ascensores (sin nada de Express)
export const elevatorsService = {
  async list({ page, limit }: PaginationQuery): Promise<PaginatedResponse<Elevator>> {
    const [data, total] = await Promise.all([
      elevatorsRepository.findMany((page - 1) * limit, limit),
      elevatorsRepository.count(),
    ]);
    return { data, total, page, limit };
  },

  async getById(id: string): Promise<ElevatorWithBuilding> {
    const elevator = await elevatorsRepository.findById(id);
    if (!elevator) throw new AppError(404, 'Recurso no encontrado');
    return elevator;
  },

  async create(data: CreateElevatorDto): Promise<ElevatorWithBuilding> {
    const elevator = await elevatorsRepository.create(data); // 409 si el código ya existe (P2002)
    logger.info(`Ascensor creado: ${elevator.internalCode} en ${elevator.building.name}`);
    return elevator;
  },

  async update(id: string, data: UpdateElevatorDto): Promise<ElevatorWithBuilding> {
    const elevator = await elevatorsRepository.update(id, data); // 404 si no existe (P2025)
    logger.info(`Ascensor actualizado: ${elevator.internalCode}`);
    return elevator;
  },

  async remove(id: string): Promise<void> {
    const elevator = await elevatorsRepository.delete(id); // 404 si no existe (P2025)
    logger.info(`Ascensor eliminado: ${elevator.internalCode}`);
  },
};
