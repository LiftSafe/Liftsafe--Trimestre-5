<<<<<<< HEAD
from fastapi import APIRouter, Depends, HTTPException, status
=======
<<<<<<< HEAD
from fastapi import APIRouter, Depends, HTTPException, status
=======
from fastapi import APIRouter, Depends, HTTPException, status, Body
>>>>>>> feature/luz
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.database import get_db
<<<<<<< HEAD
from app.models.models import Programacion, Solicitud, Usuario
from app.schemas.schemas import ProgramacionCreate, ProgramacionUpdate, ProgramacionResponse, MessageResponse
=======
<<<<<<< HEAD
from app.models.models import Programacion, Solicitud, Usuario
=======
from app.models.models import Programacion, Solicitud, Usuario, Notificacion
>>>>>>> feature/luz
from app.schemas.schemas import ProgramacionCreate, ProgramacionUpdate, ProgramacionResponse
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
from app.utils.auth_deps import get_current_user, require_coordinador, INSPECTOR_ROL_ID

router = APIRouter(prefix="/programacion", tags=["Programación"])

# 1. Asignar inspector a solicitud (solo Coordinador)
@router.post("/", response_model=ProgramacionResponse, status_code=status.HTTP_201_CREATED)
def asignar_inspector(
    data: ProgramacionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_coordinador)
):
    solicitud = db.query(Solicitud).filter(Solicitud.id_solicitud == data.id_solicitud).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
    # Validación extra: Evitar programar si ya está programada o cancelada
>>>>>>> feature/luz
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    if solicitud.estado != "Pendiente":
        raise HTTPException(status_code=400, detail="La solicitud no está pendiente")

    inspector = db.query(Usuario).filter(
        Usuario.id_usuario == data.id_inspector,
        Usuario.id_rol == INSPECTOR_ROL_ID
    ).first()
    if not inspector:
        raise HTTPException(status_code=404, detail="Inspector no encontrado")

    nueva = Programacion(
        id_solicitud=data.id_solicitud,
        id_inspector=data.id_inspector,
        fecha_programada=data.fecha_programada,
        hora_inicio=data.hora_inicio,
        hora_fin_estimada=data.hora_fin_estimada,
        estado="Programada"
    )
    db.add(nueva)
<<<<<<< HEAD
    solicitud.estado = "Programada"
=======
<<<<<<< HEAD
    solicitud.estado = "Programada"
=======
    
    # Actualizar estado de la solicitud
    solicitud.estado = "Programada"

    # 👇 INTEGRACIÓN CON TAREA 3: Crear notificación para el Inspector
    notificacion = Notificacion(
        id_usuario_destino=data.id_inspector,
        mensaje=f"Se te ha asignado una nueva inspección para la solicitud #{data.id_solicitud}.",
        leida=False,
        fecha=date.today()
    )
    db.add(notificacion)

>>>>>>> feature/luz
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    db.commit()
    db.refresh(nueva)
    return nueva

# 2. Listar programaciones
@router.get("/", response_model=List[ProgramacionResponse])
def listar_programaciones(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Programacion)
    if current_user["rol"] == "Inspector":
        query = query.filter(Programacion.id_inspector == current_user["user_id"])
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
    # Si es coordinador o admin, ve todas
>>>>>>> feature/luz
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    return query.order_by(Programacion.fecha_programada.desc()).all()

# 3. Reasignar inspector (Coordinador)
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

    if data.id_inspector:
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
        # Validar que el nuevo inspector sea realmente un inspector
>>>>>>> feature/luz
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
        inspector = db.query(Usuario).filter(
            Usuario.id_usuario == data.id_inspector,
            Usuario.id_rol == INSPECTOR_ROL_ID
        ).first()
        if not inspector:
            raise HTTPException(status_code=404, detail="Inspector no encontrado")
<<<<<<< HEAD
        programacion.id_inspector = data.id_inspector

=======
<<<<<<< HEAD
        programacion.id_inspector = data.id_inspector

=======
        
        # Actualizar inspector y crear nueva notificación
        programacion.id_inspector = data.id_inspector
        notificacion = Notificacion(
            id_usuario_destino=data.id_inspector,
            mensaje=f"Se te ha reasignado la inspección de la solicitud #{programacion.id_solicitud}.",
            leida=False,
            fecha=date.today()
        )
        db.add(notificacion)

    # Actualizar solo si vienen datos, ignorando el campo estado para no romper la lógica
>>>>>>> feature/luz
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    if data.fecha_programada:
        programacion.fecha_programada = data.fecha_programada
    if data.hora_inicio:
        programacion.hora_inicio = data.hora_inicio
<<<<<<< HEAD
    if data.estado:
        programacion.estado = data.estado
=======
<<<<<<< HEAD
    if data.estado:
        programacion.estado = data.estado
=======
    if data.hora_fin_estimada:
        programacion.hora_fin_estimada = data.hora_fin_estimada

    # Forzamos que el estado siga siendo "Programada" (evitamos que se cambie por error)
    programacion.estado = "Programada"
>>>>>>> feature/luz
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869

    db.commit()
    db.refresh(programacion)
    return programacion

# 4. Cancelar programación (Coordinador)
@router.put("/{id}/cancelar")
def cancelar_programacion(
    id: int,
<<<<<<< HEAD
    motivo: str,
=======
<<<<<<< HEAD
    motivo: str,
=======
    motivo: str = Body(..., embed=True),  # ✅ CORREGIDO: Ahora espera {"motivo": "..."} en el JSON
>>>>>>> feature/luz
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_coordinador)
):
    programacion = db.query(Programacion).filter(Programacion.id_programacion == id).first()
    if not programacion:
        raise HTTPException(status_code=404, detail="Programación no encontrada")

    programacion.estado = "Cancelada"
    programacion.motivo_cancelacion = motivo

    solicitud = db.query(Solicitud).filter(Solicitud.id_solicitud == programacion.id_solicitud).first()
    if solicitud:
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
        solicitud.estado = "Pendiente"
    
    db.commit()
    return {"message": "Programación cancelada"}
<<<<<<< HEAD


@router.delete("/{id}", response_model=MessageResponse)
def eliminar_programacion(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_coordinador)
):
    programacion = db.query(Programacion).filter(Programacion.id_programacion == id).first()
    if not programacion:
        raise HTTPException(status_code=404, detail="Programación no encontrada")
    
    if programacion.estado != "Programada":
        raise HTTPException(status_code=400, detail="Solo se pueden eliminar programaciones en estado Programada")
    
    db.delete(programacion)
    db.commit()
    return {"message": "Programación eliminada exitosamente"}
=======
=======
        # Devolvemos la solicitud a estado Pendiente para que pueda ser reprogramada
        solicitud.estado = "Pendiente"
    
    db.commit()
    return {"message": "Programación cancelada correctamente"}
>>>>>>> feature/luz
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
