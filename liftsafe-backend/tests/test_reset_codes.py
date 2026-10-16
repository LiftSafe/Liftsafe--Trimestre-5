"""Pruebas unitarias del código de recuperación de clave (app/controllers/auth_controller.py).

La regla depende de la hora actual (FIRST: Repeatable). Aquí los tiempos se fijan
RELATIVOS a ahora con márgenes grandes, y no se toca el disco ni la red.
"""
from datetime import datetime, timedelta

import pytest

from app.controllers import auth_controller as ac


@pytest.fixture(autouse=True)
def aislar_estado(monkeypatch):
    """Sin archivo en disco y con el diccionario de códigos vacío en cada test."""
    monkeypatch.setattr(ac, "_save_codes", lambda codes: None)
    monkeypatch.setattr(ac, "_load_codes", lambda: {})
    monkeypatch.setattr(ac, "_reset_codes", {})


def guardar(correo, code="123456", vence_en=timedelta(minutes=30)):
    ac._reset_codes[correo] = {"code": code, "expires": datetime.utcnow() + vence_en}


def test_codigo_correcto_y_vigente_es_valido():
    guardar("ana@x.com", "123456")
    assert ac.verify_reset_code("ana@x.com", "123456") is True


def test_codigo_se_puede_usar_una_sola_vez():
    guardar("ana@x.com", "123456")
    ac.verify_reset_code("ana@x.com", "123456")
    assert ac.verify_reset_code("ana@x.com", "123456") is False


def test_correo_sin_codigo_es_invalido():
    assert ac.verify_reset_code("nadie@x.com", "123456") is False


def test_codigo_incorrecto_es_invalido_y_no_se_consume():
    guardar("ana@x.com", "123456")
    assert ac.verify_reset_code("ana@x.com", "000000") is False
    assert ac.verify_reset_code("ana@x.com", "123456") is True  # el correcto sigue vivo


def test_codigo_vencido_es_invalido_y_se_elimina():
    guardar("ana@x.com", "123456", vence_en=timedelta(minutes=-1))
    assert ac.verify_reset_code("ana@x.com", "123456") is False
    assert "ana@x.com" not in ac._reset_codes


def test_acepta_el_codigo_como_numero():
    guardar("ana@x.com", "123456")
    assert ac.verify_reset_code("ana@x.com", 123456) is True


def test_genera_un_codigo_de_6_digitos_que_vence_en_una_hora():
    # Arrange
    antes = datetime.utcnow()
    # Act
    code = ac.generate_reset_code("ana@x.com")
    # Assert
    assert len(code) == 6 and code.isdigit()
    vence = ac._reset_codes["ana@x.com"]["expires"]
    assert antes + timedelta(minutes=59) < vence < antes + timedelta(minutes=61)
