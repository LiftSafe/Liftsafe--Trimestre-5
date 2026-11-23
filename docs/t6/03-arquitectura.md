# 03 · Arquitectura del sistema (T6)

**Ítem 5 de la lista T6.** Diagrama actualizado al cierre de T6 y guion de la demo end-to-end.

## Vista general

```mermaid
flowchart LR
    subgraph Usuarios
        A1[Administrador / Director técnico / Coordinador]
        A2[Inspector en campo]
        A3[Cliente / Asesor]
        A4[App móvil, IoT u otros sistemas]
    end

    subgraph Frontend["Frontend web · React 19 + Vite + MUI (LiftSafe_FrontendV2)"]
        FE[SPA por roles<br/>servicios apiClient.js]
    end

    subgraph B1["Backend 1 · FastAPI (liftsafe-backend) — núcleo del negocio"]
        R1[Rutas /auth /usuarios /ascensores /inspecciones<br/>/checklist /informes /reportes /auditoria ...]
        C1[Controladores: cierre, foto obligatoria, productividad, correo, PDF]
        U1[Utilidades: JWT + roles, AES-256, auditoría inmutable]
    end

    subgraph B4["Backend 4 · Express + Prisma (api-t6) — API de integración"]
        R4[/auth/login · /elevators · /buildings · /summary/]
        M4[JWT + roles ADMIN / INTEGRADOR · Zod]
    end

    DB1[(MySQL / MariaDB<br/>liftsafe_db)]
    DB4[(PostgreSQL<br/>liftsafe_t6 · liftsafe_t6_test)]
    SMTP[[Gmail SMTP]]
    FS[[Disco: fotos y PDF]]

    A1 & A2 & A3 --> FE
    FE -- "HTTPS JSON + Bearer JWT" --> R1
    R1 --> C1 --> U1
    U1 -- SQLAlchemy --> DB1
    C1 --> SMTP
    C1 --> FS
    A4 -- "Bearer JWT" --> R4 --> M4
    M4 -- Prisma --> DB4
```

Los **backends 2 y 3** (`api-semana04`, `api-semana05`) fueron etapas de aprendizaje de Express
(memoria y luego PostgreSQL + Prisma). El 4.° backend (`api-t6`) los evoluciona y agrega
autenticación; ver [08-reflexion-4-backends.md](08-reflexion-4-backends.md).

## Capas dentro de cada backend

| Capa | Backend 1 · FastAPI | Backend 4 · api-t6 |
|---|---|---|
| Entrada HTTP | `app/routes/*.py` | `src/routes/*.routes.ts` |
| Validación | Pydantic (`app/schemas`) | Zod (`src/schemas`) |
| Autenticación | `utils/auth_deps.py` (python-jose, HS256) | `middlewares/auth.ts` (jsonwebtoken, HS256) |
| Negocio | `app/controllers` | `src/services` |
| Datos | SQLAlchemy (`app/models`) | Prisma (`src/repositories`) |
| Errores | Manejadores en `app/main.py` (JSON + CORS) | `middlewares/errorHandler.ts` |

## Despliegue

```mermaid
flowchart TB
    subgraph Docker["docker compose (raíz del repo)"]
        fe[fe · Nginx :3000]
        be[be · Uvicorn :8000]
        db[(db · MariaDB 10.4 :3307)]
        fe --> be --> db
    end
    subgraph DockerT6["docker compose (api-t6)"]
        pg[(PostgreSQL 16 :5433<br/>dev + test)]
    end
    api4[api-t6 · Node 22 :3100] --> pg
```

## Guion de la demo end-to-end (≈10 min)

1. `docker compose up -d --build` en la raíz → abrir http://localhost:3000.
2. **Administrador**: inicia sesión, revisa el tablero y la lista de chequeo NTC 5926-1.
3. **Asesor**: crea un cliente y su edificio; registra un ascensor dentro del edificio.
4. **Coordinador**: programa una inspección para ese ascensor.
5. **Inspector**: ejecuta el checklist, sube fotos, firma y recoge la **firma presencial del cliente**.
6. **Coordinador**: aprueba; se genera el **PDF** del informe y se envía la encuesta.
7. **Administrador**: descarga el **Excel de productividad** y revisa la **auditoría**.
8. **4.° backend**: en Postman, `POST /auth/login` como INTEGRADOR → `GET /elevators/summary`;
   intentar `POST /elevators` con ese token → **403**; con ADMIN → **201**.
