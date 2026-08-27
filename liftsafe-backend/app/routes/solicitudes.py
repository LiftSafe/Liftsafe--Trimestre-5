from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from app.database import get_db
from app.models.models import Solicitud, Ascensor
from app.schemas.schemas import SolicitudCreate, SolicitudUpdate, SolicitudResponse
from app.utils.auth_deps import get_current_user_role, require_admin

router = APIRouter(prefix="/solicitudes", tags=["Solicitudes"])

# 1. Crear solicitud (solo Cliente)
@router.post("/", response_model=SolicitudResponse, status_code=status.HTTP_201_CREATED)
def crear_solicitud(
    data: SolicitudCreate,
    db: Session = Depends(get_db),
    user_data: tuple = Depends(get_current_user_role)
):
    rol, sub, user_id = user_data
    
    # Validación: Solo clientes pueden crear solicitudes
    if rol != "Cliente":
        raise HTTPException(status_code=403, detail="Solo clientes pueden crear solicitudes")
    
    ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == data.id_ascensor).first()
    if not ascensor:
        raise HTTPException(status_code=404, detail="Ascensor no encontrado")
    
    # Validación: El ascensor debe pertenecer al cliente logueado
    if ascensor.id_cliente != user_id:
        raise HTTPException(status_code=403, detail="El ascensor no pertenece a este cliente")
    
    nueva = Solicitud(
        id_cliente=user_id,
        id_ascensor=data.id_ascensor,
        tipo_servicio=data.tipo_servicio,
        prioridad=data.prioridad,
        fecha_deseada=data.fecha_deseada,
        observaciones=data.observaciones,
        estado="Pendiente",
        fecha_solicitud=date.today()
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

# 2. Listar solicitudes
@router.get("/", response_model=List[SolicitudResponse])
def listar_solicitudes(
    db: Session = Depends(get_db),
    user_data: tuple = Depends(get_current_user_role)
):
    rol, sub, user_id = user_data
    
    query = db.query(Solicitud)
    # Si es cliente, solo ve sus propias solicitudes
    if rol == "Cliente":
        query = query.filter(Solicitud.id_cliente == user_id)
    return query.order_by(Solicitud.fecha_solicitud.desc()).all()

# 3. Obtener una solicitud por ID
@router.get("/{id}", response_model=SolicitudResponse)
def obtener_solicitud(
    id: int,
    db: Session = Depends(get_db),
    user_data: tuple = Depends(get_current_user_role)
):
    rol, sub, user_id = user_data
    
    solicitud = db.query(Solicitud).filter(Solicitud.id_solicitud == id).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    # Validar permiso
    if rol == "Cliente" and solicitud.id_cliente != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver esta solicitud")
    return solicitud

# 4. Modificar solicitud
@router.put("/{id}", response_model=SolicitudResponse)
def modificar_solicitud(
    id: int,
    data: SolicitudUpdate,
    db: Session = Depends(get_db),
    user_data: tuple = Depends(get_current_user_role)
):
    rol, sub, user_id = user_data
    
    solicitud = db.query(Solicitud).filter(Solicitud.id_solicitud == id).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    # Cliente solo puede modificar sus propias solicitudes y solo si están pendientes
    if rol == "Cliente":
        if solicitud.id_cliente != user_id:
            raise HTTPException(status_code=403, detail="No tienes permiso")
        if solicitud.estado != "Pendiente":
            raise HTTPException(status_code=400, detail="Solo se pueden modificar solicitudes pendientes")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(solicitud, key, value)
    db.commit()
    db.refresh(solicitud)
    return solicitud

# 5. Eliminar solicitud (solo Administrador)
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_solicitud(
    id: int,
    db: Session = Depends(get_db),
    user_data: dict = Depends(require_admin)
):
    solicitud = db.query(Solicitud).filter(Solicitud.id_solicitud == id).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    db.delete(solicitud)
    db.commit()
    return {"message": "Solicitud eliminada correctamente"}