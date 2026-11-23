# 04 · Plan de pruebas

**Ítem 7 de la lista T6.** Versión 1.0 · Cierre de T6.

## 1. Objetivo
Verificar que LiftSafe cumple sus requisitos funcionales y no funcionales antes de pasar a T7,
con un proceso **documentado y reproducible**: cualquier integrante puede volver a ejecutar
todas las pruebas con un comando y obtener la misma evidencia.

## 2. Alcance

| Incluido | Excluido (y por qué) |
|---|---|
| Backend 1 FastAPI: autenticación, usuarios, ascensores, inspecciones, checklist, firmas, informes PDF, productividad, auditoría, cifrado AES-256 | Envío real de correos por Gmail (se prueba con dobles: no se debe depender de internet) |
| Frontend React: páginas, servicios, validaciones, permisos por rol | Pruebas de carga con usuarios reales concurrentes (planeado para T7) |
| 4.° backend (`api-t6`): login JWT, roles, validación, CRUD, resumen | Navegadores distintos a Chromium en E2E |
| E2E del login, registro y recuperación de contraseña | Componente IoT (no se incorporó en T6) |
| Regresión de los defectos corregidos en T6 (DEF-01 a DEF-08, MEJ-01) | |

## 3. Niveles y tipos de prueba

| Nivel | Herramienta | Dónde | Qué verifica |
|---|---|---|---|
| Unitarias | pytest, Vitest | `liftsafe-backend/tests`, `LiftSafe_FrontendV2/src/**/*.test.*`, `api-t6/tests/auth.service.test.ts` | Reglas de negocio aisladas con dobles (fakes, stubs, spies) |
| Integración / API | pytest + TestClient, supertest, Prisma | `tests/test_api_*.py`, `api-t6/tests/*.api.test.ts` | Contrato HTTP, códigos de estado, validación, JWT y roles; integración real con PostgreSQL |
| Contrato con Postman | Newman | `api-t6/postman/LiftSafe-T6.postman_collection.json` | 17 peticiones con 19 tests sobre el servidor encendido |
| Extremo a extremo | Playwright | `e2e/tests` | Flujos de usuario en el navegador |
| Regresión | pytest, Vitest | `tests/test_regresion_defectos.py`, `ChecklistNorma.test.jsx` | Que los defectos corregidos no vuelvan |
| Estática | ruff (PEP 8), ESLint, `tsc` | todo el código | Errores de estilo y de tipos |

**Técnicas de diseño:** partición de equivalencia (datos válidos e inválidos), valores límite
(vencimiento del código de recuperación, longitud mínima de nombres y contraseñas), tablas de
decisión (rol × acción permitida) y pruebas negativas de seguridad (sin token, token manipulado,
token vencido, rol insuficiente).

## 4. Ambientes (prueba separado de desarrollo)

| Ambiente | Base de datos | Configuración | Uso |
|---|---|---|---|
| Desarrollo | MySQL `liftsafe_db` (XAMPP o Docker :3307) · PostgreSQL `liftsafe_t6` | `.env` | Programar y la demo |
| **Pruebas** | **Ninguna** para las unitarias (sesión falsa `tests/fakes.py`, mocks de Prisma) · PostgreSQL **`liftsafe_t6_test`** para la integración del 4.° backend | `.env.test`, `vitest.config.mts`, `tests/conftest.py` | Pruebas automáticas; nunca tocan los datos de desarrollo |
| Integración continua | Ninguna (contenedores efímeros de GitHub Actions) | `.github/workflows/tests.yml` | Cada push y PR |

Salvaguardas: `conftest.py` fija credenciales falsas antes de importar la app; la integración de
`api-t6` solo corre si `DATABASE_URL` contiene `_test`; el JWT de pruebas usa una clave propia.

## 5. Criterios
- **Entrada:** el código compila, las dependencias están instaladas y la base de pruebas está migrada.
- **Salida (aprobación):** 100 % de pruebas en verde, cobertura ≥ umbral (backend 64 %,
  frontend 54 %, módulo crítico de autenticación del 4.° backend ≥ 80 %), cero errores
  críticos de linter y ningún defecto de severidad Crítica o Alta abierto.
- **Suspensión:** si falla el ambiente (Docker o base caída), se registra como defecto de ambiente y se reanuda al corregirlo.

## 6. Roles
| Rol | Responsable |
|---|---|
| Líder de pruebas | Esteban |
| Pruebas de API y BD | Valentina, Luz |
| Pruebas de frontend | Dayan, Luz |
| E2E e integración continua | Felipe |

## 7. Cómo ejecutar todo
- VS Code → *Terminal → Run Task → "LiftSafe: T6 - ejecutar todas las pruebas y guardar evidencia"*.
- Deja cada resultado en `docs/t6/evidencias/` y un resumen en `00-resumen.txt`.
- Por partes: `cd liftsafe-backend && uv run pytest` · `cd LiftSafe_FrontendV2 && npm test` ·
  `cd api-t6 && npm run test:cov` · `cd e2e && npx playwright test`.

## 8. Gestión de defectos
Cada defecto se registra como **issue en GitHub** con etiqueta `bug`, severidad (Crítica, Alta,
Media, Baja) y estado (Abierto → En corrección → Verificado → Cerrado). El commit que lo corrige
usa `fix(...)` y referencia el issue (`Closes #NN`). El ciclo está documentado en
[06-registro-defectos.md](06-registro-defectos.md).
