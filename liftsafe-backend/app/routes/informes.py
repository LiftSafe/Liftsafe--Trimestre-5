from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Informe, Inspeccion
from app.schemas.schemas import MessageResponse
from app.controllers.informe_controller import generar_pdf_informe
from datetime import datetime
from jose import jwt, JWTError
from app.config import settings

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

# 1. Generar informe PDF
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
    return {"message": "Informe generado correctamente", "ruta": pdf_path}

# 2. Listar informes
@router.get("/", response_model=List[dict])
def listar_informes(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return db.query(Informe).all()

# 3. Obtener informe por inspeccion
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

# 4. Enviar informe
@router.put("/{id}/enviar", response_model=MessageResponse)
def enviar_informe(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    informe = db.query(Informe).filter(Informe.id_informe == id).first()
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")
    if informe.estado != "Generado":
        raise HTTPException(status_code=400, detail="El informe debe estar generado")
    
    informe.estado = "Enviado"
    db.commit()
    return {"message": "Informe enviado correctamente"}
