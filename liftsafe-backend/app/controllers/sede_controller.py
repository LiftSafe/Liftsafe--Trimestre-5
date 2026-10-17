"""Reglas de negocio de las sedes (sucursales) de un cliente."""
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.models import Sede


def sedes_del_cliente(db: Session, id_cliente: int) -> list:
    return (
        db.query(Sede)
        .filter(Sede.id_cliente == id_cliente)
        .order_by(Sede.nombre.asc())
        .all()
    )


def elegir_sede(sedes: list, id_sede: Optional[int]) -> Optional[int]:
    """Decide qué sede queda guardada en el ascensor.

    - Cliente sin sedes: el ascensor no lleva sede (None).
    - Cliente con 1 sede: se usa esa sede automáticamente.
    - Cliente con 2 o más sedes: la sede es obligatoria.
    En todos los casos, si se manda una sede, debe ser del mismo cliente.
    """
    ids = [s.id_sede for s in sedes]
    if id_sede is not None and id_sede not in ids:
        raise HTTPException(status_code=400, detail="La sede seleccionada no pertenece a este cliente")
    if id_sede is not None:
        return id_sede
    if len(ids) == 1:
        return ids[0]
    if len(ids) >= 2:
        raise HTTPException(
            status_code=400,
            detail="Este cliente tiene varias sedes: selecciona en qué sede está el ascensor",
        )
    return None


def sede_para_ascensor(db: Session, id_cliente: int, id_sede: Optional[int]) -> Optional[int]:
    return elegir_sede(sedes_del_cliente(db, id_cliente), id_sede)


def sede_a_dict(sede: Sede, total_ascensores: int = 0) -> dict:
    return {
        "id_sede": sede.id_sede,
        "id_cliente": sede.id_cliente,
        "nombre": sede.nombre,
        "direccion": sede.direccion,
        "ciudad": sede.ciudad,
        "total_ascensores": total_ascensores,
    }
