"""Clientes y sus sedes (sucursales).

- GET    /clientes/                       lista de clientes (para el formulario de ascensores)
- GET    /clientes/{id_cliente}/sedes     sedes de un cliente
- POST   /clientes/{id_cliente}/sedes     agrega una sede (Administrador)
- PUT    /clientes/sedes/{id_sede}        edita una sede (Administrador)
- DELETE /clientes/sedes/{id_sede}        elimina una sede sin ascensores (Administrador)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.controllers.sede_controller import sede_a_dict, sedes_del_cliente
from app.database import get_db
from app.models.models import Ascensor, Rol, Sede, Usuario
from app.schemas.schemas import SedeCreate, SedeUpdate
from app.utils.auth_deps import get_current_user_role

router = APIRouter(prefix="/clientes", tags=["Clientes y sedes"])

ROLES_LECTURA = {"Administrador", "Director Técnico", "Coordinador"}
ROLES_ESCRITURA = {"Administrador"}


def _exigir_rol(rol: str, permitidos: set, accion: str):
    if rol not in permitidos:
        raise HTTPException(status_code=403, detail=f"No autorizado para {accion}")


def _obtener_cliente(db: Session, id_cliente: int) -> Usuario:
    cliente = (
        db.query(Usuario)
        .join(Rol, Usuario.id_rol == Rol.id_rol)
        .filter(Usuario.id_usuario == id_cliente, Rol.nombre_rol == "Cliente")
        .first()
    )
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


def _conteo_ascensores(db: Session, ids_sede: list) -> dict:
    if not ids_sede:
        return {}
    filas = (
        db.query(Ascensor.id_sede, func.count(Ascensor.id_ascensor))
        .filter(Ascensor.id_sede.in_(ids_sede))
        .group_by(Ascensor.id_sede)
        .all()
    )
    return dict(filas)


@router.get("/")
def listar_clientes(db: Session = Depends(get_db), user_data: tuple = Depends(get_current_user_role)):
    rol, _, _ = user_data
    _exigir_rol(rol, ROLES_LECTURA, "ver los clientes")
    total_sedes = (
        db.query(Sede.id_cliente, func.count(Sede.id_sede)).group_by(Sede.id_cliente).all()
    )
    sedes_por_cliente = dict(total_sedes)
    clientes = (
        db.query(Usuario)
        .join(Rol, Usuario.id_rol == Rol.id_rol)
        .filter(Rol.nombre_rol == "Cliente")
        .order_by(Usuario.nombre_completo.asc())
        .all()
    )
    return [
        {
            "id_usuario": c.id_usuario,
            "nombre_completo": c.nombre_completo,
            "razon_social": c.razon_social,
            "direccion": c.direccion,
            "estado": c.estado,
            "total_sedes": sedes_por_cliente.get(c.id_usuario, 0),
        }
        for c in clientes
    ]


@router.get("/{id_cliente}/sedes")
def listar_sedes(id_cliente: int, db: Session = Depends(get_db), user_data: tuple = Depends(get_current_user_role)):
    rol, _, user_id = user_data
    # El propio cliente también puede ver sus sedes
    if not (rol == "Cliente" and user_id == id_cliente):
        _exigir_rol(rol, ROLES_LECTURA, "ver las sedes")
    _obtener_cliente(db, id_cliente)
    sedes = sedes_del_cliente(db, id_cliente)
    conteo = _conteo_ascensores(db, [s.id_sede for s in sedes])
    return [sede_a_dict(s, conteo.get(s.id_sede, 0)) for s in sedes]


@router.post("/{id_cliente}/sedes", status_code=201)
def crear_sede(id_cliente: int, data: SedeCreate, db: Session = Depends(get_db), user_data: tuple = Depends(get_current_user_role)):
    rol, _, _ = user_data
    _exigir_rol(rol, ROLES_ESCRITURA, "agregar sedes")
    _obtener_cliente(db, id_cliente)
    nombre = (data.nombre or "").strip()
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre de la sede es obligatorio")
    repetida = (
        db.query(Sede)
        .filter(Sede.id_cliente == id_cliente, func.lower(Sede.nombre) == nombre.lower())
        .first()
    )
    if repetida:
        raise HTTPException(status_code=400, detail="Este cliente ya tiene una sede con ese nombre")
    sede = Sede(
        id_cliente=id_cliente,
        nombre=nombre,
        direccion=(data.direccion or "").strip() or None,
        ciudad=(data.ciudad or "").strip() or None,
    )
    db.add(sede)
    db.commit()
    db.refresh(sede)
    return sede_a_dict(sede)


@router.put("/sedes/{id_sede}")
def editar_sede(id_sede: int, data: SedeUpdate, db: Session = Depends(get_db), user_data: tuple = Depends(get_current_user_role)):
    rol, _, _ = user_data
    _exigir_rol(rol, ROLES_ESCRITURA, "editar sedes")
    sede = db.query(Sede).filter(Sede.id_sede == id_sede).first()
    if not sede:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    if data.nombre is not None:
        nombre = data.nombre.strip()
        if not nombre:
            raise HTTPException(status_code=400, detail="El nombre de la sede es obligatorio")
        sede.nombre = nombre
    if data.direccion is not None:
        sede.direccion = data.direccion.strip() or None
    if data.ciudad is not None:
        sede.ciudad = data.ciudad.strip() or None
    db.commit()
    db.refresh(sede)
    return sede_a_dict(sede)


@router.delete("/sedes/{id_sede}")
def eliminar_sede(id_sede: int, db: Session = Depends(get_db), user_data: tuple = Depends(get_current_user_role)):
    rol, _, _ = user_data
    _exigir_rol(rol, ROLES_ESCRITURA, "eliminar sedes")
    sede = db.query(Sede).filter(Sede.id_sede == id_sede).first()
    if not sede:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    en_uso = db.query(Ascensor).filter(Ascensor.id_sede == id_sede).count()
    if en_uso:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar: la sede tiene {en_uso} ascensor(es). Muévelos a otra sede primero.",
        )
    db.delete(sede)
    db.commit()
    return {"message": "Sede eliminada"}
