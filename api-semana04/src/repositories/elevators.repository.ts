import type { Elevator } from '../types';
import type { CreateElevatorDto, UpdateElevatorDto } from '../schemas/elevator.schema';

// Almacenamiento en memoria (CRUD). Solo guarda y lee datos: sin reglas de negocio.
const ahora = () => new Date().toISOString();

const semilla = (): Elevator[] => [
  { id: 1, internalCode: 'ASC-001', brand: 'Otis', model: 'Gen2', type: 'Eléctrico', capacityKg: 630, floors: 10, status: 'Activo', createdAt: ahora(), updatedAt: ahora() },
  { id: 2, internalCode: 'ASC-002', brand: 'Schindler', model: '3300', type: 'Eléctrico', capacityKg: 800, floors: 15, status: 'Activo', createdAt: ahora(), updatedAt: ahora() },
  { id: 3, internalCode: 'ASC-003', brand: 'ThyssenKrupp', model: 'Synergy', type: 'Hidráulico', capacityKg: 450, floors: 4, status: 'En mantenimiento', createdAt: ahora(), updatedAt: ahora() },
];

let elevators: Elevator[] = semilla();
let siguienteId = elevators.length + 1;

export const elevatorsRepository = {
  findAll(offset: number, limit: number): Elevator[] {
    return elevators.slice(offset, offset + limit);
  },

  count(): number {
    return elevators.length;
  },

  findById(id: number): Elevator | undefined {
    return elevators.find((e) => e.id === id);
  },

  findByInternalCode(internalCode: string): Elevator | undefined {
    return elevators.find((e) => e.internalCode === internalCode);
  },

  create(data: CreateElevatorDto): Elevator {
    const elevator: Elevator = { id: siguienteId++, ...data, createdAt: ahora(), updatedAt: ahora() };
    elevators.push(elevator);
    return elevator;
  },

  update(id: number, data: UpdateElevatorDto): Elevator | undefined {
    const actual = this.findById(id);
    if (!actual) return undefined;
    Object.assign(actual, data, { updatedAt: ahora() });
    return actual;
  },

  delete(id: number): boolean {
    const antes = elevators.length;
    elevators = elevators.filter((e) => e.id !== id);
    return elevators.length < antes;
  },

  // Solo para las pruebas automáticas: vuelve a los datos iniciales
  reset(): void {
    elevators = semilla();
    siguienteId = elevators.length + 1;
  },
};
