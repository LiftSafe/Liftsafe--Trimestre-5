"""RNF-012: log de auditoría de los cambios en los datos clave de las inspecciones.

Cada registro guarda usuario, fecha y hora, tabla y registro afectados, los
campos modificados con su valor anterior (datos_anteriores) y el nuevo
(datos_nuevos). La tabla es inmutable: un trigger de la base de datos impide
modificar o borrar registros (ver migrations/auditoria_inmutable.sql).
"""
import json
from datetime import date, datetime

from app.models.models import Auditoria


def _json(datos):
    if not datos:
        return None
    return json.dumps(datos, ensure_ascii=False, default=lambda v: v.isoformat() if isinstance(v, (date, datetime)) else str(v))


def cambios(antes: dict, despues: dict) -> tuple[dict, dict]:
    """Solo los campos que cambiaron: (valores anteriores, valores nuevos)."""
    claves = [k for k in despues if antes.get(k) != despues.get(k)]
    return {k: antes.get(k) for k in claves}, {k: despues.get(k) for k in claves}


def registrar_auditoria(db, id_usuario, tabla, operacion, id_registro,
                        datos_anteriores=None, datos_nuevos=None, ip_origen="127.0.0.1", commit=True):
    """Agrega un evento de auditoría. Con commit=False queda en la misma
    transacción que el cambio auditado (se guardan juntos o ninguno)."""
    registro = Auditoria(
        id_usuario=id_usuario,
        tabla_afectada=tabla,
        operacion=operacion,
        id_registro=id_registro,
        datos_anteriores=_json(datos_anteriores),
        datos_nuevos=_json(datos_nuevos),
        ip_origen=ip_origen,
        fecha_evento=datetime.now(),
    )
    db.add(registro)
    if commit:
        db.commit()
    return registro


def auditar_cambio(db, id_usuario, tabla, id_registro, antes: dict, despues: dict, operacion="UPDATE", commit=False):
    """Registra solo si algo cambió. Devuelve True si se registró."""
    anteriores, nuevos = cambios(antes, despues)
    if not nuevos:
        return False
    registrar_auditoria(db, id_usuario, tabla, operacion, id_registro, anteriores, nuevos, commit=commit)
    return True
