"""Regla: los ítems calificados "No Aplica" deben tener foto."""
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.controllers.foto_obligatoria_controller import (
    exigir_fotos_no_aplica, items_sin_foto, mensaje_faltan_fotos,
)


def _detalle(id_item, resultado):
    return SimpleNamespace(id_item=id_item, resultado=resultado)


def test_item_no_aplica_sin_foto_queda_pendiente():
    detalles = [_detalle(1, "No Aplica"), _detalle(2, "Cumple"), _detalle(3, "No Cumple")]
    assert items_sin_foto(detalles, set()) == [1]


def test_item_no_aplica_con_foto_no_queda_pendiente():
    detalles = [_detalle(1, "No Aplica"), _detalle(4, "No Aplica")]
    assert items_sin_foto(detalles, {1}) == [4]
    assert items_sin_foto(detalles, {1, 4}) == []


def test_mensaje_en_singular_y_plural():
    assert mensaje_faltan_fotos(["Foso"]) == "Falta la foto obligatoria de 1 ítem marcado N/A: Foso"
    varios = mensaje_faltan_fotos([f"Ítem {i}" for i in range(7)])
    assert varios.startswith("Faltan las fotos obligatorias de 7 ítems marcados N/A")
    assert varios.endswith("; ...")


def _db(detalles, informe, fotos, items):
    """Sesión falsa: devuelve en orden detalles, informe, fotos e ítems."""
    db = MagicMock()
    q_detalles, q_informe, q_fotos, q_items = (MagicMock() for _ in range(4))
    q_detalles.filter.return_value.all.return_value = detalles
    q_informe.filter.return_value.first.return_value = informe
    q_fotos.filter.return_value.all.return_value = [(f,) for f in fotos]
    q_items.filter.return_value.all.return_value = items
    db.query.side_effect = [q_detalles, q_informe, q_fotos, q_items]
    return db


def test_sin_items_no_aplica_no_exige_nada():
    db = _db([], None, [], [])
    exigir_fotos_no_aplica(db, 1)
    assert db.query.call_count == 1


def test_bloquea_si_falta_la_foto():
    item = SimpleNamespace(descripcion="Iluminación del foso")
    db = _db([_detalle(2, "No Aplica")], None, [], [item])
    with pytest.raises(HTTPException) as error:
        exigir_fotos_no_aplica(db, 1)
    assert error.value.status_code == 400
    assert "Iluminación del foso" in error.value.detail


def test_deja_pasar_si_todas_tienen_foto():
    db = _db([_detalle(2, "No Aplica")], (9,), [2], [])
    exigir_fotos_no_aplica(db, 1)
