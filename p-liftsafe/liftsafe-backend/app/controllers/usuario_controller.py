from sqlalchemy.orm import Session
from app.models.models import Usuario, Rol, Ascensor, Inspeccion, Informe

def get_user_profile(db: Session, user_id: int):
    return db.query(Usuario, Rol.nombre_rol).join(Rol).filter(Usuario.id_usuario == user_id).first()

def get_admin_stats(db: Session):
    total_usuarios = db.query(Usuario).count()
    total_ascensores = db.query(Ascensor).count()
    total_inspecciones = db.query(Inspeccion).count()
    inspecciones_pendientes = db.query(Inspeccion).filter(Inspeccion.estado.in_(['Borrador', 'En Proceso'])).count()
    total_informes = db.query(Informe).count()
    
    return {
        "total_usuarios": total_usuarios,
        "total_ascensores": total_ascensores,
        "total_inspecciones": total_inspecciones,
        "inspecciones_pendientes": inspecciones_pendientes,
        "total_informes": total_informes
    }

def get_cliente_ascensores(db: Session, client_id: int):
    return db.query(Ascensor).filter(Ascensor.id_cliente == client_id).all()

def get_inspector_inspecciones(db: Session, inspector_id: int):
    return db.query(Inspeccion).filter(Inspeccion.id_inspector == inspector_id).all()

## 



