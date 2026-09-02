# app/utils/auth_deps.py

from fastapi import Request, HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.models import Usuario

# ============================================
# CONSTANTES DE ROLES
# ============================================
CLIENTE_ROL_ID = 6
INSPECTOR_ROL_ID = 4
COORDINADOR_ROL_ID = 5
ADMIN_ROL_ID = 1

DOCUMENT_TYPES = {"CC", "CE", "PA", "RC", "TI", "NIT", "PEP", "PPT", "CD"}

# ============================================
# SEGURIDAD - HTTP Bearer
# ============================================
security = HTTPBearer()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# ============================================
# VERSIÓN LEGACY - Para rutas que usan Request
# ============================================
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

# ============================================
# VERSIÓN NUEVA - Con HTTPBearer para Swagger
# ============================================
def get_current_user_role(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Nueva versión con HTTPBearer para Swagger"""
    token = credentials.credentials

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("rol"), payload.get("sub"), payload.get("user_id")
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")

# ============================================
# OBTENER USUARIO ACTUAL (compatible con routers de Luz)
# ============================================
def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security), db: Session = Depends(get_db)):
    """Devuelve dict con user_id y rol (compatible con routers de Luz)"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("user_id") or payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        # Si user_id es string (correo), buscar en BD
        if isinstance(user_id, str) and "@" in user_id:
            user = db.query(Usuario).filter(Usuario.correo == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            return {"user_id": user.id_usuario, "rol": user.rol.nombre_rol}
        
        return {
            "user_id": int(user_id),
            "rol": payload.get("rol"),
        }
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")

# ============================================
# FUNCIONES DE PERMISOS (ROLES)
# ============================================
def require_admin(current_user: dict = Depends(get_current_user)):
    """Verifica que el usuario sea Administrador"""
    if current_user["rol"] != "Administrador":
        raise HTTPException(status_code=403, detail="Se requieren permisos de Administrador")
    return current_user

def require_coordinador(current_user: dict = Depends(get_current_user)):
    """Verifica que el usuario sea Coordinador o Administrador"""
    if current_user["rol"] not in ["Administrador", "Coordinador"]:
        raise HTTPException(status_code=403, detail="Se requieren permisos de Coordinador")
    return current_user

def require_inspector(current_user: dict = Depends(get_current_user)):
    """Verifica que el usuario sea Inspector"""
    if current_user["rol"] != "Inspector":
        raise HTTPException(status_code=403, detail="Se requieren permisos de Inspector")
    return current_user

# ============================================
# FUNCIONES PARA RUTAS QUE USAN REQUEST
# ============================================
def require_admin_from_request(request: Request):
    """Para rutas que aún usan Request en lugar de Security"""
    rol, _, _ = get_current_user_role_from_request(request)
    if rol != "Administrador":
        raise HTTPException(status_code=403, detail="Solo el administrador puede realizar esta acción")
    return rol