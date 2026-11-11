"""Reglas para cerrar una inspección (RF-009 y RF-011).

- No se finaliza mientras queden ítems del checklist sin calificar.
- Una inspección cerrada ya no deja cambiar el checklist ni las fotos.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.models import ChecklistCategoria, ChecklistItem, DetalleChecklist

# Estados en los que la inspección ya fue cerrada por el inspector
ESTADOS_CERRADOS = {
    "Pendiente firma cliente", "Pendiente revisión", "Finalizada", "Aprobada", "Completada", "Cancelada",
}


def esta_cerrada(estado) -> bool:
    return estado in ESTADOS_CERRADOS


def exigir_inspeccion_abierta(inspeccion) -> None:
    if inspeccion is not None and esta_cerrada(inspeccion.estado):
        raise HTTPException(
            status_code=400,
            detail=f"La inspección ya fue cerrada ({inspeccion.estado}): no se puede modificar",
        )


def faltan_por_calificar(ids_items_activos: set, ids_items_respondidos: set) -> int:
    return len(ids_items_activos - ids_items_respondidos)


def exigir_checklist_completo(db: Session, id_inspeccion: int) -> None:
    activos = {
        fila[0] for fila in db.query(ChecklistItem.id_item)
        .join(ChecklistCategoria, ChecklistCategoria.id_categoria == ChecklistItem.id_categoria)
        .filter(ChecklistItem.activo == True, ChecklistCategoria.activo == True).all()  # noqa: E712
    }
    respondidos = {
        fila[0] for fila in db.query(DetalleChecklist.id_item)
        .filter(DetalleChecklist.id_inspeccion == id_inspeccion).all()
    }
    faltan = faltan_por_calificar(activos, respondidos)
    if faltan:
        texto = "Falta 1 ítem" if faltan == 1 else f"Faltan {faltan} ítems"
        raise HTTPException(status_code=400, detail=f"{texto} del checklist por calificar")
