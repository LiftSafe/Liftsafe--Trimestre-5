"""RF-024: reporte de productividad de los inspectores."""
from datetime import datetime

from app.controllers.productividad_controller import calcular_productividad


def _f(id_insp, nombre, estado, informe=None, horas=None, minutos=None):
    inicio = datetime(2026, 10, 1, 8)
    fin = datetime(2026, 10, 1, 8 + horas) if horas else None
    return {"id_inspector": id_insp, "inspector": nombre, "estado": estado, "estado_informe": informe,
            "fecha_inicio": inicio, "fecha_fin": fin, "duracion_minutos": minutos}


def test_agrupa_por_inspector_y_calcula_tasas():
    datos = calcular_productividad([
        _f(1, "Daniela", "Finalizada", "Aprobado", horas=2),
        _f(1, "Daniela", "Finalizada", "Enviado", minutos=180),
        _f(1, "Daniela", "Programada"),
        _f(2, "Andrés", "Pendiente revisión", "Rechazado", horas=4),
        _f(2, "Andrés", "Cancelada"),
    ])
    daniela, andres = datos["inspectores"]
    assert daniela["inspector"] == "Daniela"
    assert (daniela["asignadas"], daniela["terminadas"], daniela["en_curso"], daniela["aprobadas"]) == (3, 2, 1, 2)
    assert daniela["horas_promedio"] == 2.5          # 2 h y 3 h
    assert daniela["tasa_cumplimiento"] == 67        # 2 de 3
    assert daniela["tasa_aprobacion"] == 100
    assert (andres["terminadas"], andres["canceladas"], andres["rechazadas"], andres["tasa_aprobacion"]) == (1, 1, 1, 0)

    total = datos["total"]
    assert (total["asignadas"], total["terminadas"], total["aprobadas"], total["rechazadas"]) == (5, 3, 2, 1)
    assert total["horas_promedio"] == 3.0            # (2 + 3 + 4) / 3
    assert total["tasa_aprobacion"] == 67


def test_sin_datos():
    datos = calcular_productividad([])
    assert datos["inspectores"] == []
    assert datos["total"]["asignadas"] == 0
    assert datos["total"]["horas_promedio"] is None
    assert datos["total"]["tasa_aprobacion"] is None
