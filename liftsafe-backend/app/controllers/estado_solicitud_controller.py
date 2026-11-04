"""Estado que se muestra de una solicitud según cómo va su inspección.

La solicitud queda "Programada" cuando se le asigna la inspección y pasa a
"Finalizada" al aprobar el informe. En medio, el cliente debe ver en qué va:
si la inspección ya empezó, se muestra el estado de la inspección.
"""

ESTADOS_EN_CURSO = ("En Progreso", "Pendiente firma cliente", "Pendiente revisión")


def estado_visible(estado_solicitud: str, inspecciones: list) -> str:
    if estado_solicitud != "Programada" or not inspecciones:
        return estado_solicitud
    ultima = max(inspecciones, key=lambda i: i.id_inspeccion or 0)
    return ultima.estado if ultima.estado in ESTADOS_EN_CURSO else estado_solicitud
