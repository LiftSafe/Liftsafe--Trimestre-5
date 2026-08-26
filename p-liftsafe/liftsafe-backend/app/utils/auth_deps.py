# app/utils/auth_deps.py

from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings

CLIENTE_ROL_ID = 6

DOCUMENT_TYPES = {"CC", "CE", "PA", "RC", "TI", "NIT", "PEP", "PPT", "CD"}

# ✅ ESQUEMA DE SEGURIDAD GLOBAL
security = HTTPBearer()


def get_current_user_role_from_request(request: Request):
    """Versión legacy que lee de Request (para rutas que aún la usen)"""
    authorization = request.headers.get("authorization") or request.headers.get("Authorization")
    if not authorization:
        raise HTTPException(status_code=401, detail="Token no proporcionado")

    token = authorization[7:] if authorization.startswith("Bearer ") else authorization

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("rol"), payload.get("sub"), payload.get("user_id")
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")


def get_current_user_role(credentials: HTTPAuthorizationCredentials = Security(security)):
    """✅ Nueva versión con HTTPBearer para Swagger"""
    token = credentials.credentials

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("rol"), payload.get("sub"), payload.get("user_id")
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")


def require_admin(request: Request):
    """Para rutas que aún usan Request en lugar de Security"""
    rol, _, _ = get_current_user_role_from_request(request)
    if rol != "Administrador":
        raise HTTPException(status_code=403, detail="Solo el administrador puede realizar esta acción")
    return rol