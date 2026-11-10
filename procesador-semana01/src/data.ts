import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CliError, type Elevator } from './types';

const esTexto = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const esNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

// Comprueba que cada registro tenga los campos y tipos de Elevator.
export function validateElevators(data: unknown): Elevator[] {
  if (!Array.isArray(data)) throw new CliError('El archivo de datos debe contener un arreglo de ascensores.');
  return data.map((e: unknown, i) => {
    const r = e as Record<string, unknown>;
    const errores: string[] = [];
    if (typeof e !== 'object' || e === null) errores.push('no es un objeto');
    else {
      if (!esNumero(r.id)) errores.push('id');
      for (const campo of ['internalCode', 'brand', 'model', 'category', 'building', 'city']) {
        if (!esTexto(r[campo])) errores.push(campo);
      }
      for (const campo of ['floors', 'capacityKg', 'inspectionCost']) {
        if (!esNumero(r[campo]) || (r[campo] as number) < 0) errores.push(campo);
      }
      if (typeof r.active !== 'boolean') errores.push('active');
    }
    if (errores.length) throw new CliError(`Registro #${i + 1} inválido (campos: ${errores.join(', ')}).`);
    return r as unknown as Elevator;
  });
}

// Lee y parsea el JSON con fs/promises.
export async function loadElevators(filePath: string): Promise<Elevator[]> {
  const nombre = path.relative(process.cwd(), filePath) || filePath;
  let texto: string;
  try {
    texto = await readFile(filePath, 'utf-8');
  } catch (err) {
    const codigo = (err as NodeJS.ErrnoException).code;
    if (codigo === 'ENOENT') throw new CliError(`No se encontró el archivo de datos: ${nombre}. Revisa que exista o indica otro con --data <ruta>.`);
    throw new CliError(`No se pudo leer ${nombre}: ${(err as Error).message}`);
  }
  let data: unknown;
  try {
    data = JSON.parse(texto);
  } catch (err) {
    throw new CliError(`El archivo ${nombre} no es un JSON válido: ${(err as Error).message}`);
  }
  return validateElevators(data);
}
