"""La solicitud muestra en qué va su inspección."""
from app.controllers.estado_solicitud_controller import estado_visible, estados_ultima_inspeccion


def test_programada_muestra_el_avance_de_la_inspeccion():
    assert estado_visible("Programada", "Pendiente revisión") == "Pendiente revisión"
    assert estado_visible("Programada", "En Progreso") == "En Progreso"
    assert estado_visible("Programada", "Pendiente firma cliente") == "Pendiente firma cliente"


def test_sin_avance_sigue_programada():
    assert estado_visible("Programada", None) == "Programada"
    assert estado_visible("Programada", "Programada") == "Programada"
    assert estado_visible("Programada", "Cancelada") == "Programada"


def test_los_demas_estados_no_cambian():
    for estado in ("Pendiente", "Finalizada", "Cancelada"):
        assert estado_visible(estado, "Pendiente revisión") == estado


def test_sin_solicitudes_no_consulta():
    assert estados_ultima_inspeccion(None, []) == {}
