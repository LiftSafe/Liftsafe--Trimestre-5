"""Quién puede gestionar usuarios.

El Administrador gestiona a todos. El Asesor (área comercial) solo crea,
ve y edita usuarios con rol Cliente.
"""
from fastapi import HTTPException

ROLES_GESTORES = {"Administrador", "Asesor"}
ROL_CLIENTE = "Cliente"


def exigir_gestor(rol: str) -> str:
    if rol not in ROLES_GESTORES:
        raise HTTPException(status_code=403, detail="Solo el administrador o el asesor pueden gestionar usuarios")
    return rol


def exigir_rol_permitido(rol_gestor: str, nombre_rol_objetivo) -> None:
    """El asesor solo puede trabajar con clientes."""
    if rol_gestor == "Asesor" and nombre_rol_objetivo != ROL_CLIENTE:
        raise HTTPException(status_code=403, detail="El asesor solo puede gestionar clientes")


def solo_clientes(rol_gestor: str) -> bool:
    return rol_gestor == "Asesor"
