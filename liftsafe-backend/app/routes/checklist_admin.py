"""RNF-011 / CU014: mantenimiento de la lista de chequeo (NTC 5926-1:2012).

El Administrador y el Director Técnico pueden crear, editar, reordenar y
activar o desactivar grupos e ítems desde la aplicación, sin cambiar código
ni publicar una versión nueva. Los ítems no se borran: se desactivan, para
no perder las calificaciones que ya tienen las inspecciones anteriores.
Cada cambio queda en el log de auditoría (RNF-012).
"""
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import ChecklistCategoria, ChecklistItem, DetalleChecklist
from app.utils.auditoria import auditar_cambio, registrar_auditoria
from app.utils.auth_deps import get_current_user

router = APIRouter(prefix="/checklist/admin", tags=["Checklist - administración"])

ROLES_EDITAN = {"Administrador", "Director Técnico"}


def _texto(v):
    if v is None:
        return v
    v = v.strip()
    return v or None


class CategoriaIn(BaseModel):
    nombre_categoria: str = Field(min_length=1, max_length=150)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    orden_visualizacion: int = Field(default=0, ge=0)
    norma_referencia: Optional[str] = Field(default="NTC 5926-1:2012", max_length=100)
    activo: bool = True

    _limpiar = field_validator("nombre_categoria", "descripcion", "norma_referencia", mode="before")(_texto)


class CategoriaUpdate(BaseModel):
    nombre_categoria: Optional[str] = Field(default=None, min_length=1, max_length=150)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    orden_visualizacion: Optional[int] = Field(default=None, ge=0)
    norma_referencia: Optional[str] = Field(default=None, max_length=100)
    activo: Optional[bool] = None

    _limpiar = field_validator("nombre_categoria", "descripcion", "norma_referencia", mode="before")(_texto)


class ItemIn(BaseModel):
    id_categoria: int
    codigo_item: str = Field(min_length=1, max_length=20)
    descripcion: str = Field(min_length=1)
    criterio_cumplimiento: Optional[str] = None
    nivel_criticidad: Literal["Leve", "Grave", "Muy grave"]
    obligatorio: bool = True
    orden_visualizacion: int = Field(default=0, ge=0)
    activo: bool = True

    _limpiar = field_validator("codigo_item", "descripcion", "criterio_cumplimiento", mode="before")(_texto)

    @field_validator("codigo_item")
    @classmethod
    def _mayusculas(cls, v):
        return v.upper() if v else v


class ItemUpdate(BaseModel):
    id_categoria: Optional[int] = None
    codigo_item: Optional[str] = Field(default=None, min_length=1, max_length=20)
    descripcion: Optional[str] = Field(default=None, min_length=1)
    criterio_cumplimiento: Optional[str] = None
    nivel_criticidad: Optional[Literal["Leve", "Grave", "Muy grave"]] = None
    obligatorio: Optional[bool] = None
    orden_visualizacion: Optional[int] = Field(default=None, ge=0)
    activo: Optional[bool] = None

    _limpiar = field_validator("codigo_item", "descripcion", "criterio_cumplimiento", mode="before")(_texto)

    @field_validator("codigo_item")
    @classmethod
    def _mayusculas(cls, v):
        return v.upper() if v else v


CAMPOS_CATEGORIA = ("nombre_categoria", "descripcion", "orden_visualizacion", "norma_referencia", "activo")
CAMPOS_ITEM = ("id_categoria", "codigo_item", "descripcion", "criterio_cumplimiento", "nivel_criticidad",
               "obligatorio", "orden_visualizacion", "activo")


def _foto(obj, campos) -> dict:
    datos = {c: getattr(obj, c) for c in campos}
    if "activo" in datos:
        datos["activo"] = bool(datos["activo"])
    if "obligatorio" in datos:
        datos["obligatorio"] = bool(datos["obligatorio"])
    return datos


def _exigir_editor(user: dict) -> int:
    if user.get("rol") not in ROLES_EDITAN:
        raise HTTPException(status_code=403, detail="Solo el Administrador o el Director Técnico pueden modificar la lista de chequeo")
    return user.get("user_id")


def _categoria_json(cat: ChecklistCategoria, usos: dict) -> dict:
    items = sorted(cat.items or [], key=lambda i: (i.orden_visualizacion or 0, i.id_item))
    return {
        **_foto(cat, CAMPOS_CATEGORIA),
        "id_categoria": cat.id_categoria,
        "items": [{**_foto(i, CAMPOS_ITEM), "id_item": i.id_item, "usos": usos.get(i.id_item, 0)} for i in items],
    }


def _usos(db: Session) -> dict:
    return dict(db.query(DetalleChecklist.id_item, func.count()).group_by(DetalleChecklist.id_item).all())


@router.get("/categorias")
def listar_todo(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)) -> List[dict]:
    """Todos los grupos e ítems, activos e inactivos, con cuántas veces se ha calificado cada ítem."""
    _exigir_editor(current_user)
    categorias = sorted(db.query(ChecklistCategoria).all(),
                        key=lambda c: (not c.activo, c.orden_visualizacion or 0, c.id_categoria))
    usos = _usos(db)
    return [_categoria_json(c, usos) for c in categorias]


def _nombre_libre(db, nombre, excepto=None):
    q = db.query(ChecklistCategoria).filter(ChecklistCategoria.nombre_categoria == nombre)
    if excepto:
        q = q.filter(ChecklistCategoria.id_categoria != excepto)
    if q.first():
        raise HTTPException(status_code=409, detail=f"Ya existe un grupo llamado «{nombre}»")


def _codigo_libre(db, codigo, excepto=None):
    q = db.query(ChecklistItem).filter(ChecklistItem.codigo_item == codigo)
    if excepto:
        q = q.filter(ChecklistItem.id_item != excepto)
    if q.first():
        raise HTTPException(status_code=409, detail=f"El código {codigo} ya está en uso")


@router.post("/categorias", status_code=201)
def crear_categoria(data: CategoriaIn, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = _exigir_editor(current_user)
    _nombre_libre(db, data.nombre_categoria)
    cat = ChecklistCategoria(**data.model_dump())
    db.add(cat)
    db.flush()
    registrar_auditoria(db, uid, "checklist_categoria", "CREATE", cat.id_categoria, None, data.model_dump(), commit=False)
    db.commit()
    db.refresh(cat)
    return _categoria_json(cat, {})


@router.put("/categorias/{id_categoria}")
def editar_categoria(id_categoria: int, data: CategoriaUpdate,
                     current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = _exigir_editor(current_user)
    cat = db.query(ChecklistCategoria).filter(ChecklistCategoria.id_categoria == id_categoria).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    cambios = data.model_dump(exclude_unset=True)
    if cambios.get("nombre_categoria") is None:
        cambios.pop("nombre_categoria", None)
    if "nombre_categoria" in cambios:
        _nombre_libre(db, cambios["nombre_categoria"], excepto=id_categoria)
    antes = _foto(cat, CAMPOS_CATEGORIA)
    for k, v in cambios.items():
        setattr(cat, k, v)
    auditar_cambio(db, uid, "checklist_categoria", id_categoria, antes, _foto(cat, CAMPOS_CATEGORIA))
    db.commit()
    db.refresh(cat)
    return _categoria_json(cat, _usos(db))


def _exigir_categoria(db, id_categoria):
    if not db.query(ChecklistCategoria).filter(ChecklistCategoria.id_categoria == id_categoria).first():
        raise HTTPException(status_code=404, detail="El grupo indicado no existe")


@router.post("/items", status_code=201)
def crear_item(data: ItemIn, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = _exigir_editor(current_user)
    _exigir_categoria(db, data.id_categoria)
    _codigo_libre(db, data.codigo_item)
    item = ChecklistItem(**data.model_dump())
    db.add(item)
    db.flush()
    registrar_auditoria(db, uid, "checklist_item", "CREATE", item.id_item, None, data.model_dump(), commit=False)
    db.commit()
    db.refresh(item)
    return {**_foto(item, CAMPOS_ITEM), "id_item": item.id_item, "usos": 0}


@router.put("/items/{id_item}")
def editar_item(id_item: int, data: ItemUpdate,
                current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    uid = _exigir_editor(current_user)
    item = db.query(ChecklistItem).filter(ChecklistItem.id_item == id_item).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    cambios = {k: v for k, v in data.model_dump(exclude_unset=True).items()
               if v is not None or k == "criterio_cumplimiento"}
    if "id_categoria" in cambios:
        _exigir_categoria(db, cambios["id_categoria"])
    if "codigo_item" in cambios:
        _codigo_libre(db, cambios["codigo_item"], excepto=id_item)
    antes = _foto(item, CAMPOS_ITEM)
    for k, v in cambios.items():
        setattr(item, k, v)
    auditar_cambio(db, uid, "checklist_item", id_item, antes, _foto(item, CAMPOS_ITEM))
    db.commit()
    db.refresh(item)
    usos = db.query(DetalleChecklist).filter(DetalleChecklist.id_item == id_item).count()
    return {**_foto(item, CAMPOS_ITEM), "id_item": item.id_item, "usos": usos}
