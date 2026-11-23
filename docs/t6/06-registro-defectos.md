# 06 · Registro de defectos

**Ítems 10, 11 y 13 de la lista T6.** Sistema de seguimiento: **GitHub Issues** del repositorio
(etiquetas `bug` + `severidad:*`). Esta tabla es el espejo del tablero; el texto de cada issue
está en [10-issues-github.md](10-issues-github.md).

**Severidad:** Crítica (el sistema no se puede usar) · Alta (falla una función principal sin
alternativa) · Media (falla con alternativa o dato incorrecto) · Baja (molestia o estética).
**Estado:** Abierto → En corrección → Verificado → Cerrado.

| ID | Defecto | Severidad | Detectado | Corrección (commit) | Verificación | Estado |
|---|---|---|---|---|---|---|
| DEF-01 | Si el backend fallaba (500), el login mostraba "Failed to fetch" en vez del error: la respuesta salía sin cabeceras CORS | Alta | 13/11 · prueba manual del login | `69f8579` `app/main.py` | `test_def01_*` (2 pruebas) | Cerrado |
| DEF-02 | Se podía guardar un grupo de la lista de chequeo con el nombre "o"; se perdió "6.2 Cables de tracción y sus amarres" | Media | 13/11 · uso del Administrador | `69f8579` `checklist_admin.py`, `ChecklistNorma.jsx` | `test_def02_*` (4) + `ChecklistNorma.test.jsx` | Cerrado |
| DEF-03 | El Excel de productividad no contaba una inspección terminada hoy si estaba programada para mañana | Media | 13/11 · revisión del Excel | `69f8579` `app/routes/reportes.py` | `test_def03_*` | Cerrado |
| DEF-04 | Los campos de correo aceptaban espacios (login, registro, crear usuario) | Media | 11/11 · prueba exploratoria | `36c85b5` → **reabierto** → `a01fe24` | `utils/correo.test.js`, `authPages.test.jsx` | Cerrado |
| DEF-05 | Al crear un cliente, Chrome rellenaba "Teléfono" con el correo guardado del login | Baja | 13/11 · Asesor | `69f8579` `Users.jsx` (`autoComplete`) | Manual (Chrome) | Cerrado |
| DEF-06 | El backend no conectaba a MySQL: `Access denied ... (1044)`. La tabla del sistema `mysql.db` de XAMPP quedó dañada tras un cierre inesperado | Crítica (ambiente) | 13/11 · todos los usuarios | `scripts/reparar_permisos_bd.py` + base en Docker | Re-ejecución del login y del script | Cerrado |
| DEF-07 | Un edificio escrito se perdía al pulsar "Listo" sin "Agregar", así que no se podía registrar su ascensor | Media | 13/11 · Asesor | `69f8579` `SedesClienteDialog.jsx` | Manual | Cerrado |
| DEF-08 | Los botones "Ver ascensores" y "Ver inspecciones" del detalle del edificio no hacían nada | Baja | 13/11 · Administrador | `69f8579` `Buildings.jsx`, `Elevators.jsx`, `Inspections.jsx` | Manual | Cerrado |

Mejora (no defecto) registrada en el mismo tablero:

| ID | Mejora | Commit | Verificación |
|---|---|---|---|
| MEJ-01 | El inspector recoge la firma del cliente en su propio equipo (nombre + documento en la auditoría) | `69f8579` | `test_mej01_*` (4 pruebas) |

---

## Ciclo completo demostrado: detectar → corregir → verificar

### DEF-01 — "Failed to fetch" en el login
1. **Detectar.** Caso CP-BE-01 de la matriz: con la base caída, iniciar sesión. *Esperado:* "Error interno del servidor". *Obtenido:* "Failed to fetch".
   Causa: en Starlette el manejador de `Exception` corre fuera del middleware de CORS, así que el 500 salía sin `Access-Control-Allow-Origin` y el navegador lo bloqueaba.
2. **Corregir.** Commit `69f8579`: el manejador agrega las cabeceras CORS a mano para orígenes `localhost`, y guarda el error en `logs/errores.log`.
3. **Verificar.**
   - `test_def01_error_500_incluye_cors_para_el_frontend`: **falla** en el código anterior (`a01fe24`) y **pasa** en el actual. Ver `evidencias/regresion-antes.txt` y `evidencias/backend-pytest.txt`.
   - `test_def01_error_500_no_abre_cors_a_otros_dominios` comprueba que el arreglo no abre CORS a cualquiera.
   - Re-ejecución manual: el login muestra "Error interno del servidor" y el log da la causa real.

### DEF-04 — Correos con espacios (con reapertura)
1. **Detectar.** CP-FE-03: escribir `" ana@correo.com "` en el login → se enviaba con espacios.
2. **Corregir (1.er intento).** Commit `36c85b5`: se quitan los espacios mientras se escribe. Pruebas `correo.test.js` en verde.
3. **Verificar → falla.** En el navegador los espacios seguían viéndose: con `type="email"` el navegador entrega el valor ya recortado y no se re-renderiza. **Se reabre.**
4. **Corregir (2.º intento).** Commit `a01fe24`: los campos pasan a `type="text"`.
5. **Verificar.** `authPages.test.jsx` y re-ejecución manual en Chrome: el campo muestra el correo sin espacios. **Cerrado.**
   Lección: una prueba unitaria en verde no garantiza el comportamiento en el navegador real.

### DEF-03 — Productividad incompleta
1. **Detectar.** CP-BE-08: inspección de Esteban programada el 14/11 y terminada el 13/11; Excel del periodo hasta el 13/11. *Esperado:* 1 terminada. *Obtenido:* no aparece.
2. **Corregir.** Commit `69f8579`: el periodo se filtra por `COALESCE(fecha_fin, fecha_inicio)`.
3. **Verificar.** `test_def03_productividad_filtra_por_fecha_de_terminacion` (falla en `a01fe24`, pasa ahora) y nueva descarga del Excel.

## Convención de commits
Los commits ya distinguen construcción (`feat:`) de corrección (`fix:`), además de `test:`,
`docs:`, `chore:` y `style:` (84 `feat` y 45 `fix` en el historial). Desde T6, cada `fix`
nombra el defecto (`DEF-xx`) y el PR lo cierra con `Closes #NN`.
