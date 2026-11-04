"""RF-024: Reporte de productividad (Coordinador / Director Técnico)."""
from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.controllers.productividad_controller import calcular_productividad
from app.database import get_db
from app.models.models import Informe, Inspeccion, Usuario
from app.utils.auth_deps import get_current_user
from app.utils.excel_productividad import generar_excel_productividad

router = APIRouter(prefix="/reportes", tags=["Reportes"])

ROLES_REPORTE = {"Coordinador", "Director Técnico", "Administrador"}


@router.get("/productividad")
def reporte_productividad(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Desempeño de cada inspector entre dos fechas (por defecto, los últimos 30 días)."""
    return _datos_productividad(desde, hasta, current_user, db)


@router.get("/productividad/excel")
def reporte_productividad_excel(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """El mismo reporte en Excel (.xlsx), con logo, indicadores y tabla con formato."""
    datos = _datos_productividad(desde, hasta, current_user, db)
    usuario = db.query(Usuario).filter(Usuario.id_usuario == current_user.get("user_id")).first()
    contenido = generar_excel_productividad(datos, usuario.nombre_completo if usuario else "")
    nombre = f'Productividad_LiftSafe_{datos["desde"]}_a_{datos["hasta"]}.xlsx'
    return Response(
        content=contenido,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{nombre}"', "Access-Control-Expose-Headers": "Content-Disposition"},
    )


def _datos_productividad(desde, hasta, current_user, db):
    if current_user.get("rol") not in ROLES_REPORTE:
        raise HTTPException(status_code=403, detail="Solo el Coordinador o el Director Técnico pueden ver este reporte")
    hasta = hasta or date.today()
    desde = desde or (hasta - timedelta(days=30))
    if desde > hasta:
        raise HTTPException(status_code=400, detail="La fecha 'desde' no puede ser mayor que 'hasta'")

    filas = (
        db.query(Inspeccion, Usuario.nombre_completo, Informe.estado)
        .outerjoin(Usuario, Inspeccion.id_inspector == Usuario.id_usuario)
        .outerjoin(Informe, Informe.id_inspeccion == Inspeccion.id_inspeccion)
        .filter(Inspeccion.fecha_inicio >= datetime.combine(desde, time.min),
                Inspeccion.fecha_inicio <= datetime.combine(hasta, time.max))
        .all()
    )
    datos = calcular_productividad([
        {
            "id_inspector": i.id_inspector, "inspector": nombre, "estado": i.estado, "estado_informe": estado_inf,
            "fecha_inicio": i.fecha_inicio, "fecha_fin": i.fecha_fin, "duracion_minutos": i.duracion_minutos,
        }
        for i, nombre, estado_inf in filas
    ])
    return {"desde": desde.isoformat(), "hasta": hasta.isoformat(), **datos}
