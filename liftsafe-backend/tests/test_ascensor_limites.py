"""Semana 6 · tests UNITARIOS (sin BD) de la regla que corrige el hallazgo.

La BD rechazaba valores que el API aceptaba (→ 500). La regla vive en el
esquema y se prueba en su valor límite: el máximo pasa, uno más se rechaza.
"""
import pytest
from pydantic import ValidationError

from app.schemas.schemas import MAX_INT, AscensorCreate, AscensorUpdate

VALIDO = dict(
    id_cliente=1, codigo_interno="ASC-1", marca="Schindler", modelo="3300",
    numero_serie="SN-1", tipo_ascensor="Pasajeros", capacidad_kg=630, numero_pisos=8,
    ubicacion_exacta="Torre A", direccion_completa="Calle 1", ciudad="Bogotá", estado="Operativo",
)
LARGOS = {
    "codigo_interno": 50, "marca": 80, "modelo": 80, "numero_serie": 80, "tipo_ascensor": 50,
    "ubicacion_exacta": 200, "direccion_completa": 250, "ciudad": 100, "estado": 255,
}


@pytest.mark.parametrize("campo, maximo", LARGOS.items())
def test_crear_acepta_el_largo_maximo_de_la_columna(campo, maximo):
    assert len(getattr(AscensorCreate(**{**VALIDO, campo: "x" * maximo}), campo)) == maximo


@pytest.mark.parametrize("campo, maximo", LARGOS.items())
def test_crear_rechaza_un_caracter_mas_que_la_columna(campo, maximo):
    with pytest.raises(ValidationError):
        AscensorCreate(**{**VALIDO, campo: "x" * (maximo + 1)})


@pytest.mark.parametrize("campo", ["capacidad_kg", "numero_pisos", "capacidad_personas"])
def test_crear_acepta_el_maximo_de_int_y_rechaza_uno_mas(campo):
    assert getattr(AscensorCreate(**{**VALIDO, campo: MAX_INT}), campo) == MAX_INT
    with pytest.raises(ValidationError):
        AscensorCreate(**{**VALIDO, campo: MAX_INT + 1})


@pytest.mark.parametrize("campo, maximo", LARGOS.items())
def test_editar_aplica_los_mismos_limites(campo, maximo):
    assert len(getattr(AscensorUpdate(**{campo: "x" * maximo}), campo)) == maximo
    with pytest.raises(ValidationError):
        AscensorUpdate(**{campo: "x" * (maximo + 1)})


def test_editar_sin_campos_sigue_siendo_valido():
    assert AscensorUpdate().model_dump(exclude_none=True) == {}
