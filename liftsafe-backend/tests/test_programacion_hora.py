"""Pruebas unitarias de _parse_hora (app/routes/programacion.py)."""
from datetime import time

import pytest

from app.routes.programacion import _parse_hora


@pytest.mark.parametrize("entrada", [None, ""])
def test_sin_hora_devuelve_none(entrada):
    assert _parse_hora(entrada) is None


@pytest.mark.parametrize(
    "entrada, esperado",
    [
        ("08:30", time(8, 30)),
        ("08:30:15", time(8, 30, 15)),
        (" 08:30 ", time(8, 30)),     # recorta espacios
        ("00:00", time(0, 0)),        # límite inferior
        ("23:59", time(23, 59)),      # límite superior
    ],
)
def test_interpreta_horas_validas(entrada, esperado):
    assert _parse_hora(entrada) == esperado


@pytest.mark.parametrize("entrada", ["24:00", "12:60", "abc", "8"])
def test_hora_invalida_lanza_value_error(entrada):
    with pytest.raises(ValueError):
        _parse_hora(entrada)
