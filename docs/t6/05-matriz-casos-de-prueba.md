# 05 · Matriz de casos de prueba

**Ítem 8 de la lista T6.** 35 casos: 9 positivos (P) y 26 negativos (N). Cada caso indica la
prueba automatizada que lo ejecuta. La columna **Obtenido** sale de la ejecución registrada en
[07-reporte-de-ejecucion.md](07-reporte-de-ejecucion.md) y `evidencias/`.

**Leyenda de niveles:** U = unitaria · API = API/integración · E2E = navegador · PM = Postman · R = regresión de un defecto.

## Backend 1 · FastAPI (seguridad, negocio y defectos)

| ID | Tipo | Nivel | Caso | Datos | Pasos | Esperado | Obtenido | Prueba automatizada |
|---|---|---|---|---|---|---|---|---|
| CP-BE-01 | N | R | Error interno visto desde el navegador (DEF-01) | Origen `http://localhost:5173`, excepción `RuntimeError` | Provocar un error no controlado en una petición | 500 JSON `Error interno del servidor` **con** `Access-Control-Allow-Origin` | ✅ Pasó | `test_regresion_defectos.py::test_def01_error_500_incluye_cors_para_el_frontend` |
| CP-BE-02 | N | R | Error interno pedido desde un dominio ajeno | Origen `https://sitio-ajeno.com` | Igual al anterior | 500 **sin** cabecera CORS | ✅ Pasó | `::test_def01_error_500_no_abre_cors_a_otros_dominios` |
| CP-BE-03 | N | API | Ruta protegida sin token | Sin cabecera `Authorization` | `GET /usuarios/perfil/1`, `/auth/me`, etc. | 401 | ✅ Pasó | `test_api_seguridad.py::test_endpoint_protegido_sin_token_responde_401` |
| CP-BE-04 | N | API | Token basura | `Bearer abc.def.ghi` | Llamar una ruta protegida | 401 `Token inválido` sin detalles de la librería | ✅ Pasó | `::test_token_basura_responde_401_sin_filtrar_el_mensaje_interno_de_la_libreria` |
| CP-BE-05 | N | API | Token vencido | JWT con `exp` pasado | Llamar una ruta protegida | 401 | ✅ Pasó | `::test_token_vencido_responde_401` |
| CP-BE-06 | N | U | Código de recuperación en el valor límite | Vence en −1 s, 0 s y +1 s | Validar el código | Inválido / inválido / válido | ✅ Pasó | `test_reset_codes.py::test_vencimiento_del_codigo_en_el_valor_limite` |
| CP-BE-07 | P | U | Contraseña cifrada con AES-256-GCM | `Secreta123!` | Cifrar y descifrar | Mismo valor; cada cifrado distinto | ✅ Pasó | `test_cifrado.py::test_contrasena_se_cifra_y_se_descifra` |
| CP-BE-08 | N | R | Productividad: inspección terminada antes de la fecha programada (DEF-03) | Periodo 01/11–13/11 | Generar el reporte | El filtro usa `COALESCE(fecha_fin, fecha_inicio)` | ✅ Pasó | `::test_def03_productividad_filtra_por_fecha_de_terminacion` |
| CP-BE-09 | N | R | Nombre de grupo de checklist muy corto (DEF-02) | `"o"`, `"ab"` | Crear o editar grupo | Error de validación (mín. 3) | ✅ Pasó | `::test_def02_nombre_de_grupo_muy_corto_se_rechaza` |
| CP-BE-10 | N | U | Finalizar inspección con ítems sin calificar | Checklist con 2 pendientes | Pedir el cierre | Rechazado con la cantidad pendiente | ✅ Pasó | `test_cierre_inspeccion.py::test_no_deja_finalizar_con_items_pendientes` |
| CP-BE-11 | N | U | Ítem "No cumple" sin foto | Ítem No cumple, 0 fotos | Pedir el cierre | Bloqueado: falta la foto | ✅ Pasó | `test_foto_obligatoria.py::test_bloquea_si_falta_la_foto` |
| CP-BE-12 | P | R | Firma presencial del cliente (MEJ-01) | Inspector asignado, nombre `Ana Ruiz`, doc. `52123456` | `PUT /inspecciones/73/firma-cliente` | Firma guardada, estado `Pendiente revisión`, auditoría con `presencial` | ✅ Pasó | `::test_mej01_inspector_asignado_recoge_firma_presencial` |
| CP-BE-13 | N | R | Firma presencial sin datos de quien firma | Sin nombre ni documento | Igual | 400 | ✅ Pasó | `::test_mej01_firma_presencial_exige_nombre_y_documento` |
| CP-BE-14 | N | R | Otro inspector intenta firmar por el cliente | Inspector 99 (no asignado) | Igual | 403 | ✅ Pasó | `::test_mej01_otro_inspector_no_puede_firmar_por_el_cliente` |

## Frontend · React

| ID | Tipo | Nivel | Caso | Datos | Pasos | Esperado | Obtenido | Prueba automatizada |
|---|---|---|---|---|---|---|---|---|
| CP-FE-01 | N | R | Guardar un grupo con nombre "o" (DEF-02) | `o` | Lista de chequeo → Nuevo grupo → Guardar | Mensaje "al menos 3 caracteres"; no llama al servidor | ✅ Pasó | `ChecklistNorma.test.jsx` › *should reject a group name shorter than 3 characters* |
| CP-FE-02 | P | U | Agregar ítem muestra solo su grupo | Grupo 6.1 | Agregar ítem | Campo Grupo = "6.1 Puertas de piso", solo lectura | ✅ Pasó | `ChecklistNorma.test.jsx` › *should show only the selected group* |
| CP-FE-03 | N | R | Correo con espacios (DEF-04) | `" ana @correo.com "` | Limpiar el correo | `ana@correo.com` | ✅ Pasó | `utils/correo.test.js` |
| CP-FE-04 | P | U | Código del próximo ítem sugerido | Grupo con 2 ítems | Agregar ítem | Propone `NTC-6.1-03` y guarda | ✅ Pasó | `ChecklistNorma.test.jsx` › *should propose the next code* |

## 4.° backend · api-t6 (JWT y roles)

| ID | Tipo | Nivel | Caso | Datos | Pasos | Esperado | Obtenido | Prueba automatizada |
|---|---|---|---|---|---|---|---|---|
| CP-API-01 | P | U | Login correcto | `admin@liftsafe.test` / clave válida | `authService.login` | JWT con `sub` y `role`; sin `passwordHash` | ✅ Pasó | `auth.service.test.ts` |
| CP-API-02 | N | U | Contraseña errada | Clave `Otra12345` | Login | 401 | ✅ Pasó | `auth.service.test.ts` |
| CP-API-03 | N | U | Correo inexistente no revela que no existe | `nadie@liftsafe.test` | Login | 401 con el mismo mensaje que clave errada | ✅ Pasó | `auth.service.test.ts` |
| CP-API-05 | N | U | Token vencido | `exp` hace 60 s | Verificar token | 401 "El token venció" | ✅ Pasó | `auth.service.test.ts` |
| CP-API-06 | N | U | `JWT_SECRET` corto | `corta` | Arrancar el servidor | No arranca y explica por qué | ✅ Pasó | `auth.service.test.ts` |
| CP-API-07 | N | API | Correo mal escrito | `no-es-correo` | `POST /auth/login` | 400 "El correo no es válido" | ✅ Pasó · ✅ Pasó | `auth.api.test.ts` · Postman 05 |
| CP-API-10 | P | API | Correo con mayúsculas y espacios | `"  ADMIN@LiftSafe.test "` | `POST /auth/login` | 200; se busca `admin@liftsafe.test` | ✅ Pasó | `auth.api.test.ts` |
| CP-API-11 | N | API | Sin token | — | `GET /elevators` | 401 | ✅ Pasó · ✅ Pasó | `auth.api.test.ts` · Postman 07 |
| CP-API-13 | N | API | Token manipulado | Token + `x` | `GET /elevators` | 401 | ✅ Pasó · ✅ Pasó | `auth.api.test.ts` · Postman 17 |
| CP-API-14 | P | API | INTEGRADOR consulta | Token INTEGRADOR, `page=1&limit=5` | `GET /elevators` | 200 `{data,total,page,limit}` | ✅ Pasó · ✅ Pasó | `auth.api.test.ts` · Postman 08 |
| CP-API-15 | N | API | INTEGRADOR intenta crear | Token INTEGRADOR | `POST /elevators` | 403; no se crea nada | ✅ Pasó · ✅ Pasó | `auth.api.test.ts` · Postman 11 |
| CP-API-16 | N | API | ADMIN con datos inválidos | `internalCode: "X1"` | `POST /elevators` | 400 | ✅ Pasó · ✅ Pasó | `auth.api.test.ts` · Postman 12 |
| CP-API-17 | P | API | ADMIN crea ascensor | `ASC-950`, Otis, 630 kg | `POST /elevators` | 201 | ✅ Pasó · ✅ Pasó | `auth.api.test.ts` · Postman 13 |
| CP-API-21 | N | PM | Código repetido | `ASC-950` otra vez | `POST /elevators` | 409 | ✅ Pasó | Postman 14 |
| CP-API-22 | P | API | CRUD real contra PostgreSQL de pruebas | Base `liftsafe_t6_test` | Crear → detalle → actualizar → eliminar | 201 → 200 → 200 → 204 → 404 | ✅ Pasó | `elevators.api.test.ts` |

## E2E · Playwright

| ID | Tipo | Nivel | Caso | Esperado | Prueba |
|---|---|---|---|---|---|
| CP-E2E-01 | N | E2E | Registro con contraseña débil | Mensajes de requisitos y no se envía | `04-registro-contrasena-debil.spec.js` |
| CP-E2E-02 | N | E2E | Login con la API caída (500) | Mensaje legible, no pantalla en blanco | `06-login-api-con-errores.spec.js` |

**Total:** **35 casos** (9 positivos y 26 negativos), todos con prueba automatizada.
