from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.database import get_db
from app.models.models import Programacion, Solicitud, Usuario
from app.schemas.schemas import ProgramacionCreate, ProgramacionUpdate, ProgramacionResponse
from app.utils.auth_deps import get_current_user, require_coordinador, INSPECTOR_ROL_ID

router = APIRouter(prefix="/programacion", tags=["Programación"])

# 1. Asignar inspector a solicitud (solo Coordinador)
@router.post("/", response_model=ProgramacionResponse, status_code=status.HTTP_201_CREATED)
def asignar_inspector(
    data: ProgramacionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_coordinador)
):
    solicitud = db.query(Solicitud).filter(Solicitud.id_solicitud == data.id_solicitud).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    if solicitud.estado != "Pendiente":
        raise HTTPException(status_code=400, detail="La solicitud no está pendiente")

    inspector = db.query(Usuario).filter(
        Usuario.id_usuario == data.id_inspector,
        Usuario.id_rol == INSPECTOR_ROL_ID
    ).first()
    if not inspector:
        raise HTTPException(status_code=404, detail="Inspector no encontrado")

    nueva = Programacion(
        id_solicitud=data.id_solicitud,
        id_inspector=data.id_inspector,
        fecha_programada=data.fecha_programada,
        hora_inicio=data.hora_inicio,
        hora_fin_estimada=data.hora_fin_estimada,
        estado="Programada"
    )
    db.add(nueva)
    solicitud.estado = "Programada"
    db.commit()
    db.refresh(nueva)
    return nueva

# 2. Listar programaciones
@router.get("/", response_model=List[ProgramacionResponse])
def listar_programaciones(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Programacion)
    if current_user["rol"] == "Inspector":
        query = query.filter(Programacion.id_inspector == current_user["user_id"])
    return query.order_by(Programacion.fecha_programada.desc()).all()

# 3. Reasignar inspector (Coordinador)
@router.put("/{id}/reasignar", response_model=ProgramacionResponse)
def reasignar_inspector(
    id: int,
    data: ProgramacionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_coordinador)
):
    programacion = db.query(Programacion).filter(Programacion.id_programacion == id).first()
    if not programacion:
        raise HTTPException(status_code=404, detail="Programación no encontrada")

    if data.id_inspector:
        inspector = db.query(Usuario).filter(
            Usuario.id_usuario == data.id_inspector,
            Usuario.id_rol == INSPECTOR_ROL_ID
        ).first()
        if not inspector:
            raise HTTPException(status_code=404, detail="Inspector no encontrado")
        programacion.id_inspector = data.id_inspector

    if data.fecha_programada:
        programacion.fecha_programada = data.fecha_programada
    if data.hora_inicio:
        programacion.hora_inicio = data.hora_inicio
    if data.estado:
        programacion.estado = data.estado

    db.commit()
    db.refresh(programacion)
    return programacion

# 4. Cancelar programación (Coordinador)
@router.put("/{id}/cancelar")
def cancelar_programacion(
    id: int,
    motivo: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_coordinador)
):
    programacion = db.query(Programacion).filter(Programacion.id_programacion == id).first()
    if not programacion:
        raise HTTPException(status_code=404, detail="Programación no encontrada")

    programacion.estado = "Cancelada"
    programacion.motivo_cancelacion = motivo

    solicitud = db.query(Solicitud).filter(Solicitud.id_solicitud == programacion.id_solicitud).first()
    if solicitud:
        solicitud.estado = "Pendiente"
    
    db.commit()
    return {"message": "Programación cancelada"}