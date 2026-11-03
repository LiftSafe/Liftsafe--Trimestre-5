# LiftSafe · Semana 04 — Validación, Errores y Logging

API REST en **Node.js + Express + TypeScript** con validación de datos (**Zod**), manejo estructurado de errores (**AppError**) y logging profesional (**Winston + Morgan**).

## Dominio asignado

| Dominio | Recurso principal | Ruta base |
|---|---|---|
| **LiftSafe** — inspección de ascensores (NTC 5926-1) | `Elevator` (ascensor) | `/api/v1/elevators` |

## Campos del schema y sus validaciones (`src/schemas/elevator.schema.ts`)

| Campo | Tipo | Validación |
|---|---|---|
| `internalCode` | string | Obligatorio. Se pasa a mayúsculas. Formato `ASC-001` (`/^ASC-\d{3,}$/`). No se puede repetir (409) |
| `brand` | string | Obligatorio, 1 a 80 caracteres, sin espacios sobrantes |
| `model` | string | Obligatorio, 1 a 80 caracteres |
| `type` | enum | `Eléctrico`, `Hidráulico`, `Panorámico` o `Montacargas` |
| `capacityKg` | number | Entero, mayor que 0 y máximo 10.000 |
| `floors` | number | Entero, de 2 a 200 |
| `status` | enum | `Activo` (por defecto), `En mantenimiento` o `Fuera de servicio` |

- `createElevatorSchema`: creación. `updateElevatorSchema = createElevatorSchema.partial()`: todos los campos opcionales.
- Tipos inferidos con `z.infer<>`: `CreateElevatorDto`, `UpdateElevatorDto`, `PaginationQuery`.
- `:id` se valida con `z.coerce.number().int().positive()`.
- Listado paginado con `?page=1&limit=10` (`limit` máximo 100).

### Reglas de negocio (en el servicio, con `AppError`)
- Ascensor inexistente → **404**.
- Código interno repetido → **409**.
- No se elimina un ascensor **Activo** → **409** (primero hay que ponerlo fuera de servicio).

## Endpoints

| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| GET | `/api/v1/elevators?page=1&limit=10` | Listar con paginación | 200, 400 |
| GET | `/api/v1/elevators/:id` | Obtener por id | 200, 400, 404 |
| POST | `/api/v1/elevators` | Crear (valida con Zod) | 201, 400, 409 |
| PUT | `/api/v1/elevators/:id` | Actualizar (campos opcionales) | 200, 400, 404, 409 |
| DELETE | `/api/v1/elevators/:id` | Eliminar | 204, 400, 404, 409 |
| GET | `/api/v1/health` | Estado de la API | 200 |

Ejemplo de cuerpo para `POST`:

```json
{ "internalCode": "ASC-100", "brand": "Otis", "model": "Gen3", "type": "Eléctrico", "capacityKg": 630, "floors": 12 }
```

## Manejo de errores

Todas las respuestas de error son JSON:

| Caso | Código | Cuerpo |
|---|---|---|
| Body inválido (`safeParse` en el controlador) | 400 | `{ status, message: "Datos inválidos", issues: [...] }` |
| `:id` no numérico | 400 | `{ status, message: "Id inválido", issues: [...] }` |
| `ZodError` lanzado (por ejemplo `?page=0`) | 400 | `{ status, message, issues }` desde el `errorHandler` |
| JSON mal escrito | 400 | `{ status, message }` |
| `AppError` | su `statusCode` | `{ status, message }` + `logger.warn` |
| Ruta inexistente (`notFound`) | 404 | `{ status, message: "Ruta no encontrada: ..." }` |
| Cualquier otro error | 500 | `{ status, message: "Error interno del servidor" }` + `logger.error` |

## Logging (`src/config/logger.ts`)

| | Desarrollo | Producción |
|---|---|---|
| Nivel | `http` | `warn` |
| Formato | Colores + hora | JSON |
| Archivo | — | `logs/error.log` (solo errores) |

- **Morgan** registra cada petición HTTP a través del stream de Winston (`logger.http`).
- `logger.info()` al iniciar el servidor y al crear/actualizar/eliminar.
- `logger.warn()` en el `errorHandler` para cada `AppError`.
- Sin `console.log` en el código.

## Arquitectura en capas

```
Ruta → Controlador → Servicio → Repositorio
routes/   controllers/   services/   repositories/
```

- **Rutas** (`elevators.routes.ts`): solo registran los endpoints.
- **Controlador** (`elevators.controller.ts`): valida la entrada con Zod, llama al servicio y responde. Cada `try/catch` termina en `next(err)`.
- **Servicio** (`elevators.service.ts`): toda la lógica de negocio y los `AppError`.
- **Repositorio** (`elevators.repository.ts`): CRUD en memoria (3 ascensores de ejemplo).
- En `app.ts` el orden es: `express.json` → `morgan` → rutas → `notFound` → `errorHandler`.

## Cómo ejecutar

Requisitos: Node.js 20 o superior y pnpm (`npm install -g pnpm`).

```bash
cd api-semana04
pnpm install
pnpm dev          # desarrollo: http://localhost:3000/api/v1/elevators
pnpm test         # pruebas automáticas (Vitest + Supertest)
pnpm build        # compila TypeScript a dist/
pnpm start        # producción: logs en JSON y logs/error.log
```

El puerto se cambia con la variable `PORT`.

## Pruebas y evidencias

- `tests/elevators.api.test.ts` cubre los 4 casos de las capturas, más el CRUD completo, la paginación y los 409.
- `postman/LiftSafe-Semana04.postman_collection.json` se importa en Postman o Thunder Client y trae todas las peticiones listas, incluidas las de las capturas:
  1. `POST` con body inválido → 400 con `issues[]`
  2. `GET /:id` con id no numérico → 400
  3. `GET /:id` con id inexistente → 404
  4. `GET /ruta-inexistente` → 404 en JSON (no HTML)
  5. Logs visibles en la consola donde corre `pnpm dev`
