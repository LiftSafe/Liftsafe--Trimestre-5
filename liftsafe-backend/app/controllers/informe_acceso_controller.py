"""Qué puede ver el cliente de un informe.

El cliente solo descarga el PDF cuando el coordinador o el administrador
aprobó el informe. Antes de eso ve el estado, pero no la ruta del PDF.
"""
from sqlalchemy.orm import Session

from app.models.models import Ascensor, Inspeccion

ROL_CLIENTE = "Cliente"
ESTADOS_DESCARGABLES_CLIENTE = ("Aprobado", "Enviado")


def cliente_puede_descargar(estado_informe) -> bool:
    return estado_informe in ESTADOS_DESCARGABLES_CLIENTE


def informe_para_usuario(informe, rol: str) -> dict:
    """Informe como dict; al cliente se le oculta el PDF hasta la aprobación."""
    datos = {c.name: getattr(informe, c.name) for c in informe.__table__.columns}
    pendiente = rol == ROL_CLIENTE and not cliente_puede_descargar(datos.get("estado"))
    if pendiente:
        datos["ruta_pdf"] = None
        datos["hash_documento"] = None
    datos["pendiente_aprobacion"] = pendiente
    return datos


def es_inspeccion_del_cliente(db: Session, id_inspeccion: int, id_cliente) -> bool:
    return db.query(Inspeccion.id_inspeccion).join(
        Ascensor, Ascensor.id_ascensor == Inspeccion.id_ascensor
    ).filter(
        Inspeccion.id_inspeccion == id_inspeccion, Ascensor.id_cliente == id_cliente
    ).first() is not None
