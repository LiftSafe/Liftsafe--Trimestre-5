import type { Building, Elevator } from '@prisma/client';

export type { Building, Elevator };
export type ElevatorWithBuilding = Elevator & { building: Building };

// Contrato del listado paginado
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
