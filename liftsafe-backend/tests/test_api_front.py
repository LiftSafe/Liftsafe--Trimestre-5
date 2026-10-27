"""Pruebas de API — ángulo Front: el contrato exacto que consume la interfaz.

Se verifican los campos del JSON que React lee (LiftSafe_FrontendV2/src/services)
y el formato de error que la interfaz muestra (`detail` como texto o como lista
con `msg`, ver apiClient.js).
"""
from datetime import datetime

from jose import jwt

from app.config import settings
from tests.fakes import auth, fila


def test_login_exitoso_entrega_los_campos_que_guarda_el_frontend(client, monkeypatch):
    # Arrange: se simula la validación de credenciales (AES_DECRYPT necesita MySQL real)
    usuario = fila(correo="ana@example.com", id_usuario=7, nombre_completo="Ana Pérez", rol=fila(nombre_rol="Cliente"))
    monkeypatch.setattr("app.routes.auth.authenticate_user", lambda db, correo, clave: usuario)

    # Act
    respuesta = client.post("/auth/login", json={"correo": "ana@example.com", "contrasena": "Segura2024x"})

    # Assert
    cuerpo = respuesta.json()
    assert respuesta.status_code == 200
    assert respuesta.headers["content-type"] == "application/json"
    assert set(cuerpo) == {"access_token", "token_type", "rol", "nombre"}
    assert cuerpo["token_type"] == "bearer"
    assert (cuerpo["rol"], cuerpo["nombre"]) == ("Cliente", "Ana Pérez")


def test_el_token_del_login_lleva_el_usuario_y_el_rol(client, monkeypatch):
    usuario = fila(correo="ana@example.com", id_usuario=7, nombre_completo="Ana", rol=fila(nombre_rol="Inspector"))
    monkeypatch.setattr("app.routes.auth.authenticate_user", lambda db, correo, clave: usuario)

    token = client.post("/auth/login", json={"correo": "ana@example.com", "contrasena": "x"}).json()["access_token"]

    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert (payload["user_id"], payload["rol"], payload["sub"]) == (7, "Inspector", "ana@example.com")


def test_login_con_credenciales_incorrectas_responde_401_con_detail_de_texto(client, monkeypatch):
    monkeypatch.setattr("app.routes.auth.authenticate_user", lambda db, correo, clave: None)

    respuesta = client.post("/auth/login", json={"correo": "ana@example.com", "contrasena": "mala"})

    assert respuesta.status_code == 401
    assert respuesta.json() == {"detail": "Credenciales incorrectas"}
    assert respuesta.headers["content-type"] == "application/json"


def test_login_con_correo_invalido_responde_422_con_lista_de_errores_con_msg(client):
    respuesta = client.post("/auth/login", json={"correo": "no-es-un-correo", "contrasena": "x"})

    assert respuesta.status_code == 422
    errores = respuesta.json()["detail"]
    assert errores[0]["loc"] == ["body", "correo"]
    assert "msg" in errores[0]  # apiClient.js une los `msg` para mostrarlos


def test_auth_me_entrega_los_campos_del_perfil(client, db):
    # Arrange: la consulta devuelve (Usuario, nombre_rol)
    usuario = fila(
        id_usuario=7, nombre_completo="Ana Pérez", correo="ana@example.com", telefono="3001234567",
        tipo_documento="CC", documento_identidad="123", estado="activo", fecha_registro=datetime(2026, 1, 5),
    )
    db.firsts = [(usuario, "Cliente")]

    respuesta = client.get("/auth/me", headers=auth("Cliente", 7, correo="ana@example.com"))

    assert respuesta.status_code == 200
    assert respuesta.json() == {
        "id_usuario": 7,
        "nombre_completo": "Ana Pérez",
        "correo": "ana@example.com",
        "rol": "Cliente",
        "telefono": "3001234567",
        "tipo_documento": "CC",
        "documento_identidad": "123",
        "estado": "activo",
        "fecha_registro": "2026-01-05T00:00:00",
    }


def test_listado_de_ascensores_entrega_exactamente_los_campos_que_usa_la_tabla(client, db):
    ascensor = fila(
        id_ascensor=1, codigo_interno="ASC-001", marca="Otis", modelo="Gen2", tipo_ascensor="Pasajeros",
        capacidad_kg=630, ciudad="Bogotá", estado="Activo", id_sede=None, sede=None,
    )
    db.alls = [[(ascensor, "Edificio Central")]]

    respuesta = client.get("/ascensores/listado", headers=auth("Administrador"))

    assert respuesta.status_code == 200
    fila_json = respuesta.json()[0]
    assert set(fila_json) == {
        "id_ascensor", "codigo_interno", "marca", "modelo", "tipo_ascensor",
        "capacidad_kg", "ciudad", "estado", "cliente", "id_sede", "sede",
    }
    assert fila_json["cliente"] == "Edificio Central"
    assert fila_json["sede"] is None


def test_listado_de_ascensores_de_un_cliente_que_no_existe_en_la_bd_responde_404(client, db):
    db.firsts = [None]

    respuesta = client.get("/ascensores/listado", headers=auth("Cliente", 7))

    assert respuesta.status_code == 404
    assert respuesta.json() == {"detail": "Usuario no encontrado"}
