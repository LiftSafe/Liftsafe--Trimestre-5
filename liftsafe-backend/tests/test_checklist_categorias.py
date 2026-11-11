"""Qué categorías e ítems del checklist ve una inspección."""
from types import SimpleNamespace as N

from app.controllers.checklist_controller import categorias_visibles


def _cat(id_, orden, items, nombre=None):
    return N(id_categoria=id_, nombre_categoria=nombre or f"Cat {id_}", descripcion=None,
             orden_visualizacion=orden, norma_referencia=None, items=items)


def _item(id_, orden):
    return N(id_item=id_, orden_visualizacion=orden)


NUEVA_2 = _cat(2, 2, [_item(21, 2), _item(20, 1)], "6.2 Cables")
NUEVA_1 = _cat(1, 1, [_item(10, 1)], "6.1 Puertas")
VIEJA = _cat(9, 1, [_item(90, 1), _item(91, 2)], "Cabina")


def test_muestra_solo_las_categorias_activas_en_orden():
    res = categorias_visibles([NUEVA_2, VIEJA, NUEVA_1], {1, 2}, {10, 20, 21, 90, 91}, set())
    assert [c["nombre_categoria"] for c in res] == ["6.1 Puertas", "6.2 Cables"]
    assert [i.id_item for i in res[1]["items"]] == [20, 21]


def test_conserva_lo_respondido_en_el_checklist_anterior():
    res = categorias_visibles([NUEVA_1, VIEJA], {1}, {10, 90, 91}, {90})
    nombres = [c["nombre_categoria"] for c in res]
    assert nombres == ["6.1 Puertas", "Cabina"]  # el vigente va primero
    vieja = next(c for c in res if c["nombre_categoria"] == "Cabina")
    assert [i.id_item for i in vieja["items"]] == [90]


def test_oculta_items_inactivos_y_categorias_vacias():
    res = categorias_visibles([NUEVA_2], {2}, {20}, set())
    assert [i.id_item for i in res[0]["items"]] == [20]
    assert categorias_visibles([_cat(3, 1, [])], {3}, set(), set()) == []
