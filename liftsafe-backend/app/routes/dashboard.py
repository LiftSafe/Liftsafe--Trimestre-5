# app/routes/dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.utils.auth_deps import get_current_user, require_admin
from app.models.models import Usuario, Ascensor, Inspeccion, Informe  # ✅ SIN Edificio
from sqlalchemy import func, text
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# ============================================
# 1. ESTADÍSTICAS GENERALES
# ============================================
@router.get("/stats")
def get_stats(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtiene estadísticas generales del dashboard"""
    try:
        total_usuarios = db.query(Usuario).count()
        total_ascensores = db.query(Ascensor).count()
        total_inspecciones = db.query(Inspeccion).count()
        usuarios_activos = db.query(Usuario).filter(Usuario.estado == "activo").count()
        informes_emitidos = db.query(Informe).count()

        inicio_mes = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        inspecciones_mes = db.query(Inspeccion).filter(Inspeccion.fecha_creacion >= inicio_mes).count()

        # Inspecciones por estado
        inspecciones_estado = db.query(
            Inspeccion.estado, func.count(Inspeccion.id_inspeccion)
        ).group_by(Inspeccion.estado).all()

        return {
            "total_usuarios": total_usuarios,
            "total_ascensores": total_ascensores,
            "total_inspecciones": total_inspecciones,
            "inspecciones_estado": [{"estado": e, "cantidad": c} for e, c in inspecciones_estado],
            # Alias que espera AdminDashboard.jsx (antes no existían y todo salía en 0)
            "usuarios_activos": usuarios_activos,
            "ascensores_registrados": total_ascensores,
            "inspecciones_mes": inspecciones_mes,
            "informes_emitidos": informes_emitidos,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}")

# ============================================
# 2. GRÁFICOS
# ============================================
@router.get("/charts")
def get_charts(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtiene datos para gráficos del dashboard"""
    try:
        # Inspecciones por mes (últimos 6 meses)
        seis_meses = datetime.now() - timedelta(days=180)
        inspecciones_mes = db.query(
            func.date_format(Inspeccion.fecha_inicio, '%Y-%m').label('mes'),
            func.count(Inspeccion.id_inspeccion).label('total')
        ).filter(Inspeccion.fecha_inicio >= seis_meses)
        
        if not inspecciones_mes.first():
            inspecciones_mes = db.query(
                func.date_format(Inspeccion.fecha_creacion, '%Y-%m').label('mes'),
                func.count(Inspeccion.id_inspeccion).label('total')
            ).filter(Inspeccion.fecha_creacion >= seis_meses)
        
        inspecciones_mes = inspecciones_mes.group_by('mes').order_by('mes').all()
        
        # Ascensores por estado
        ascensores_estado = db.query(
            Ascensor.estado, func.count(Ascensor.id_ascensor)
        ).group_by(Ascensor.estado).all()

        # Inspecciones por estado (para el donut de "Estado de inspecciones")
        inspecciones_estado = db.query(
            Inspeccion.estado, func.count(Inspeccion.id_inspeccion)
        ).group_by(Inspeccion.estado).all()

        return {
            "inspecciones_mes": [{"mes": m, "total": t} for m, t in inspecciones_mes],
            "ascensores_estado": [{"estado": e, "cantidad": c} for e, c in ascensores_estado],
            # Alias que espera AdminDashboard.jsx (antes no existían: la gráfica salía vacía)
            "monthlyInspections": [{"month": m, "total": t} for m, t in inspecciones_mes],
            "inspectionStatusData": [{"name": e, "value": c} for e, c in inspecciones_estado],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener datos de gráficos: {str(e)}")

# ============================================
# 3. USUARIOS
# ============================================
@router.get("/usuarios")
def get_usuarios(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtiene lista de usuarios para el dashboard"""
    try:
        usuarios = db.query(Usuario).options(joinedload(Usuario.rol)).limit(20).all()
        return [{
            "id": u.id_usuario,
            "nombre": u.nombre_completo,
            "correo": u.correo,
            "rol": u.rol.nombre_rol if u.rol else "Sin rol",
            "estado": u.estado,
            # Alias que espera el frontend (Users.jsx, AdminDashboard.jsx)
            "name": u.nombre_completo,
            "email": u.correo,
            "role": u.rol.nombre_rol if u.rol else "Sin rol",
            "status": u.estado,
        } for u in usuarios]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener usuarios: {str(e)}")

# ============================================
# 4. INSPECCIONES
# ============================================
@router.get("/inspecciones")
def get_inspecciones(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtiene lista de inspecciones para el dashboard"""
    try:
        inspecciones = db.query(Inspeccion).options(
            joinedload(Inspeccion.ascensor),
            joinedload(Inspeccion.inspector_rel),
        ).order_by(Inspeccion.fecha_creacion.desc()).limit(20).all()
        return [{
            "id": i.id_inspeccion,
            "ascensor": i.id_ascensor,
            "fecha": i.fecha_creacion,
            "estado": i.estado,
            "inspector": i.inspector_rel.nombre_completo if i.inspector_rel else None,
            # Alias que esperan los dashboards de cada rol (antes mostraban "undefined" e IDs crudos)
            "status": i.estado,
            "building": i.ascensor.direccion_completa if i.ascensor else None,
            "elevator": i.ascensor.codigo_interno if i.ascensor else None,
            "date": i.fecha_fin or i.fecha_inicio,
            "nextDate": i.fecha_inicio,
        } for i in inspecciones]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener inspecciones: {str(e)}")

# ============================================
# 5. ASCENSORES
# ============================================
@router.get("/ascensores")
def get_ascensores(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtiene lista de ascensores para el dashboard"""
    try:
        ascensores = db.query(Ascensor).options(joinedload(Ascensor.cliente)).limit(20).all()
        return [{
            "id": a.id_ascensor,
            "codigo": a.codigo_interno,
            "marca": a.marca,
            "modelo": a.modelo,
            "estado": a.estado,
            "cliente": a.id_cliente,
            # Alias que espera Elevators.jsx (antes mostraba celdas vacías)
            "brand": a.marca,
            "model": a.modelo,
            "location": a.ubicacion_exacta,
            "building": a.direccion_completa,
            "city": a.ciudad,
            "status": a.estado,
            "client": a.cliente.nombre_completo if a.cliente else None,
        } for a in ascensores]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener ascensores: {str(e)}")

# ============================================
# 6. INFORMES (para la pantalla de Reportes)
# ============================================
@router.get("/informes")
def get_informes(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtiene lista de informes/certificados generados para el dashboard de Reportes.
    Restaurado: este endpoint se perdió en una fusión anterior y rompía Reports.jsx."""
    try:
        inspecciones = db.query(Inspeccion).options(
            joinedload(Inspeccion.ascensor),
            joinedload(Inspeccion.inspector_rel),
        ).filter(
            Inspeccion.estado.in_(["Aprobada", "Finalizada", "Completada"])
        ).order_by(Inspeccion.fecha_creacion.desc()).all()

        return [{
            "id": i.id_inspeccion,
            "elevator": i.ascensor.codigo_interno if i.ascensor else None,
            "building": i.ascensor.direccion_completa if i.ascensor else None,
            "date": i.fecha_fin or i.fecha_inicio,
            "status": i.estado,
            "inspector": i.inspector_rel.nombre_completo if i.inspector_rel else None,
        } for i in inspecciones]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener informes: {str(e)}")