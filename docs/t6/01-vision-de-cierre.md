# 01 · Visión de cierre de T6

**Ítem 1 de la lista T6.** Qué queda terminado en T6 y qué pasa a T7, dicho con honestidad.

## Producto
**LiftSafe** gestiona inspecciones técnicas de ascensores según la NTC 5926-1: desde la
solicitud del cliente hasta el informe PDF firmado, con trazabilidad y auditoría.

## ✅ Terminado en T6
| Área | Qué está listo | Evidencia |
|---|---|---|
| Flujo principal | Solicitud → programación → checklist NTC 5926-1 (grupos 6.1 a 6.11) con fotos obligatorias → firmas → revisión del coordinador → informe PDF → encuesta | Demo end-to-end ([03-arquitectura.md](03-arquitectura.md)) |
| Roles | Administrador, Director técnico, Coordinador, Inspector, Asesor y Cliente, cada uno con su tablero | `config/roles.js`, `utils/auth_deps.py` |
| Seguridad | JWT, contraseñas y firmas con AES-256-GCM, auditoría inmutable, validación de contraseñas | `test_cifrado.py`, `test_auditoria*.py` |
| Mejoras de cierre | Firma presencial del cliente en el equipo del inspector, botones "Ver ascensores / Ver inspecciones" por edificio, edificios y ascensores desde el Asesor | Commit `69f8579` |
| 4.° backend | `api-t6`: API de integración con JWT, roles, Zod, Prisma y base de pruebas separada | [08-reflexion-4-backends.md](08-reflexion-4-backends.md) |
| Pruebas | Unitarias, API, integración, E2E, regresión, Postman con tests e integración continua | [04](04-plan-de-pruebas.md), [05](05-matriz-casos-de-prueba.md), [07](07-reporte-de-ejecucion.md) |
| Ambiente | Todo el sistema levanta con `docker compose up` | `DOCKER_SETUP.md` |

## 🟡 Terminado con limitaciones
- **Correo**: funciona con Gmail, pero cada integrante debe poner su propia contraseña de aplicación.
- **Productividad**: el tiempo promedio no cuenta las inspecciones cerradas antes de la hora programada (DT-08).
- **Linter**: sin errores críticos, pero quedan advertencias de estilo (DT-07).

## ➡️ Pasa a T7
| Pendiente | Motivo | Prioridad |
|---|---|---|
| Sacar datos reales y claves del repositorio público (DT-01) | Riesgo de seguridad detectado al cierre | Crítica |
| Conectar la app móvil Flutter al 4.° backend | El 4.° backend ya expone el contrato; falta el cliente | Alta |
| Refactorizar rutas largas del backend 1 y páginas grandes del frontend (DT-03, DT-04) | Mantenibilidad | Alta |
| Componente IoT (sensor de estado del ascensor que reporte al 4.° backend) | No obligatorio en T6; el 4.° backend ya tiene el rol INTEGRADOR para recibirlo | Media |
| Pruebas de carga y despliegue en la nube | Fuera del alcance de T6 | Media |
