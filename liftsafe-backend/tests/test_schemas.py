"""Pruebas unitarias de las reglas de validación de app/schemas/schemas.py."""
import pytest
from pydantic import ValidationError

from app.schemas.schemas import (
    EncuestaRespuestaCreate,
    UsuarioCreate,
    UsuarioRegister,
    UsuarioUpdate,
)
from app.utils.auth_deps import CLIENTE_ROL_ID, INSPECTOR_ROL_ID


def datos_registro(**cambios):
    base = {
        "nombre_completo": "Cliente Prueba",
        "correo": "cliente@example.com",
        "contrasena": "Abcdefg1",
        "tipo_documento": "CC",
        "documento_identidad": "1098765432",
        "id_rol": CLIENTE_ROL_ID,
    }
    base.update(cambios)
    return base


# ── UsuarioRegister ──────────────────────────────────────────────────
def test_registro_valido():
    usuario = UsuarioRegister(**datos_registro())
    assert usuario.correo == "cliente@example.com"
    assert usuario.id_rol == CLIENTE_ROL_ID


def test_registro_rechaza_rol_que_no_es_cliente():
    with pytest.raises(ValidationError) as exc:
        UsuarioRegister(**datos_registro(id_rol=INSPECTOR_ROL_ID))
    assert "Solo los clientes pueden registrarse" in str(exc.value)


def test_registro_rechaza_contrasena_debil():
    with pytest.raises(ValidationError):
        UsuarioRegister(**datos_registro(contrasena="abc"))


def test_registro_rechaza_correo_invalido():
    with pytest.raises(ValidationError):
        UsuarioRegister(**datos_registro(correo="no-es-un-correo"))


def test_registro_rechaza_tipo_documento_invalido():
    with pytest.raises(ValidationError):
        UsuarioRegister(**datos_registro(tipo_documento="XYZ"))


# ── UsuarioCreate (lo crea un administrador) ─────────────────────────
def test_usuario_create_rechaza_rol_cliente():
    with pytest.raises(ValidationError) as exc:
        UsuarioCreate(**datos_registro(id_rol=CLIENTE_ROL_ID))
    assert "Los clientes deben registrarse por su cuenta" in str(exc.value)


def test_usuario_create_acepta_rol_inspector():
    usuario = UsuarioCreate(**datos_registro(id_rol=INSPECTOR_ROL_ID))
    assert usuario.id_rol == INSPECTOR_ROL_ID


# ── UsuarioUpdate ────────────────────────────────────────────────────
def test_usuario_update_sin_contrasena_es_valido():
    assert UsuarioUpdate(nombre_completo="Nuevo Nombre").contrasena is None


def test_usuario_update_valida_contrasena_si_viene():
    with pytest.raises(ValidationError):
        UsuarioUpdate(contrasena="abc")


# ── Encuesta: calificación de 1 a 5 ──────────────────────────────────
@pytest.mark.parametrize("nota", [1, 3, 5])
def test_calificacion_valida(nota):
    assert EncuestaRespuestaCreate(calificacion=nota).calificacion == nota


@pytest.mark.parametrize("nota", [0, 6, -1])
def test_calificacion_fuera_de_rango(nota):
    with pytest.raises(ValidationError) as exc:
        EncuestaRespuestaCreate(calificacion=nota)
    assert "entre 1 y 5" in str(exc.value)
