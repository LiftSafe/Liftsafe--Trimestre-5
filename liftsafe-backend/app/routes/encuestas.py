from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.models import Encuesta, Inspeccion
from app.schemas.schemas import EncuestaRespuestaCreate
from app.utils.auth_deps import get_current_user_role

router = APIRouter(prefix="/encuestas", tags=["Encuestas"])


# FIX: mismo motivo que _serializar_solicitud en routes/solicitudes.py -> no
# se declara un response_model con relaciones ORM tipadas como "dict", que
# ya rompió /programacion/ antes (ver comentarios ahí). Se arma el dict a
# mano con exactamente lo que necesita el frontend.
def _serializar_encuesta(e: Encuesta) -> dict:
    ascensor = e.inspeccion.ascensor if e.inspeccion else None
    return {
        "id_encuesta": e.id_encuesta,
        "id_inspeccion": e.id_inspeccion,
        "calificacion": e.calificacion,
        "comentario": e.comentario,
        "respondida": bool(e.respondida),
        "fecha_creacion": e.fecha_creacion,
        "fecha_respuesta": e.fecha_respuesta,
        "codigo_ascensor": ascensor.codigo_interno if ascensor else None,
    }


# ============================================
# 1. LISTAR MIS ENCUESTAS (Cliente)
# ============================================
@router.get("/")
def listar_mis_encuestas(
    db: Session = Depends(get_db),
    user_data: tuple = Depends(get_current_user_role)
):
    rol, correo, user_id = user_data
    if rol != "Cliente":
        raise HTTPException(status_code=403, detail="Solo los clientes tienen encuestas")

    encuestas = (
        db.query(Encuesta)
        .options(joinedload(Encuesta.inspeccion).joinedload(Inspeccion.ascensor))
        .filter(Encuesta.id_cliente == user_id)
        .order_by(Encuesta.fecha_creacion.desc())
        .all()
    )
    return [_serializar_encuesta(e) for e in encuestas]


# ============================================
# 2. RESPONDER UNA ENCUESTA (Cliente)
# ============================================
@router.put("/{id_encuesta}/responder")
def responder_encuesta(
    id_encuesta: int,
    data: EncuestaRespuestaCreate,
    db: Session = Depends(get_db),
    user_data: tuple = Depends(get_current_user_role)
):
    rol, correo, user_id = user_data

    encuesta = db.query(Encuesta).filter(Encuesta.id_encuesta == id_encuesta).first()
    if not encuesta:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")

    if encuesta.id_cliente != user_id:
        raise HTTPException(status_code=403, detail="Esta encuesta no te pertenece")

    if encuesta.respondida:
        raise HTTPException(status_code=400, detail="Esta encuesta ya fue respondida")

    encuesta.calificacion = data.calificacion
    encuesta.comentario = data.comentario
    encuesta.respondida = True
    encuesta.fecha_respuesta = datetime.now()
    db.commit()
    db.refresh(encuesta)

    return {"message": "¡Gracias por tu respuesta!"}
