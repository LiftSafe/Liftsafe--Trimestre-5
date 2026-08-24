from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.models import Inspeccion, Ascensor, Usuario, Informe
from jose import jwt, JWTError
from app.config import settings
from datetime import datetime, date

router = APIRouter(prefix="/inspecciones", tags=["Inspecciones"])

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

@router.get("/mis-inspecciones")
def mis_inspecciones(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    if rol in ['Administrador', 'Director Técnico']:
        result = db.execute(text("SELECT * FROM vista_resumen_inspecciones")).mappings().all()
        return [dict(row) for row in result]
    
    elif rol == 'Inspector':
        result = (
            db.query(Inspeccion, Ascensor.codigo_interno, Informe.id_informe)
            .join(Ascensor, Inspeccion.id_ascensor == Ascensor.id_ascensor)
            .outerjoin(Informe, Informe.id_inspeccion == Inspeccion.id_inspeccion)
            .filter(Inspeccion.id_inspector == user_id)
            .all()
        )
        return [
            {
                "id_inspeccion": i.id_inspeccion,
                "codigo_ascensor": codigo,
                "fecha_inicio": i.fecha_inicio,
                "fecha_fin": i.fecha_fin,
                "estado": i.estado,
                "observaciones_generales": i.observaciones_generales,
                "id_informe": id_informe,
            }
            for i, codigo, id_informe in result
        ]
    
    elif rol == 'Cliente':
        result = (
            db.query(Inspeccion, Ascensor.codigo_interno, Informe.id_informe)
            .join(Ascensor, Inspeccion.id_ascensor == Ascensor.id_ascensor)
            .outerjoin(Informe, Informe.id_inspeccion == Inspeccion.id_inspeccion)
            .filter(Ascensor.id_cliente == user_id)
            .all()
        )
        return [
            {
                "id_inspeccion": i.id_inspeccion,
                "codigo_ascensor": codigo,
                "fecha_inicio": i.fecha_inicio,
                "fecha_fin": i.fecha_fin,
                "estado": i.estado,
                "observaciones_generales": i.observaciones_generales,
                "id_informe": id_informe,
            }
            for i, codigo, id_informe in result
        ]
    else:
        raise HTTPException(status_code=403, detail="Rol no autorizado")
    

from app.schemas.schemas import InspeccionCreate
from app.controllers.inspeccion_controller import crear_inspeccion
from app.utils.auth_deps import get_current_user_role

@router.post("/crear")
def crear_nueva_inspeccion(
    request: Request,
    data: InspeccionCreate,
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(request)
    
    # Solo admin y coordinador pueden crear inspecciones
    if rol not in ['Administrador', 'Coordinador', 'Inspector']:
        raise HTTPException(status_code=403, detail="No autorizado para crear inspecciones")
    
    # ✅ VALIDACIÓN ROBUSTA DE FECHA
    fecha_programada = data.fecha_programada
    
    # Convertir a date si es datetime
    if isinstance(fecha_programada, datetime):
        fecha_programada = fecha_programada.date()
    
    # Obtener fecha de hoy (solo date, sin hora)
    hoy = date.today()
    
    # Comparar fechas
    if fecha_programada < hoy:
        raise HTTPException(
            status_code=400, 
            detail=f"La fecha programada ({fecha_programada}) no puede ser anterior a hoy ({hoy})"
        )
    
    # Si es inspector, usar su propio ID
    inspector_id = user_id if rol == 'Inspector' else data.id_inspector
    
    try:
        inspeccion = crear_inspeccion(db, data.dict(), inspector_id)
        return {
            "message": "Inspección creada exitosamente",
            "id_inspeccion": inspeccion.id_inspeccion
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear inspección: {str(e)}")