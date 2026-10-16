# Matriz de rotación de capas

**Grupo:** LiftSafe
**Ficha:** _(número de ficha)_
**Stack:** React + FastAPI + MySQL

## Capas por semana

Cada semana cada integrante trabaja una capa distinta. El revisor de un PR debe tener una capa distinta a la del autor.

> **S2:** son 5 integrantes y 4 capas, así que API la comparten Valentina y Esteban, y Front la comparten Dayan y Luz, sobre unidades distintas. Felipe repite E2E porque la capa E2E monta el CI (pendiente de confirmar con el instructor). La capa **BD** queda para la semana 3.

| Integrante (usuario GitHub) | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 |
|---|---|---|---|---|---|---|---|---|---|
| @MendVal (Valentina) | E2E | API | | | | | | | |
| @esteban64-64 (Esteban) | E2E | API | | | | | | | |
| @Felipemesa1 (Felipe) | E2E | E2E (CI) | | | | | | | |
| @usuario-dayan (Dayan) | E2E | Front | | | | | | | |
| @usuario-luz (Luz) | E2E | Front | | | | | | | |

## Cobertura semanal

Cifra real medida al cierre de cada semana (líneas) y umbral que se exige la semana siguiente: el mayor entre 30 y la cifra, redondeada hacia abajo.

| Semana | Frontend (Vitest, % líneas) | Backend (pytest, % total) | Umbral semana siguiente |
|---|---|---|---|
| S1 | 1.22 | 45.64 | Front 30 · Back 45 |
| S2 | 33.33 | 48.10 | Front 33 · Back 48 |

## Integración continua (desde la semana 2)

- Workflow: `.github/workflows/tests.yml`, con los jobs `frontend` y `backend-fastapi`, más un resumen de commits de test por autor.
- Regla de rama: el repositorio es **público**, así que se activa un ruleset en `main` (*Require a pull request* + *Require status checks*: `frontend` y `backend-fastapi`). Si no se pudiera activar, la regla manual es que **nadie fusiona un PR en rojo**.
- Prueba del rojo: con `fail_under = 99` o `lines: 99`, el job correspondiente queda en ❌; al devolver el valor, vuelve a ✅.
- Exclusiones de cobertura: solo `src/main.jsx` (arranque de React), `src/assets/**` (imágenes), `src/data/**` (datos de demostración) y `app/__init__.py` en el backend. Ninguna tiene lógica de negocio.
