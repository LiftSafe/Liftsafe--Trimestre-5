# LiftSafe · 4.° backend (T6) — API de integración con JWT

API REST en **Express + TypeScript + Prisma + PostgreSQL** que expone los ascensores y edificios
de LiftSafe a **sistemas externos** (app móvil, sensores IoT, terceros) con autenticación **JWT**
y dos roles. Por qué existe y cómo se compara con los otros backends:
[docs/t6/08-reflexion-4-backends.md](../docs/t6/08-reflexion-4-backends.md).

| Rol | Puede |
|---|---|
| `INTEGRADOR` | Consultar ascensores, su detalle, el resumen por estado y los edificios |
| `ADMIN` | Todo lo anterior + crear, editar y eliminar ascensores |

## Instalación desde cero

Requisitos: Node 22, Docker Desktop.

```bash
cd api-t6
cp .env.example .env              # Windows: copy .env.example .env
cp .env.test.example .env.test    # base de PRUEBAS separada
npm install                       # instala y genera el cliente de Prisma
docker compose up -d --wait       # PostgreSQL en el puerto 5433 (bases liftsafe_t6 y liftsafe_t6_test)
npx prisma migrate deploy         # tablas en la base de desarrollo
npx prisma db seed                # 4 edificios, 8 ascensores y 2 usuarios
npm run dev                       # http://localhost:3100/api/v1/health
```

Usuarios del seed (contraseña = `SEED_PASSWORD` del `.env`, por defecto `LiftSafe2026!`):
`admin@liftsafe.test` (ADMIN) e `integrador@liftsafe.test` (INTEGRADOR).

### Variables de entorno
| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Conexión a PostgreSQL |
| `JWT_SECRET` | Sí | Clave para firmar los tokens, **mínimo 32 caracteres** (si no, el servidor no arranca) |
| `JWT_EXPIRES_IN` | No (`1h`) | Vigencia del token |
| `PORT` | No (`3100`) | Puerto HTTP |
| `SEED_PASSWORD` | No | Contraseña de los usuarios demo |

## API (`/api/v1`)

Todas las respuestas son JSON. Los errores tienen la forma `{ "status": "error", "message": "...", "issues"?: [...] }`.

| Método | Ruta | Auth | Cuerpo / parámetros | Respuestas |
|---|---|---|---|---|
| GET | `/health` | — | — | 200 `{ status: "ok" }` |
| POST | `/auth/login` | — | `{ email, password }` (correo válido, clave 8–72) | 200 `{ data: { token, expiresIn, user } }` · 400 · 401 · 403 cuenta desactivada |
| GET | `/auth/me` | Bearer | — | 200 `{ data: user }` · 401 |
| GET | `/elevators` | Bearer | `?page=1&limit=10` (máx. 100) | 200 `{ data, total, page, limit }` · 401 |
| GET | `/elevators/summary` | Bearer | — | 200 `{ data: { total, byStatus } }` |
| GET | `/elevators/:id` | Bearer | `id` UUID | 200 `{ data }` con su edificio · 400 · 404 |
| POST | `/elevators` | Bearer **ADMIN** | `internalCode` (ASC-###), `brand`, `model`, `type`, `capacityKg`, `stops`, `status?`, `installedAt?`, `buildingId` | 201 · 400 · 403 · 409 código repetido |
| PUT | `/elevators/:id` | Bearer **ADMIN** | campos parciales | 200 · 400 · 403 · 404 · 409 |
| DELETE | `/elevators/:id` | Bearer **ADMIN** | — | 204 · 403 · 404 |
| GET | `/buildings` | Bearer | — | 200 `{ data: [{ ..., totalElevators }] }` |

Ejemplo:
```bash
TOKEN=$(curl -s -X POST localhost:3100/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"integrador@liftsafe.test","password":"LiftSafe2026!"}' | jq -r .data.token)
curl -s localhost:3100/api/v1/elevators/summary -H "Authorization: Bearer $TOKEN"
```

## Pruebas

| Comando | Qué corre |
|---|---|
| `npm test` | Unitarias del servicio de autenticación + pruebas de la API con la base simulada + integración con PostgreSQL (solo si existe `.env.test` con la base `_test`) |
| `npm run test:cov` | Lo mismo con cobertura (exige ≥ 80 % en el módulo de autenticación) |
| `npm run lint` · `npm run typecheck` | ESLint y TypeScript |
| `npx newman run postman/LiftSafe-T6.postman_collection.json` | 17 peticiones con 19 tests (con el servidor encendido y el seed cargado) |

Los casos están en [docs/t6/05-matriz-casos-de-prueba.md](../docs/t6/05-matriz-casos-de-prueba.md) (CP-API-01 a CP-API-20).
