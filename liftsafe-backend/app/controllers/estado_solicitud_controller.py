"""Estado que se muestra de una solicitud según cómo va su inspección.

La solicitud queda "Programada" cuando se le asigna la inspección y pasa a
"Finalizada" al aprobar el informe. En medio, el cliente debe ver en qué va:
si la inspección ya empezó, se muestra el estado de la inspección.
"""
from sqlalchemy import func

ESTADOS_EN_CURSO = ("En Progreso", "Pendiente firma cliente", "Pendiente revisión")


def estado_visible(estado_solicitud: str, estado_inspeccion: str | None) -> str:
    """estado_inspeccion: estado de la inspección más reciente de la solicitud."""
    if estado_solicitud == "Programada" and estado_inspeccion in ESTADOS_EN_CURSO:
        return estado_inspeccion
    return estado_solicitud


def estados_ultima_inspeccion(db, ids_solicitud) -> dict:
    """{id_solicitud: estado de su inspección más reciente}, en una sola consulta
    (solo lee la columna estado; no carga las inspecciones completas)."""
    from app.models.models import Inspeccion
    ids = list(ids_solicitud)
    if not ids:
        return {}
    ultimas = (db.query(func.max(Inspeccion.id_inspeccion))
               .filter(Inspeccion.id_solicitud.in_(ids))
               .group_by(Inspeccion.id_solicitud))
    filas = db.query(Inspeccion.id_solicitud, Inspeccion.estado).filter(Inspeccion.id_inspeccion.in_(ultimas)).all()
    return dict(filas)
