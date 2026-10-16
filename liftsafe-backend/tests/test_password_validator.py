"""Pruebas unitarias de app/utils/password_validator.py (patrón AAA)."""
import json
from pathlib import Path

import pytest

from app.utils.password_validator import (
    get_password_errors,
    has_consecutive_digits,
    validate_password,
)

# Tabla de casos COMPARTIDA con el frontend (shared/password_cases.json).
# Si alguien cambia una regla en un solo lado, una de las dos suites falla.
CASOS_COMPARTIDOS = json.loads(
    (Path(__file__).resolve().parents[2] / "shared" / "password_cases.json").read_text(encoding="utf-8")
)


@pytest.mark.parametrize("caso", CASOS_COMPARTIDOS, ids=lambda c: repr(c["password"]))
def test_errores_coinciden_con_tabla_compartida(caso):
    # Arrange
    password = caso["password"]

    # Act
    errores = get_password_errors(password)

    # Assert
    assert errores == caso["errors"]


@pytest.mark.parametrize(
    "password, esperado",
    [
        ("123", True),  # ascendente
        ("987", True),  # descendente
        ("a456b", True),  # en medio del texto
        ("135", False),  # no consecutivos
        ("12", False),  # muy corto
        ("abc", False),  # sin dígitos
    ],
)
def test_has_consecutive_digits(password, esperado):
    assert has_consecutive_digits(password) is esperado


def test_validate_password_acepta_contrasena_valida():
    # No debe lanzar excepción
    assert validate_password("Abcdefg1") is None


def test_validate_password_lanza_value_error_con_el_primer_error():
    with pytest.raises(ValueError) as exc:
        validate_password("abc")
    assert str(exc.value) == "Mínimo 8 caracteres"
