# app/utils/auth_deps.py

from fastapi import Request, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings

CLIENTE_ROL_ID = 6
INSPECTOR_ROL_ID = 4
COORDINADOR_ROL_ID = 5

DOCUMENT_TYPES = {"CC", "CE", "PA", "RC", "TI", "NIT", "PEP", "PPT", "CD"}

# ✅ ESQUEMA DE SEGURIDAD GLOBAL
security = HTTPBearer()


<<<<<<< HEAD
def get_current_user_role_from_request(request: Request):
    """Versión legacy que lee de Request (para rutas que aún la usen)"""
=======
def get_current_user_role(request: Request):
>>>>>>> feature/luz
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


def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Devuelve dict con user_id y rol (compatible con routers de Luz)"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return {
            "user_id": payload.get("user_id") or payload.get("sub"),
            "rol": payload.get("rol"),
        }
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")


def require_admin(request: Request):
    """Para rutas que aún usan Request en lugar de Security"""
    rol, _, _ = get_current_user_role_from_request(request)
    if rol != "Administrador":
        raise HTTPException(status_code=403, detail="Solo el administrador puede realizar esta acción")
    return rol

<<<<<<< HEAD
=======
from fastapi import Request, HTTPException, Depends, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.models import Usuario
from fastapi.security import OAuth2PasswordBearer

# Lo que ya tenías:
CLIENTE_ROL_ID = 6
DOCUMENT_TYPES = {"CC", "CE", "PA", "RC", "TI", "NIT", "PEP", "PPT", "CD"}

# Agregar las constantes que faltan:
INSPECTOR_ROL_ID = 4  # Ajusta este número según tu base de datos
COORDINADOR_ROL_ID = 5 # Ajusta este número según tu base de datos

# Configuración del token:
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Función para obtener el usuario actual (que te faltaba):
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(Usuario).filter(Usuario.id_usuario == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return {"user_id": user.id_usuario, "rol": user.rol.nombre_rol} 

# Funciones de permisos (roles):
def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != "Administrador":
        raise HTTPException(status_code=403, detail="Se requieren permisos de Administrador")
    return current_user
>>>>>>> feature/luz

def require_coordinador(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] not in ["Administrador", "Coordinador"]:
        raise HTTPException(status_code=403, detail="Se requieren permisos de Coordinador")
    return current_user

<<<<<<< HEAD

def require_inspector(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != "Inspector":
        raise HTTPException(status_code=403, detail="Se requieren permisos de Inspector")
    return current_user
=======
def require_inspector(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != "Inspector":
        raise HTTPException(status_code=403, detail="Se requieren permisos de Inspector")
    return current_user
>>>>>>> feature/luz
