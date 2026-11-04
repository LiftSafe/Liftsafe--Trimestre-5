"""La solicitud muestra en qué va su inspección."""
from types import SimpleNamespace as N

from app.controllers.estado_solicitud_controller import estado_visible


def insp(id_, estado):
    return N(id_inspeccion=id_, estado=estado)


def test_programada_muestra_el_avance_de_la_inspeccion():
    assert estado_visible("Programada", [insp(5, "Pendiente revisión")]) == "Pendiente revisión"
    assert estado_visible("Programada", [insp(5, "En Progreso")]) == "En Progreso"
    assert estado_visible("Programada", [insp(5, "Pendiente firma cliente")]) == "Pendiente firma cliente"


def test_sin_avance_sigue_programada():
    assert estado_visible("Programada", []) == "Programada"
    assert estado_visible("Programada", [insp(5, "Programada")]) == "Programada"


def test_usa_la_inspeccion_mas_reciente():
    assert estado_visible("Programada", [insp(9, "En Progreso"), insp(3, "Cancelada")]) == "En Progreso"


def test_los_demas_estados_no_cambian():
    for estado in ("Pendiente", "Finalizada", "Cancelada"):
        assert estado_visible(estado, [insp(1, "Pendiente revisión")]) == estado
