# Semana 5 — texto del PR 
## ¿Qué prueba este PR?
Resiliencia del correo (recuperar clave y encuesta) con dobles, el cliente HTTP con MSW y estados de error del login con page.route.

## Inventario de dependencias externas
- Correo (FastMail/SMTP): recuperación de clave y encuesta → test_notificaciones.py
- Reloj: códigos de recuperación vencen en 1 h → ya cubierto en test_reset_codes.py
- Disco: reset_codes.json, PDFs y fotos → monkeypatch de _save_codes/_load_codes
- MySQL: fake de sesión con dependency_overrides[get_db]
- Backend visto desde el frontend → MSW (apiClient.msw.test.js) y page.route (06-login-api-con-errores.spec.js)

## Tipos de doble por test
| Test | Doble | Qué verifica |
|---|---|---|
| `test_notificaciones.py` — recuperar clave envía el código | SPY (`send_reset_email`) + STUB (`generate_reset_code` → "123456") | Comportamiento: se envía una vez, con ese código |
| `test_notificaciones.py` — correo inexistente | SPY con `assert_not_called` + fake de BD como STUB | Comportamiento: no se envía nada |
| `test_notificaciones.py` — servidor de correo caído | STUB que lanza error | Estado: la ruta responde 503 |
| `test_notificaciones.py` — encuesta con SMTP caído | STUB que falla | Estado: no relanza (no tumba el cierre de la inspección) |
| `test_notificaciones.py` — encuesta enviada | SPY sobre `_enviar` | Comportamiento: un mensaje, al destinatario correcto |
| `test_autenticacion.py` — códigos de recuperación | FAKE (archivo real en carpeta temporal) + SPY (`db.commit`) | Estado del archivo y una sola confirmación |
| `test_rutas_sesion_falsa.py` — rutas con sesión falsa | SPY sobre los filtros de la consulta | Seguridad: se filtra por el cliente dueño |
| `apiClient.msw.test.js` | STUB de MSW (200, 500 sin cuerpo, 422, error de Pydantic, HTML) + SPY del handler | Estado del dato y comportamiento de la petición |
| `06-login-api-con-errores.spec.js` | STUB de red con `page.route` (500 y credenciales incorrectas) | Mensaje que ve el usuario |
| `Encuestas.test.jsx` | STUB del módulo de servicio | Lo que muestra la pantalla según el backend |
| `componentesSimples.test.jsx` | SPY de `onChange` | Lo que sale del componente |

## Mutantes
- Back: quité el try/except de recuperar_clave → falló test_recuperar_clave_responde_503_si_el_servidor_de_correo_falla.
- Front: quité .catch(() => ({})) de parseResponse → fallaron el test de HTML y el de 500 sin cuerpo.

## Revisión de exceso de mocks
Revisé un test con la tabla de señales. test_recuperar_clave_envia_el_codigo_una_sola_vez: verifica la llamada porque enviar el correo ES el resultado; no mockea la unidad bajo prueba ni librerías de terceros (se reemplaza send_reset_email, función propia). Sin cambios necesarios.

## Capas
- Autor (Felipe): API + Front + E2E — dobles de prueba
- Autora (Luz): BD — API con PostgreSQL y Prisma (`api-semana05`)
- Revisor: de otra capa distinta a la del autor

## ¿Cómo lo ejecuto?
cd liftsafe-backend && uv run pytest
cd LiftSafe_FrontendV2 && npm test
cd e2e && pnpm test
