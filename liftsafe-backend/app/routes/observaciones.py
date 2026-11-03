from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List
from jose import jwt, JWTError

from app.database import get_db
from app.config import settings
from sqlalchemy import or_
from app.models.models import Observacion, Informe, Inspeccion
from app.controllers.cierre_inspeccion_controller import exigir_inspeccion_abierta
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

    # RF-008: se registra durante la inspección (id_inspeccion); también se
    # acepta id_informe por compatibilidad.
    id_inspeccion = data.id_inspeccion
    if id_inspeccion is None and data.id_informe is not None:
        informe = db.query(Informe).filter(Informe.id_informe == data.id_informe).first()
        if not informe:
            raise HTTPException(status_code=404, detail="Informe no encontrado")
        id_inspeccion = informe.id_inspeccion
    if id_inspeccion is None:
        raise HTTPException(status_code=400, detail="Indica la inspección de la observación")

    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id_inspeccion).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    if inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No eres el inspector de esta inspección")
    exigir_inspeccion_abierta(inspeccion)
    informe = db.query(Informe).filter(Informe.id_inspeccion == id_inspeccion).first()

    nueva = Observacion(
        id_inspeccion=id_inspeccion,
        id_informe=informe.id_informe if informe else None,
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


@router.get("/inspeccion/{id_inspeccion}", response_model=List[ObservacionResponse])
def listar_observaciones_inspeccion(
    id_inspeccion: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Observaciones de una inspección (las registradas durante la inspección
    y las que se agregaron al informe)."""
    get_current_user_role(request)
    informe = db.query(Informe).filter(Informe.id_inspeccion == id_inspeccion).first()
    filtro = [Observacion.id_inspeccion == id_inspeccion]
    if informe:
        filtro.append(Observacion.id_informe == informe.id_informe)
    return db.query(Observacion).filter(or_(*filtro)).order_by(Observacion.id_observacion).all()


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
    rol, _, user_id = get_current_user_role(request)

    observacion = db.query(Observacion).filter(Observacion.id_observacion == id).first()
    if not observacion:
        raise HTTPException(status_code=404, detail="Observación no encontrada")
    # Solo el inspector de la inspección, y mientras no esté cerrada
    id_insp = observacion.id_inspeccion
    if id_insp is None and observacion.id_informe:
        inf = db.query(Informe).filter(Informe.id_informe == observacion.id_informe).first()
        id_insp = inf.id_inspeccion if inf else None
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id_insp).first() if id_insp else None
    if rol != "Inspector" or not inspeccion or inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="Solo el inspector de la inspección puede eliminar la observación")
    exigir_inspeccion_abierta(inspeccion)

    db.delete(observacion)
    db.commit()
    return {"message": "Observación eliminada"}