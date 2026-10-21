"""Regla: todo ítem del checklist calificado "No Aplica" debe tener foto.

Sin esas fotos no se puede terminar la inspección ni aprobar su informe.
"""
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.models import ChecklistItem, DetalleChecklist, Fotografia, Informe

RESULTADO_CON_FOTO_OBLIGATORIA = "No Aplica"


def items_sin_foto(detalles: list, ids_items_con_foto: set) -> list:
    """Ids de los ítems "No Aplica" que todavía no tienen ninguna foto."""
    return [
        d.id_item for d in detalles
        if d.resultado == RESULTADO_CON_FOTO_OBLIGATORIA and d.id_item not in ids_items_con_foto
    ]


def mensaje_faltan_fotos(descripciones: list) -> str:
    total = len(descripciones)
    lista = "; ".join(descripciones[:5]) + ("; ..." if total > 5 else "")
    if total == 1:
        return f"Falta la foto obligatoria de 1 ítem marcado N/A: {lista}"
    return f"Faltan las fotos obligatorias de {total} ítems marcados N/A: {lista}"


def exigir_fotos_no_aplica(db: Session, id_inspeccion: int) -> None:
    """Lanza 400 si algún ítem "No Aplica" de la inspección no tiene foto."""
    detalles = db.query(DetalleChecklist).filter(
        DetalleChecklist.id_inspeccion == id_inspeccion,
        DetalleChecklist.resultado == RESULTADO_CON_FOTO_OBLIGATORIA,
    ).all()
    if not detalles:
        return

    # Fotos subidas a la inspección o (versiones anteriores) a su informe
    origen = [Fotografia.id_inspeccion == id_inspeccion]
    informe = db.query(Informe.id_informe).filter(Informe.id_inspeccion == id_inspeccion).first()
    if informe:
        origen.append(Fotografia.id_informe == informe[0])
    con_foto = {
        fila[0] for fila in db.query(Fotografia.id_item)
        .filter(or_(*origen), Fotografia.id_item.isnot(None)).all()
    }

    faltan = items_sin_foto(detalles, con_foto)
    if not faltan:
        return
    items = db.query(ChecklistItem).filter(ChecklistItem.id_item.in_(faltan)).all()
    descripciones = [i.descripcion for i in items] or [f"ítem {i}" for i in faltan]
    raise HTTPException(status_code=400, detail=mensaje_faltan_fotos(descripciones))
