# 07 · Reporte de ejecución de pruebas

**Ítems 9, 10 y 14 de la lista T6.** Ejecución del **18 de noviembre de 2026** en el equipo del
líder (Windows 11, Python 3.14 con uv, Node 22, Docker Desktop), con la tarea de VS Code
"LiftSafe: T6 - ejecutar todas las pruebas y guardar evidencia". La salida completa de cada
paso está en [`evidencias/`](evidencias/).

## Resumen

| Componente | Herramienta | Resultado | Cobertura | Evidencia |
|---|---|---|---|---|
| Backend 1 · FastAPI | pytest | ✅ **296 / 296** | **66,05 %** (umbral 64 %) · módulo crítico de autenticación (`auth_deps.py`, `auth_controller.py`) **100 %** | `backend-pytest.txt` |
| Regresión de defectos | pytest | ✅ **11 / 11** en el código corregido · ❌ 8 / 11 fallan en el código anterior (esperado) | — | `regresion-despues.txt`, `regresion-antes.txt` |
| Frontend · React | Vitest | ✅ **523 / 523** (47 archivos, 3,4 min con `--maxWorkers=2`) | **58,09 %** líneas (umbral 54 %) | `frontend-vitest.txt` |
| 4.° backend · api-t6 | Vitest (unitarias + API + integración con PostgreSQL de pruebas) | ✅ **37 / 37** | **93,96 %** · `auth.service.ts` 100 %, `middlewares/auth.ts` 89,7 % (umbral 80 %) | `api-t6-vitest.txt` |
| 4.° backend · Postman | Newman | ✅ **17 peticiones, 19 / 19 aserciones** · tiempo medio 58 ms | — | `api-t6-postman.txt` |
| Tipos (api-t6) | `tsc --noEmit` | ✅ 0 errores | — | `api-t6-typecheck.txt` |

## Linters (ítem 14)

| Código | Herramienta | Errores críticos | Avisos de estilo | Evidencia |
|---|---|---|---|---|
| Backend FastAPI | ruff (PEP 8: E, W, F) | ✅ **0** (sintaxis, nombres sin definir) | **237 → 11** tras `ruff --fix` (espacios, imports sin usar). Quedan comparaciones `== True` en filtros de SQLAlchemy, 3 `lambda` y 4 espacios en textos: DT-07 | `backend-ruff-criticos.txt`, `backend-ruff.txt` |
| Frontend React | ESLint (+ react-hooks) | ✅ **0** (antes 91: globales de Vitest sin declarar, variables sin usar, claves duplicadas en `statusHelpers.js`, error sin `cause`) | **14 avisos** de rendimiento del compilador de React (`set-state-in-effect`): DT-07 | `frontend-eslint.txt` |
| 4.° backend | ESLint + typescript-eslint | ✅ **0** | 0 | `api-t6-eslint.txt` |

**Sin regresiones respecto a T5:** todas las pruebas que existían en T5 siguen en verde y la
cobertura sube: backend 64,54 % → 66,05 %, frontend 54,12 % → 58,09 %.

## Defectos encontrados en la ejecución

| Hallazgo | Causa | Acción |
|---|---|---|
| La primera corrida del frontend dio 23 fallos por **tiempo agotado** (`Test timed out in 20000ms`, `Unable to find ... `) con el equipo cargado (videollamada, Docker y 42 procesos de Vitest en paralelo) | Ambiente, no código: cada archivo tardaba ~42 s solo en arrancar | `findBy*` espera hasta 5 s (`src/test/setup.js`) y la ejecución usa `--maxWorkers=2`. Re-ejecución: ver fila del frontend |
| La integración del 4.° backend falló la primera vez: `P1001 Can't reach database server at localhost:5433` | Docker Desktop estaba apagado | Se encendió Docker y se re-ejecutó: 37 / 37 |
| La prueba nueva *should show only the selected group* falló: el campo Grupo **no era de solo lectura** (`InputProps` ya no aplica en MUI 9) | Defecto real en el arreglo de la lista de chequeo | Se cambió a `slotProps.htmlInput.readOnly`; re-ejecución 523 / 523 |
| `test_mej01_*` falló al escribirse (`NoInspectionAvailable` en `FakeSession.refresh`) | El doble de sesión exige modelos de SQLAlchemy | Se usó una sesión mínima propia en la prueba |

## Ciclo rojo → verde de los defectos (ítem 11)

`regresion-antes.txt` ejecuta `tests/test_regresion_defectos.py` contra el código del commit
`a01fe24` (antes de los arreglos): **8 fallan** (DEF-01, DEF-02 ×3, DEF-03, MEJ-01 ×3) y 3 pasan
(los que verifican que el comportamiento correcto no se rompe). `regresion-despues.txt`
ejecuta las mismas pruebas sobre el código actual: **11 / 11 pasan**.
