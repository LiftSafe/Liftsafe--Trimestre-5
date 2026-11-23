# 02 · Sprints y retrospectivas

**Ítem 2 de la lista T6.** El equipo trabajó en sprints de una semana (S1 a S5) más un sprint
de cierre (S6). Los datos salen del historial de Git, los PR del repositorio y
[docs/matriz-rotacion.md](../matriz-rotacion.md). Cada retrospectiva incluye una reflexión
explícita sobre el **proceso de pruebas**.

> Formato de cada retrospectiva: ¿qué salió bien? · ¿qué salió mal? · ¿qué cambiamos? · reflexión de pruebas.

## Resumen

| Sprint | Fechas aprox. | Objetivo | PR | Cobertura al cierre (front · back) |
|---|---|---|---|---|
| S1 | 6–13 oct | Configurar pruebas y primer E2E | #2, #3 | 1 % · 46 % |
| S2 | 14–17 oct | Unitarias de front y back, CI, valores límite | #4, #5, #7, #8 | 33 % · 48 % |
| S3 | 18–19 oct | Pruebas de pantallas (Auditoría, Inspector) y base de datos | #9, #10, #13 | 42 % · 52 % |
| S4 | 27 oct–10 nov | Pruebas de API, hallazgos y API Express (`api-semana04`) | #14 | 54 % · 57 % |
| S5 | 10 nov | Dobles de prueba y API con PostgreSQL + Prisma (`api-semana05`) | #15, #16, #17 | 54 % · 65 % |
| S6 | 11–18 nov | Cierre: 4.° backend, defectos, documentación y Docker | (este PR) | ver [07](07-reporte-de-ejecucion.md) |

---

## Sprint 1 — Fundamentos de pruebas
- **Bien:** Playwright y el primer flujo E2E (recuperar contraseña) quedaron funcionando.
- **Mal:** la cobertura del frontend arrancó en 1,22 %; casi nada del front tenía pruebas.
- **Cambiamos:** rotación de capas por persona (matriz) para que todos probaran algo distinto.
- **Reflexión de pruebas:** empezamos por E2E porque "se ve", pero son lentas y frágiles. Entendimos la pirámide: necesitábamos muchas más unitarias abajo.

## Sprint 2 — Unitarias e integración continua
- **Bien:** CI en GitHub Actions con jobs `frontend` y `backend-fastapi`; umbrales mínimos de cobertura.
- **Mal:** se repitieron commits iguales en varias ramas (rebases desordenados).
- **Cambiamos:** un PR por capa y revisor de otra capa.
- **Reflexión de pruebas:** probar valores límite (vencimiento del código a los 60 minutos) encontró casos que nadie había pensado. La tabla compartida de contraseñas evitó duplicar datos de prueba entre front y back.

## Sprint 3 — Pantallas y base de datos
- **Bien:** pruebas de pantallas con estados vacío, error y permisos; helper `renderWithProviders`.
- **Mal:** algunos formularios superaban el tiempo por defecto de Vitest.
- **Cambiamos:** `testTimeout` mayor para formularios y umbral 41/52.
- **Reflexión de pruebas:** probar los estados de error mostró pantallas que se quedaban en blanco si la API fallaba. Probar "lo que pasa cuando algo sale mal" vale tanto como el camino feliz.

## Sprint 4 — Pruebas de API
- **Bien:** 6 hallazgos reales corregidos (JSON mal formado, rutas sin token, mensajes internos filtrados, 201 vs 200, 409 en duplicados). Ver [guia-semana-04](../guia-semana-04.md).
- **Mal:** el sprint se alargó por la semana de receso; los PR se fusionaron todos el 10 de noviembre.
- **Cambiamos:** "rojo primero": escribir la prueba que falla antes de corregir.
- **Reflexión de pruebas:** fue el sprint con más defectos encontrados. Las pruebas de API fueron las más rentables porque el contrato HTTP es lo que usan el front y otros sistemas.

## Sprint 5 — Dobles de prueba y persistencia
- **Bien:** inventario de dependencias externas (correo, reloj, disco, MySQL) y un tipo de doble justificado para cada una; mutantes que demostraron que las pruebas detectan fallas.
- **Mal:** la API con Prisma no tenía autenticación.
- **Cambiamos:** revisión de exceso de mocks con una tabla de señales.
- **Reflexión de pruebas:** los mutantes nos enseñaron que una prueba que nunca falla no prueba nada. Mockear de más esconde errores reales, por eso en S6 agregamos integración contra una base de pruebas real.

## Sprint 6 — Cierre
- **Bien:** 4.° backend con JWT y roles; defectos de la demo registrados, corregidos y verificados con pruebas de regresión; Docker para todo el equipo; documentación T6.
- **Mal:** el MySQL de XAMPP se dañó (DEF-06) y nos dejó sin backend unas horas; descubrimos datos reales y la clave AES en el repositorio público (DT-01).
- **Cambiamos:** la base en Docker como ambiente estándar; cada defecto se registra como issue antes de corregirlo.
- **Reflexión de pruebas:** varios defectos (DEF-01, DEF-02) los encontraron usuarios en la demo, no las pruebas. Faltaban pruebas de "uso real" (nombres absurdos, errores del servidor vistos desde el navegador). Ahora cada defecto deja una prueba de regresión que falla si vuelve.

---
*Las retrospectivas se escribieron a partir del historial; cada integrante puede completar su punto de vista en el PR.*
