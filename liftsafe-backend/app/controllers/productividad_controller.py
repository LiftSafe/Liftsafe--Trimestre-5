"""RF-024: reporte de productividad de los inspectores en un periodo."""
from datetime import datetime

ESTADOS_TERMINADA = {"Pendiente firma cliente", "Pendiente revisión", "Finalizada", "Aprobada", "Completada"}
ESTADOS_INFORME_APROBADO = {"Aprobado", "Enviado"}


def rechazos_por_inspeccion(db) -> dict:
    """Cuántas veces se rechazó el informe de cada inspección. Sale del log de
    auditoría (RNF-012) porque, cuando el inspector corrige y el informe se
    vuelve a generar y aprobar, su estado actual ya no dice que fue rechazado."""
    from sqlalchemy import func
    from app.models.models import Auditoria, Informe
    filas = (
        db.query(Informe.id_inspeccion, func.count(Auditoria.id_auditoria))
        .join(Auditoria, Auditoria.id_registro == Informe.id_informe)
        .filter(Auditoria.tabla_afectada == "informe", Auditoria.operacion == "RECHAZADO")
        .group_by(Informe.id_inspeccion)
        .all()
    )
    return {id_inspeccion: veces for id_inspeccion, veces in filas}


def fue_rechazada(fila) -> bool:
    """La inspección tuvo al menos un informe rechazado (aunque luego se aprobara)."""
    return (fila.get("rechazos") or 0) > 0 or fila.get("estado_informe") == "Rechazado"


def _horas(fila) -> float | None:
    """Duración de una inspección terminada, en horas."""
    if fila.get("duracion_minutos"):
        return fila["duracion_minutos"] / 60
    inicio, fin = fila.get("fecha_inicio"), fila.get("fecha_fin")
    if isinstance(inicio, datetime) and isinstance(fin, datetime) and fin >= inicio:
        return (fin - inicio).total_seconds() / 3600
    return None


def calcular_productividad(filas: list) -> dict:
    """filas: dicts con id_inspector, inspector, estado, estado_informe,
    rechazos, fecha_inicio, fecha_fin y duracion_minutos (una por inspección).
    "rechazadas" cuenta las inspecciones a las que les rechazaron el informe
    alguna vez, aunque después se corrigieran y aprobaran."""
    por_inspector = {}
    for f in filas:
        r = por_inspector.setdefault(f["id_inspector"], {
            "id_inspector": f["id_inspector"], "inspector": f.get("inspector") or "Sin nombre",
            "asignadas": 0, "terminadas": 0, "en_curso": 0, "canceladas": 0,
            "aprobadas": 0, "rechazadas": 0, "_horas": [],
        })
        r["asignadas"] += 1
        estado = f.get("estado")
        if estado in ESTADOS_TERMINADA:
            r["terminadas"] += 1
            horas = _horas(f)
            if horas is not None:
                r["_horas"].append(horas)
        elif estado == "Cancelada":
            r["canceladas"] += 1
        else:
            r["en_curso"] += 1
        if f.get("estado_informe") in ESTADOS_INFORME_APROBADO:
            r["aprobadas"] += 1
        if fue_rechazada(f):
            r["rechazadas"] += 1

    def cerrar(r):
        horas = r.pop("_horas")
        revisadas = r["aprobadas"] + r["rechazadas"]
        r["horas_promedio"] = round(sum(horas) / len(horas), 1) if horas else None
        r["tasa_cumplimiento"] = round(100 * r["terminadas"] / r["asignadas"]) if r["asignadas"] else 0
        r["tasa_aprobacion"] = round(100 * r["aprobadas"] / revisadas) if revisadas else None
        return r

    inspectores = sorted((cerrar(r) for r in por_inspector.values()), key=lambda r: (-r["terminadas"], r["inspector"]))
    total = {k: sum(r[k] for r in inspectores) for k in ("asignadas", "terminadas", "en_curso", "canceladas", "aprobadas", "rechazadas")}
    todas_horas = [h for f in filas if f.get("estado") in ESTADOS_TERMINADA for h in [_horas(f)] if h is not None]
    revisadas = total["aprobadas"] + total["rechazadas"]
    total["horas_promedio"] = round(sum(todas_horas) / len(todas_horas), 1) if todas_horas else None
    total["tasa_cumplimiento"] = round(100 * total["terminadas"] / total["asignadas"]) if total["asignadas"] else 0
    total["tasa_aprobacion"] = round(100 * total["aprobadas"] / revisadas) if revisadas else None
    return {"total": total, "inspectores": inspectores}
