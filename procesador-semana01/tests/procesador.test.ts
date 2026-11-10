import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseArgs } from '../src/args';
import { loadElevators } from '../src/data';
import { buildReport, categories, filterByCategory, saveReport, summarize } from '../src/report';
import { CliError } from '../src/types';

const DATA = path.join(__dirname, '..', 'data', 'elevators.json');

describe('lectura de datos', () => {
  it('lee los 12 ascensores del JSON', async () => {
    expect(await loadElevators(DATA)).toHaveLength(12);
  });

  it('da un error descriptivo si el archivo no existe', async () => {
    await expect(loadElevators('/no/existe.json')).rejects.toThrow(/No se encontró el archivo de datos/);
  });

  it('rechaza un JSON mal formado o con campos inválidos', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'ls-'));
    await writeFile(path.join(dir, 'malo.json'), '{ esto no es json');
    await expect(loadElevators(path.join(dir, 'malo.json'))).rejects.toThrow(/no es un JSON válido/);
    await writeFile(path.join(dir, 'campos.json'), JSON.stringify([{ id: 1, internalCode: 'X' }]));
    await expect(loadElevators(path.join(dir, 'campos.json'))).rejects.toThrow(CliError);
  });
});

describe('resumen y filtro', () => {
  it('calcula total, activos, promedio y extremos', async () => {
    const s = summarize(await loadElevators(DATA));
    expect(s).toMatchObject({ total: 12, active: 9, inactive: 3, averageInspectionCost: 977916.67 });
    expect(s.mostExpensive?.internalCode).toBe('ASC-005');
    expect(s.cheapest?.internalCode).toBe('SIL-002');
  });

  it('filtra sin importar mayúsculas ni tildes', async () => {
    const todos = await loadElevators(DATA);
    expect(filterByCategory(todos, 'electrico')).toHaveLength(4);
    expect(filterByCategory(todos, 'MONTACARGAS')).toHaveLength(2);
    expect(filterByCategory(todos, 'escaleras')).toHaveLength(0);
    expect(categories(todos)).toEqual(['Eléctrico', 'Hidráulico', 'Montacargas', 'Panorámico', 'Salvaescaleras']);
  });

  it('una lista vacía no rompe el resumen', () => {
    expect(summarize([])).toMatchObject({ total: 0, averageInspectionCost: 0, mostExpensive: null });
  });
});

describe('argumentos y reporte', () => {
  it('acepta --category con espacio, con = y el separador --', () => {
    expect(parseArgs(['--', '--category', 'Hidráulico']).category).toBe('Hidráulico');
    expect(parseArgs(['--category=Panorámico']).category).toBe('Panorámico');
    expect(parseArgs([]).category).toBeNull();
  });

  it('avisa si falta el valor o la opción no existe', () => {
    expect(() => parseArgs(['--category'])).toThrow(/Falta el valor/);
    expect(() => parseArgs(['--color', 'rojo'])).toThrow(/Opción desconocida/);
  });

  it('escribe output/report.json', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'ls-'));
    const salida = path.join(dir, 'output', 'report.json');
    const todos = await loadElevators(DATA);
    await saveReport(buildReport(filterByCategory(todos, 'Eléctrico'), 'data/elevators.json', 'Eléctrico'), salida);
    const reporte = JSON.parse(await readFile(salida, 'utf-8'));
    expect(reporte.filter.category).toBe('Eléctrico');
    expect(reporte.summary.total).toBe(4);
    expect(reporte.elevators).toHaveLength(4);
  });
});
