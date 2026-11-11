# Semana 4 — Pruebas de API · LiftSafe

## 0. Qué trae este paquete
Carpeta `liftsafe-backend/` con los archivos nuevos/modificados (misma estructura que tu repo):

| Archivo | Para qué |
|---|---|
| `tests/fakes.py` | Sesión de BD falsa + helpers de token (aísla la BD) |
| `tests/conftest.py` | Se le AÑADEN los fixtures `client` y `db` (el resto queda igual) |
| `tests/test_api_ascensores.py` | Ángulo **API** (CRUD de ascensores) |
| `tests/test_api_bd.py` | Ángulo **BD** (409, dependientes, sedes) |
| `tests/test_api_front.py` | Ángulo **Front** (campos exactos del JSON) |
| `tests/test_api_seguridad.py` | Ángulo **E2E** (401/403/autorizado + contrato de errores) |
| `app/main.py`, `routes/*`, `schemas.py`, `auth_deps.py` | Correcciones de los hallazgos |

## 1. Hallazgos encontrados (anótalos en el PR)
1. 🔎 JSON mal formado respondía 422 con una LISTA de Pydantic. Ahora 400 `{"detail": "Cuerpo de la petición mal formado"}`. (main.py)
2. 🔎 Error inesperado (BD caída) respondía texto plano "Internal Server Error", no JSON. Ahora 500 `{"detail": "Error interno del servidor"}` y el detalle queda solo en el log. (main.py)
3. 🔒 `/usuarios/perfil/{id}` y `/usuarios/dashboard/{admin|cliente|inspector}` NO pedían token: cualquiera veía perfiles y estadísticas. Ahora 401 sin token. (usuarios.py)
4. 🔒 `get_current_user` devolvía `"Token inválido: <mensaje interno de python-jose>"`. Ahora solo `"Token inválido"`. (auth_deps.py)
5. `POST /ascensores/` respondía 200 y el `response_model` descartaba `id_ascensor`. Ahora 201 con `id_ascensor`. (ascensores.py + schemas.py)
6. Duplicados y registros con dependientes respondían 400. Ahora 409 (código interno, correo, nombre de sede, borrar ascensor con inspecciones, borrar sede con ascensores, borrar último admin).

## 2. Pasos
1. `git checkout main && git pull` → `git checkout -b feat/s4-pruebas-api-<tu-nombre>`
2. Copia la carpeta `liftsafe-backend/` de este paquete sobre la de tu repo (reemplaza archivos).
3. **Rojo primero** (opcional pero recomendado): guarda los cambios de `app/` con `git stash push -- liftsafe-backend/app`, corre `uv run pytest --no-cov` → fallan los tests de hallazgos. `git stash pop` → vuelve al verde.
4. `cd liftsafe-backend && uv run pytest` → todo en verde. Si algún test falla por un detalle, pega aquí el error.
5. **Mutante** (ver sección 3), confirma que falla, deshaz.
6. Commits con TU usuario de git (`git config user.name` / `user.email`) — el CI cuenta commits de `tests/` por autor.
7. Abre el PR con la plantilla (sección 4). El revisor debe ser de OTRA capa.
8. Matriz `docs/matriz-rotacion.md`: escribe tu capa en la columna S4 (distinta a la de S2).

## 3. Mutantes (elige uno de TU archivo)
| Archivo de tests | Rompe esto | Debe fallar |
|---|---|---|
| test_api_ascensores | `ascensores.py`: `status_code=201` → `200` | `test_crear_ascensor_responde_201...` |
| test_api_bd | `clientes.py` `eliminar_sede`: comenta el `if en_uso: raise ...` | `test_eliminar_sede_con_ascensores...` |
| test_api_front | `auth.py` login: quita `"nombre": user.nombre_completo` | `test_login_exitoso...` |
| test_api_seguridad | `ascensores.py` `crear_ascensor`: `['Administrador','Coordinador']` → agrega `'Inspector'` | `test_inspector_no_puede_crear_ascensores...` |
| (contrato de errores) | `main.py`: comenta el `return JSONResponse(status_code=400 ...)` | `test_json_mal_formado...` |

Documenta en el PR: archivo, línea cambiada, test que falló, y que lo deshiciste.

## 4. Texto para el PR
```
## ¿Qué prueba este PR?
Pruebas de API (TestClient, sin servidor ni BD) del ángulo <API|BD|Front|E2E>.

## Capas
- Capa del autor esta semana: <tu capa>
- Capa del revisor esta semana: <otra capa>

## Hallazgos
🔎 Hallazgo: `POST /auth/login` con JSON mal formado respondía 422 con una lista de Pydantic. Corregido en el manejador de errores de main.py. Test: `test_json_mal_formado_responde_400_con_detail_json`.
🔒 Hallazgo de seguridad: `/usuarios/perfil/{id}` y `/usuarios/dashboard/*` no exigían token. Corregido con `Depends(get_current_user)`. Test: `test_endpoint_protegido_sin_token_responde_401`.
🔒 Hallazgo: `Token inválido: <mensaje interno>` exponía detalles de la librería JWT. Test: `test_token_basura_responde_401_sin_filtrar...`.

## Mutante
Rompí <archivo:línea> (<cambio>) → falló `<test>`. Revertido.

## ¿Cómo lo ejecuto?
cd liftsafe-backend && uv run pytest
```

## 5. Cierre de semana: umbral 50 %
1. Con los PR fusionados: `cd liftsafe-backend && uv run pytest` → mira la línea `TOTAL ... NN%`.
2. Nuevo umbral = el mayor entre 50 y NN, redondeado hacia abajo. En `pyproject.toml`: `fail_under = <valor>  # semana 4: NN.NN% real`.
3. Frontend: `cd LiftSafe_FrontendV2 && npm test` → `% Lines`. En `vite.config.js` sube `thresholds` (hoy `lines: 33`) a max(50, real). Si el front no llega a 50 %, hay que sumar tests de componentes (técnicas de la semana 3).
4. Anota las cifras en la tabla "Cobertura semanal" de `docs/matriz-rotacion.md`.
5. PR "chore: umbral S4" → CI en verde (jobs `frontend` y `backend-fastapi`).

## 6. Preparación para el vocero
- 401 = no sabemos quién eres (sin token / vencido / firma falsa). 403 = sabemos quién eres pero tu rol no puede. Tests: `test_api_seguridad.py`.
- La BD se aísla con `app.dependency_overrides[get_db]` → `FakeSession` (fixture `client` en conftest.py). Lo real: rutas, validación Pydantic, manejadores de error, JWT. Lo simulado: la sesión de BD.
- Stack trace/SQL en una respuesta = filtración de información interna (rutas, tablas, versiones) que ayuda a un atacante.
- Prueba en vivo: `curl -i -X POST localhost:8000/auth/login -H "Content-Type: application/json" -d '{"correo":'` → 400 JSON.
