from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, date
from app.database import get_db
from app.models.models import Solicitud, Ascensor, Usuario, Notificacion
from app.schemas.schemas import SolicitudCreate, SolicitudUpdate, SolicitudResponse
from app.utils.auth_deps import get_current_user_role, require_admin, ADMIN_ROL_ID, COORDINADOR_ROL_ID

router = APIRouter(prefix="/solicitudes", tags=["Solicitudes"])


# ✅ FIX: SolicitudResponse declara ascensor/cliente como "dict | None", pero
# las relaciones de SQLAlchemy son objetos ORM, no dicts (mismo problema que
# ya se corrigió en usuario_ascensor.py). Antes esos campos no existían
# siquiera en el modelo, así que siempre llegaban en None y el frontend
# mostraba "N/A" en Ascensor y Cliente. Se serializa manualmente a dict.
def _serializar_solicitud(s: Solicitud) -> dict:
    return {
        "id_solicitud": s.id_solicitud,
        "id_cliente": s.id_cliente,
        "id_ascensor": s.id_ascensor,
        "tipo_servicio": s.tipo_servicio,
        "prioridad": s.prioridad,
        "fecha_solicitud": s.fecha_solicitud,
        "fecha_deseada": s.fecha_deseada,
        "estado": s.estado,
        "observaciones": s.observaciones,
        "fecha_registro": s.fecha_registro,
        "ascensor": {
            "id_ascensor": s.ascensor.id_ascensor,
            "codigo_interno": s.ascensor.codigo_interno,
            "marca": s.ascensor.marca,
            "modelo": s.ascensor.modelo,
            "ciudad": s.ascensor.ciudad,
            "direccion_completa": s.ascensor.direccion_completa,
        } if s.ascensor else None,
        "cliente": {
            "id_usuario": s.cliente.id_usuario,
            "nombre_completo": s.cliente.nombre_completo,
            "correo": s.cliente.correo,
            "telefono": s.cliente.telefono,
        } if s.cliente else None,
    }


def _con_relaciones(query):
    return query.options(joinedload(Solicitud.ascensor), joinedload(Solicitud.cliente))


# 1. Crear solicitud (solo Cliente)
@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
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

    # FIX: el frontend (Solicitudes.jsx) ya bloquea fechas pasadas en el
    # campo "Fecha deseada", pero el backend no validaba nada -> se podia
    # crear una solicitud pidiendo una inspeccion para una fecha ya pasada
    # llamando directo al API. Misma regla que ya existe en /inspecciones
    # (crear_inspeccion) para el flujo de "Nueva inspección".
    if data.fecha_deseada and data.fecha_deseada < date.today():
        raise HTTPException(
            status_code=400,
            detail=f"La fecha deseada ({data.fecha_deseada}) no puede ser anterior a hoy ({date.today()})"
        )

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

    # FIX: al crear una solicitud no se avisaba a nadie -> Coordinadores y
    # Administradores solo se enteraban de una solicitud nueva si entraban
    # manualmente a revisar la lista. Se les crea una notificación (misma
    # tabla/patrón que ya usa asignar_inspector en programacion.py), así les
    # suena la alarma y les aparece en la campanita.
    destinatarios = db.query(Usuario).filter(
        Usuario.id_rol.in_([ADMIN_ROL_ID, COORDINADOR_ROL_ID])
    ).all()
    for destinatario in destinatarios:
        db.add(Notificacion(
            id_usuario_destino=destinatario.id_usuario,
            mensaje=f"Nueva solicitud de inspección para el ascensor {ascensor.codigo_interno} (prioridad {data.prioridad}).",
            enlace="/dashboard/solicitudes",
            leida=False,
        ))
    db.commit()

    nueva = _con_relaciones(db.query(Solicitud)).filter(
        Solicitud.id_solicitud == nueva.id_solicitud
    ).first()
    return _serializar_solicitud(nueva)

# 2. Listar solicitudes
@router.get("/", response_model=List[dict])
def listar_solicitudes(
    db: Session = Depends(get_db),
    user_data: tuple = Depends(get_current_user_role)
):
    rol, sub, user_id = user_data

    query = _con_relaciones(db.query(Solicitud))
    # Si es cliente, solo ve sus propias solicitudes
    if rol == "Cliente":
        query = query.filter(Solicitud.id_cliente == user_id)
    solicitudes = query.order_by(Solicitud.id_solicitud.desc()).all()
    return [_serializar_solicitud(s) for s in solicitudes]

# 3. Obtener una solicitud por ID
@router.get("/{id}", response_model=dict)
def obtener_solicitud(
    id: int,
    db: Session = Depends(get_db),
    user_data: tuple = Depends(get_current_user_role)
):
    rol, sub, user_id = user_data

    solicitud = _con_relaciones(db.query(Solicitud)).filter(Solicitud.id_solicitud == id).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    # Validar permiso
    if rol == "Cliente" and solicitud.id_cliente != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver esta solicitud")
    return _serializar_solicitud(solicitud)

# 4. Modificar solicitud
@router.put("/{id}", response_model=dict)
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

    estado_anterior = solicitud.estado
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(solicitud, key, value)
    db.commit()
    db.refresh(solicitud)

    # FIX: cuando el cliente cancelaba una solicitud pendiente, Coordinador
    # y Administrador no se enteraban -> les toca revisarla manualmente para
    # darse cuenta. Se les avisa igual que cuando se crea una solicitud
    # nueva.
    if solicitud.estado == "Cancelada" and estado_anterior != "Cancelada":
        destinatarios = db.query(Usuario).filter(
            Usuario.id_rol.in_([ADMIN_ROL_ID, COORDINADOR_ROL_ID])
        ).all()
        for destinatario in destinatarios:
            db.add(Notificacion(
                id_usuario_destino=destinatario.id_usuario,
                mensaje=f"La solicitud #{solicitud.id_solicitud} fue cancelada por el cliente.",
                enlace="/dashboard/solicitudes",
                leida=False,
            ))
        db.commit()

    solicitud = _con_relaciones(db.query(Solicitud)).filter(Solicitud.id_solicitud == id).first()
    return _serializar_solicitud(solicitud)

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
