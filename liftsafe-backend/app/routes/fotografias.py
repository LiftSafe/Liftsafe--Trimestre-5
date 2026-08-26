from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Request, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import os
import shutil
from app.database import get_db
from app.models.models import Fotografia, Informe
from app.schemas.schemas import FotografiaResponse, MessageResponse
from app.utils.auth_deps import get_current_user_role

router = APIRouter(prefix="/fotografias", tags=["Fotografias"])

UPLOAD_DIR = "uploads/fotos/"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png"}


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


@router.get("/informe/{id_informe}", response_model=List[FotografiaResponse])
def listar_fotos_informe(
    id_informe: int,
    request: Request,
    db: Session = Depends(get_db),
):
    get_current_user_role(request)
    return db.query(Fotografia).filter(Fotografia.id_informe == id_informe).all()


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
    return {"message": "Foto eliminada"}
