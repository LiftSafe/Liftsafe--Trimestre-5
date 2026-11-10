# Ejecuciones del procesador (logs)

Salida real de la herramienta con distintos argumentos (Node.js 22, pnpm 9). La última ejecución (`pnpm dev`, sin filtro) es la que dejó el `output/report.json` entregado.

```text
$ pnpm dev -- --category electrico

✔ Se leyeron 12 ascensores de data/elevators.json

📋 Catálogo de ascensores — categoría "Eléctrico"
──────────────────────────────────────────────
  Total de ascensores:      4
  En servicio (activos):    4
  Fuera de servicio:        0
  Costo promedio inspección: $ 1.125.000
  Más costoso:  ASC-005 (Hyundai LUXEN) — $ 1.580.000
  Más económico: ASC-001 (Otis Gen2) — $ 850.000

  Por categoría:
    • Eléctrico: 4

💾 Reporte guardado en output/report.json
(código de salida: 0)

$ pnpm start -- --category Panorámico

✔ Se leyeron 12 ascensores de data/elevators.json

📋 Catálogo de ascensores — categoría "Panorámico"
──────────────────────────────────────────────
  Total de ascensores:      2
  En servicio (activos):    2
  Fuera de servicio:        0
  Costo promedio inspección: $ 1.420.000
  Más costoso:  PAN-001 (Schindler 7000 Panorama) — $ 1.450.000
  Más económico: PAN-002 (Kone Panorama 3000) — $ 1.390.000

  Por categoría:
    • Panorámico: 2

💾 Reporte guardado en output/report.json
(código de salida: 0)

$ pnpm dev -- --category Escaleras

✔ Se leyeron 12 ascensores de data/elevators.json

⚠ La categoría "Escaleras" no existe.
  Categorías disponibles: Eléctrico, Hidráulico, Montacargas, Panorámico, Salvaescaleras
  Ejemplo: pnpm dev -- --category Eléctrico
(código de salida: 1)

$ pnpm dev -- --data data/no-existe.json

✖ Error: No se encontró el archivo de datos: data/no-existe.json. Revisa que exista o indica otro con --data <ruta>.
(código de salida: 1)

$ pnpm dev -- --category

✖ Error: Falta el valor de --category (ej. --category Eléctrico)
(código de salida: 1)

$ pnpm dev

✔ Se leyeron 12 ascensores de data/elevators.json

📋 Catálogo de ascensores — todas las categorías
──────────────────────────────────────────────
  Total de ascensores:      12
  En servicio (activos):    9
  Fuera de servicio:        3
  Costo promedio inspección: $ 977.917
  Más costoso:  ASC-005 (Hyundai LUXEN) — $ 1.580.000
  Más económico: SIL-002 (Thyssenkrupp Flow X) — $ 365.000

  Por categoría:
    • Eléctrico: 4
    • Hidráulico: 2
    • Montacargas: 2
    • Panorámico: 2
    • Salvaescaleras: 2

💾 Reporte guardado en output/report.json
(código de salida: 0)

```
