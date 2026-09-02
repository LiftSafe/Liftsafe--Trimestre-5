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
    
    # Admin y Director Técnico ven todo
    if rol in ['Administrador', 'Director Técnico']:
        ascensores = db.query(Ascensor, Usuario.nombre_completo).join(Usuario, Ascensor.id_cliente == Usuario.id_usuario).all()
    else:
        # Otros roles: solo ven ascensores del cliente logueado
        user = db.query(Usuario).filter(Usuario.correo == correo).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        ascensores = db.query(Ascensor, Usuario.nombre_completo).join(Usuario, Ascensor.id_cliente == Usuario.id_usuario).filter(Ascensor.id_cliente == user.id_usuario).all()
    
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
<<<<<<< HEAD
    ]


from app.schemas.schemas import AscensorCreate, AscensorUpdate, MessageResponse

@router.post("/", response_model=MessageResponse)
def crear_ascensor(
    data: AscensorCreate,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    if rol not in ['Administrador', 'Director Técnico', 'Coordinador']:
        raise HTTPException(status_code=403, detail="No autorizado para crear ascensores")
    
    # Validar que el cliente exista
    cliente = db.query(Usuario).filter(Usuario.id_usuario == data.id_cliente).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Validar código interno único
    existente = db.query(Ascensor).filter(Ascensor.codigo_interno == data.codigo_interno).first()
    if existente:
        raise HTTPException(status_code=400, detail="El código interno ya está registrado")
    
    nuevo = Ascensor(
        id_cliente=data.id_cliente,
        codigo_interno=data.codigo_interno,
        marca=data.marca,
        modelo=data.modelo,
        numero_serie=data.numero_serie,
        tipo_ascensor=data.tipo_ascensor,
        capacidad_kg=data.capacidad_kg,
        capacidad_personas=data.capacidad_personas,
        numero_pisos=data.numero_pisos,
        velocidad_ms=data.velocidad_ms,
        ubicacion_exacta=data.ubicacion_exacta,
        direccion_completa=data.direccion_completa,
        ciudad=data.ciudad,
        estado=data.estado,
        fecha_instalacion=data.fecha_instalacion
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"message": "Ascensor creado exitosamente", "id_ascensor": nuevo.id_ascensor}


@router.put("/{id_ascensor}", response_model=MessageResponse)
def editar_ascensor(
    id_ascensor: int,
    data: AscensorUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    if rol not in ['Administrador', 'Director Técnico', 'Coordinador']:
        raise HTTPException(status_code=403, detail="No autorizado para editar ascensores")
    
    ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == id_ascensor).first()
    if not ascensor:
        raise HTTPException(status_code=404, detail="Ascensor no encontrado")
    
    # Validar cliente si se está actualizando
    if data.id_cliente is not None:
        cliente = db.query(Usuario).filter(Usuario.id_usuario == data.id_cliente).first()
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        ascensor.id_cliente = data.id_cliente
    
    # Validar código interno único si se está actualizando
    if data.codigo_interno is not None:
        existente = db.query(Ascensor).filter(
            Ascensor.codigo_interno == data.codigo_interno,
            Ascensor.id_ascensor != id_ascensor
        ).first()
        if existente:
            raise HTTPException(status_code=400, detail="El código interno ya está registrado")
        ascensor.codigo_interno = data.codigo_interno
    
    if data.marca is not None:
        ascensor.marca = data.marca
    if data.modelo is not None:
        ascensor.modelo = data.modelo
    if data.numero_serie is not None:
        ascensor.numero_serie = data.numero_serie
    if data.tipo_ascensor is not None:
        ascensor.tipo_ascensor = data.tipo_ascensor
    if data.capacidad_kg is not None:
        ascensor.capacidad_kg = data.capacidad_kg
    if data.capacidad_personas is not None:
        ascensor.capacidad_personas = data.capacidad_personas
    if data.numero_pisos is not None:
        ascensor.numero_pisos = data.numero_pisos
    if data.velocidad_ms is not None:
        ascensor.velocidad_ms = data.velocidad_ms
    if data.ubicacion_exacta is not None:
        ascensor.ubicacion_exacta = data.ubicacion_exacta
    if data.direccion_completa is not None:
        ascensor.direccion_completa = data.direccion_completa
    if data.ciudad is not None:
        ascensor.ciudad = data.ciudad
    if data.estado is not None:
        ascensor.estado = data.estado
    if data.fecha_instalacion is not None:
        ascensor.fecha_instalacion = data.fecha_instalacion
    
    db.commit()
    db.refresh(ascensor)
    return {"message": "Ascensor actualizado exitosamente"}


@router.delete("/{id_ascensor}", response_model=MessageResponse)
def eliminar_ascensor(
    id_ascensor: int,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    if rol not in ['Administrador', 'Director Técnico']:
        raise HTTPException(status_code=403, detail="No autorizado para eliminar ascensores")
    
    ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == id_ascensor).first()
    if not ascensor:
        raise HTTPException(status_code=404, detail="Ascensor no encontrado")
    
    # Validar que no tenga inspecciones asociadas
    if ascensor.inspecciones:
        raise HTTPException(status_code=400, detail="No se puede eliminar el ascensor porque tiene inspecciones asociadas")
    
    db.delete(ascensor)
    db.commit()
    return {"message": "Ascensor eliminado exitosamente"}
=======
    ]
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
