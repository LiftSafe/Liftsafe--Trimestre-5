from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List
from jose import jwt, JWTError

from app.database import get_db
from app.config import settings
from app.models.models import Observacion, Informe, Inspeccion
from app.schemas.schemas import (
    ObservacionCreate,
    ObservacionUpdate,
    ObservacionResponse,
    MessageResponse,
)

router = APIRouter(prefix="/observaciones", tags=["Observaciones"])


def get_current_user_role(request: Request):
    authorization = request.headers.get('authorization')
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("rol"), payload.get("sub"), payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


@router.post("/", response_model=ObservacionResponse, status_code=status.HTTP_201_CREATED)
def crear_observacion(
    data: ObservacionCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    rol, correo, user_id = get_current_user_role(request)

    if rol != "Inspector":
        raise HTTPException(status_code=403, detail="Solo inspectores pueden crear observaciones")

    informe = db.query(Informe).filter(Informe.id_informe == data.id_informe).first()
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")

    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == informe.id_inspeccion).first()
    if not inspeccion or inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No eres el inspector de esta inspección")

    nueva = Observacion(
        id_informe=data.id_informe,
        tipo_observacion=data.tipo_observacion,
        descripcion=data.descripcion,
        nivel_riesgo=data.nivel_riesgo,
        requiere_atencion_inmediata=data.requiere_atencion_inmediata,
        fecha_limite_recomendada=data.fecha_limite_recomendada,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("/{id_informe}", response_model=List[ObservacionResponse])
def listar_observaciones(
    id_informe: int,
    request: Request,
    db: Session = Depends(get_db),
):
    get_current_user_role(request)

    informe = db.query(Informe).filter(Informe.id_informe == id_informe).first()
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")

    return db.query(Observacion).filter(Observacion.id_informe == id_informe).all()


@router.put("/{id}", response_model=ObservacionResponse)
def modificar_observacion(
    id: int,
    data: ObservacionUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    rol, correo, user_id = get_current_user_role(request)

    observacion = db.query(Observacion).filter(Observacion.id_observacion == id).first()
    if not observacion:
        raise HTTPException(status_code=404, detail="Observación no encontrada")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(observacion, key, value)

    db.commit()
    db.refresh(observacion)
    return observacion


@router.delete("/{id}", response_model=MessageResponse)
def eliminar_observacion(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    get_current_user_role(request)

    observacion = db.query(Observacion).filter(Observacion.id_observacion == id).first()
    if not observacion:
        raise HTTPException(status_code=404, detail="Observación no encontrada")

    db.delete(observacion)
    db.commit()
    return {"message": "Observación eliminada"}