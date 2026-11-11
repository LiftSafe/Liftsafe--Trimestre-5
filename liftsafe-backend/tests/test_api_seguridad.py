"""Pruebas de API — ángulo E2E (transversal): seguridad y contrato de errores.

Parte 1: endpoints protegidos con los tres casos (401, 403, autorizado).
Parte 2: el contrato de errores de TODO el API: siempre JSON con `detail` y
         sin stack traces, SQL ni mensajes internos.
"""
import pytest

from tests.fakes import FakeSession, auth, token_vencido

ASCENSOR = {
    "id_cliente": 5, "codigo_interno": "A-1", "marca": "Otis", "modelo": "G", "numero_serie": "S",
    "tipo_ascensor": "P", "capacidad_kg": 1, "numero_pisos": 1, "ubicacion_exacta": "x",
    "direccion_completa": "x", "ciudad": "x", "estado": "Activo",
}

# (método, ruta, cuerpo) de endpoints que exigen sesión
PROTEGIDOS = [
    ("get", "/auth/me", None),
    ("get", "/ascensores/listado", None),
    ("post", "/ascensores/", ASCENSOR),
    ("delete", "/ascensores/1", None),
    ("get", "/clientes/", None),
    ("get", "/usuarios/listado", None),
    ("delete", "/usuarios/1", None),
    ("get", "/usuarios/perfil/1", None),
    ("get", "/usuarios/dashboard/admin", None),
    ("get", "/usuarios/dashboard/cliente/1", None),
    ("get", "/usuarios/dashboard/inspector/1", None),
]


def _enviar(client, metodo, ruta, cuerpo, headers=None):
    return getattr(client, metodo)(ruta, headers=headers, **({"json": cuerpo} if cuerpo else {}))


# ── 401: sin autenticar ──────────────────────────────────────────────────────
@pytest.mark.parametrize("metodo,ruta,cuerpo", PROTEGIDOS)
def test_endpoint_protegido_sin_token_responde_401(client, metodo, ruta, cuerpo):
    respuesta = _enviar(client, metodo, ruta, cuerpo)

    assert respuesta.status_code == 401
    assert isinstance(respuesta.json()["detail"], str)


def test_token_basura_responde_401_sin_filtrar_el_mensaje_interno_de_la_libreria(client):
    respuesta = client.get("/usuarios/perfil/1", headers={"Authorization": "Bearer abc.def.ghi"})

    assert respuesta.status_code == 401
    assert respuesta.json() == {"detail": "Token inválido"}


def test_token_vencido_responde_401(client):
    respuesta = client.get("/ascensores/listado", headers={"Authorization": f"Bearer {token_vencido()}"})

    assert respuesta.status_code == 401
    assert respuesta.json() == {"detail": "Token inválido"}


def test_token_firmado_con_otra_clave_responde_401(client):
    from jose import jwt

    falso = jwt.encode({"user_id": 1, "rol": "Administrador"}, "clave-del-atacante", algorithm="HS256")

    respuesta = client.get("/ascensores/listado", headers={"Authorization": f"Bearer {falso}"})

    assert respuesta.status_code == 401


# ── 403: autenticado pero sin permiso ────────────────────────────────────────
def test_cliente_no_puede_listar_clientes_responde_403(client):
    respuesta = client.get("/clientes/", headers=auth("Cliente"))

    assert respuesta.status_code == 403
    assert respuesta.json() == {"detail": "No autorizado para ver los clientes"}


def test_inspector_no_puede_crear_ascensores_responde_403(client):
    respuesta = client.post("/ascensores/", json=ASCENSOR, headers=auth("Inspector"))

    assert respuesta.status_code == 403
    assert respuesta.json() == {"detail": "No autorizado para crear ascensores"}


def test_director_tecnico_no_puede_eliminar_ascensores_responde_403(client):
    respuesta = client.delete("/ascensores/1", headers=auth("Director Técnico"))

    assert respuesta.status_code == 403


def test_coordinador_no_puede_eliminar_usuarios_responde_403(client):
    respuesta = client.delete("/usuarios/1", headers=auth("Coordinador"))

    assert respuesta.status_code == 403
    assert respuesta.json() == {"detail": "Solo el administrador puede realizar esta acción"}


def test_cliente_no_puede_crear_sedes_responde_403(client):
    respuesta = client.post("/clientes/5/sedes", json={"nombre": "Norte"}, headers=auth("Cliente", 5))

    assert respuesta.status_code == 403


# ── Autorizado ───────────────────────────────────────────────────────────────
def test_administrador_lista_clientes_responde_200(client):
    respuesta = client.get("/clientes/", headers=auth("Administrador"))

    assert respuesta.status_code == 200
    assert respuesta.json() == []


def test_usuario_autenticado_consulta_un_perfil_responde_200(client, db):
    db.exec_rows = [{
        "id_usuario": 1, "nombre_completo": "Ana", "correo": "ana@example.com",
        "nombre_rol": "Cliente", "telefono": None, "estado": "activo", "id_rol": 6,
    }]

    respuesta = client.get("/usuarios/perfil/1", headers=auth("Cliente", 1))

    assert respuesta.status_code == 200
    assert respuesta.json()["rol"] == "Cliente"


def test_administrador_crea_una_sede_responde_201_con_la_sede(client, db):
    from tests.fakes import fila

    db.firsts = [fila(id_usuario=5), None]  # el cliente existe; no hay sede repetida

    respuesta = client.post(
        "/clientes/5/sedes",
        json={"nombre": "Norte", "direccion": "Cra 1", "ciudad": "Bogotá"},
        headers=auth("Administrador"),
    )

    assert respuesta.status_code == 201
    assert respuesta.json() == {
        "id_sede": 99, "id_cliente": 5, "nombre": "Norte", "direccion": "Cra 1",
        "ciudad": "Bogotá", "total_ascensores": 0,
    }


# ── Contrato de errores de todo el API ───────────────────────────────────────
def test_json_mal_formado_responde_400_con_detail_json(client):
    respuesta = client.post("/auth/login", content='{"correo":', headers={"Content-Type": "application/json"})

    assert respuesta.status_code == 400
    assert respuesta.json() == {"detail": "Cuerpo de la petición mal formado"}
    assert respuesta.headers["content-type"] == "application/json"


def test_tipos_incorrectos_responden_422_con_el_campo_en_error(client):
    respuesta = client.post("/auth/login", json={"correo": 123, "contrasena": ["x"]})

    assert respuesta.status_code == 422
    campos = {tuple(e["loc"]) for e in respuesta.json()["detail"]}
    assert ("body", "correo") in campos


def test_ruta_inexistente_responde_404_en_json(client):
    respuesta = client.get("/esta-ruta-no-existe")

    assert respuesta.status_code == 404
    assert respuesta.json() == {"detail": "Not Found"}


def test_metodo_no_permitido_responde_405_en_json(client):
    respuesta = client.delete("/auth/login")

    assert respuesta.status_code == 405
    assert isinstance(respuesta.json()["detail"], str)


def test_error_inesperado_responde_500_json_sin_sql_ni_stack_trace(client, db):
    # Arrange: la BD "se cae" con un mensaje que contiene SQL y datos internos
    db.error = RuntimeError("(pymysql.err.OperationalError) (2003, \"Can't connect\") SELECT * FROM usuario WHERE clave='x'")

    # Act
    respuesta = client.get("/ascensores/listado", headers=auth("Administrador"))

    # Assert
    assert respuesta.status_code == 500
    assert respuesta.headers["content-type"] == "application/json"
    assert respuesta.json() == {"detail": "Error interno del servidor"}
    for pista in ("SELECT", "pymysql", "Traceback", "RuntimeError", "usuario"):
        assert pista not in respuesta.text
