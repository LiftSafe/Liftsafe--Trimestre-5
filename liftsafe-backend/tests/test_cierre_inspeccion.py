"""RF-009 y RF-011: checklist completo para cerrar y nada de cambios después."""
from types import SimpleNamespace as N
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.controllers.cierre_inspeccion_controller import (
    esta_cerrada, exigir_checklist_completo, exigir_inspeccion_abierta, faltan_por_calificar,
)


@pytest.mark.parametrize("estado", ["Pendiente firma cliente", "Pendiente revisión", "Finalizada", "Aprobada"])
def test_inspeccion_cerrada_no_se_modifica(estado):
    assert esta_cerrada(estado)
    with pytest.raises(HTTPException) as error:
        exigir_inspeccion_abierta(N(estado=estado))
    assert error.value.status_code == 400


@pytest.mark.parametrize("estado", ["Programada", "En Progreso"])
def test_inspeccion_abierta_se_puede_editar(estado):
    exigir_inspeccion_abierta(N(estado=estado))
    exigir_inspeccion_abierta(None)


def test_cuenta_los_items_sin_calificar():
    assert faltan_por_calificar({1, 2, 3}, {1}) == 2
    assert faltan_por_calificar({1, 2}, {1, 2, 99}) == 0


def _db(activos, respondidos):
    db = MagicMock()
    q_activos, q_resp = MagicMock(), MagicMock()
    q_activos.join.return_value.filter.return_value.all.return_value = [(i,) for i in activos]
    q_resp.filter.return_value.all.return_value = [(i,) for i in respondidos]
    db.query.side_effect = [q_activos, q_resp]
    return db


def test_no_deja_finalizar_con_items_pendientes():
    with pytest.raises(HTTPException) as error:
        exigir_checklist_completo(_db({1, 2, 3}, {1}), 5)
    assert error.value.detail == "Faltan 2 ítems del checklist por calificar"
    with pytest.raises(HTTPException) as error:
        exigir_checklist_completo(_db({1, 2}, {1}), 5)
    assert error.value.detail == "Falta 1 ítem del checklist por calificar"


def test_deja_finalizar_con_todo_calificado():
    exigir_checklist_completo(_db({1, 2}, {1, 2}), 5)
