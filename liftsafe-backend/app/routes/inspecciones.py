from fastapi import APIRouter, Depends, HTTPException, Request, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
<<<<<<< HEAD
from app.models.models import Inspeccion, Ascensor, Usuario
from jose import jwt, JWTError
from app.config import settings
from datetime import datetime, date

router = APIRouter(prefix="/inspecciones", tags=["Inspecciones"])

# ✅ ESQUEMA DE SEGURIDAD
=======
from app.models.models import Inspeccion, Ascensor, Usuario, Informe
from app.schemas.schemas import InspeccionCreate, FirmaRequest, MessageResponse
from app.controllers.inspeccion_controller import crear_inspeccion
from app.utils.auth_deps import get_current_user_role
from app.config import settings
from jose import jwt, JWTError
from datetime import datetime, date
from typing import Optional

router = APIRouter(prefix="/inspecciones", tags=["Inspecciones"])

# ============================================
# AUTENTICACIÓN (versión unificada)
# ============================================
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
security = HTTPBearer()

def get_current_user_role(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("rol"), payload.get("sub"), payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

<<<<<<< HEAD
=======
# ============================================
# 1. MIS INSPECCIONES
# ============================================
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
@router.get("/mis-inspecciones")
def mis_inspecciones(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    if rol in ['Administrador', 'Director Técnico']:
        result = db.execute(text("SELECT * FROM vista_resumen_inspecciones")).mappings().all()
        return [dict(row) for row in result]
    
    elif rol == 'Inspector':
<<<<<<< HEAD
        result = db.query(Inspeccion, Ascensor.codigo_interno).join(Ascensor, Inspeccion.id_ascensor == Ascensor.id_ascensor).filter(Inspeccion.id_inspector == user_id).all()
=======
        result = (
            db.query(Inspeccion, Ascensor.codigo_interno, Informe.id_informe)
            .join(Ascensor, Inspeccion.id_ascensor == Ascensor.id_ascensor)
            .outerjoin(Informe, Informe.id_inspeccion == Inspeccion.id_inspeccion)
            .filter(Inspeccion.id_inspector == user_id)
            .all()
        )
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
        return [
            {
                "id_inspeccion": i.id_inspeccion,
                "codigo_ascensor": codigo,
                "fecha_inicio": i.fecha_inicio,
                "fecha_fin": i.fecha_fin,
                "estado": i.estado,
<<<<<<< HEAD
                "observaciones_generales": i.observaciones_generales
            }
            for i, codigo in result
        ]
    
    elif rol == 'Cliente':
        result = db.query(Inspeccion, Ascensor.codigo_interno).join(Ascensor, Inspeccion.id_ascensor == Ascensor.id_ascensor).filter(Ascensor.id_cliente == user_id).all()
=======
                "observaciones_generales": i.observaciones_generales,
                "firma_inspector": bool(i.firma_inspector),
                "firma_cliente": bool(i.firma_cliente),
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
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
        return [
            {
                "id_inspeccion": i.id_inspeccion,
                "codigo_ascensor": codigo,
                "fecha_inicio": i.fecha_inicio,
                "fecha_fin": i.fecha_fin,
                "estado": i.estado,
<<<<<<< HEAD
                "observaciones_generales": i.observaciones_generales
            }
            for i, codigo in result
=======
                "observaciones_generales": i.observaciones_generales,
                "firma_inspector": bool(i.firma_inspector),
                "firma_cliente": bool(i.firma_cliente),
                "id_informe": id_informe,
            }
            for i, codigo, id_informe in result
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
        ]
    
    else:
        raise HTTPException(status_code=403, detail="Rol no autorizado")

<<<<<<< HEAD
from app.schemas.schemas import InspeccionCreate, MessageResponse
from app.controllers.inspeccion_controller import crear_inspeccion

@router.post("/crear")
def crear_nueva_inspeccion(
    data: InspeccionCreate,  # ✅ PRIMERO: parámetro sin valor por defecto
    credentials: HTTPAuthorizationCredentials = Security(security),  # ✅ DESPUÉS: con valor por defecto
=======
# ============================================
# 2. CREAR INSPECCIÓN
# ============================================
@router.post("/crear")
def crear_nueva_inspeccion(
    data: InspeccionCreate,
    credentials: HTTPAuthorizationCredentials = Security(security),
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
<<<<<<< HEAD
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
=======
    if rol not in ['Administrador', 'Coordinador', 'Inspector']:
        raise HTTPException(status_code=403, detail="No autorizado para crear inspecciones")
    
    fecha_programada = data.fecha_programada
    
    if isinstance(fecha_programada, datetime):
        fecha_programada = fecha_programada.date()
    
    hoy = date.today()
    
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    if fecha_programada < hoy:
        raise HTTPException(
            status_code=400, 
            detail=f"La fecha programada ({fecha_programada}) no puede ser anterior a hoy ({hoy})"
        )
    
<<<<<<< HEAD
    # Si es inspector, usar su propio ID
=======
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
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

<<<<<<< HEAD
from app.schemas.schemas import InspeccionUpdate

@router.put("/{id_inspeccion}", response_model=MessageResponse)
def actualizar_inspeccion(
    id_inspeccion: int,
    data: InspeccionUpdate,
=======
# ============================================
# 3. OBTENER DETALLE DE UNA INSPECCIÓN
# ============================================
@router.get("/{id}")
def obtener_inspeccion(
    id: int,
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
<<<<<<< HEAD
    if rol not in ['Administrador', 'Coordinador', 'Inspector']:
        raise HTTPException(status_code=403, detail="No autorizado para actualizar inspecciones")
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id_inspeccion).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    # Si es inspector, solo puede editar sus propias inspecciones
    if rol == 'Inspector' and inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No autorizado para editar esta inspección")
    
    if data.estado is not None:
        inspeccion.estado = data.estado
    if data.observaciones_generales is not None:
        inspeccion.observaciones_generales = data.observaciones_generales
    if data.fecha_fin is not None:
        inspeccion.fecha_fin = data.fecha_fin
    if data.firma_inspector is not None:
        inspeccion.firma_inspector = data.firma_inspector
        inspeccion.fecha_firma_inspector = datetime.now()
    if data.firma_cliente is not None:
        inspeccion.firma_cliente = data.firma_cliente
        inspeccion.fecha_firma_cliente = datetime.now()
    
    db.commit()
    db.refresh(inspeccion)
    return {"message": "Inspección actualizada exitosamente"}


@router.delete("/{id_inspeccion}", response_model=MessageResponse)
def eliminar_inspeccion(
    id_inspeccion: int,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    if rol not in ['Administrador', 'Coordinador']:
        raise HTTPException(status_code=403, detail="No autorizado para eliminar inspecciones")
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id_inspeccion).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    if inspeccion.estado not in ['Pendiente', 'Programada']:
        raise HTTPException(status_code=400, detail="Solo se pueden eliminar inspecciones en estado Pendiente o Programada")
    
    db.delete(inspeccion)
    db.commit()
    return {"message": "Inspección eliminada exitosamente"}
=======
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    if rol == 'Inspector' and inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver esta inspección")
    
    if rol == 'Cliente':
        ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == inspeccion.id_ascensor).first()
        if ascensor.id_cliente != user_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver esta inspección")

    informe = db.query(Informe).filter(Informe.id_inspeccion == inspeccion.id_inspeccion).first()

    return {
        "id_inspeccion": inspeccion.id_inspeccion,
        "id_informe": informe.id_informe if informe else None,
        "id_ascensor": inspeccion.id_ascensor,
        "id_inspector": inspeccion.id_inspector,
        "estado": inspeccion.estado,
        "fecha_inicio": inspeccion.fecha_inicio,
        "fecha_fin": inspeccion.fecha_fin,
        "firma_inspector": inspeccion.firma_inspector,
        "fecha_firma_inspector": inspeccion.fecha_firma_inspector,
        "firma_cliente": inspeccion.firma_cliente,
        "fecha_firma_cliente": inspeccion.fecha_firma_cliente,
        "observaciones_generales": inspeccion.observaciones_generales
    }

# ============================================
# 4. FIRMAR COMO INSPECTOR
# ============================================
@router.put("/{id}/firma-inspector", response_model=MessageResponse)
def firmar_inspector(
    id: int,
    data: FirmaRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    if inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No eres el inspector asignado a esta inspección")
    
    if inspeccion.firma_inspector:
        raise HTTPException(status_code=400, detail="Ya hay una firma del inspector registrada")
    
    inspeccion.firma_inspector = data.firma
    inspeccion.fecha_firma_inspector = datetime.now()
    db.commit()
    db.refresh(inspeccion)
    
    return {"message": "Firma del inspector registrada exitosamente"}

# ============================================
# 5. FIRMAR COMO CLIENTE
# ============================================
@router.put("/{id}/firma-cliente", response_model=MessageResponse)
def firmar_cliente(
    id: int,
    data: FirmaRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    if inspeccion.firma_cliente:
        raise HTTPException(status_code=400, detail="Ya hay una firma del cliente registrada")
    
    ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == inspeccion.id_ascensor).first()
    if not ascensor:
        raise HTTPException(status_code=404, detail="Ascensor no encontrado")
    
    if ascensor.id_cliente != user_id:
        raise HTTPException(status_code=403, detail="No eres el cliente propietario de este ascensor")
    
    inspeccion.firma_cliente = data.firma
    inspeccion.fecha_firma_cliente = datetime.now()
    db.commit()
    db.refresh(inspeccion)
    
    return {"message": "Firma del cliente registrada exitosamente"}

# ============================================
# 6. VERIFICAR ESTADO DE FIRMAS
# ============================================
@router.get("/{id}/firmas")
def verificar_firmas(
    id: int,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    if rol == 'Inspector' and inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver esta inspección")
    
    if rol == 'Cliente':
        ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == inspeccion.id_ascensor).first()
        if ascensor.id_cliente != user_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver esta inspección")
    
    return {
        "id_inspeccion": inspeccion.id_inspeccion,
        "firma_inspector": bool(inspeccion.firma_inspector),
        "fecha_firma_inspector": inspeccion.fecha_firma_inspector,
        "firma_cliente": bool(inspeccion.firma_cliente),
        "fecha_firma_cliente": inspeccion.fecha_firma_cliente,
        "ambas_firmas": bool(inspeccion.firma_inspector and inspeccion.firma_cliente)
    }

# ============================================
# 7. ACTUALIZAR ESTADO DE INSPECCIÓN
# ============================================
@router.put("/{id}/estado")
def actualizar_estado(
    id: int,
    estado: str,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    if rol not in ['Administrador', 'Coordinador'] and inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para actualizar esta inspección")
    
    estados_validos = ['Programada', 'En Progreso', 'Completada', 'Cancelada', 'Finalizada', 'Aprobada']
    if estado not in estados_validos:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Opciones: {estados_validos}")
    
    inspeccion.estado = estado
    if estado in ['Completada', 'Finalizada', 'Aprobada']:
        inspeccion.fecha_fin = datetime.now()
    
    db.commit()
    db.refresh(inspeccion)
    
    return {
        "message": "Estado actualizado exitosamente",
        "nuevo_estado": inspeccion.estado
    }
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
