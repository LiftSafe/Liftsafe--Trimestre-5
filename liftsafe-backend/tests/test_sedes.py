"""Regla de negocio: sede del ascensor según cuántas sedes tenga el cliente."""
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.controllers.sede_controller import elegir_sede, sede_a_dict


def _sedes(*ids):
    return [SimpleNamespace(id_sede=i) for i in ids]


def test_cliente_sin_sedes_el_ascensor_queda_sin_sede():
    # Arrange
    sedes = _sedes()
    # Act
    resultado = elegir_sede(sedes, None)
    # Assert
    assert resultado is None


def test_cliente_con_una_sede_se_asigna_automaticamente():
    assert elegir_sede(_sedes(7), None) == 7


def test_cliente_con_varias_sedes_exige_elegir_una():
    with pytest.raises(HTTPException) as error:
        elegir_sede(_sedes(1, 2), None)
    assert error.value.status_code == 400
    assert "varias sedes" in error.value.detail


def test_cliente_con_varias_sedes_acepta_la_sede_elegida():
    assert elegir_sede(_sedes(1, 2, 3), 2) == 2


def test_rechaza_una_sede_de_otro_cliente():
    with pytest.raises(HTTPException) as error:
        elegir_sede(_sedes(1, 2), 99)
    assert error.value.status_code == 400
    assert "no pertenece" in error.value.detail


def test_sede_a_dict_expone_los_campos_del_formulario():
    sede = SimpleNamespace(id_sede=3, id_cliente=10, nombre="Sede Norte", direccion="Cra 1", ciudad="Bogotá")
    assert sede_a_dict(sede, 2) == {
        "id_sede": 3,
        "id_cliente": 10,
        "nombre": "Sede Norte",
        "direccion": "Cra 1",
        "ciudad": "Bogotá",
        "total_ascensores": 2,
    }
