from app.models.models import Auditoria
import json
from datetime import datetime


def registrar_auditoria(db, id_usuario, tabla, operacion, id_registro,
                         datos_anteriores=None, datos_nuevos=None):
    """
    Registra un evento de auditoría en la base de datos.

    Uso desde otros módulos (ejemplo, al crear una inspección):
        from app.utils.auditoria import registrar_auditoria
        registrar_auditoria(
            db,
            id_usuario=current_user_id,
            tabla="inspeccion",
            operacion="CREATE",
            id_registro=nueva_inspeccion.id_inspeccion,
            datos_nuevos={"estado": "Borrador"}
        )
    """
    auditoria = Auditoria(
        id_usuario=id_usuario,
        tabla_afectada=tabla,
        operacion=operacion,
        id_registro=id_registro,
        datos_anteriores=json.dumps(datos_anteriores) if datos_anteriores else None,
        datos_nuevos=json.dumps(datos_nuevos) if datos_nuevos else None,
        ip_origen="127.0.0.1",
        fecha_evento=datetime.now()
    )
    db.add(auditoria)
    db.commit()
    return auditoria