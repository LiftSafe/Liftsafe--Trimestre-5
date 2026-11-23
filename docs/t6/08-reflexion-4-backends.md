# 08 · Reflexión comparativa de los 4 backends

**Ítems 3 y 15 de la lista T6.**

## Los cuatro backends

| # | Carpeta | Stack | Momento | Responsabilidad |
|---|---|---|---|---|
| 1 | `liftsafe-backend` | Python 3.12 · FastAPI · SQLAlchemy · MySQL | Desde T4 | **Núcleo del negocio**: usuarios y roles, ascensores, inspecciones, checklist NTC 5926-1, firmas, informes PDF, productividad, auditoría |
| 2 | `api-semana04` | Node · Express · TypeScript · datos en memoria | T6, semana 4 | Aprender capas (rutas → controlador → servicio → repositorio), validación con Zod y manejo de errores |
| 3 | `api-semana05` | Express · TypeScript · **PostgreSQL + Prisma** | T6, semana 5 | Persistencia real: migraciones, seed, relaciones 1:N y traducción de errores de la base |
| 4 | **`api-t6`** | Express · TypeScript · PostgreSQL + Prisma · **JWT** | T6, cierre | **API de integración**: un punto de acceso seguro y de solo lectura para sistemas externos (app móvil, sensores IoT, terceros), con escritura solo para ADMIN |

## ¿Por qué un 4.° backend y no otra ruta en FastAPI?
- **Responsabilidad diferenciada.** El backend 1 sirve a la aplicación web y a sus 6 roles de
  negocio. El 4.° expone un contrato pequeño, estable y versionado (`/api/v1`) para consumidores
  que **no** son personas usando la web. Separarlo evita que un cambio en la web rompa a los integradores.
- **Aislamiento de riesgo.** Si una integración externa genera mucha carga o se ve comprometida,
  no afecta la base transaccional MySQL ni los datos personales de los clientes.
- **Roles propios.** ADMIN e INTEGRADOR no existen en el backend 1; un integrador solo consulta.

## Comparación

| Aspecto | 1 · FastAPI | 2 · Express memoria | 3 · Express + Prisma | 4 · api-t6 |
|---|---|---|---|---|
| Lenguaje y tipos | Python con type hints | TypeScript estricto | TypeScript estricto | TypeScript estricto |
| Validación | Pydantic | Zod | Zod | Zod (+ variables de entorno validadas) |
| Persistencia | SQLAlchemy, SQL a mano en migraciones | Arreglo en memoria | Prisma + migraciones versionadas | Prisma + migraciones versionadas |
| Autenticación | JWT (python-jose) + 6 roles | No | No | **JWT (jsonwebtoken) + 2 roles + bcrypt** |
| Documentación de la API | Swagger automático (`/docs`) | README + Postman | README + Postman | README + Postman con 19 tests |
| Pruebas | pytest con sesión falsa, ~65 % cobertura | Vitest + supertest | Vitest + integración real | Vitest unit + API + integración en base de pruebas separada |
| Lo más fuerte | Cobertura funcional completa del negocio | Claridad de capas | Migraciones y errores de BD | Seguridad y contrato pequeño |
| Lo más débil | Rutas muy largas (lógica mezclada en `routes/`), sin linter hasta T6 | Se pierde todo al reiniciar | Sin autenticación | Pocos recursos aún (solo consulta de ascensores y edificios) |

## Lo que aprendimos
1. **Separar capas desde el principio** ahorra trabajo: en FastAPI varias rutas mezclan consulta,
   regla de negocio y respuesta, y por eso hubo que probarlas con dobles complejos. En Express la
   separación nos permitió probar el servicio de autenticación sin servidor ni base.
2. **Validar en la frontera** (Pydantic/Zod) eliminó una clase entera de defectos: casi todos los
   400 se responden antes de tocar la base.
3. **Las migraciones versionadas** (Prisma) son más seguras que los `.sql` sueltos del backend 1,
   donde mantener `actualizar_base.sql` a mano costó varios ajustes.
4. **Los errores también son contrato**: el defecto DEF-01 (500 sin CORS) mostró que un error
   mal formado se ve en el navegador como un fallo de red, y confunde al usuario y al equipo.
5. **Base de pruebas separada**: en el backend 1 usamos sesión falsa; en el 4.° probamos contra
   PostgreSQL real pero en `liftsafe_t6_test`, lo que dio más confianza sin arriesgar datos.

## Qué haríamos distinto
- Empezar el backend 1 con la misma estructura en capas y un linter desde el día uno.
- Usar migraciones versionadas (Alembic) en lugar de scripts SQL sueltos.
- Definir desde el inicio un único formato de error para todos los backends
  (FastAPI usa `{"detail": ...}`, Express usa `{"status", "message"}`).
