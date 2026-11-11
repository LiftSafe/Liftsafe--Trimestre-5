import { prisma } from '../lib/prisma';
import { traducirErrorPrisma } from '../errors/prismaErrors';
import type { CreateElevatorDto, UpdateElevatorDto } from '../schemas/elevator.schema';
import type { Elevator, ElevatorWithBuilding } from '../types';

// Única capa que habla con la base de datos (Prisma). Los errores de Prisma
// se traducen a AppError (P2025 → 404, P2002 → 409, P2003 → 400).
async function conErrores<T>(operacion: () => Promise<T>): Promise<T> {
  try {
    return await operacion();
  } catch (err) {
    throw traducirErrorPrisma(err);
  }
}

export const elevatorsRepository = {
  findMany(skip: number, take: number): Promise<Elevator[]> {
    return prisma.elevator.findMany({ skip, take, orderBy: { internalCode: 'asc' } });
  },

  count(): Promise<number> {
    return prisma.elevator.count();
  },

  // Detalle con su relación (el edificio)
  findById(id: string): Promise<ElevatorWithBuilding | null> {
    return prisma.elevator.findUnique({ where: { id }, include: { building: true } });
  },

  create(data: CreateElevatorDto): Promise<ElevatorWithBuilding> {
    return conErrores(() => prisma.elevator.create({ data, include: { building: true } }));
  },

  update(id: string, data: UpdateElevatorDto): Promise<ElevatorWithBuilding> {
    return conErrores(() => prisma.elevator.update({ where: { id }, data, include: { building: true } }));
  },

  delete(id: string): Promise<Elevator> {
    return conErrores(() => prisma.elevator.delete({ where: { id } }));
  },
};
