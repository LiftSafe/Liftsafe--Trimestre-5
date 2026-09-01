from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Notificacion
from app.schemas.schemas import NotificacionCreate, NotificacionUpdate, NotificacionResponse
from app.utils.auth_deps import get_current_user_role

# ============================================================
# CREAR EL ROUTER (¡ESTO ES LO QUE FALTABA!)
# ============================================================
router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])

# 1. Crear notificación (solo para uso interno del sistema)
@router.post("/", response_model=NotificacionResponse, status_code=status.HTTP_201_CREATED)
def crear_notificacion(
    data: NotificacionCreate,
    db: Session = Depends(get_db)
):
    """Crea una nueva notificación para un usuario"""
    nueva = Notificacion(
        id_usuario_destino=data.id_usuario_destino,
        mensaje=data.mensaje,
        leida=False
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

# 2. Obtener notificaciones del usuario logueado
@router.get("/", response_model=List[NotificacionResponse])
def obtener_notificaciones(
    db: Session = Depends(get_db),
    user_data: tuple = Depends(get_current_user_role)
):
    """Obtiene todas las notificaciones del usuario autenticado"""
    rol, sub, user_id = user_data
    notificaciones = db.query(Notificacion).filter(
        Notificacion.id_usuario_destino == user_id
    ).order_by(Notificacion.fecha_creacion.desc()).all()
    return notificaciones

# 3. Marcar una notificación como leída
@router.put("/{id_notificacion}/leer", response_model=NotificacionResponse)
def marcar_como_leida(
    id_notificacion: int,
    db: Session = Depends(get_db),
    user_data: tuple = Depends(get_current_user_role)
):
    """Marca una notificación específica como leída"""
    rol, sub, user_id = user_data
    notificacion = db.query(Notificacion).filter(
        Notificacion.id_notificacion == id_notificacion,
        Notificacion.id_usuario_destino == user_id
    ).first()
    
    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    notificacion.leida = True
    db.commit()
    db.refresh(notificacion)
    return notificacion

# 4. Marcar todas las notificaciones como leídas
@router.put("/leer-todas")
def marcar_todas_como_leidas(
    db: Session = Depends(get_db),
    user_data: tuple = Depends(get_current_user_role)
):
    """Marca todas las notificaciones del usuario como leídas"""
    rol, sub, user_id = user_data
    db.query(Notificacion).filter(
        Notificacion.id_usuario_destino == user_id,
        Notificacion.leida == False
    ).update({"leida": True})
    db.commit()
    return {"message": "Todas las notificaciones marcadas como leídas"}