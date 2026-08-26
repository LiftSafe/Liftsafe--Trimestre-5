# app/routes/dashboard.py

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract, text
from app.database import get_db
from app.models.models import Inspeccion, Ascensor, Usuario, Informe, Rol
from app.utils.auth_deps import get_current_user_role
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
security = HTTPBearer()


# ============ FUNCIONES AUXILIARES ============

def get_inspecciones_query(db: Session, rol: str, user_id: int):
    """Retorna la query base de inspecciones filtrada por rol"""
    query = db.query(Inspeccion).options(
        joinedload(Inspeccion.ascensor).joinedload(Ascensor.cliente)
    )
    
    if rol in ["Administrador", "Director Técnico", "Coordinador"]:
        return query
    elif rol == "Inspector":
        return query.filter(Inspeccion.id_inspector == user_id)
    elif rol == "Asesor":
        return query.join(Ascensor).filter(Ascensor.id_cliente == user_id)
    elif rol == "Cliente":
        return query.join(Ascensor).filter(Ascensor.id_cliente == user_id)
    else:
        raise HTTPException(status_code=403, detail=f"Rol '{rol}' no autorizado")


def get_ascensores_query(db: Session, rol: str, user_id: int):
    """Retorna la query base de ascensores filtrada por rol"""
    query = db.query(Ascensor)
    
    if rol in ["Administrador", "Director Técnico", "Coordinador"]:
        return query
    elif rol == "Inspector":
        return query.join(Inspeccion).filter(Inspeccion.id_inspector == user_id).distinct()
    elif rol == "Asesor":
        return query
    elif rol == "Cliente":
        return query.filter(Ascensor.id_cliente == user_id)
    else:
        raise HTTPException(status_code=403, detail=f"Rol '{rol}' no autorizado")


def get_usuarios_query(db: Session, rol: str, user_id: int):
    """Retorna la query base de usuarios filtrada por rol"""
    query = db.query(Usuario)
    
    if rol == "Administrador":
        return query
    elif rol == "Director Técnico":
        return query.join(Rol).filter(Rol.nombre_rol != "Administrador")
    elif rol == "Coordinador":
        return query.join(Rol).filter(
            Rol.nombre_rol.in_(["Inspector", "Cliente", "Asesor"])
        )
    elif rol in ["Inspector", "Asesor", "Cliente"]:
        return query.filter(Usuario.id_usuario == user_id)
    else:
        raise HTTPException(status_code=403, detail=f"Rol '{rol}' no autorizado")


# ============ RUTAS DE GRÁFICAS ============

@router.get("/graficas/tendencia")
def tendencia_inspecciones(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    query = get_inspecciones_query(db, rol, user_id)
    
    resultado = query.with_entities(
        extract('month', Inspeccion.fecha_inicio).label('mes'),
        func.count(Inspeccion.id_inspeccion).label('total')
    ).group_by('mes').order_by('mes').all()
    
    meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    data = {meses[int(r.mes)-1]: r.total for r in resultado if r.mes}
    return data


@router.get("/graficas/estados")
def estados_inspecciones(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    query = get_inspecciones_query(db, rol, user_id)
    
    resultado = query.with_entities(
        Inspeccion.estado,
        func.count(Inspeccion.id_inspeccion).label('total')
    ).group_by(Inspeccion.estado).all()
    
    return {r.estado: r.total for r in resultado}


@router.get("/graficas/edificios")
def inspecciones_por_edificio(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    if rol in ["Inspector", "Asesor", "Cliente"]:
        return {}
    
    resultado = db.query(
        Usuario.nombre_completo.label('cliente'),
        func.count(Inspeccion.id_inspeccion).label('total')
    ).join(Ascensor, Usuario.id_usuario == Ascensor.id_cliente)\
     .join(Inspeccion, Ascensor.id_ascensor == Inspeccion.id_ascensor)\
     .group_by(Usuario.id_usuario)\
     .order_by(func.count(Inspeccion.id_inspeccion).desc())\
     .limit(5).all()
    
    return {r.cliente: r.total for r in resultado}


# ============ RUTAS PRINCIPALES ============

@router.get("/stats")
def get_stats(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    hoy = datetime.now()
    primer_dia_mes = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    usuarios_query = get_usuarios_query(db, rol, user_id)
    ascensores_query = get_ascensores_query(db, rol, user_id)
    inspecciones_query = get_inspecciones_query(db, rol, user_id)
    
    return {
        "usuarios_activos": usuarios_query.count(),
        "ascensores_registrados": ascensores_query.count(),
        "inspecciones_mes": inspecciones_query.filter(Inspeccion.fecha_inicio >= primer_dia_mes).count(),
        "informes_emitidos": inspecciones_query.count(),
        "variaciones": {
            "usuarios_activos": 0,
            "ascensores_registrados": 0,
            "inspecciones_mes": 0,
            "informes_emitidos": 0
        }
    }


@router.get("/charts")
def get_charts(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    hoy = datetime.now()
    meses_nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    
    base_query = get_inspecciones_query(db, rol, user_id)
    
    monthly_inspections = []
    for i in range(5, -1, -1):
        mes_objetivo = hoy.month - i
        año_objetivo = hoy.year
        
        while mes_objetivo <= 0:
            mes_objetivo += 12
            año_objetivo -= 1
        
        primer_dia = datetime(año_objetivo, mes_objetivo, 1)
        if mes_objetivo == 12:
            ultimo_dia = datetime(año_objetivo + 1, 1, 1)
        else:
            ultimo_dia = datetime(año_objetivo, mes_objetivo + 1, 1)
        
        total = base_query.filter(
            Inspeccion.fecha_inicio >= primer_dia,
            Inspeccion.fecha_inicio < ultimo_dia
        ).count()
        
        aprobadas = base_query.filter(
            Inspeccion.fecha_inicio >= primer_dia,
            Inspeccion.fecha_inicio < ultimo_dia,
            Inspeccion.estado == "Aprobada"
        ).count()
        
        pendientes = total - aprobadas
        
        monthly_inspections.append({
            "month": meses_nombres[mes_objetivo - 1],
            "total": total,
            "aprobadas": aprobadas,
            "pendientes": pendientes
        })

    estados_result = base_query.with_entities(
        Inspeccion.estado,
        func.count(Inspeccion.id_inspeccion).label('total')
    ).group_by(Inspeccion.estado).all()
    
    inspection_status_data = []
    colores = {
        'Aprobada': '#0E7C4A',
        'Finalizada': '#1ABC9C',
        'Pendiente': '#C97B1A',
        'Borrador': '#F39C12',
        'En Proceso': '#E67E22',
        'Observaciones': '#C0392B',
        'No Cumple': '#E74C3C',
        'Programada': '#0066CC',
        'Completada': '#16A085'
    }
    
    for r in estados_result:
        if r.estado:
            inspection_status_data.append({
                "name": r.estado,
                "value": r.total,
                "color": colores.get(r.estado, '#0066CC')
            })
    
    if not inspection_status_data:
        inspection_status_data = [
            {"name": "Aprobadas", "value": 0, "color": "#0E7C4A"},
            {"name": "Pendientes", "value": 0, "color": "#C97B1A"},
            {"name": "Observaciones", "value": 0, "color": "#C0392B"}
        ]

    return {
        "monthlyInspections": monthly_inspections,
        "inspectionStatusData": inspection_status_data
    }


@router.get("/inspecciones")
def get_inspecciones(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    inspecciones = get_inspecciones_query(db, rol, user_id).all()
    
    resultado = []
    
    for insp in inspecciones:
        ascensor = insp.ascensor
        
        building_name = "Sin edificio"
        if ascensor:
            building_name = ascensor.direccion_completa or "Sin dirección"
        
        fecha_inicio = insp.fecha_inicio
        fecha_str = fecha_inicio.strftime("%Y-%m-%d") if fecha_inicio else ""
        next_date = (fecha_inicio + timedelta(days=30)).strftime("%Y-%m-%d") if fecha_inicio else ""
        
        inspector_name = "Por asignar"
        if insp.inspector_rel:
            inspector_name = insp.inspector_rel.nombre_completo
        
        elevator_label = "N/A"
        brand = ""
        model = ""
        if ascensor:
            brand = ascensor.marca or ""
            model = ascensor.modelo or ""
            elevator_label = f"{brand} {model}".strip() or "Sin datos"
        
        resultado.append({
            "id": insp.id_inspeccion,
            "status": insp.estado or "Pendiente",
            "elevator": elevator_label,
            "brand": brand,
            "model": model,
            "building": building_name,
            "date": fecha_str,
            "nextDate": next_date,
            "type": getattr(insp, 'tipo_servicio', "Regular"),
            "inspector": inspector_name,
            "reportNumber": insp.id_informe if hasattr(insp, 'id_informe') else None
        })
    
    return resultado


@router.get("/edificios")
def get_edificios(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    ascensores = get_ascensores_query(db, rol, user_id).options(
        joinedload(Ascensor.cliente)
    ).all()
    
    edificios_dict = {}
    for asc in ascensores:
        direccion = asc.direccion_completa or "Sin dirección"
        
        if direccion not in edificios_dict:
            edificios_dict[direccion] = {
                "id": direccion,
                "name": direccion,
                "address": f"{asc.ubicacion_exacta or 'Sin ubicación'}, {asc.ciudad or 'Sin ciudad'}",
                "elevators": 0,
                "manager": asc.cliente.nombre_completo if asc.cliente else "Sin gestor",
                "phone": asc.cliente.telefono if asc.cliente else "Sin teléfono",
                "status": asc.estado or "Activo"
            }
        
        edificios_dict[direccion]["elevators"] += 1
    
    return list(edificios_dict.values())


@router.get("/ascensores")
def get_ascensores(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    ascensores = get_ascensores_query(db, rol, user_id).options(
        joinedload(Ascensor.cliente)
    ).all()
    
    resultado = []
    
    for asc in ascensores:
        ultima_insp = db.query(Inspeccion).filter(
            Inspeccion.id_ascensor == asc.id_ascensor
        ).order_by(Inspeccion.fecha_inicio.desc()).first()
        
        resultado.append({
            "id": asc.id_ascensor,
            "brand": asc.marca,
            "model": asc.modelo,
            "type": asc.tipo_ascensor,
            "building": asc.direccion_completa,
            "location": asc.ubicacion_exacta,
            "city": asc.ciudad,
            "status": asc.estado,
            "capacity": asc.capacidad_kg,
            "floors": asc.numero_pisos,
            "client": asc.cliente.nombre_completo if asc.cliente else "Sin cliente",
            "lastInspection": ultima_insp.fecha_inicio.strftime("%Y-%m-%d") if ultima_insp and ultima_insp.fecha_inicio else "No registrada",
            "nextInspection": "No programada"
        })
    
    return resultado


@router.get("/usuarios")
def get_usuarios(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    if rol == "Administrador":
        result = db.execute(text("""
            SELECT u.*, r.nombre_rol 
            FROM vista_usuarios_segura u
            JOIN rol r ON u.id_rol = r.id_rol
        """)).mappings().all()
    elif rol == "Director Técnico":
        result = db.execute(text("""
            SELECT u.*, r.nombre_rol 
            FROM vista_usuarios_segura u
            JOIN rol r ON u.id_rol = r.id_rol
            WHERE r.nombre_rol != 'Administrador'
        """)).mappings().all()
    elif rol == "Coordinador":
        result = db.execute(text("""
            SELECT u.*, r.nombre_rol 
            FROM vista_usuarios_segura u
            JOIN rol r ON u.id_rol = r.id_rol
            WHERE r.nombre_rol IN ('Inspector', 'Cliente', 'Asesor')
        """)).mappings().all()
    else:
        result = db.execute(text("""
            SELECT u.*, r.nombre_rol 
            FROM vista_usuarios_segura u
            JOIN rol r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = :user_id
        """), {"user_id": user_id}).mappings().all()
    
    resultado = []
    for row in result:
        doc = row["nit"] or row["documento_identidad"] or ""
        if row["tipo_documento"]:
            doc_labels = {"CC": "CC", "NIT": "NIT", "PPE": "PPE", "CE": "CE"}
            doc = f"{doc_labels.get(row['tipo_documento'], row['tipo_documento'])} {doc}".strip()
        resultado.append({
            "id": row["id_usuario"],
            "name": row["nombre_completo"] or "Sin nombre",
            "email": row["correo"] or "",
            "role": row["nombre_rol"] or "Usuario",
            "status": row["estado"] or "Activo",
            "phone": row["telefono"] or "",
            "document": doc,
        })
    
    return resultado


@router.get("/informes")
def get_informes(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    base_query = get_inspecciones_query(db, rol, user_id)
    
    informes = base_query.filter(
        Inspeccion.estado.in_(["Aprobada", "Finalizada", "Completada"])
    ).all()
    
    resultado = []
    
    for inf in informes:
        ascensor = inf.ascensor
        brand = ascensor.marca if ascensor else ""
        model = ascensor.modelo if ascensor else ""
        elevator_label = f"{brand} {model}".strip() or "N/A"
        
        resultado.append({
            "id": inf.id_inspeccion,
            "elevator": elevator_label,
            "building": ascensor.direccion_completa if ascensor else "Sin edificio",
            "date": inf.fecha_inicio.strftime("%Y-%m-%d") if inf.fecha_inicio else "Sin fecha",
            "status": inf.estado,
            "inspector": inf.inspector_rel.nombre_completo if inf.inspector_rel else "No asignado"
        })
    
    return resultado


@router.get("/reports-summary")
def get_reports_summary(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    hoy = datetime.now()
    treinta_dias = hoy + timedelta(days=30)
    
    base_query = get_inspecciones_query(db, rol, user_id)
    
    certificados = base_query.filter(
        Inspeccion.estado.in_(['Aprobada', 'Finalizada', 'Completada'])
    ).count()
    
    pendientes = base_query.filter(
        Inspeccion.estado.in_(['Borrador', 'En Proceso', 'Programada', 'Pendiente'])
    ).count()
    
    por_vencer = base_query.filter(
        Inspeccion.fecha_inicio != None,
        Inspeccion.fecha_inicio <= treinta_dias,
        Inspeccion.estado.in_(['Borrador', 'En Proceso', 'Programada'])
    ).count()
    
    return {
        "certificados": certificados,
        "pendientes": pendientes,
        "por_vencer": por_vencer
    }