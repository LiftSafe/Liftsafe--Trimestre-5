# 09 · Deuda técnica priorizada

**Ítem 15 de la lista T6.** Prioridad = impacto × probabilidad. Se revisa al inicio de T7.

| # | Prioridad | Deuda | Impacto | Acción propuesta | Esfuerzo |
|---|---|---|---|---|---|
| DT-01 | 🔴 Crítica | El repositorio es **público** y contiene `liftsafe_db.sql` (datos reales de usuarios) y la clave AES `SECRET_KEY_MYSQL` en `docker-compose.yml` y `.env.example`: con ambos se pueden descifrar las contraseñas | Exposición de datos personales y credenciales | Rotar la clave AES y volver a cifrar; reemplazar el respaldo por datos ficticios; borrar del historial con `git filter-repo` o volver privado el repo | Medio |
| DT-02 | 🔴 Alta | Las tablas del sistema de MySQL de XAMPP se dañaron tras un cierre inesperado (permisos perdidos, ver DEF-06) | El backend no arranca para nadie del equipo | Usar la base en Docker (`docker compose up`) como ambiente estándar; respaldo automático | Bajo |
| DT-03 | 🟠 Alta | Rutas del backend 1 con lógica de negocio mezclada (`inspecciones.py` ~500 líneas, `informes.py` ~420) | Difícil de probar y de cambiar | Mover la lógica a `controllers/` como ya se hizo con cierre y productividad | Alto |
| DT-04 | 🟠 Alta | Componentes de frontend muy grandes (`Inspections.jsx` ~1.700 líneas, `Solicitudes.jsx` ~880) | Regresiones al tocar una parte | Dividir en subcomponentes y hooks (firma, checklist, filtros) | Alto |
| DT-05 | 🟡 Media | Migraciones del backend 1 como `.sql` sueltos + `run_migration.py` manual | Bases desalineadas entre integrantes | Adoptar Alembic | Medio |
| DT-06 | 🟡 Media | Formatos de error distintos entre backends (`detail` vs `status/message`) | Más código en clientes | Contrato de error común (RFC 7807) | Bajo |
| DT-07 | 🟡 Media | Avisos no críticos: 11 de ruff (`== True` en filtros, `lambda`) y 14 de ESLint (`setState` dentro de `useEffect`, que el compilador de React marca como riesgo de renders en cascada) | Rendimiento y estilo | Refactorizar efectos de `Inspections.jsx`, `Auditoria.jsx`, `Encuestas.jsx`; volver las reglas a `error` | Medio |
| DT-08 | 🟡 Media | El tiempo promedio de inspección no se calcula si el inspector cierra antes de la hora programada | Indicador de productividad incompleto | Registrar la hora real de inicio de la visita | Bajo |
| DT-09 | 🟢 Baja | Colecciones Postman de las semanas 4 y 5 sin tests | Menos verificación automática | Migrar al formato de la colección T6 | Bajo |
| DT-10 | 🟢 Baja | Sin pruebas de carga | Desconocemos el límite real | k6 o Locust en T7 sobre el ambiente Docker | Medio |
