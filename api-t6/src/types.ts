import type { Building, Elevator, Role } from '@prisma/client';

export type { Building, Elevator, Role };
export type ElevatorWithBuilding = Elevator & { building: Building };

// Contrato del listado paginado
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Usuario autenticado que viaja en req.user
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
