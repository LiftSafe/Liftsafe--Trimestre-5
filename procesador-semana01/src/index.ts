import path from 'node:path';
import { parseArgs } from './args';
import { loadElevators } from './data';
import { buildReport, categories, filterByCategory, saveReport } from './report';
import { CliError, type Summary } from './types';

const cop = (valor: number): string =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);

function printSummary(s: Summary, titulo: string): void {
  console.log(`\n📋 ${titulo}`);
  console.log('─'.repeat(46));
  console.log(`  Total de ascensores:      ${s.total}`);
  console.log(`  En servicio (activos):    ${s.active}`);
  console.log(`  Fuera de servicio:        ${s.inactive}`);
  console.log(`  Costo promedio inspección: ${cop(s.averageInspectionCost)}`);
  if (s.mostExpensive) {
    console.log(`  Más costoso:  ${s.mostExpensive.internalCode} (${s.mostExpensive.brand} ${s.mostExpensive.model}) — ${cop(s.mostExpensive.inspectionCost)}`);
  }
  if (s.cheapest) {
    console.log(`  Más económico: ${s.cheapest.internalCode} (${s.cheapest.brand} ${s.cheapest.model}) — ${cop(s.cheapest.inspectionCost)}`);
  }
}

async function main(): Promise<void> {
  const opciones = parseArgs(process.argv.slice(2));
  const todos = await loadElevators(opciones.dataPath);
  console.log(`✔ Se leyeron ${todos.length} ascensores de ${path.relative(process.cwd(), opciones.dataPath)}`);

  let seleccion = todos;
  if (opciones.category) {
    seleccion = filterByCategory(todos, opciones.category);
    if (seleccion.length === 0) {
      console.warn(`\n⚠ La categoría "${opciones.category}" no existe.`);
      console.warn(`  Categorías disponibles: ${categories(todos).join(', ')}`);
      console.warn('  Ejemplo: pnpm dev -- --category Eléctrico');
      process.exitCode = 1;
      return;
    }
  }

  const reporte = buildReport(seleccion, path.relative(process.cwd(), opciones.dataPath), opciones.category);
  printSummary(reporte.summary, opciones.category ? `Catálogo de ascensores — categoría "${seleccion[0].category}"` : 'Catálogo de ascensores — todas las categorías');
  console.log('\n  Por categoría:');
  for (const [cat, n] of Object.entries(reporte.byCategory)) console.log(`    • ${cat}: ${n}`);

  await saveReport(reporte, opciones.outputPath);
  console.log(`\n💾 Reporte guardado en ${path.relative(process.cwd(), opciones.outputPath)}`);
}

main().catch((err: unknown) => {
  if (err instanceof CliError) console.error(`\n✖ Error: ${err.message}`);
  else console.error('\n✖ Error inesperado:', err);
  process.exit(1);
});
