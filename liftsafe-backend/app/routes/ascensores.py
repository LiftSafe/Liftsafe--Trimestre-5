from fastapi import APIRouter, Depends, HTTPException, Request, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import Ascensor, Usuario
from jose import jwt, JWTError
from app.config import settings

router = APIRouter(prefix="/ascensores", tags=["Ascensores"])

# ✅ ESQUEMA DE SEGURIDAD
security = HTTPBearer()

def get_current_user_role(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("rol"), payload.get("sub"), payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.get("/listado")
def listado_ascensores(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    from app.models.models import Inspeccion

    if rol in ['Administrador', 'Director Técnico', 'Coordinador']:
        ascensores = db.query(Ascensor, Usuario.nombre_completo).join(
            Usuario, Ascensor.id_cliente == Usuario.id_usuario
        ).all()
    elif rol == 'Inspector':
        ascensores = db.query(Ascensor, Usuario.nombre_completo).join(
            Usuario, Ascensor.id_cliente == Usuario.id_usuario
        ).join(Inspeccion, Ascensor.id_ascensor == Inspeccion.id_ascensor).filter(
            Inspeccion.id_inspector == user_id
        ).distinct().all()
    else:
        user = db.query(Usuario).filter(Usuario.correo == correo).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        ascensores = db.query(Ascensor, Usuario.nombre_completo).join(
            Usuario, Ascensor.id_cliente == Usuario.id_usuario
        ).filter(Ascensor.id_cliente == user.id_usuario).all()
    
    return [
        {
            "id_ascensor": a.id_ascensor,
            "codigo_interno": a.codigo_interno,
            "marca": a.marca,
            "modelo": a.modelo,
            "tipo_ascensor": a.tipo_ascensor,
            "capacidad_kg": a.capacidad_kg,
            "ciudad": a.ciudad,
            "estado": a.estado,
            "cliente": cliente
        }
        for a, cliente in ascensores
    ]

@router.get("/edificios")
def edificios(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    # Inspector: edificios donde ha hecho inspecciones
    if rol == 'Inspector':
        from app.models.models import Inspeccion
        resultado = db.query(
            Usuario.nombre_completo.label('cliente'),
            Usuario.direccion,
            func.count(Ascensor.id_ascensor).label('total_ascensores')
        ).join(Ascensor, Usuario.id_usuario == Ascensor.id_cliente)\
         .join(Inspeccion, Ascensor.id_ascensor == Inspeccion.id_ascensor)\
         .filter(Inspeccion.id_inspector == user_id)\
         .group_by(Usuario.id_usuario).all()
    
    # Cliente: solo su edificio
    elif rol == 'Cliente':
        resultado = db.query(
            Usuario.nombre_completo.label('cliente'),
            Usuario.direccion,
            func.count(Ascensor.id_ascensor).label('total_ascensores')
        ).join(Ascensor, Usuario.id_usuario == Ascensor.id_cliente)\
         .filter(Usuario.correo == correo)\
         .group_by(Usuario.id_usuario).all()
    
    # Admin y Director Técnico: todos
    else:
        resultado = db.query(
            Usuario.nombre_completo.label('cliente'),
            Usuario.direccion,
            func.count(Ascensor.id_ascensor).label('total_ascensores')
        ).join(Ascensor, Usuario.id_usuario == Ascensor.id_cliente)\
         .group_by(Usuario.id_usuario).all()
    
    return [
        {
            "cliente": r.cliente,
            "direccion": r.direccion,
            "total_ascensores": r.total_ascensores
        }
        for r in resultado
    ]

@router.get("/mis-ascensores")
def mis_ascensores_inspeccionados(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no identificado")
    
    # Buscar ascensores que el inspector ha inspeccionado
    from app.models.models import Inspeccion
    ascensores = db.query(Ascensor, Usuario.nombre_completo).\
        join(Inspeccion, Ascensor.id_ascensor == Inspeccion.id_ascensor).\
        join(Usuario, Ascensor.id_cliente == Usuario.id_usuario).\
        filter(Inspeccion.id_inspector == user_id).\
        distinct().all()
    
    return [
        {
            "id_ascensor": a.id_ascensor,
            "codigo_interno": a.codigo_interno,
            "marca": a.marca,
            "modelo": a.modelo,
            "tipo_ascensor": a.tipo_ascensor,
            "capacidad_kg": a.capacidad_kg,
            "ciudad": a.ciudad,
            "estado": a.estado,
            "cliente": cliente
        }
        for a, cliente in ascensores
    ]