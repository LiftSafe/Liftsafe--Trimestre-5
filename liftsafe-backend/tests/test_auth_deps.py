"""Pruebas unitarias de get_current_user (app/utils/auth_deps.py): lectura del JWT y rol."""
from types import SimpleNamespace as N

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt

from app.config import settings
from app.utils.auth_deps import get_current_user


class FakeDB:
    """Doble mínimo de Session: db.query(...).filter(...).first() devuelve `usuario`."""

    def __init__(self, usuario=None):
        self.usuario = usuario

    def query(self, *_):
        return self

    def filter(self, *_):
        return self

    def first(self):
        return self.usuario


def token(**claims):
    return jwt.encode(claims, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def credenciales(**claims):
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token(**claims))


def test_devuelve_user_id_y_rol_del_token_sin_consultar_la_bd():
    # Arrange
    cred = credenciales(user_id=7, rol="Cliente")
    # Act
    usuario = get_current_user(cred, FakeDB())
    # Assert
    assert usuario == {"user_id": 7, "rol": "Cliente"}


def test_acepta_sub_cuando_no_hay_user_id():
    usuario = get_current_user(credenciales(sub="9", rol="Inspector"), FakeDB())
    assert usuario == {"user_id": 9, "rol": "Inspector"}


def test_rechaza_un_token_sin_user_id_ni_sub():
    with pytest.raises(HTTPException) as exc:
        get_current_user(credenciales(rol="Cliente"), FakeDB())
    assert exc.value.status_code == 401
    assert "user_id no encontrado" in exc.value.detail


def test_rechaza_un_token_firmado_con_otra_clave():
    mala = jwt.encode({"user_id": 1}, "otra-clave", algorithm=settings.ALGORITHM)
    cred = HTTPAuthorizationCredentials(scheme="Bearer", credentials=mala)
    with pytest.raises(HTTPException) as exc:
        get_current_user(cred, FakeDB())
    assert exc.value.status_code == 401


def test_con_correo_busca_el_usuario_y_toma_el_rol_de_la_bd():
    usuario_bd = N(id_usuario=42, rol=N(nombre_rol="Coordinador"))
    resultado = get_current_user(credenciales(sub="ana@x.com"), FakeDB(usuario_bd))
    assert resultado == {"user_id": 42, "rol": "Coordinador"}


def test_con_correo_inexistente_responde_404():
    with pytest.raises(HTTPException) as exc:
        get_current_user(credenciales(sub="nadie@x.com"), FakeDB(None))
    assert exc.value.status_code == 404


def test_sin_rol_en_el_token_usa_el_rol_de_la_bd():
    usuario_bd = N(id_usuario=5, rol=N(nombre_rol="Asesor"))
    resultado = get_current_user(credenciales(user_id=5), FakeDB(usuario_bd))
    assert resultado == {"user_id": 5, "rol": "Asesor"}


def test_sin_rol_ni_usuario_en_la_bd_el_rol_es_Usuario():
    resultado = get_current_user(credenciales(user_id=5), FakeDB(None))
    assert resultado == {"user_id": 5, "rol": "Usuario"}
