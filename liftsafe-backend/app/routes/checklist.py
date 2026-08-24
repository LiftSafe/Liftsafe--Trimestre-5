from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List
from jose import jwt, JWTError

from app.database import get_db
from app.config import settings
from app.models.models import DetalleChecklist, Inspeccion, ChecklistItem, ChecklistCategoria
from app.schemas.schemas import (
    DetalleChecklistCreate,
    DetalleChecklistResponse,
    ChecklistCategoriaResponse,
    MessageResponse,
)
router = APIRouter(prefix="/checklist", tags=["Checklist"])


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


@router.post("/", response_model=DetalleChecklistResponse, status_code=status.HTTP_201_CREATED)
def calificar_item(
    data: DetalleChecklistCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    rol, correo, user_id = get_current_user_role(request)

    if rol != "Inspector":
        raise HTTPException(status_code=403, detail="Solo inspectores pueden calificar")

    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == data.id_inspeccion).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")

    if inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No eres el inspector asignado a esta inspección")

    item = db.query(ChecklistItem).filter(ChecklistItem.id_item == data.id_item).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")

    existente = db.query(DetalleChecklist).filter(
        DetalleChecklist.id_inspeccion == data.id_inspeccion,
        DetalleChecklist.id_item == data.id_item,
    ).first()

    if existente:
        existente.resultado = data.resultado
        existente.observacion = data.observacion
        existente.accion_requerida = data.accion_requerida
        db.commit()
        db.refresh(existente)
        return existente

    nuevo = DetalleChecklist(
        id_inspeccion=data.id_inspeccion,
        id_item=data.id_item,
        resultado=data.resultado,
        observacion=data.observacion,
        accion_requerida=data.accion_requerida,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/inspeccion/{id_inspeccion}", response_model=List[DetalleChecklistResponse])
def listar_checklist_inspeccion(
    id_inspeccion: int,
    request: Request,
    db: Session = Depends(get_db),
):
    rol, correo, user_id = get_current_user_role(request)

    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id_inspeccion).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")

    if rol not in ["Administrador", "Director Técnico", "Coordinador"]:
        if inspeccion.id_inspector != user_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver esta inspección")

    return db.query(DetalleChecklist).filter(
        DetalleChecklist.id_inspeccion == id_inspeccion
    ).all()


@router.get("/categorias", response_model=List[ChecklistCategoriaResponse])
def listar_categorias(
    request: Request,
    db: Session = Depends(get_db),
):
    get_current_user_role(request)
    return db.query(ChecklistCategoria).filter(ChecklistCategoria.activo == True).all()


@router.get("/cumplimiento/{id_inspeccion}")
def obtener_cumplimiento(
    id_inspeccion: int,
    request: Request,
    db: Session = Depends(get_db),
):
    get_current_user_role(request)

    total = db.query(DetalleChecklist).filter(
        DetalleChecklist.id_inspeccion == id_inspeccion
    ).count()

    cumplen = db.query(DetalleChecklist).filter(
        DetalleChecklist.id_inspeccion == id_inspeccion,
        DetalleChecklist.resultado == "Cumple",
    ).count()

    porcentaje = (cumplen / total * 100) if total > 0 else 0

    return {
        "total_items": total,
        "items_cumplen": cumplen,
        "porcentaje_cumplimiento": round(porcentaje, 2),
    }
# 5. Eliminar una calificación de checklist (por si el inspector se equivocó)
@router.delete("/{id_detalle}", response_model=MessageResponse)
def eliminar_detalle_checklist(
    id_detalle: int,
    request: Request,
    db: Session = Depends(get_db),
):
    rol, correo, user_id = get_current_user_role(request)

    detalle = db.query(DetalleChecklist).filter(DetalleChecklist.id_detalle == id_detalle).first()
    if not detalle:
        raise HTTPException(status_code=404, detail="Registro de checklist no encontrado")

    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == detalle.id_inspeccion).first()
    if rol != "Inspector" or not inspeccion or inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este registro")

    db.delete(detalle)
    db.commit()
    return {"message": "Calificación de checklist eliminada"}