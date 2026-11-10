// Recurso principal del dominio LiftSafe: un ascensor del catálogo.
export interface Elevator {
  id: number;
  internalCode: string; // código interno (ej. ASC-001)
  brand: string;
  model: string;
  category: string; // tipo de equipo: Eléctrico, Hidráulico, Montacargas...
  building: string;
  city: string;
  floors: number;
  capacityKg: number;
  inspectionCost: number; // costo de la inspección técnica, en COP
  active: boolean; // true = en servicio
}

export interface ElevatorRef {
  internalCode: string;
  brand: string;
  model: string;
  category: string;
  inspectionCost: number;
}

export interface Summary {
  total: number;
  active: number;
  inactive: number;
  averageInspectionCost: number;
  mostExpensive: ElevatorRef | null;
  cheapest: ElevatorRef | null;
}

export interface Report {
  generatedAt: string;
  source: string;
  filter: { category: string | null };
  summary: Summary;
  byCategory: Record<string, number>;
  elevators: Elevator[];
}

export interface CliOptions {
  category: string | null;
  dataPath: string;
  outputPath: string;
}

// Error con mensaje para el usuario: se muestra y el proceso termina con código 1.
export class CliError extends Error {}
