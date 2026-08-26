from sqlalchemy.orm import Session
from sqlalchemy import text

def get_vista_resumen(db: Session):
    result = db.execute(text("SELECT * FROM vista_resumen_inspecciones")).mappings().all()
    return [dict(row) for row in result]

def get_procedimiento_inspecciones(db: Session, estado: str):
    result = db.execute(
        text("CALL sp_listar_inspecciones_por_estado(:estado)"),
        {"estado": estado}
    ).mappings().all()
    return [dict(row) for row in result]