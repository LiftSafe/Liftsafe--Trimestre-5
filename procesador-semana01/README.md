# LiftSafe — Procesador de datos (Semana 1)

Herramienta de línea de comandos en **Node.js + TypeScript (estricto) + async/await** que lee el catálogo de ascensores desde un archivo JSON, lo filtra por categoría, muestra un resumen y guarda un reporte en `output/report.json`.

## Dominio: inspección de ascensores (LiftSafe)

LiftSafe gestiona las inspecciones técnicas de ascensores según la NTC 5926-1. El recurso principal es el **ascensor** (`Elevator`), que reemplaza al `Item` del starter:

| Starter (`Item`) | LiftSafe (`Elevator`) | Descripción |
|---|---|---|
| `items.json` | `data/elevators.json` | Catálogo de 12 ascensores |
| `name` | `internalCode`, `brand`, `model` | Código interno (ej. `ASC-001`), marca y modelo |
| `category` | `category` | Tipo de equipo: Eléctrico, Hidráulico, Montacargas, Panorámico, Salvaescaleras |
| `price` | `inspectionCost` | Costo de la inspección técnica, en pesos colombianos (COP) |
| `active` | `active` | `true` si el ascensor está en servicio |
| — | `building`, `city`, `floors`, `capacityKg` | Edificio, ciudad, pisos que recorre y capacidad en kg |

## Cómo correrlo

```bash
cd procesador-semana01
pnpm install
pnpm dev                                   # todas las categorías
pnpm dev -- --category Eléctrico           # filtra por categoría
pnpm dev -- --category montacargas         # no importan mayúsculas ni tildes
pnpm build && pnpm start -- --category Panorámico   # versión compilada (dist/)
pnpm test                                  # 9 pruebas con Vitest
```

Opciones:

| Opción | Para qué | Por defecto |
|---|---|---|
| `--category <tipo>` | Filtra por categoría (también `--category=<tipo>`) | sin filtro |
| `--data <ruta>` | Archivo JSON a leer | `data/elevators.json` |
| `--output <ruta>` | Dónde guardar el reporte | `output/report.json` |

## Qué hace (requisitos)

1. **Lee el JSON** con `fs/promises.readFile` y valida que cada registro tenga los campos y tipos correctos.
2. **Resumen del catálogo**: total, activos vs. inactivos, costo promedio de inspección, ascensor más costoso y más económico (y cantidad por categoría).
3. **Filtro por categoría** con `--category`.
4. **Reporte** en `output/report.json` con `fs/promises.writeFile` (crea la carpeta si no existe).
5. **Manejo de errores**:
   - Si el archivo de datos no existe → mensaje descriptivo y `process.exit(1)`.
   - Si la categoría no existe → aviso con la lista de categorías disponibles (código de salida 1, no se sobrescribe el reporte).
   - JSON mal formado, registros con campos inválidos, opciones desconocidas o `--category` sin valor → mensaje claro y código 1.

## Estructura

```
procesador-semana01/
├── data/elevators.json      # 12 ascensores
├── output/report.json       # reporte generado (sin filtro)
├── docs/ejecuciones.md      # logs con distintos argumentos
├── src/
│   ├── index.ts             # CLI: une todo y muestra el resumen
│   ├── args.ts              # lee --category, --data, --output
│   ├── data.ts              # lectura y validación del JSON (fs/promises)
│   ├── report.ts            # filtro, resumen, conteo y escritura del reporte
│   └── types.ts             # Elevator, Summary, Report, CliError
└── tests/procesador.test.ts # pruebas (Vitest)
```

## Ejemplo de salida

```text
✔ Se leyeron 12 ascensores de data/elevators.json

📋 Catálogo de ascensores — categoría "Eléctrico"
──────────────────────────────────────────────
  Total de ascensores:      4
  En servicio (activos):    4
  Fuera de servicio:        0
  Costo promedio inspección: $ 1.125.000
  Más costoso:  ASC-005 (Hyundai LUXEN) — $ 1.580.000
  Más económico: ASC-001 (Otis Gen2) — $ 850.000

💾 Reporte guardado en output/report.json
```

Más ejecuciones (filtros, categoría inexistente, archivo inexistente) en [`docs/ejecuciones.md`](docs/ejecuciones.md).
