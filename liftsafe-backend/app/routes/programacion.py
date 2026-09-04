from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.models.models import Programacion, Solicitud, Usuario, Notificacion, Inspeccion
from app.schemas.schemas import ProgramacionCreate, ProgramacionUpdate, ProgramacionResponse, MessageResponse
from app.utils.auth_deps import get_current_user, require_coordinador, INSPECTOR_ROL_ID

router = APIRouter(prefix="/programacion", tags=["Programación"])


# ✅ FIX: el frontend manda la hora como texto suelto "HH:MM" (un <input
# type="time">, ver Solicitudes.jsx), pero Programacion.hora_inicio /
# hora_fin_estimada son columnas DATETIME (app/models/models.py). Guardar el
# string "HH:MM" directo en un DATETIME hacía que MySQL rechazara el INSERT
# ("Incorrect datetime value") -> 500 en el backend, que el navegador
# mostraba como "bloqueado por CORS" (FastAPI no agrega headers de CORS a
# una excepción no controlada). Esta función arma un datetime real
# combinando la fecha programada con la hora recibida.
def _combinar_fecha_hora(fecha: date, hora_str: Optional[str]) -> Optional[datetime]:
    if not fecha or not hora_str:
        return None
    hora_str = hora_str.strip()
    formato = "%H:%M:%S" if hora_str.count(":") == 2 else "%H:%M"
    hora = datetime.strptime(hora_str, formato).time()
    return datetime.combine(fecha, hora)

# ============================================
# 1. ASIGNAR INSPECTOR A SOLICITUD (Coordinador)
# ============================================
@router.post("/", response_model=ProgramacionResponse, status_code=status.HTTP_201_CREATED)
def asignar_inspector(
    data: ProgramacionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_coordinador)
):
    solicitud = db.query(Solicitud).filter(Solicitud.id_solicitud == data.id_solicitud).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    # Validar que la solicitud esté pendiente
    if solicitud.estado != "Pendiente":
        raise HTTPException(status_code=400, detail="La solicitud no está pendiente")

    # Validar que el usuario sea un Inspector
    inspector = db.query(Usuario).filter(
        Usuario.id_usuario == data.id_inspector,
        Usuario.id_rol == INSPECTOR_ROL_ID
    ).first()
    if not inspector:
        raise HTTPException(status_code=404, detail="Inspector no encontrado")

    # Crear la programación
    nueva = Programacion(
        id_solicitud=data.id_solicitud,
        id_inspector=data.id_inspector,
        fecha_programada=data.fecha_programada,
        hora_inicio=_combinar_fecha_hora(data.fecha_programada, data.hora_inicio),
        hora_fin_estimada=_combinar_fecha_hora(data.fecha_programada, data.hora_fin_estimada),
        estado="Programada"
    )
    db.add(nueva)
    db.flush()  # necesitamos nueva.id_programacion para la inspección

    # ✅ FIX: asignar un inspector solo creaba la fila en `programacion`, y la
    # lista de "Inspecciones" (para Inspector/Coordinador/Admin) se arma
    # siempre a partir de la tabla `inspeccion` (ver vista_resumen_inspecciones
    # y mis_inspecciones en routes/inspecciones.py). Como nunca se creaba esa
    # fila, la inspección recién asignada no aparecía en ningún lado. Ahora se
    # crea la Inspeccion vinculada a la misma programación, en estado
    # "Programada", igual que hace crear_inspeccion() para el flujo de
    # "Nueva inspección".
    nueva_inspeccion = Inspeccion(
        id_programacion=nueva.id_programacion,
        id_ascensor=solicitud.id_ascensor,
        id_inspector=data.id_inspector,
        id_solicitud=data.id_solicitud,
        fecha_inicio=nueva.hora_inicio or datetime.combine(data.fecha_programada, datetime.min.time()),
        estado="Programada"
    )
    db.add(nueva_inspeccion)

    # Actualizar estado de la solicitud
    solicitud.estado = "Programada"

    # Crear notificación para el Inspector (Luz)
    notificacion = Notificacion(
        id_usuario_destino=data.id_inspector,
        mensaje=f"Se te ha asignado una nueva inspección para la solicitud #{data.id_solicitud}.",
        leida=False,
        fecha_creacion=date.today()
    )
    db.add(notificacion)

    db.commit()
    db.refresh(nueva)
    return nueva

# ============================================
# 2. LISTAR PROGRAMACIONES
# ============================================
@router.get("/", response_model=List[ProgramacionResponse])
def listar_programaciones(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Programacion)
    
    # Si es Inspector, solo ve sus programaciones
    if current_user["rol"] == "Inspector":
        query = query.filter(Programacion.id_inspector == current_user["user_id"])
    
    return query.order_by(Programacion.fecha_programada.desc()).all()

# ============================================
# 3. REASIGNAR INSPECTOR (Coordinador)
# ============================================
@router.put("/{id}/reasignar", response_model=ProgramacionResponse)
def reasignar_inspector(
    id: int,
    data: ProgramacionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_coordinador)
):
    programacion = db.query(Programacion).filter(Programacion.id_programacion == id).first()
    if not programacion:
        raise HTTPException(status_code=404, detail="Programación no encontrada")

    # Validar y actualizar inspector
    if data.id_inspector:
        inspector = db.query(Usuario).filter(
            Usuario.id_usuario == data.id_inspector,
            Usuario.id_rol == INSPECTOR_ROL_ID
        ).first()
        if not inspector:
            raise HTTPException(status_code=404, detail="Inspector no encontrado")
        
        programacion.id_inspector = data.id_inspector
        
        # Crear notificación para el nuevo inspector (Luz)
        notificacion = Notificacion(
            id_usuario_destino=data.id_inspector,
            mensaje=f"Se te ha reasignado la inspección de la solicitud #{programacion.id_solicitud}.",
            leida=False,
            fecha_creacion=date.today()
        )
        db.add(notificacion)

    # Actualizar fechas y horas
    if data.fecha_programada:
        programacion.fecha_programada = data.fecha_programada
    fecha_referencia = data.fecha_programada or programacion.fecha_programada
    if data.hora_inicio:
        programacion.hora_inicio = _combinar_fecha_hora(fecha_referencia, data.hora_inicio)
    if data.hora_fin_estimada:
        programacion.hora_fin_estimada = _combinar_fecha_hora(fecha_referencia, data.hora_fin_estimada)

    # Mantener estado como Programada (no se cambia en reasignación)
    programacion.estado = "Programada"

    # ✅ FIX: mantener sincronizada la Inspeccion creada al asignar (mismo
    # motivo que en asignar_inspector) para que una reasignación de
    # inspector/fecha/hora también se refleje en la lista de Inspecciones.
    inspeccion_vinculada = db.query(Inspeccion).filter(
        Inspeccion.id_programacion == programacion.id_programacion
    ).first()
    if inspeccion_vinculada:
        if data.id_inspector:
            inspeccion_vinculada.id_inspector = data.id_inspector
        if programacion.hora_inicio:
            inspeccion_vinculada.fecha_inicio = programacion.hora_inicio

    db.commit()
    db.refresh(programacion)
    return programacion

# ============================================
# 4. CANCELAR PROGRAMACIÓN (Coordinador)
# ============================================
@router.put("/{id}/cancelar")
def cancelar_programacion(
    id: int,
    motivo: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_coordinador)
):
    programacion = db.query(Programacion).filter(Programacion.id_programacion == id).first()
    if not programacion:
        raise HTTPException(status_code=404, detail="Programación no encontrada")

    programacion.estado = "Cancelada"
    programacion.motivo_cancelacion = motivo

    # Devolver la solicitud a estado Pendiente para reprogramación
    solicitud = db.query(Solicitud).filter(Solicitud.id_solicitud == programacion.id_solicitud).first()
    if solicitud:
        solicitud.estado = "Pendiente"
    
    db.commit()
    return {"message": "Programación cancelada correctamente"}

# ============================================
# 5. ELIMINAR PROGRAMACIÓN (HEAD - CRUD completo)
# ============================================
@router.delete("/{id}", response_model=MessageResponse)
def eliminar_programacion(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_coordinador)
):
    programacion = db.query(Programacion).filter(Programacion.id_programacion == id).first()
    if not programacion:
        raise HTTPException(status_code=404, detail="Programación no encontrada")
    
    # Solo se pueden eliminar programaciones en estado Programada
    if programacion.estado != "Programada":
        raise HTTPException(status_code=400, detail="Solo se pueden eliminar programaciones en estado Programada")
    
    db.delete(programacion)
    db.commit()
    return {"message": "Programación eliminada exitosamente"}