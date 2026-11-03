from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Informe, Inspeccion, Usuario, Ascensor, Notificacion, Encuesta, Solicitud, Fotografia
from app.controllers.foto_obligatoria_controller import exigir_fotos_no_aplica
from app.controllers.informe_acceso_controller import (
    ROL_CLIENTE, cliente_puede_descargar, es_inspeccion_del_cliente, informe_para_usuario,
)
from app.schemas.schemas import MessageResponse, InformeRevisionRequest
from app.controllers.informe_controller import generar_pdf_informe
from app.controllers.email_controller import send_encuesta_email
from datetime import datetime
import os
from jose import jwt, JWTError
from app.config import settings
from app.utils.auth_deps import ADMIN_ROL_ID, COORDINADOR_ROL_ID, DIRECTOR_TECNICO_ROL_ID

router = APIRouter(prefix="/informes", tags=["Informes"])

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return {
            "rol": payload.get("rol"),
            "sub": payload.get("sub"),
            "user_id": payload.get("user_id")
        }
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token invalido: {str(e)}")

def finalizar_solicitud(db: Session, inspeccion) -> bool:
    """Marca como Finalizada la solicitud de la que salió la inspección."""
    if not inspeccion or not inspeccion.id_solicitud:
        return False
    solicitud = db.query(Solicitud).filter(Solicitud.id_solicitud == inspeccion.id_solicitud).first()
    if not solicitud or solicitud.estado == "Finalizada":
        return False
    solicitud.estado = "Finalizada"
    db.commit()
    return True


async def crear_encuesta_si_falta(db: Session, inspeccion, ascensor, cliente, mensaje: str) -> bool:
    """Crea la encuesta de satisfacción de la inspección (una sola vez),
    avisa al cliente en la campanita y le manda el correo."""
    if not (inspeccion and ascensor and cliente):
        return False
    if db.query(Encuesta).filter(Encuesta.id_inspeccion == inspeccion.id_inspeccion).first():
        return False
    db.add(Encuesta(id_inspeccion=inspeccion.id_inspeccion, id_cliente=cliente.id_usuario))
    db.add(Notificacion(
        id_usuario_destino=cliente.id_usuario,
        mensaje=mensaje,
        enlace="/dashboard/encuestas",
        leida=False,
    ))
    db.commit()
    try:
        await send_encuesta_email(cliente.correo, cliente.nombre_completo, ascensor.codigo_interno)
    except Exception as e:
        print(f"⚠️ No se pudo enviar el correo de encuesta: {e}")
    return True

# ============================================
# 1. GENERAR INFORME PDF (ESTEBAN)
# ============================================
@router.post("/{id_inspeccion}/generar", response_model=MessageResponse)
def generar_informe(
    id_inspeccion: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["rol"] == ROL_CLIENTE:
        raise HTTPException(status_code=403, detail="El cliente no puede generar informes")
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id_inspeccion).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspeccion no encontrada")
    
    if not inspeccion.firma_inspector or not inspeccion.firma_cliente:
        raise HTTPException(status_code=400, detail="Faltan firmas para generar el informe")
    
    try:
        pdf_path, hash_documento = generar_pdf_informe(db, id_inspeccion)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {str(e)}")
    
    informe = db.query(Informe).filter(Informe.id_inspeccion == id_inspeccion).first()
    if informe:
        informe.ruta_pdf = pdf_path
        informe.hash_documento = hash_documento
        informe.fecha_generacion = datetime.now()
        informe.estado = "Generado"
    else:
        nuevo_informe = Informe(
            id_inspeccion=id_inspeccion,
            numero_informe=f"INF-{id_inspeccion}-{datetime.now().strftime('%Y%m%d')}",
            ruta_pdf=pdf_path,
            hash_documento=hash_documento,
            fecha_generacion=datetime.now(),
            estado="Generado"
        )
        db.add(nuevo_informe)
    
    db.commit()

    # Las fotos que el inspector tomó durante la inspección (antes de que
    # existiera el informe) quedan asociadas al informe recién generado.
    informe_actual = db.query(Informe).filter(Informe.id_inspeccion == id_inspeccion).first()
    db.query(Fotografia).filter(
        Fotografia.id_inspeccion == id_inspeccion, Fotografia.id_informe.is_(None)
    ).update({Fotografia.id_informe: informe_actual.id_informe}, synchronize_session=False)
    db.commit()

    # FIX: nadie se enteraba de que un informe ya estaba listo para
    # revisión -> Coordinador, Director Técnico y Administrador (los tres
    # roles que revisar_informe permite) tenían que ir a mirar la lista de
    # informes manualmente para saber que había uno nuevo.
    revisores = db.query(Usuario).filter(
        Usuario.id_rol.in_([ADMIN_ROL_ID, COORDINADOR_ROL_ID, DIRECTOR_TECNICO_ROL_ID])
    ).all()
    for revisor in revisores:
        db.add(Notificacion(
            id_usuario_destino=revisor.id_usuario,
            mensaje=f"El informe de la inspección #{id_inspeccion} está listo para revisión.",
            enlace="/dashboard/reportes",
            leida=False,
        ))
    db.commit()

    return {"message": "Informe generado correctamente", "ruta": pdf_path}

# ============================================
# 2. LISTAR INFORMES (ESTEBAN)
# ============================================
@router.get("/", response_model=List[dict])
def listar_informes(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    consulta = db.query(Informe)
    if current_user["rol"] == ROL_CLIENTE:
        # El cliente solo ve sus informes ya aprobados
        consulta = consulta.join(Inspeccion, Inspeccion.id_inspeccion == Informe.id_inspeccion).join(
            Ascensor, Ascensor.id_ascensor == Inspeccion.id_ascensor
        ).filter(Ascensor.id_cliente == current_user["user_id"])
        return [informe_para_usuario(i, ROL_CLIENTE) for i in consulta.order_by(Informe.id_informe.desc()).all()
                if cliente_puede_descargar(i.estado)]
    return [informe_para_usuario(i, current_user["rol"]) for i in consulta.order_by(Informe.id_informe.desc()).all()]

# ============================================
# 3. OBTENER INFORME POR INSPECCIÓN (ESTEBAN)
# ============================================
@router.get("/inspeccion/{id_inspeccion}")
def obtener_informe_por_inspeccion(
    id_inspeccion: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["rol"] == ROL_CLIENTE and not es_inspeccion_del_cliente(db, id_inspeccion, current_user["user_id"]):
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este informe")
    informe = db.query(Informe).filter(Informe.id_inspeccion == id_inspeccion).first()
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")
    # Al cliente se le oculta el PDF hasta que el coordinador lo apruebe
    return informe_para_usuario(informe, current_user["rol"])

# ============================================
# 3.5 APROBAR / RECHAZAR INFORME (RF-023, paso 7 del flujo)
# ============================================
@router.put("/{id}/revisar", response_model=MessageResponse)
async def revisar_informe(
    id: int,
    data: InformeRevisionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["rol"] not in ["Coordinador", "Director Técnico", "Administrador"]:
        raise HTTPException(status_code=403, detail="Solo un Coordinador o Director Técnico puede revisar informes")

    informe = db.query(Informe).filter(Informe.id_informe == id).first()
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")

    if informe.estado != "Generado":
        raise HTTPException(status_code=400, detail="Solo se pueden revisar informes en estado 'Generado'")

    # No se aprueba si faltan fotos de ítems marcados "No Cumple".
    if data.decision == "Aprobado":
        exigir_fotos_no_aplica(db, informe.id_inspeccion)

    informe.fecha_revision = datetime.now()
    informe.id_revisor = current_user["user_id"]
    informe.observaciones_revision = data.observaciones_revision
    informe.concepto_tecnico = data.concepto_tecnico
    informe.estado = data.decision  # "Aprobado" o "Rechazado"

    if data.decision == "Aprobado":
        informe.fecha_aprobacion = datetime.now()

    db.commit()

    # Al aprobar el informe, la inspección (que estaba "Pendiente revisión")
    # queda "Finalizada" y el cliente ya puede ver el checklist final.
    if data.decision == "Aprobado":
        insp = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == informe.id_inspeccion).first()
        if insp and insp.estado != "Finalizada":
            insp.estado = "Finalizada"
            asc = db.query(Ascensor).filter(Ascensor.id_ascensor == insp.id_ascensor).first()
            if asc:
                db.add(Notificacion(
                    id_usuario_destino=asc.id_cliente,
                    mensaje=f"La inspección del ascensor {asc.codigo_interno} fue revisada y quedó finalizada. Ya puedes ver el checklist final.",
                    enlace="/dashboard/inspecciones",
                    leida=False,
                ))
            db.commit()
        # Con el informe aprobado el proceso terminó: la solicitud queda
        # Finalizada (antes solo pasaba al "Enviar informe") y se habilita
        # la encuesta de satisfacción.
        finalizar_solicitud(db, insp)
        if insp:
            asc = db.query(Ascensor).filter(Ascensor.id_ascensor == insp.id_ascensor).first()
            cli = db.query(Usuario).filter(Usuario.id_usuario == asc.id_cliente).first() if asc else None
            await crear_encuesta_si_falta(
                db, insp, asc, cli,
                f"La inspección del ascensor {asc.codigo_interno if asc else ''} terminó. "
                "Cuéntanos cómo fue todo el proceso en la sección Encuestas.",
            )

    # FIX: el inspector que hizo la inspección no se enteraba de si su
    # informe había sido aprobado o rechazado.
    inspeccion_rel = db.query(Inspeccion).filter(
        Inspeccion.id_inspeccion == informe.id_inspeccion
    ).first()
    if inspeccion_rel and inspeccion_rel.id_inspector:
        db.add(Notificacion(
            id_usuario_destino=inspeccion_rel.id_inspector,
            mensaje=f"Tu informe de la inspección #{informe.id_inspeccion} fue {data.decision.lower()}.",
            enlace="/dashboard/reportes",
            leida=False,
        ))
        db.commit()

    return {"message": f"Informe {data.decision.lower()} correctamente"}

# ============================================
# 4. ENVIAR INFORME (ESTEBAN)
# ============================================
@router.put("/{id}/enviar", response_model=MessageResponse)
async def enviar_informe(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["rol"] == ROL_CLIENTE:
        raise HTTPException(status_code=403, detail="El cliente no puede enviar informes")
    informe = db.query(Informe).filter(Informe.id_informe == id).first()
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")

    if informe.estado != "Aprobado":
        raise HTTPException(status_code=400, detail="El informe debe estar aprobado antes de enviarse")

    informe.estado = "Enviado"
    db.commit()

    # FIX: el cliente no se enteraba de que su informe ya estaba disponible.
    inspeccion_rel = db.query(Inspeccion).filter(
        Inspeccion.id_inspeccion == informe.id_inspeccion
    ).first()
    ascensor_rel = db.query(Ascensor).filter(
        Ascensor.id_ascensor == inspeccion_rel.id_ascensor
    ).first() if inspeccion_rel else None
    cliente_rel = db.query(Usuario).filter(
        Usuario.id_usuario == ascensor_rel.id_cliente
    ).first() if ascensor_rel else None

    # FIX: al enviar el informe (el último paso del proceso), la Solicitud
    # original se quedaba en "Programada" para siempre -> en la lista de
    # Solicitudes el cliente/coordinador nunca veía que el proceso ya había
    # terminado. Ahora, cuando el informe se envía, se marca la Solicitud
    # asociada como "Finalizada".
    finalizar_solicitud(db, inspeccion_rel)

    if cliente_rel:
        db.add(Notificacion(
            id_usuario_destino=cliente_rel.id_usuario,
            mensaje=f"Ya está disponible el informe de inspección del ascensor {ascensor_rel.codigo_interno}.",
            enlace="/dashboard/reportes",
            leida=False,
        ))
        db.commit()

        # FIX: la encuesta se estaba creando apenas el cliente firmaba, antes
        # incluso de que existiera un informe -> se movió aquí, al momento
        # en que el informe (ya aprobado) se envía al cliente, que es
        # cuando de verdad se completa todo el proceso. Si por algún motivo
        # ya existiera una encuesta para esta inspección, no se duplica.
        # Normalmente la encuesta ya se creó al aprobar; si no, se crea aquí.
        await crear_encuesta_si_falta(
            db, inspeccion_rel, ascensor_rel, cliente_rel,
            f"Ya tienes el informe completo del ascensor {ascensor_rel.codigo_interno}. "
            "Cuéntanos cómo fue todo el proceso en la sección Encuestas.",
        )

    return {"message": "Informe enviado correctamente"}

# ============================================
# 5. ELIMINAR INFORME (HEAD - CRUD completo)
# ============================================
@router.delete("/{id}", response_model=MessageResponse)
def eliminar_informe(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Solo Administrador o Director Técnico pueden eliminar
    if current_user["rol"] not in ['Administrador', 'Director Técnico']:
        raise HTTPException(status_code=403, detail="No autorizado para eliminar informes")
    
    informe = db.query(Informe).filter(Informe.id_informe == id).first()
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")
    
    # Eliminar archivo PDF si existe
    if informe.ruta_pdf and os.path.exists(informe.ruta_pdf):
        os.remove(informe.ruta_pdf)
    
    db.delete(informe)
    db.commit()
    return {"message": "Informe eliminado exitosamente"}