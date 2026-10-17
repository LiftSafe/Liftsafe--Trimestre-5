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


# ── Valores límite con reloj fijo (semana 2, Esteban) ──────────────────
# Para no depender de la hora real (FIRST: Repeatable) se reemplaza el
# datetime del módulo por uno cuyo utcnow() devuelve siempre AHORA.

AHORA = datetime(2026, 10, 16, 12, 0, 0)


@pytest.fixture
def reloj_fijo(monkeypatch):
    class RelojFijo(datetime):
        @classmethod
        def utcnow(cls):
            return AHORA

    monkeypatch.setattr(ac, "datetime", RelojFijo)


@pytest.mark.parametrize(
    "vence_en, esperado",
    [
        (timedelta(seconds=1), True),  # justo antes del límite
        (timedelta(0), True),  # límite exacto: vence en este instante, aún sirve
        (timedelta(microseconds=-1), False),  # justo después del límite
    ],
    ids=["un-segundo-antes", "instante-exacto", "un-microsegundo-despues"],
)
def test_vencimiento_del_codigo_en_el_valor_limite(reloj_fijo, vence_en, esperado):
    # Arrange
    ac._reset_codes["ana@x.com"] = {"code": "123456", "expires": AHORA + vence_en}
    # Act
    resultado = ac.verify_reset_code("ana@x.com", "123456")
    # Assert
    assert resultado is esperado


def test_codigo_generado_vence_exactamente_una_hora_despues(reloj_fijo):
    # Arrange / Act
    ac.generate_reset_code("ana@x.com")
    # Assert
    assert ac._reset_codes["ana@x.com"]["expires"] == AHORA + timedelta(hours=1)


def test_codigo_de_un_correo_no_sirve_para_otro():
    # Arrange
    guardar("ana@x.com", "111111")
    guardar("luis@x.com", "222222")
    # Act
    resultado = ac.verify_reset_code("luis@x.com", "111111")
    # Assert
    assert resultado is False
    assert ac.verify_reset_code("ana@x.com", "111111") is True


def test_pedir_un_codigo_nuevo_invalida_el_anterior(monkeypatch):
    # Arrange: el azar se fija para que los dos códigos sean distintos
    secuencias = iter([list("111111"), list("222222")])
    monkeypatch.setattr(ac.random, "choices", lambda *a, **k: next(secuencias))
    ac.generate_reset_code("ana@x.com")
    ac.generate_reset_code("ana@x.com")
    # Act
    viejo = ac.verify_reset_code("ana@x.com", "111111")
    # Assert
    assert viejo is False
    assert ac.verify_reset_code("ana@x.com", "222222") is True
