from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.database import get_db
from app.models.models import UsuarioAscensor, Usuario, Ascensor
from app.schemas.schemas import UsuarioAscensorCreate, UsuarioAscensorUpdate, UsuarioAscensorResponse, MessageResponse
from app.utils.auth_deps import get_current_user_role, require_admin

router = APIRouter(prefix="/usuario-ascensor", tags=["Usuario-Ascensor"])

INSPECTOR_ROL_ID = 4


@router.post("/", response_model=UsuarioAscensorResponse, status_code=status.HTTP_201_CREATED)
def asignar_inspector_ascensor(
    data: UsuarioAscensorCreate,
    db: Session = Depends(get_db),
    rol: str = Depends(require_admin)
):
    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == data.id_usuario,
        Usuario.id_rol == INSPECTOR_ROL_ID
    ).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Inspector no encontrado")

    ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == data.id_ascensor).first()
    if not ascensor:
        raise HTTPException(status_code=404, detail="Ascensor no encontrado")

    existente = db.query(UsuarioAscensor).filter(
        UsuarioAscensor.id_usuario == data.id_usuario,
        UsuarioAscensor.id_ascensor == data.id_ascensor,
        UsuarioAscensor.fecha_desasignacion.is_(None)
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una asignación activa")

    nueva = UsuarioAscensor(
        id_usuario=data.id_usuario,
        id_ascensor=data.id_ascensor,
        tipo_asignacion=data.tipo_asignacion,
        fecha_asignacion=data.fecha_asignacion,
        observaciones=data.observaciones
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("/", response_model=List[UsuarioAscensorResponse])
def listar_asignaciones(
    db: Session = Depends(get_db),
    current_user: tuple = Depends(get_current_user_role)
):
    rol, sub, user_id = current_user
    query = db.query(UsuarioAscensor)
    if rol == "Inspector":
        query = query.filter(UsuarioAscensor.id_usuario == user_id)
    return query.all()


@router.get("/{id}", response_model=UsuarioAscensorResponse)
def obtener_asignacion(
    id: int,
    db: Session = Depends(get_db),
    current_user: tuple = Depends(get_current_user_role)
):
    asignacion = db.query(UsuarioAscensor).filter(UsuarioAscensor.id_usuario_ascensor == id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return asignacion


@router.put("/{id}/desasignar", response_model=MessageResponse)
def desasignar_inspector(
    id: int,
    data: UsuarioAscensorUpdate,
    db: Session = Depends(get_db),
    rol: str = Depends(require_admin)
):
    asignacion = db.query(UsuarioAscensor).filter(UsuarioAscensor.id_usuario_ascensor == id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    if asignacion.fecha_desasignacion:
        raise HTTPException(status_code=400, detail="Ya está desasignado")

    asignacion.fecha_desasignacion = data.fecha_desasignacion or date.today()
    asignacion.observaciones = data.observaciones or asignacion.observaciones
    db.commit()
    return {"message": "Inspector desasignado correctamente"}