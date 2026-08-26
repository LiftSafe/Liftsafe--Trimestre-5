from sqlalchemy.orm import Session
from app.models.models import Inspeccion, Programacion, Solicitud
from datetime import datetime

def crear_inspeccion(db: Session, data: dict, id_inspector: int):
    """
    Crea una nueva inspección con su programación y solicitud asociada.
    """
    # La fecha ya viene como datetime desde Pydantic, no necesita strptime
    fecha_programada = data['fecha_programada']
    if isinstance(fecha_programada, str):
        fecha_programada = datetime.strptime(fecha_programada, '%Y-%m-%d')
    
    # 1. Crear solicitud primero (requerida por el modelo)
    nueva_solicitud = Solicitud(
        id_cliente=data.get('id_cliente', 1),
        id_ascensor=data['id_ascensor'],
        tipo_servicio=data.get('tipo_servicio', 'Periódica'),
        prioridad='Normal',
        fecha_solicitud=datetime.now().date(),
        fecha_deseada=fecha_programada.date() if hasattr(fecha_programada, 'date') else fecha_programada,
        estado='Programada',
        observaciones=data.get('observaciones')
    )
    db.add(nueva_solicitud)
    db.flush()
    
    # 2. Crear programación
    nueva_programacion = Programacion(
        id_solicitud=nueva_solicitud.id_solicitud,
        id_inspector=id_inspector,
        fecha_programada=fecha_programada.date() if hasattr(fecha_programada, 'date') else fecha_programada,
        hora_inicio=fecha_programada,
        estado='Programada'
    )
    db.add(nueva_programacion)
    db.flush()
    
    # 3. Crear inspección
    nueva_inspeccion = Inspeccion(
        id_programacion=nueva_programacion.id_programacion,
        id_ascensor=data['id_ascensor'],
        id_inspector=id_inspector,
        id_solicitud=nueva_solicitud.id_solicitud,
        fecha_inicio=fecha_programada,
        estado='Programada',
        observaciones_generales=data.get('observaciones')
    )
    db.add(nueva_inspeccion)
    db.commit()
    db.refresh(nueva_inspeccion)
    
    return nueva_inspeccion