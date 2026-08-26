from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Literal
from datetime import datetime, date
from app.utils.password_validator import validate_password
from app.utils.auth_deps import DOCUMENT_TYPES, CLIENTE_ROL_ID


DocumentType = Literal["CC", "CE", "PA", "RC", "TI", "NIT", "PEP", "PPT", "CD"]

class UsuarioLogin(BaseModel):
    correo: EmailStr
    contrasena: str

class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre_completo: str
    correo: str
    nombre_rol: str
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    rol: str
    nombre: str

class AscensorResponse(BaseModel):
    id_ascensor: int
    codigo_interno: str
    marca: str
    modelo: str
    tipo_ascensor: str
    ciudad: str
    estado: str
    
    class Config:
        from_attributes = True

class InspeccionResponse(BaseModel):
    id_inspeccion: int
    codigo_ascensor: str
    marca: str
    modelo: str
    nombre_inspector: str
    fecha_inicio: Optional[datetime]
    estado: str
    
    class Config:
        from_attributes = True

class UsuarioRegister(BaseModel):
    nombre_completo: str
    correo: EmailStr
    contrasena: str
    telefono: Optional[str] = None
    tipo_documento: DocumentType
    documento_identidad: str
    nit: Optional[str] = None
    razon_social: Optional[str] = None
    id_rol: int = CLIENTE_ROL_ID

    @field_validator("contrasena")
    @classmethod
    def check_password(cls, v: str) -> str:
        validate_password(v)
        return v

    @field_validator("id_rol")
    @classmethod
    def only_cliente(cls, v: int) -> int:
        if v != CLIENTE_ROL_ID:
            raise ValueError("Solo los clientes pueden registrarse públicamente")
        return v

    @field_validator("tipo_documento")
    @classmethod
    def check_doc_type(cls, v: str) -> str:
        if v not in DOCUMENT_TYPES:
            raise ValueError("Tipo de documento no válido")
        return v

class UsuarioCreate(BaseModel):
    nombre_completo: str
    correo: EmailStr
    contrasena: str
    telefono: Optional[str] = None
    tipo_documento: DocumentType
    documento_identidad: str
    nit: Optional[str] = None
    razon_social: Optional[str] = None
    id_rol: int

    @field_validator("contrasena")
    @classmethod
    def check_password(cls, v: str) -> str:
        validate_password(v)
        return v

    @field_validator("id_rol")
    @classmethod
    def not_cliente(cls, v: int) -> int:
        if v == CLIENTE_ROL_ID:
            raise ValueError("Los clientes deben registrarse por su cuenta")
        return v

    @field_validator("tipo_documento")
    @classmethod
    def check_doc_type(cls, v: str) -> str:
        if v not in DOCUMENT_TYPES:
            raise ValueError("Tipo de documento no válido")
        return v

class RecuperarClaveRequest(BaseModel):
    correo: EmailStr

class ResetClaveRequest(BaseModel):
    token: str
    nueva_contrasena: str

    @field_validator("nueva_contrasena")
    @classmethod
    def check_password(cls, v: str) -> str:
        validate_password(v)
        return v

class MessageResponse(BaseModel):
    message: str
    
class InspeccionCreate(BaseModel):
    id_ascensor: int
    id_inspector: int
    fecha_programada: date  # ← Cambiar de datetime a date
    tipo_servicio: str = "Periódica"
    observaciones: Optional[str] = None
