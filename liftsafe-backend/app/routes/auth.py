# app/routes/auth.py

import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.schemas.schemas import UsuarioLogin, Token, UsuarioRegister, RecuperarClaveRequest, ResetClaveRequest, MessageResponse
from app.controllers.auth_controller import (
    authenticate_user, create_access_token, hash_password,
    create_reset_token, verify_reset_token,
    generate_reset_code, verify_reset_code
)
from app.controllers.email_controller import send_reset_email
from app.models.models import Usuario, Rol
from app.utils.auth_deps import CLIENTE_ROL_ID
from jose import jwt, JWTError
from app.config import settings
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# ✅ ESQUEMA DE SEGURIDAD HTTP BEARER
security = HTTPBearer()

# ── Schema para verificar código ──────────────────────────────────────────────
class VerifyCodeRequest(BaseModel):
    correo: str
    code: str
    nueva_contrasena: str

class CodeCheckRequest(BaseModel):
    correo: str
    code: str

# ── Login ─────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=Token)
def login(credentials: UsuarioLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.correo, credentials.contrasena)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # ✅ AGREGAR user_id EXPLÍCITAMENTE
    token = create_access_token({
        "sub": user.correo,
        "user_id": user.id_usuario,  # ✅ AGREGADO
        "rol": user.rol.nombre_rol,
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": user.rol.nombre_rol,
        "nombre": user.nombre_completo
    }

# ── Register ──────────────────────────────────────────────────────────────────
@router.post("/register", response_model=MessageResponse)
def register(user_data: UsuarioRegister, db: Session = Depends(get_db)):
    if user_data.id_rol != CLIENTE_ROL_ID:
        raise HTTPException(status_code=403, detail="Solo los clientes pueden registrarse.")

    existing = db.query(Usuario).filter(Usuario.correo == user_data.correo).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    rol = db.query(Rol).filter(Rol.id_rol == CLIENTE_ROL_ID).first()
    if not rol:
        raise HTTPException(status_code=400, detail="Rol Cliente no configurado")

    db.execute(
        text("""
            INSERT INTO usuario (id_rol, nombre_completo, correo, contrasena_encriptada,
                               telefono, tipo_documento, documento_identidad, estado)
            VALUES (:id_rol, :nombre, :correo, AES_ENCRYPT(:contrasena, :aes_key),
                    :telefono, :tipo_doc, :documento, 'activo')
        """),
        {
            "id_rol": CLIENTE_ROL_ID,
            "nombre": user_data.nombre_completo,
            "correo": user_data.correo,
            "contrasena": user_data.contrasena,
            "telefono": user_data.telefono,
            "tipo_doc": user_data.tipo_documento,
            "documento": user_data.documento_identidad,
            "aes_key": settings.SECRET_KEY_MYSQL,
        }
    )
    db.commit()
    
    return {"message": "Usuario registrado exitosamente"}

# ── Recuperar clave: envía código numérico ────────────────────────────────────
@router.post("/recuperar-clave", response_model=MessageResponse)
async def recuperar_clave(request: RecuperarClaveRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.correo == request.correo).first()
    
    # Siempre devolvemos el mismo mensaje para no revelar si el correo existe
    if not user:
        return {"message": "Si el correo existe, recibirás un código de recuperación"}
    
    code = generate_reset_code(request.correo)
    
    try:
        await send_reset_email(request.correo, code)
        return {"message": "Código enviado. Revisa tu bandeja de entrada."}
    except Exception as e:
        logger.error(f"Error enviando email a {request.correo}: {e}")
        raise HTTPException(
            status_code=503,
            detail="Error al enviar el correo. Por favor intenta más tarde o contacta soporte."
        )

# ── Verificar código y cambiar contraseña ────────────────────────────────────
@router.post("/reset-clave", response_model=MessageResponse)
def reset_clave(request: VerifyCodeRequest, db: Session = Depends(get_db)):
    print(f"🔍 ENDPOINT recibió: correo='{request.correo}', code='{request.code}'")
    valid = verify_reset_code(request.correo, request.code)
    if not valid:
        raise HTTPException(status_code=400, detail="Código inválido o expirado")
    
    # Actualizar contraseña con AES_ENCRYPT
    db.execute(
        text("UPDATE usuario SET contrasena_encriptada = AES_ENCRYPT(:pwd, :aes_key) WHERE correo = :correo"),
        {"pwd": request.nueva_contrasena, "correo": request.correo, "aes_key": settings.SECRET_KEY_MYSQL}
    )
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}

# ── Me ────────────────────────────────────────────────────────────────────────
@router.get("/me")
def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        correo = payload.get("sub")
        if not correo:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = db.query(Usuario, Rol.nombre_rol).join(Rol).filter(Usuario.correo == correo).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    u, rol = user
    return {
        "id_usuario": u.id_usuario,
        "nombre_completo": u.nombre_completo,
        "correo": u.correo,
        "rol": rol,
        "telefono": u.telefono,
        "tipo_documento": u.tipo_documento,
        "documento_identidad": u.documento_identidad,
        "estado": u.estado,
        "fecha_registro": u.fecha_registro
    }