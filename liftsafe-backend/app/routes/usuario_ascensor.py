from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import date
from app.database import get_db
from app.models.models import UsuarioAscensor, Usuario, Ascensor
from app.schemas.schemas import UsuarioAscensorCreate, UsuarioAscensorUpdate, UsuarioAscensorResponse, MessageResponse
from app.utils.auth_deps import get_current_user_role, require_admin

router = APIRouter(prefix="/usuario-ascensor", tags=["Usuario-Ascensor"])

INSPECTOR_ROL_ID = 4


# ✅ FIX: el esquema UsuarioAscensorResponse declara usuario/ascensor como
# "dict | None", pero SQLAlchemy entrega objetos ORM (no dicts) en esas
# relaciones. Pydantic no podía validar la respuesta -> ResponseValidationError
# no controlada -> 500 que además se comía los headers de CORS (por eso en el
# navegador parecía un error de CORS). Se serializa manualmente a dict.
def _serializar_asignacion(a: UsuarioAscensor) -> dict:
    return {
        "id_usuario_ascensor": a.id_usuario_ascensor,
        "id_usuario": a.id_usuario,
        "id_ascensor": a.id_ascensor,
        "tipo_asignacion": a.tipo_asignacion,
        "fecha_asignacion": a.fecha_asignacion,
        "fecha_desasignacion": a.fecha_desasignacion,
        "observaciones": a.observaciones,
        "usuario": {
            "id_usuario": a.usuario.id_usuario,
            "nombre_completo": a.usuario.nombre_completo,
            "correo": a.usuario.correo,
        } if a.usuario else None,
        "ascensor": {
            "id_ascensor": a.ascensor.id_ascensor,
            "codigo_interno": a.ascensor.codigo_interno,
            "marca": a.ascensor.marca,
            "modelo": a.ascensor.modelo,
        } if a.ascensor else None,
    }

# ============================================
# 1. ASIGNAR INSPECTOR A ASCENSOR (solo Admin)
# ============================================
@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def asignar_inspector_ascensor(
    data: UsuarioAscensorCreate,
    db: Session = Depends(get_db),
    rol: str = Depends(require_admin)
):
    try:
        # Validar que el usuario existe y es Inspector
        usuario = db.query(Usuario).filter(
            Usuario.id_usuario == data.id_usuario,
            Usuario.id_rol == INSPECTOR_ROL_ID
        ).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Inspector no encontrado")

        # Validar que el ascensor existe
        ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == data.id_ascensor).first()
        if not ascensor:
            raise HTTPException(status_code=404, detail="Ascensor no encontrado")

        # Verificar si ya existe asignación activa
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

        nueva = db.query(UsuarioAscensor).options(
            joinedload(UsuarioAscensor.usuario),
            joinedload(UsuarioAscensor.ascensor),
        ).filter(UsuarioAscensor.id_usuario_ascensor == nueva.id_usuario_ascensor).first()

        return _serializar_asignacion(nueva)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al asignar inspector: {str(e)}")

# ============================================
# 2. LISTAR ASIGNACIONES
# ============================================
@router.get("/", response_model=List[dict])
def listar_asignaciones(
    db: Session = Depends(get_db),
    current_user: tuple = Depends(get_current_user_role)
):
    try:
        rol, sub, user_id = current_user
        query = db.query(UsuarioAscensor).options(
            joinedload(UsuarioAscensor.usuario),
            joinedload(UsuarioAscensor.ascensor),
        )

        # Si es inspector, solo ve sus propias asignaciones
        if rol == "Inspector":
            query = query.filter(UsuarioAscensor.id_usuario == user_id)

        asignaciones = query.order_by(UsuarioAscensor.id_usuario_ascensor.desc()).all()
        return [_serializar_asignacion(a) for a in asignaciones]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar asignaciones: {str(e)}")

# ============================================
# 3. OBTENER ASIGNACIÓN POR ID
# ============================================
@router.get("/{id}", response_model=dict)
def obtener_asignacion(
    id: int,
    db: Session = Depends(get_db),
    current_user: tuple = Depends(get_current_user_role)
):
    try:
        asignacion = db.query(UsuarioAscensor).options(
            joinedload(UsuarioAscensor.usuario),
            joinedload(UsuarioAscensor.ascensor),
        ).filter(UsuarioAscensor.id_usuario_ascensor == id).first()
        if not asignacion:
            raise HTTPException(status_code=404, detail="Asignación no encontrada")

        return _serializar_asignacion(asignacion)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener asignación: {str(e)}")

# ============================================
# 4. DESASIGNAR (baja lógica, solo Admin)
# ============================================
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

# ============================================
# 5. ELIMINAR ASIGNACIÓN (HEAD - CRUD completo)
# ============================================
@router.delete("/{id}", response_model=MessageResponse)
def eliminar_asignacion(
    id: int,
    db: Session = Depends(get_db),
    rol: str = Depends(require_admin)
):
    asignacion = db.query(UsuarioAscensor).filter(UsuarioAscensor.id_usuario_ascensor == id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    
    db.delete(asignacion)
    db.commit()
    return {"message": "Asignación eliminada exitosamente"}