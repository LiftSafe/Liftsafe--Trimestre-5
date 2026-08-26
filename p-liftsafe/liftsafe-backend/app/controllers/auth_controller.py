# app/controllers/auth_controller.py

import json
import os
import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.models import Usuario, Rol
from app.schemas.schemas import UsuarioLogin
from jose import jwt, JWTError
from app.config import settings

# ============ CONFIGURACIÓN ============

CODES_FILE = "reset_codes.json"
SECRET_KEY_MYSQL = 'LiftSafeSecretKey2026!'

# ============ CÓDIGOS DE RECUPERACIÓN (JSON) ============

def _load_codes():
    if os.path.exists(CODES_FILE):
        with open(CODES_FILE, 'r') as f:
            data = json.load(f)
            for k, v in data.items():
                v["expires"] = datetime.fromisoformat(v["expires"])
            return data
    return {}

def _save_codes(codes):
    data = {}
    for k, v in codes.items():
        data[k] = {
            "code": v["code"],
            "expires": v["expires"].isoformat()
        }
    with open(CODES_FILE, 'w') as f:
        json.dump(data, f)

_reset_codes = _load_codes()

def generate_reset_code(correo: str) -> str:
    """Genera un código numérico de 6 dígitos y lo guarda temporalmente."""
    code = ''.join(random.choices(string.digits, k=6))
    _reset_codes[correo] = {
        "code": code,
        "expires": datetime.utcnow() + timedelta(hours=1)
    }
    _save_codes(_reset_codes)
    print(f"✅ Código generado: {code} para {correo}")
    return code

def verify_reset_code(correo: str, code: str) -> bool:
    """Verifica que el código sea válido y no haya expirado."""
    _reset_codes.update(_load_codes())
    entry = _reset_codes.get(correo)
    if not entry:
        return False
    if datetime.utcnow() > entry["expires"]:
        _reset_codes.pop(correo, None)
        _save_codes(_reset_codes)
        return False
    if str(entry["code"]) != str(code):
        return False
    _reset_codes.pop(correo, None)
    _save_codes(_reset_codes)
    return True

# ============ HASHING / ENCRIPTACIÓN ============

def hash_password(password: str) -> str:
    """Devuelve contraseña en texto plano. MySQL la encripta vía AES_ENCRYPT."""
    return password

def verify_password(plain_password: str, stored_password: str, db: Session = None, correo: str = None) -> bool:
    """Verifica contraseña usando AES_DECRYPT de MySQL."""
    if db and correo:
        result = db.execute(
            text(f"SELECT AES_DECRYPT(contrasena_encriptada, '{SECRET_KEY_MYSQL}') as pwd FROM usuario WHERE correo = :correo"),
            {"correo": correo}
        ).mappings().first()
        if result and result["pwd"]:
            decrypted = result["pwd"].decode('utf-8') if isinstance(result["pwd"], bytes) else result["pwd"]
            return plain_password == decrypted
    return False

# ============ AUTENTICACIÓN ============

def authenticate_user(db: Session, correo: str, password: str):
    user = db.query(Usuario).join(Rol).filter(Usuario.correo == correo).first()
    if not user:
        return None
    
    result = db.execute(
        text(f"SELECT AES_DECRYPT(contrasena_encriptada, '{SECRET_KEY_MYSQL}') as pwd FROM usuario WHERE correo = :correo"),
        {"correo": correo}
    ).mappings().first()
    
    if result and result["pwd"]:
        decrypted = result["pwd"].decode('utf-8') if isinstance(result["pwd"], bytes) else result["pwd"]
        if password == decrypted:
            return user
    
    return None

# ============ TOKENS JWT ============

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_reset_token(correo: str):
    expire = datetime.utcnow() + timedelta(hours=1)
    return jwt.encode({"sub": correo, "exp": expire, "type": "reset"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_reset_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "reset":
            return None
        return payload.get("sub")
    except JWTError:
        return None