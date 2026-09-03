from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.models import Auditoria
from app.schemas.schemas import AuditoriaResponse
from app.utils.auth_deps import require_admin

router = APIRouter(prefix="/auditoria", tags=["Auditoria"])


# Listar auditoría (solo Administrador)
@router.get("/", response_model=List[AuditoriaResponse])
def listar_auditoria(
    tabla: str | None = None,
    usuario: int | None = None,
    db: Session = Depends(get_db),
    rol: str = Depends(require_admin)
):
    query = db.query(Auditoria).options(joinedload(Auditoria.usuario))
    if tabla:
        query = query.filter(Auditoria.tabla_afectada == tabla)
    if usuario:
        query = query.filter(Auditoria.id_usuario == usuario)
    registros = query.order_by(Auditoria.fecha_evento.desc()).all()

    return [
        {
            "id_auditoria": r.id_auditoria,
            "id_usuario": r.id_usuario,
            "usuario_nombre": r.usuario.nombre_completo if r.usuario else None,
            "tabla_afectada": r.tabla_afectada,
            "operacion": r.operacion,
            "id_registro": r.id_registro,
            "datos_anteriores": r.datos_anteriores,
            "datos_nuevos": r.datos_nuevos,
            "ip_origen": r.ip_origen,
            "user_agent": r.user_agent,
            "fecha_evento": r.fecha_evento,
        }
        for r in registros
    ]