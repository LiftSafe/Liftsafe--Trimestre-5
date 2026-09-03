# app/routes/dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth_deps import get_current_user, require_admin
from app.models.models import Usuario, Ascensor, Inspeccion  # ✅ SIN Edificio
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
        
        # Inspecciones por estado
        inspecciones_estado = db.query(
            Inspeccion.estado, func.count(Inspeccion.id_inspeccion)
        ).group_by(Inspeccion.estado).all()
        
        return {
            "total_usuarios": total_usuarios,
            "total_ascensores": total_ascensores,
            "total_inspecciones": total_inspecciones,
            "inspecciones_estado": [{"estado": e, "cantidad": c} for e, c in inspecciones_estado]
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
        
        return {
            "inspecciones_mes": [{"mes": m, "total": t} for m, t in inspecciones_mes],
            "ascensores_estado": [{"estado": e, "cantidad": c} for e, c in ascensores_estado]
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
        usuarios = db.query(Usuario).limit(20).all()
        return [{
            "id": u.id_usuario,
            "nombre": u.nombre_completo,
            "correo": u.correo,
            "rol": u.rol.nombre_rol if u.rol else "Sin rol",
            "estado": u.estado
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
        inspecciones = db.query(Inspeccion).order_by(Inspeccion.fecha_creacion.desc()).limit(20).all()
        return [{
            "id": i.id_inspeccion,
            "ascensor": i.id_ascensor,
            "fecha": i.fecha_creacion,
            "estado": i.estado,
            "inspector": i.id_inspector
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
        ascensores = db.query(Ascensor).limit(20).all()
        return [{
            "id": a.id_ascensor,
            "codigo": a.codigo_interno,
            "marca": a.marca,
            "modelo": a.modelo,
            "estado": a.estado,
            "cliente": a.id_cliente
        } for a in ascensores]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener ascensores: {str(e)}")