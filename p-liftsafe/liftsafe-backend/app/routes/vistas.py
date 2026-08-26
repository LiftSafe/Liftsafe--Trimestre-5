from fastapi import APIRouter, Depends, HTTPException, Request, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.models import Inspeccion, Ascensor, Usuario
from jose import jwt, JWTError
from app.config import settings

router = APIRouter(prefix="/vistas", tags=["Vistas y Procedimientos"])

# ✅ ESQUEMA DE SEGURIDAD
security = HTTPBearer()

def get_current_user_role(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("rol"), payload.get("sub"), payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.get("/resumen-inspecciones")
def resumen_inspecciones(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    result = db.execute(text("SELECT * FROM vista_resumen_inspecciones")).mappings().all()
    return [dict(row) for row in result]

@router.get("/inspecciones-por-estado/{estado}")
def inspecciones_por_estado(
    estado: str,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    # Admin y Director Técnico ven todo
    if rol in ['Administrador', 'Director Técnico']:
        result = db.execute(
            text("CALL sp_listar_inspecciones_por_estado(:estado)"),
            {"estado": estado}
        ).mappings().all()
        return [dict(row) for row in result]
    
    # Cliente: solo ve inspecciones de sus ascensores
    elif rol == 'Cliente':
        result = db.execute(text("""
            SELECT 
                i.id_inspeccion,
                a.codigo_interno AS codigo_ascensor,
                a.marca,
                a.modelo,
                u.nombre_completo AS inspector,
                i.fecha_inicio,
                i.fecha_fin,
                i.estado,
                i.observaciones_generales
            FROM inspeccion i
            INNER JOIN ascensor a ON i.id_ascensor = a.id_ascensor
            INNER JOIN usuario u ON i.id_inspector = u.id_usuario
            WHERE i.estado = :estado AND a.id_cliente = :client_id
            ORDER BY i.fecha_inicio DESC
        """), {"estado": estado, "client_id": user_id}).mappings().all()
        return [dict(row) for row in result]
    
    # Inspector: solo ve sus propias inspecciones
    elif rol == 'Inspector':
        result = db.execute(text("""
            SELECT 
                i.id_inspeccion,
                a.codigo_interno AS codigo_ascensor,
                a.marca,
                a.modelo,
                u.nombre_completo AS inspector,
                i.fecha_inicio,
                i.fecha_fin,
                i.estado,
                i.observaciones_generales
            FROM inspeccion i
            INNER JOIN ascensor a ON i.id_ascensor = a.id_ascensor
            INNER JOIN usuario u ON i.id_inspector = u.id_usuario
            WHERE i.estado = :estado AND i.id_inspector = :inspector_id
            ORDER BY i.fecha_inicio DESC
        """), {"estado": estado, "inspector_id": user_id}).mappings().all()
        return [dict(row) for row in result]
    
    else:
        raise HTTPException(status_code=403, detail="Rol no autorizado")