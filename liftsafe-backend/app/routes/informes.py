from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Informe, Inspeccion, Usuario, Ascensor, Notificacion, Encuesta, Solicitud
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

# ============================================
# 1. GENERAR INFORME PDF (ESTEBAN)
# ============================================
@router.post("/{id_inspeccion}/generar", response_model=MessageResponse)
def generar_informe(
    id_inspeccion: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
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
    return db.query(Informe).order_by(Informe.id_informe.desc()).all()

# ============================================
# 3. OBTENER INFORME POR INSPECCIÓN (ESTEBAN)
# ============================================
@router.get("/inspeccion/{id_inspeccion}")
def obtener_informe_por_inspeccion(
    id_inspeccion: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    informe = db.query(Informe).filter(Informe.id_inspeccion == id_inspeccion).first()
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")
    return informe

# ============================================
# 3.5 APROBAR / RECHAZAR INFORME (RF-023, paso 7 del flujo)
# ============================================
@router.put("/{id}/revisar", response_model=MessageResponse)
def revisar_informe(
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

    informe.fecha_revision = datetime.now()
    informe.id_revisor = current_user["user_id"]
    informe.observaciones_revision = data.observaciones_revision
    informe.concepto_tecnico = data.concepto_tecnico
    informe.estado = data.decision  # "Aprobado" o "Rechazado"

    if data.decision == "Aprobado":
        informe.fecha_aprobacion = datetime.now()

    db.commit()

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
    if inspeccion_rel:
        solicitud_rel = db.query(Solicitud).filter(
            Solicitud.id_solicitud == inspeccion_rel.id_solicitud
        ).first()
        if solicitud_rel and solicitud_rel.estado != "Finalizada":
            solicitud_rel.estado = "Finalizada"
            db.commit()

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
        ya_existe = db.query(Encuesta).filter(
            Encuesta.id_inspeccion == inspeccion_rel.id_inspeccion
        ).first()
        if not ya_existe:
            db.add(Encuesta(
                id_inspeccion=inspeccion_rel.id_inspeccion,
                id_cliente=cliente_rel.id_usuario,
            ))
            db.add(Notificacion(
                id_usuario_destino=cliente_rel.id_usuario,
                mensaje=(
                    f"Ya tienes el informe completo del ascensor {ascensor_rel.codigo_interno}. "
                    "Cuéntanos cómo fue todo el proceso en la sección Encuestas."
                ),
                enlace="/dashboard/encuestas",
                leida=False,
            ))
            db.commit()

            try:
                await send_encuesta_email(cliente_rel.correo, cliente_rel.nombre_completo, ascensor_rel.codigo_interno)
            except Exception as e:
                print(f"⚠️ No se pudo enviar el correo de encuesta: {e}")

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