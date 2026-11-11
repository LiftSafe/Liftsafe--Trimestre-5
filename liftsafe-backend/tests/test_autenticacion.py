"""Pruebas sin BD ni red (semana 5): tokens, permisos y rutas de /auth.

La sesión de BD es un doble (MagicMock): STUB cuando devuelve datos preparados,
SPY cuando se verifica que se llamó (commit/execute).
"""
from datetime import date, datetime, timedelta
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient
from jose import JWTError, jwt

from app.config import settings
from app.controllers import auth_controller as ac
from app.controllers import inspeccion_controller as ic
from app.database import get_db
from app.main import app
from app.utils import auth_deps


@pytest.fixture
def db(mocker):
    sesion = mocker.MagicMock()
    app.dependency_overrides[get_db] = lambda: sesion
    yield sesion
    app.dependency_overrides.clear()


@pytest.fixture
def client(db):
    return TestClient(app)


def credenciales(payload):
    token = ac.create_access_token(payload)
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def usuario_falso(id_usuario=9, rol="Cliente"):
    return SimpleNamespace(id_usuario=id_usuario, rol=SimpleNamespace(nombre_rol=rol))


def bd_con_clave(mocker, clave):
    sesion = mocker.MagicMock()
    sesion.execute.return_value.mappings.return_value.first.return_value = (
        {"pwd": clave} if clave is not None else None
    )
    return sesion


# ── auth_controller: tokens ───────────────────────────────────────────────────

def test_token_de_reset_devuelve_el_correo():
    assert ac.verify_reset_token(ac.create_reset_token("ana@example.com")) == "ana@example.com"


def test_un_token_de_acceso_no_sirve_como_token_de_reset():
    token = ac.create_access_token({"sub": "ana@example.com"})
    assert ac.verify_reset_token(token) is None


def test_un_token_basura_no_sirve_como_token_de_reset():
    assert ac.verify_reset_token("basura") is None


def test_token_de_acceso_vencido_no_se_puede_decodificar():
    token = ac.create_access_token({"sub": "a@x.com"}, expires_delta=timedelta(minutes=-1))
    with pytest.raises(JWTError):
        jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def test_hash_password_devuelve_el_texto_tal_cual():
    # MySQL encripta con AES_ENCRYPT; aquí no se transforma nada
    assert ac.hash_password("Clave#Segura7") == "Clave#Segura7"


# ── auth_controller: contraseña (BD falsa) ────────────────────────────────────

def test_verify_password_acepta_la_clave_correcta(mocker):
    db = bd_con_clave(mocker, b"Clave1")  # MySQL devuelve bytes
    assert ac.verify_password("Clave1", "x", db, "a@x.com") is True


def test_verify_password_rechaza_clave_incorrecta_o_usuario_sin_clave(mocker):
    assert ac.verify_password("otra", "x", bd_con_clave(mocker, b"Clave1"), "a@x.com") is False
    assert ac.verify_password("Clave1", "x", bd_con_clave(mocker, None), "a@x.com") is False


def test_verify_password_sin_bd_es_falso():
    assert ac.verify_password("Clave1", "x") is False


def test_authenticate_user_devuelve_el_usuario_con_clave_correcta(mocker):
    db = bd_con_clave(mocker, "Clave1")  # también acepta str
    usuario = usuario_falso()
    db.query.return_value.join.return_value.filter.return_value.first.return_value = usuario
    assert ac.authenticate_user(db, "a@x.com", "Clave1") is usuario


def test_authenticate_user_devuelve_none_con_clave_incorrecta(mocker):
    db = bd_con_clave(mocker, b"Clave1")
    db.query.return_value.join.return_value.filter.return_value.first.return_value = usuario_falso()
    assert ac.authenticate_user(db, "a@x.com", "otra") is None


def test_authenticate_user_devuelve_none_si_el_correo_no_existe(mocker):
    db = mocker.MagicMock()
    db.query.return_value.join.return_value.filter.return_value.first.return_value = None
    assert ac.authenticate_user(db, "nadie@x.com", "Clave1") is None
    db.execute.assert_not_called()  # SPY: ni siquiera consulta la clave


def test_los_codigos_se_guardan_y_se_leen_de_un_archivo(tmp_path, monkeypatch):
    # FAKE: un archivo real pero en una carpeta temporal, no el reset_codes.json del proyecto
    monkeypatch.setattr(ac, "CODES_FILE", str(tmp_path / "codes.json"))
    vence = datetime(2030, 1, 1, 12, 0)
    ac._save_codes({"a@x.com": {"code": "123456", "expires": vence}})
    assert ac._load_codes() == {"a@x.com": {"code": "123456", "expires": vence}}


def test_sin_archivo_de_codigos_se_empieza_vacio(tmp_path, monkeypatch):
    monkeypatch.setattr(ac, "CODES_FILE", str(tmp_path / "no-existe.json"))
    assert ac._load_codes() == {}


# ── auth_deps: usuario actual ─────────────────────────────────────────────────

def test_get_current_user_usa_user_id_y_rol_del_token():
    creds = credenciales({"user_id": 7, "rol": "Inspector", "sub": "a@x.com"})
    assert auth_deps.get_current_user(creds, db=None) == {"user_id": 7, "rol": "Inspector"}


def test_get_current_user_busca_por_correo_cuando_el_token_solo_trae_sub(mocker):
    db = mocker.MagicMock()
    db.query.return_value.filter.return_value.first.return_value = usuario_falso(9, "Cliente")
    resultado = auth_deps.get_current_user(credenciales({"sub": "a@x.com"}), db)
    assert resultado == {"user_id": 9, "rol": "Cliente"}


def test_get_current_user_responde_404_si_el_correo_del_token_no_existe(mocker):
    db = mocker.MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException) as error:
        auth_deps.get_current_user(credenciales({"sub": "a@x.com"}), db)
    assert error.value.status_code == 404


def test_get_current_user_completa_el_rol_desde_la_bd(mocker):
    db = mocker.MagicMock()
    db.query.return_value.filter.return_value.first.return_value = usuario_falso(5, "Asesor")
    resultado = auth_deps.get_current_user(credenciales({"user_id": 5}), db)
    assert resultado == {"user_id": 5, "rol": "Asesor"}


def test_get_current_user_usa_un_rol_generico_si_el_usuario_no_existe(mocker):
    db = mocker.MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    resultado = auth_deps.get_current_user(credenciales({"user_id": 5}), db)
    assert resultado == {"user_id": 5, "rol": "Usuario"}


def test_get_current_user_rechaza_un_token_sin_identidad():
    with pytest.raises(HTTPException) as error:
        auth_deps.get_current_user(credenciales({"foo": 1}), db=None)
    assert error.value.status_code == 401


def test_get_current_user_rechaza_un_token_invalido():
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="basura")
    with pytest.raises(HTTPException) as error:
        auth_deps.get_current_user(creds, db=None)
    assert error.value.status_code == 401


# ── auth_deps: roles ──────────────────────────────────────────────────────────

@pytest.mark.parametrize("rol", ["Cliente", "Inspector", None])
def test_require_admin_rechaza_a_los_demas_roles(rol):
    with pytest.raises(HTTPException) as error:
        auth_deps.require_admin({"rol": rol})
    assert error.value.status_code == 403


def test_require_admin_deja_pasar_al_administrador():
    usuario = {"rol": "Administrador"}
    assert auth_deps.require_admin(usuario) is usuario


@pytest.mark.parametrize("rol", ["Administrador", "Coordinador"])
def test_require_coordinador_acepta_coordinador_y_administrador(rol):
    assert auth_deps.require_coordinador({"rol": rol}) == {"rol": rol}


def test_require_coordinador_rechaza_a_un_inspector():
    with pytest.raises(HTTPException) as error:
        auth_deps.require_coordinador({"rol": "Inspector"})
    assert error.value.status_code == 403


def test_require_inspector_solo_acepta_inspectores():
    assert auth_deps.require_inspector({"rol": "Inspector"}) == {"rol": "Inspector"}
    with pytest.raises(HTTPException) as error:
        auth_deps.require_inspector({"rol": "Cliente"})
    assert error.value.status_code == 403


# ── auth_deps: versiones que leen la petición ─────────────────────────────────

def peticion(token=None):
    return SimpleNamespace(headers={"authorization": f"Bearer {token}"} if token else {})


def test_rol_desde_la_peticion_devuelve_rol_sub_y_user_id():
    token = ac.create_access_token({"rol": "Cliente", "sub": "a@x.com", "user_id": 3})
    assert auth_deps.get_current_user_role_from_request(peticion(token)) == ("Cliente", "a@x.com", 3)


def test_rol_desde_la_peticion_exige_token():
    with pytest.raises(HTTPException) as error:
        auth_deps.get_current_user_role_from_request(peticion())
    assert error.value.status_code == 401


def test_rol_desde_la_peticion_rechaza_token_invalido():
    with pytest.raises(HTTPException) as error:
        auth_deps.get_current_user_role_from_request(peticion("basura"))
    assert error.value.status_code == 401


def test_get_current_user_role_devuelve_los_datos_del_token():
    creds = credenciales({"rol": "Cliente", "sub": "a@x.com", "user_id": 3})
    assert auth_deps.get_current_user_role(creds) == ("Cliente", "a@x.com", 3)


def test_get_current_user_role_rechaza_token_invalido():
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="basura")
    with pytest.raises(HTTPException) as error:
        auth_deps.get_current_user_role(creds)
    assert error.value.status_code == 401


def test_require_admin_from_request_solo_acepta_administradores():
    admin = ac.create_access_token({"rol": "Administrador"})
    cliente = ac.create_access_token({"rol": "Cliente"})
    assert auth_deps.require_admin_from_request(peticion(admin)) == "Administrador"
    with pytest.raises(HTTPException) as error:
        auth_deps.require_admin_from_request(peticion(cliente))
    assert error.value.status_code == 403


# ── Rutas /auth (BD falsa) ────────────────────────────────────────────────────

REGISTRO = {
    "nombre_completo": "Ana Prueba",
    "correo": "ana@example.com",
    "contrasena": "Clave#Segura7",
    "tipo_documento": "CC",
    "documento_identidad": "1098765432",
}


def test_login_correcto_devuelve_un_token(client, mocker):
    mocker.patch("app.routes.auth.authenticate_user", return_value=usuario_con_correo())
    respuesta = client.post("/auth/login", json={"correo": "a@x.com", "contrasena": "Clave1"})
    assert respuesta.status_code == 200
    assert respuesta.json()["access_token"]
    assert respuesta.json()["token_type"] == "bearer"


def usuario_con_correo():
    return SimpleNamespace(
        correo="a@x.com", id_usuario=1, nombre_completo="Ana",
        rol=SimpleNamespace(nombre_rol="Cliente"),
    )


def test_login_con_credenciales_incorrectas_responde_401(client, mocker):
    mocker.patch("app.routes.auth.authenticate_user", return_value=None)
    respuesta = client.post("/auth/login", json={"correo": "a@x.com", "contrasena": "mala"})
    assert respuesta.status_code == 401
    assert respuesta.json()["detail"] == "Credenciales incorrectas"


def test_registro_correcto_guarda_al_cliente_y_confirma(client, db):
    db.query.return_value.filter.return_value.first.side_effect = [None, object()]  # sin duplicado, rol existe
    respuesta = client.post("/auth/register", json=REGISTRO)
    assert respuesta.status_code == 200
    assert respuesta.json()["message"] == "Usuario registrado exitosamente"
    db.commit.assert_called_once()  # SPY


def test_registro_con_correo_repetido_responde_400_y_no_guarda(client, db):
    db.query.return_value.filter.return_value.first.return_value = object()
    respuesta = client.post("/auth/register", json=REGISTRO)
    assert respuesta.status_code == 400
    assert respuesta.json()["detail"] == "El correo ya está registrado"
    db.commit.assert_not_called()


def test_registro_sin_rol_cliente_configurado_responde_400(client, db):
    db.query.return_value.filter.return_value.first.side_effect = [None, None]
    respuesta = client.post("/auth/register", json=REGISTRO)
    assert respuesta.status_code == 400
    assert respuesta.json()["detail"] == "Rol Cliente no configurado"


def test_registro_con_otro_rol_es_rechazado_por_validacion(client):
    respuesta = client.post("/auth/register", json={**REGISTRO, "id_rol": 1})
    assert respuesta.status_code == 422


def test_reset_clave_con_codigo_valido_cambia_la_clave(client, db, mocker):
    mocker.patch("app.routes.auth.verify_reset_code", return_value=True)
    respuesta = client.post(
        "/auth/reset-clave",
        json={"correo": "a@x.com", "code": "123456", "nueva_contrasena": "Clave#Nueva7"},
    )
    assert respuesta.status_code == 200
    db.execute.assert_called_once()
    db.commit.assert_called_once()


def test_reset_clave_con_codigo_invalido_responde_400_y_no_toca_la_bd(client, db, mocker):
    mocker.patch("app.routes.auth.verify_reset_code", return_value=False)
    respuesta = client.post(
        "/auth/reset-clave",
        json={"correo": "a@x.com", "code": "000000", "nueva_contrasena": "Clave#Nueva7"},
    )
    assert respuesta.status_code == 400
    assert respuesta.json()["detail"] == "Código inválido o expirado"
    db.execute.assert_not_called()


def test_me_con_token_basura_responde_401(client):
    respuesta = client.get("/auth/me", headers={"Authorization": "Bearer basura"})
    assert respuesta.status_code == 401


def test_me_con_token_sin_correo_responde_401(client):
    token = ac.create_access_token({"foo": 1})
    respuesta = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 401


def test_me_de_un_usuario_que_ya_no_existe_responde_404(client, db):
    db.query.return_value.join.return_value.filter.return_value.first.return_value = None
    token = ac.create_access_token({"sub": "a@x.com"})
    respuesta = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert respuesta.status_code == 404


# ── inspeccion_controller ─────────────────────────────────────────────────────

def test_crear_inspeccion_acepta_la_fecha_como_texto_y_aplica_valores_por_defecto(mocker):
    db = mocker.MagicMock()
    datos = {"fecha_programada": "2026-12-01", "id_ascensor": 3}

    inspeccion = ic.crear_inspeccion(db, datos, id_inspector=4)

    solicitud, programacion, creada = [llamada.args[0] for llamada in db.add.call_args_list]
    assert solicitud.tipo_servicio == "Periódica"
    assert solicitud.id_cliente == 1
    assert programacion.id_inspector == 4
    assert programacion.fecha_programada == date(2026, 12, 1)
    assert inspeccion is creada
    assert inspeccion.estado == "Programada"
    db.commit.assert_called_once()  # SPY: todo se confirma una sola vez