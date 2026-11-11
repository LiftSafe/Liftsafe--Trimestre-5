import type { ELEVATOR_STATUSES, ELEVATOR_TYPES } from './schemas/elevator.schema';

// Entidad principal del dominio: un ascensor
export interface Elevator {
  id: number;
  internalCode: string;
  brand: string;
  model: string;
  type: (typeof ELEVATOR_TYPES)[number];
  capacityKg: number;
  floors: number;
  status: (typeof ELEVATOR_STATUSES)[number];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiResponse<T> {
  data: T;
}
