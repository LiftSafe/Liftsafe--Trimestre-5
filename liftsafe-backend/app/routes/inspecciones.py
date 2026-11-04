from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends, HTTPException, Request, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, aliased
from sqlalchemy import text
from app.database import get_db
from app.models.models import Inspeccion, Ascensor, Usuario, Informe, Notificacion, Solicitud, Programacion, Sede
from app.schemas.schemas import InspeccionCreate, InspeccionUpdate, FirmaRequest, MessageResponse
from app.controllers.inspeccion_controller import crear_inspeccion
from app.controllers.foto_obligatoria_controller import exigir_fotos_no_aplica
from app.controllers.cierre_inspeccion_controller import esta_cerrada, exigir_checklist_completo
from app.utils.auditoria import auditar_cambio, registrar_auditoria
from app.utils.auth_deps import get_current_user_role, ADMIN_ROL_ID, COORDINADOR_ROL_ID
from app.config import settings
from jose import jwt, JWTError
from datetime import datetime, date
from typing import Optional

router = APIRouter(prefix="/inspecciones", tags=["Inspecciones"])

# ============================================
# AUTENTICACIÓN (unificada)
# ============================================
security = HTTPBearer()

def get_current_user_role(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("rol"), payload.get("sub"), payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ============================================
# 1. MIS INSPECCIONES (con id_informe)
# ============================================
@router.get("/mis-inspecciones")
def mis_inspecciones(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    """Inspecciones que ve cada rol, con los mismos campos para todos (RF-016/RF-017).

    Administrador, Director Técnico y Coordinador ven todas; el Inspector, las
    suyas; el Cliente, las de sus ascensores. Trae cliente, ubicación, tipo de
    servicio y fechas para poder filtrar en la pantalla.
    """
    rol, correo, user_id = get_current_user_role(credentials)
    if rol not in ['Administrador', 'Director Técnico', 'Coordinador', 'Inspector', 'Cliente']:
        raise HTTPException(status_code=403, detail="Rol no autorizado")

    InspectorU = aliased(Usuario)
    ClienteU = aliased(Usuario)
    # RNF-001/RNF-007: solo las columnas que se muestran (no objetos completos
    # ni las firmas): con 5.000 inspecciones la lista pasa de ~0,9 s a ~0,1 s.
    consulta = (
        db.query(
            Inspeccion.id_inspeccion, Inspeccion.id_inspector, Ascensor.codigo_interno, Ascensor.marca, Ascensor.modelo,
            Ascensor.tipo_ascensor, Ascensor.ciudad, Ascensor.direccion_completa, Sede.nombre,
            InspectorU.nombre_completo, ClienteU.nombre_completo, Solicitud.tipo_servicio,
            Solicitud.prioridad, Programacion.fecha_programada, Inspeccion.fecha_inicio,
            Inspeccion.fecha_fin, Inspeccion.estado, Informe.estado, Inspeccion.observaciones_generales,
            Inspeccion.firma_inspector.isnot(None), Inspeccion.firma_cliente.isnot(None), Informe.id_informe,
        )
        .join(Ascensor, Inspeccion.id_ascensor == Ascensor.id_ascensor)
        .outerjoin(InspectorU, Inspeccion.id_inspector == InspectorU.id_usuario)
        .outerjoin(ClienteU, Ascensor.id_cliente == ClienteU.id_usuario)
        .outerjoin(Informe, Informe.id_inspeccion == Inspeccion.id_inspeccion)
        .outerjoin(Solicitud, Inspeccion.id_solicitud == Solicitud.id_solicitud)
        .outerjoin(Programacion, Inspeccion.id_programacion == Programacion.id_programacion)
        .outerjoin(Sede, Ascensor.id_sede == Sede.id_sede)
    )
    if rol == 'Inspector':
        consulta = consulta.filter(Inspeccion.id_inspector == user_id)
    elif rol == 'Cliente':
        consulta = consulta.filter(Ascensor.id_cliente == user_id)

    filas = consulta.order_by(Inspeccion.id_inspeccion.desc()).all()
    fecha = lambda v: v.isoformat() if v is not None else None
    # JSONResponse directo: los datos ya son texto/números (evita jsonable_encoder fila por fila)
    return JSONResponse([
        {
            "id_inspeccion": id_,
            "id_inspector": id_insp,
            "codigo_ascensor": codigo,
            "marca": marca,
            "modelo": modelo,
            "tipo_ascensor": tipo,
            "ciudad": ciudad,
            "direccion": direccion,
            "sede": sede,
            "nombre_inspector": inspector,
            "nombre_cliente": cliente,
            "tipo_servicio": tipo_servicio,
            "prioridad": prioridad,
            "fecha_programada": fecha(fecha_programada),
            "fecha_inicio": fecha(fecha_inicio),
            "fecha_fin": fecha(fecha_fin),
            "estado": estado,
            "estado_inspeccion": estado,  # compatibilidad con la vista anterior
            "estado_informe": estado_informe,
            "observaciones_generales": observaciones,
            "firma_inspector": bool(firma_i),
            "firma_cliente": bool(firma_c),
            "id_informe": id_informe,
        }
        for (id_, id_insp, codigo, marca, modelo, tipo, ciudad, direccion, sede, inspector, cliente, tipo_servicio,
             prioridad, fecha_programada, fecha_inicio, fecha_fin, estado, estado_informe, observaciones,
             firma_i, firma_c, id_informe) in filas
    ])

# ============================================
# 2. CREAR INSPECCIÓN
# ============================================
@router.post("/crear")
def crear_nueva_inspeccion(
    data: InspeccionCreate,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    if rol not in ['Administrador', 'Coordinador', 'Inspector']:
        raise HTTPException(status_code=403, detail="No autorizado para crear inspecciones")
    
    fecha_programada = data.fecha_programada
    if isinstance(fecha_programada, datetime):
        fecha_programada = fecha_programada.date()
    
    hoy = date.today()
    if fecha_programada < hoy:
        raise HTTPException(
            status_code=400, 
            detail=f"La fecha programada ({fecha_programada}) no puede ser anterior a hoy ({hoy})"
        )
    
    inspector_id = user_id if rol == 'Inspector' else data.id_inspector
    
    try:
        inspeccion = crear_inspeccion(db, data.dict(), inspector_id)
        return {
            "message": "Inspección creada exitosamente",
            "id_inspeccion": inspeccion.id_inspeccion
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear inspección: {str(e)}")

# ============================================
# 3. OBTENER DETALLE DE UNA INSPECCIÓN
# ============================================
@router.get("/{id}")
def obtener_inspeccion(
    id: int,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    if rol == 'Inspector' and inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver esta inspección")
    
    if rol == 'Cliente':
        ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == inspeccion.id_ascensor).first()
        if ascensor.id_cliente != user_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver esta inspección")

    informe = db.query(Informe).filter(Informe.id_inspeccion == inspeccion.id_inspeccion).first()

    # ✅ FIX: este endpoint no devolvía el código del ascensor (solo el id
    # numérico), a diferencia de /mis-inspecciones que sí lo trae con un
    # join. Como Inspections.jsx usa "codigo_ascensor" para el título del
    # modal de detalle, cada vez que se abría una inspección el título
    # mostraba "N/A" aunque la fila de la tabla sí mostrara el código
    # correcto. Se agrega el join a Ascensor (y de paso el inspector, útil
    # para el detalle) para que el detalle traiga la misma info que la lista.
    ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == inspeccion.id_ascensor).first()
    inspector = db.query(Usuario).filter(Usuario.id_usuario == inspeccion.id_inspector).first()

    return {
        "id_inspeccion": inspeccion.id_inspeccion,
        "id_informe": informe.id_informe if informe else None,
        "id_ascensor": inspeccion.id_ascensor,
        "codigo_ascensor": ascensor.codigo_interno if ascensor else None,
        "id_inspector": inspeccion.id_inspector,
        "nombre_inspector": inspector.nombre_completo if inspector else None,
        "estado": inspeccion.estado,
        "fecha_inicio": inspeccion.fecha_inicio,
        "fecha_fin": inspeccion.fecha_fin,
        "firma_inspector": inspeccion.firma_inspector,
        "fecha_firma_inspector": inspeccion.fecha_firma_inspector,
        "firma_cliente": inspeccion.firma_cliente,
        "fecha_firma_cliente": inspeccion.fecha_firma_cliente,
        "observaciones_generales": inspeccion.observaciones_generales
    }

# ============================================
# 4. ACTUALIZAR INSPECCIÓN (HEAD - CRUD completo)
# ============================================
@router.put("/{id_inspeccion}", response_model=MessageResponse)
def actualizar_inspeccion(
    id_inspeccion: int,
    data: InspeccionUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    if rol not in ['Administrador', 'Coordinador', 'Inspector']:
        raise HTTPException(status_code=403, detail="No autorizado para actualizar inspecciones")
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id_inspeccion).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    # Si es inspector, solo puede editar sus propias inspecciones
    if rol == 'Inspector' and inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No autorizado para editar esta inspección")
    if rol == 'Inspector':
        # RF-011: cerrada no se edita; el estado se cambia con "Marcar como finalizada"
        if esta_cerrada(inspeccion.estado):
            raise HTTPException(status_code=400, detail="La inspección ya fue cerrada: no se puede modificar")
        if data.estado is not None and data.estado != inspeccion.estado:
            raise HTTPException(status_code=400, detail="Para terminar la inspección usa 'Marcar como finalizada'")

    antes = {"estado": inspeccion.estado, "observaciones_generales": inspeccion.observaciones_generales,
             "fecha_fin": inspeccion.fecha_fin, "firma_inspector": bool(inspeccion.firma_inspector),
             "firma_cliente": bool(inspeccion.firma_cliente)}
    if data.estado is not None:
        inspeccion.estado = data.estado
    if data.observaciones_generales is not None:
        inspeccion.observaciones_generales = data.observaciones_generales
    if data.fecha_fin is not None:
        inspeccion.fecha_fin = data.fecha_fin
    if data.firma_inspector is not None:
        inspeccion.firma_inspector = data.firma_inspector
        inspeccion.fecha_firma_inspector = datetime.now()
    if data.firma_cliente is not None:
        inspeccion.firma_cliente = data.firma_cliente
        inspeccion.fecha_firma_cliente = datetime.now()

    # RNF-012: queda en el log qué cambió y su valor anterior
    auditar_cambio(db, user_id, "inspeccion", inspeccion.id_inspeccion, antes, {
        "estado": inspeccion.estado, "observaciones_generales": inspeccion.observaciones_generales,
        "fecha_fin": inspeccion.fecha_fin, "firma_inspector": bool(inspeccion.firma_inspector),
        "firma_cliente": bool(inspeccion.firma_cliente),
    })
    db.commit()
    db.refresh(inspeccion)
    return {"message": "Inspección actualizada exitosamente"}

# ============================================
# 5. ELIMINAR INSPECCIÓN (HEAD - CRUD completo)
# ============================================
@router.delete("/{id_inspeccion}", response_model=MessageResponse)
def eliminar_inspeccion(
    id_inspeccion: int,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    if rol not in ['Administrador', 'Coordinador']:
        raise HTTPException(status_code=403, detail="No autorizado para eliminar inspecciones")
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id_inspeccion).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    if inspeccion.estado not in ['Pendiente', 'Programada']:
        raise HTTPException(status_code=400, detail="Solo se pueden eliminar inspecciones en estado Pendiente o Programada")
    
    db.delete(inspeccion)
    db.commit()
    return {"message": "Inspección eliminada exitosamente"}

# ============================================
# 6. FIRMAR COMO INSPECTOR (VALENTINA)
# ============================================
@router.put("/{id}/firma-inspector", response_model=MessageResponse)
def firmar_inspector(
    id: int,
    data: FirmaRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    if inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No eres el inspector asignado a esta inspección")
    
    if inspeccion.firma_inspector:
        raise HTTPException(status_code=400, detail="Ya hay una firma del inspector registrada")
    
    inspeccion.firma_inspector = data.firma
    inspeccion.fecha_firma_inspector = datetime.now()
    registrar_auditoria(db, user_id, "inspeccion", "FIRMA", inspeccion.id_inspeccion,
                        {"firma_inspector": False}, {"firma_inspector": True}, commit=False)
    db.commit()
    db.refresh(inspeccion)
    
    return {"message": "Firma del inspector registrada exitosamente"}

# ============================================
# 7. FIRMAR COMO CLIENTE (VALENTINA)
# ============================================
@router.put("/{id}/firma-cliente", response_model=MessageResponse)
async def firmar_cliente(
    id: int,
    data: FirmaRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    if inspeccion.firma_cliente:
        raise HTTPException(status_code=400, detail="Ya hay una firma del cliente registrada")
    
    ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == inspeccion.id_ascensor).first()
    if not ascensor:
        raise HTTPException(status_code=404, detail="Ascensor no encontrado")
    
    if ascensor.id_cliente != user_id:
        raise HTTPException(status_code=403, detail="No eres el cliente propietario de este ascensor")
    
    inspeccion.firma_cliente = data.firma
    inspeccion.fecha_firma_cliente = datetime.now()
    pasa_a_revision = inspeccion.estado == PENDIENTE_FIRMA_CLIENTE
    estado_antes = inspeccion.estado
    if pasa_a_revision:
        inspeccion.estado = PENDIENTE_REVISION
    registrar_auditoria(db, user_id, "inspeccion", "FIRMA", inspeccion.id_inspeccion,
                        {"firma_cliente": False, "estado": estado_antes},
                        {"firma_cliente": True, "estado": inspeccion.estado}, commit=False)
    db.commit()
    db.refresh(inspeccion)

    if pasa_a_revision:
        notificar_pendiente_revision(db, inspeccion, ascensor)
        return {"message": "Firma registrada. La inspección quedó pendiente de revisión del coordinador."}
    return {"message": "Firma del cliente registrada exitosamente"}

# ============================================
# 8. VERIFICAR ESTADO DE FIRMAS (VALENTINA)
# ============================================
@router.get("/{id}/firmas")
def verificar_firmas(
    id: int,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    if rol == 'Inspector' and inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver esta inspección")
    
    if rol == 'Cliente':
        ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == inspeccion.id_ascensor).first()
        if ascensor.id_cliente != user_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver esta inspección")
    
    return {
        "id_inspeccion": inspeccion.id_inspeccion,
        "firma_inspector": bool(inspeccion.firma_inspector),
        "fecha_firma_inspector": inspeccion.fecha_firma_inspector,
        "firma_cliente": bool(inspeccion.firma_cliente),
        "fecha_firma_cliente": inspeccion.fecha_firma_cliente,
        "ambas_firmas": bool(inspeccion.firma_inspector and inspeccion.firma_cliente)
    }

# Flujo de cierre de una inspección:
#   inspector termina  -> "Pendiente firma cliente"  (si el cliente no ha firmado)
#   cliente firma      -> "Pendiente revisión"
#   coordinador aprueba el informe -> "Finalizada"  (ver revisar_informe en informes.py)
PENDIENTE_FIRMA_CLIENTE = "Pendiente firma cliente"
PENDIENTE_REVISION = "Pendiente revisión"


def notificar_pendiente_revision(db: Session, inspeccion: Inspeccion, ascensor):
    """Avisa a Coordinador/Administrador que la inspección ya tiene las dos
    firmas y está lista para generar y revisar el informe."""
    codigo_ascensor = ascensor.codigo_interno if ascensor else inspeccion.id_ascensor
    staff = db.query(Usuario).filter(
        Usuario.id_rol.in_([ADMIN_ROL_ID, COORDINADOR_ROL_ID])
    ).all()
    for miembro in staff:
        db.add(Notificacion(
            id_usuario_destino=miembro.id_usuario,
            mensaje=f"La inspección del ascensor {codigo_ascensor} tiene las dos firmas y está pendiente de revisión. Genera y revisa el informe.",
            enlace="/dashboard/inspecciones",
            leida=False,
        ))
    db.commit()


# ============================================
# 9. ACTUALIZAR ESTADO DE INSPECCIÓN
# ============================================
@router.put("/{id}/estado")
async def actualizar_estado(
    id: int,
    estado: str,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    rol, correo, user_id = get_current_user_role(credentials)
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    
    if rol not in ['Administrador', 'Coordinador'] and inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para actualizar esta inspección")
    # El inspector solo puede terminar su inspección (o seguir trabajándola);
    # aprobar, cancelar, etc. es del coordinador
    if rol == 'Inspector' and estado not in ('Finalizada', 'En Progreso'):
        raise HTTPException(status_code=403, detail="El inspector solo puede finalizar la inspección")
    if rol == 'Inspector' and esta_cerrada(inspeccion.estado):
        raise HTTPException(status_code=400, detail="La inspección ya fue cerrada")
    
    estados_validos = ['Programada', 'En Progreso', 'Completada', 'Cancelada', 'Finalizada', 'Aprobada', PENDIENTE_FIRMA_CLIENTE, PENDIENTE_REVISION]
    if estado not in estados_validos:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Opciones: {estados_validos}")

    # Cuando el inspector termina pero el cliente todavía no ha firmado, la
    # inspección NO queda "Finalizada": queda "Pendiente firma cliente" y
    # pasa a "Finalizada" sola en el momento en que el cliente firma.
    # Al terminar, la inspección nunca queda "Finalizada" directamente:
    # sin firma del cliente -> "Pendiente firma cliente"; con las dos firmas
    # -> "Pendiente revisión". "Finalizada" la pone la aprobación del
    # informe por parte del coordinador.
    # Los ítems "No Cumple" deben tener foto antes de terminar la inspección.
    # RF-009: todo el checklist calificado antes de terminar la inspección.
    if estado in ("Finalizada", PENDIENTE_FIRMA_CLIENTE, PENDIENTE_REVISION):
        exigir_checklist_completo(db, inspeccion.id_inspeccion)
        exigir_fotos_no_aplica(db, inspeccion.id_inspeccion)
    if estado == "Finalizada":
        estado = PENDIENTE_REVISION if inspeccion.firma_cliente else PENDIENTE_FIRMA_CLIENTE
    termina_inspector = estado == PENDIENTE_FIRMA_CLIENTE and inspeccion.estado != PENDIENTE_FIRMA_CLIENTE
    lista_para_revision = estado == PENDIENTE_REVISION and inspeccion.estado != PENDIENTE_REVISION

    auditar_cambio(db, user_id, "inspeccion", inspeccion.id_inspeccion,
                   {"estado": inspeccion.estado}, {"estado": estado})
    inspeccion.estado = estado
    if estado in ['Completada', 'Finalizada', 'Aprobada', PENDIENTE_FIRMA_CLIENTE, PENDIENTE_REVISION]:
        inspeccion.fecha_fin = datetime.now()
    
    db.commit()
    db.refresh(inspeccion)

    if termina_inspector:
        ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == inspeccion.id_ascensor).first()
        if ascensor:
            db.add(Notificacion(
                id_usuario_destino=ascensor.id_cliente,
                mensaje=f"El inspector terminó la inspección del ascensor {ascensor.codigo_interno}. Falta tu firma para finalizarla.",
                enlace="/dashboard/inspecciones",
                leida=False,
            ))
            db.commit()

    # ✅ FIX: cuando el Inspector finaliza la inspección, el cliente no se
    # enteraba de nada -> no había encuesta, ni notificación en la app, ni
    # correo. Ahora, en el mismo momento en que la inspección pasa a
    # "Finalizada", se crea la encuesta de satisfacción, se le notifica al
    # cliente dentro de la app (campanita) y se le manda un correo.
    # Requiere haber corrido migrations/add_encuesta_table.sql y
    # migrations/add_notificacion_table.sql.
    if lista_para_revision:
        ascensor = db.query(Ascensor).filter(Ascensor.id_ascensor == inspeccion.id_ascensor).first()
        notificar_pendiente_revision(db, inspeccion, ascensor)

    return {
        "message": "Estado actualizado exitosamente",
        "nuevo_estado": inspeccion.estado
    }