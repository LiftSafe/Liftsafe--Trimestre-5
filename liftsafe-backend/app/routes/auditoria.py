from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
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
    query = db.query(Auditoria)
    if tabla:
        query = query.filter(Auditoria.tabla_afectada == tabla)
    if usuario:
        query = query.filter(Auditoria.id_usuario == usuario)
    return query.order_by(Auditoria.fecha_evento.desc()).all()