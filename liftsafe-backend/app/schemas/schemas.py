from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Literal
from datetime import datetime, date
from app.utils.password_validator import validate_password
from app.utils.auth_deps import DOCUMENT_TYPES, CLIENTE_ROL_ID

DocumentType = Literal["CC", "CE", "PA", "RC", "TI", "NIT", "PEP", "PPT", "CD"]

# ==========================================
# ESQUEMAS DE AUTENTICACIÓN Y USUARIOS
# ==========================================
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
    fecha_programada: date
    tipo_servicio: str = "Periódica"
    observaciones: Optional[str] = None

# ==========================================
# ESQUEMAS DE USUARIO-ASCENSOR (DAYAN)
# ==========================================
class UsuarioAscensorBase(BaseModel):
    id_usuario: int
    id_ascensor: int
    tipo_asignacion: str
    fecha_asignacion: date
    observaciones: str | None = None

class UsuarioAscensorCreate(UsuarioAscensorBase):
    pass

class UsuarioAscensorUpdate(BaseModel):
    tipo_asignacion: str | None = None
    fecha_desasignacion: date | None = None
    observaciones: str | None = None

class UsuarioAscensorResponse(UsuarioAscensorBase):
    id_usuario_ascensor: int
    fecha_desasignacion: date | None = None

    class Config:
        from_attributes = True

# ==========================================
# ESQUEMAS DE AUDITORIA (DAYAN)
# ==========================================
class AuditoriaResponse(BaseModel):
    id_auditoria: int
    id_usuario: int | None
    tabla_afectada: str
    operacion: str
    id_registro: int | None
    datos_anteriores: str | None
    datos_nuevos: str | None
    ip_origen: str | None
    user_agent: str | None
    fecha_evento: datetime

    class Config:
        from_attributes = True

# ==========================================
# ESQUEMAS DE SOLICITUDES (LUZ)
# ==========================================
class SolicitudBase(BaseModel):
    id_ascensor: int
    tipo_servicio: str
    prioridad: str
    fecha_deseada: Optional[date] = None
    observaciones: Optional[str] = None

class SolicitudCreate(SolicitudBase):
    pass

class SolicitudUpdate(BaseModel):
    tipo_servicio: Optional[str] = None
    prioridad: Optional[str] = None
    fecha_deseada: Optional[date] = None
    observaciones: Optional[str] = None
    estado: Optional[str] = None

class SolicitudResponse(SolicitudBase):
    id_solicitud: int
    id_cliente: int
    estado: str
    fecha_solicitud: date
    fecha_registro: datetime
    ascensor: Optional[dict] = None
    cliente: Optional[dict] = None

    class Config:
        from_attributes = True

# ==========================================
# ESQUEMAS DE PROGRAMACIÓN (LUZ)
# ==========================================
class ProgramacionBase(BaseModel):
    id_solicitud: int
    id_inspector: int
    fecha_programada: date
    hora_inicio: str
    hora_fin_estimada: Optional[str] = None

class ProgramacionCreate(ProgramacionBase):
    pass

class ProgramacionUpdate(BaseModel):
    id_inspector: Optional[int] = None
    fecha_programada: Optional[date] = None
    hora_inicio: Optional[str] = None
    estado: Optional[str] = None
    motivo_cancelacion: Optional[str] = None

class ProgramacionResponse(ProgramacionBase):
    id_programacion: int
    estado: str
    fecha_creacion: datetime
    solicitud: Optional[dict] = None
    inspector: Optional[dict] = None

    class Config:
        from_attributes = True

# ==========================================
# ESQUEMAS DE NOTIFICACIONES (LUZ)
# ==========================================
class NotificacionBase(BaseModel):
    id_usuario_destino: int
    mensaje: str
    leida: bool = False

class NotificacionCreate(NotificacionBase):
    pass

class NotificacionUpdate(BaseModel):
    leida: bool | None = None

class NotificacionResponse(NotificacionBase):
    id_notificacion: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True