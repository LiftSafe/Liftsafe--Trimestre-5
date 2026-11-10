import path from 'node:path';
import { CliError, type CliOptions } from './types';

export const DEFAULT_DATA = path.join('data', 'elevators.json');
export const DEFAULT_OUTPUT = path.join('output', 'report.json');

// Lee --category, --data y --output (acepta "--category x" y "--category=x").
export function parseArgs(argv: string[], cwd: string = process.cwd()): CliOptions {
  const valores: Record<string, string> = {};
  const nombres = ['category', 'data', 'output'];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') continue; // separador que agrega "pnpm dev -- ..."
    if (!arg.startsWith('--')) throw new CliError(`Argumento no reconocido: "${arg}"`);
    const [nombre, enLinea] = arg.slice(2).split(/=(.*)/s, 2);
    if (!nombres.includes(nombre)) {
      throw new CliError(`Opción desconocida: --${nombre}. Opciones válidas: --category, --data, --output`);
    }
    const valor = enLinea ?? argv[++i];
    if (valor === undefined || valor.startsWith('--') || valor.trim() === '') {
      throw new CliError(`Falta el valor de --${nombre} (ej. --${nombre} ${nombre === 'category' ? 'Eléctrico' : 'ruta/archivo.json'})`);
    }
    valores[nombre] = valor.trim();
  }

  return {
    category: valores.category ?? null,
    dataPath: path.resolve(cwd, valores.data ?? DEFAULT_DATA),
    outputPath: path.resolve(cwd, valores.output ?? DEFAULT_OUTPUT),
  };
}
