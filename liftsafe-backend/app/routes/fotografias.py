from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Request, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import shutil
from app.database import get_db
from sqlalchemy import or_
from app.models.models import Fotografia, Informe, Inspeccion, ChecklistItem
from app.schemas.schemas import FotografiaResponse, MessageResponse, FotografiaUpdate
from app.utils.auth_deps import get_current_user_role_from_request as get_current_user_role

router = APIRouter(prefix="/fotografias", tags=["Fotografias"])

UPLOAD_DIR = "uploads/fotos/"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png"}

# ============================================
# 1. SUBIR FOTO
# ============================================
@router.post("/", response_model=FotografiaResponse, status_code=status.HTTP_201_CREATED)
def subir_foto(
    request: Request,
    id_informe: int = Form(...),
    file: UploadFile = File(...),
    descripcion: str | None = Form(None),
    db: Session = Depends(get_db),
):
    rol, _, _ = get_current_user_role(request)
    if rol != "Inspector":
        raise HTTPException(status_code=403, detail="Solo inspectores pueden subir fotos")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Solo se permiten JPG y PNG")

    informe = db.query(Informe).filter(Informe.id_informe == id_informe).first()
    if not informe:
        raise HTTPException(status_code=404, detail="Informe no encontrado")

    contents = file.file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="El archivo excede 10 MB")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        buffer.write(contents)

    nueva_foto = Fotografia(
        id_informe=id_informe,
        id_inspeccion=informe.id_inspeccion,
        nombre_archivo=filename,
        ruta_archivo=filepath,
        tamano_kb=round(len(contents) / 1024, 2),
        descripcion=descripcion,
        fecha_captura=datetime.now(),
        sincronizado=True,
    )
    db.add(nueva_foto)
    db.commit()
    db.refresh(nueva_foto)
    return nueva_foto

# ============================================
# 1b. SUBIR FOTO A UNA INSPECCIÓN (opcionalmente a un ítem del checklist)
#     No necesita que exista el informe: al generarlo se le asocian.
# ============================================
def _guardar_archivo(file: UploadFile) -> tuple[str, str, int]:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Solo se permiten JPG y PNG")
    contents = file.file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="El archivo excede 10 MB")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    nombre = os.path.basename(file.filename or "foto.jpg")
    filename = f"{timestamp}_{nombre}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        buffer.write(contents)
    return filename, filepath, round(len(contents) / 1024)


@router.post("/inspeccion", response_model=FotografiaResponse, status_code=status.HTTP_201_CREATED)
def subir_foto_inspeccion(
    request: Request,
    id_inspeccion: int = Form(...),
    file: UploadFile = File(...),
    id_item: int | None = Form(None),
    descripcion: str | None = Form(None),
    db: Session = Depends(get_db),
):
    rol, _, user_id = get_current_user_role(request)
    if rol != "Inspector":
        raise HTTPException(status_code=403, detail="Solo inspectores pueden subir fotos")

    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id_inspeccion).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="Inspección no encontrada")
    if inspeccion.id_inspector != user_id:
        raise HTTPException(status_code=403, detail="Solo el inspector asignado puede subir fotos a esta inspección")
    if id_item is not None and not db.query(ChecklistItem).filter(ChecklistItem.id_item == id_item).first():
        raise HTTPException(status_code=404, detail="Ítem del checklist no encontrado")

    filename, filepath, tamano = _guardar_archivo(file)
    informe = db.query(Informe).filter(Informe.id_inspeccion == id_inspeccion).first()
    nueva_foto = Fotografia(
        id_inspeccion=id_inspeccion,
        id_informe=informe.id_informe if informe else None,
        id_item=id_item,
        nombre_archivo=filename,
        ruta_archivo=filepath,
        tamano_kb=tamano,
        descripcion=descripcion,
        tipo_evidencia="Checklist" if id_item else None,
        fecha_captura=datetime.now(),
        sincronizado=True,
    )
    db.add(nueva_foto)
    db.commit()
    db.refresh(nueva_foto)
    return nueva_foto


@router.get("/inspeccion/{id_inspeccion}", response_model=List[FotografiaResponse])
def listar_fotos_inspeccion(
    id_inspeccion: int,
    request: Request,
    db: Session = Depends(get_db),
):
    get_current_user_role(request)
    informe = db.query(Informe).filter(Informe.id_inspeccion == id_inspeccion).first()
    condicion = Fotografia.id_inspeccion == id_inspeccion
    if informe:
        condicion = or_(condicion, Fotografia.id_informe == informe.id_informe)
    return db.query(Fotografia).filter(condicion).order_by(Fotografia.id_foto).all()

# ============================================
# 2. LISTAR FOTOS DE UN INFORME
# ============================================
@router.get("/informe/{id_informe}", response_model=List[FotografiaResponse])
def listar_fotos_informe(
    id_informe: int,
    request: Request,
    db: Session = Depends(get_db),
):
    get_current_user_role(request)
    return db.query(Fotografia).filter(Fotografia.id_informe == id_informe).all()

# ============================================
# 3. ELIMINAR FOTO
# ============================================
@router.delete("/{id_foto}", response_model=MessageResponse)
def eliminar_foto(
    id_foto: int,
    request: Request,
    db: Session = Depends(get_db),
):
    rol, _, _ = get_current_user_role(request)
    if rol != "Inspector":
        raise HTTPException(status_code=403, detail="Solo inspectores pueden eliminar fotos")

    foto = db.query(Fotografia).filter(Fotografia.id_foto == id_foto).first()
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")

    if os.path.exists(foto.ruta_archivo):
        os.remove(foto.ruta_archivo)

    db.delete(foto)
    db.commit()
    return {"message": "Foto eliminada exitosamente"}

# ============================================
# 4. ACTUALIZAR DESCRIPCIÓN DE FOTO (HEAD - CRUD completo)
# ============================================
@router.put("/{id_foto}", response_model=FotografiaResponse)
def actualizar_foto(
    id_foto: int,
    request: Request,
    data: FotografiaUpdate,
    db: Session = Depends(get_db),
):
    rol, _, _ = get_current_user_role(request)
    if rol != "Inspector":
        raise HTTPException(status_code=403, detail="Solo inspectores pueden actualizar fotos")

    foto = db.query(Fotografia).filter(Fotografia.id_foto == id_foto).first()
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")

    if data.descripcion is not None:
        foto.descripcion = data.descripcion
    if data.tipo_evidencia is not None:
        foto.tipo_evidencia = data.tipo_evidencia

    db.commit()
    db.refresh(foto)
    return foto