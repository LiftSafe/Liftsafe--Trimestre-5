import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Elevator, ElevatorRef, Report, Summary } from './types';

// Compara sin mayúsculas ni tildes: "electrico" encuentra "Eléctrico".
export const normalize = (texto: string): string =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

export function categories(elevators: Elevator[]): string[] {
  return [...new Set(elevators.map((e) => e.category))].sort((a, b) => a.localeCompare(b, 'es'));
}

export function filterByCategory(elevators: Elevator[], category: string): Elevator[] {
  const buscada = normalize(category);
  return elevators.filter((e) => normalize(e.category) === buscada);
}

const ref = (e: Elevator): ElevatorRef => ({
  internalCode: e.internalCode, brand: e.brand, model: e.model, category: e.category, inspectionCost: e.inspectionCost,
});

export function summarize(elevators: Elevator[]): Summary {
  const active = elevators.filter((e) => e.active).length;
  if (elevators.length === 0) {
    return { total: 0, active: 0, inactive: 0, averageInspectionCost: 0, mostExpensive: null, cheapest: null };
  }
  const total = elevators.reduce((suma, e) => suma + e.inspectionCost, 0);
  const mostExpensive = elevators.reduce((a, b) => (b.inspectionCost > a.inspectionCost ? b : a));
  const cheapest = elevators.reduce((a, b) => (b.inspectionCost < a.inspectionCost ? b : a));
  return {
    total: elevators.length,
    active,
    inactive: elevators.length - active,
    averageInspectionCost: Math.round((total / elevators.length) * 100) / 100,
    mostExpensive: ref(mostExpensive),
    cheapest: ref(cheapest),
  };
}

export function countByCategory(elevators: Elevator[]): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const c of categories(elevators)) conteo[c] = elevators.filter((e) => e.category === c).length;
  return conteo;
}

export function buildReport(elevators: Elevator[], source: string, category: string | null, now = new Date()): Report {
  return {
    generatedAt: now.toISOString(),
    source,
    filter: { category },
    summary: summarize(elevators),
    byCategory: countByCategory(elevators),
    elevators,
  };
}

// Guarda el reporte con fs/promises (crea la carpeta output/ si no existe).
export async function saveReport(report: Report, outputPath: string): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf-8');
}
