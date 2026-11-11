"""RNF-011: validaciones de la administración de la lista de chequeo."""
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.routes.checklist_admin import CategoriaIn, ItemIn, ItemUpdate, _exigir_editor


def test_solo_admin_y_director_tecnico_editan():
    assert _exigir_editor({"rol": "Administrador", "user_id": 1}) == 1
    assert _exigir_editor({"rol": "Director Técnico", "user_id": 2}) == 2
    for rol in ("Coordinador", "Inspector", "Cliente", "Asesor"):
        with pytest.raises(HTTPException) as e:
            _exigir_editor({"rol": rol, "user_id": 3})
        assert e.value.status_code == 403


def test_item_limpia_espacios_y_pone_el_codigo_en_mayusculas():
    item = ItemIn(id_categoria=1, codigo_item="  ntc-6.1-99 ", descripcion=" Puerta ", nivel_criticidad="Grave")
    assert item.codigo_item == "NTC-6.1-99" and item.descripcion == "Puerta"
    assert item.activo is True and item.obligatorio is True


def test_nivel_debe_ser_de_la_norma():
    with pytest.raises(ValidationError):
        ItemIn(id_categoria=1, codigo_item="X-1", descripcion="d", nivel_criticidad="Alto")
    assert ItemUpdate(nivel_criticidad="Muy grave").nivel_criticidad == "Muy grave"


def test_textos_vacios_no_se_aceptan():
    with pytest.raises(ValidationError):
        CategoriaIn(nombre_categoria="   ")
    with pytest.raises(ValidationError):
        ItemIn(id_categoria=1, codigo_item="X-1", descripcion="  ", nivel_criticidad="Leve")


def test_orden_no_negativo():
    with pytest.raises(ValidationError):
        CategoriaIn(nombre_categoria="6.12 Nuevo", orden_visualizacion=-1)


def test_columna_bit_se_lee_como_booleano():
    # MySQL devuelve BIT(1) como b'\x00' / b'\x01'; con Boolean b'\x00' se leía como True
    from app.models.models import BitBooleano
    col = BitBooleano()
    assert col.process_result_value(b"\x00", None) is False
    assert col.process_result_value(b"\x01", None) is True
    assert col.process_result_value(0, None) is False and col.process_result_value(1, None) is True
    assert col.process_result_value(None, None) is None
    assert col.process_bind_param(True, None) == 1 and col.process_bind_param(False, None) == 0
