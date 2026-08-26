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
    fecha_programada: date
    tipo_servicio: str = "Periódica"
    observaciones: Optional[str] = None

<<<<<<< HEAD
# ============================================
# SCHEMAS DE DAYAN - USUARIO-ASCENSOR
# ============================================
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
    usuario: dict | None = None
    ascensor: dict | None = None
=======

class DetalleChecklistBase(BaseModel):
    id_inspeccion: int
    id_item: int
    resultado: str  # Cumple, No Cumple, No Aplica
    observacion: Optional[str] = None
    accion_requerida: Optional[str] = None

class DetalleChecklistCreate(DetalleChecklistBase):
    pass

class DetalleChecklistResponse(DetalleChecklistBase):
    id_detalle: int
    fecha_registro: datetime
    

    class Config:
        from_attributes = True

<<<<<<< HEAD
# ============================================
# SCHEMAS DE VALENTINA - FOTOGRAFIAS
# ============================================
class FotografiaBase(BaseModel):
    id_informe: int
    id_item: int | None = None
    descripcion: str | None = None
    tipo_evidencia: str | None = None

class FotografiaCreate(FotografiaBase):
    pass

class FotografiaResponse(FotografiaBase):
    id_foto: int
    nombre_archivo: str
    ruta_archivo: str
    tamano_kb: int | None = None
    fecha_captura: datetime
    latitud: float | None = None
    longitud: float | None = None
    sincronizado: bool

    class Config:
        from_attributes = True

# ============================================
# SCHEMAS DE VALENTINA - FIRMA
# ============================================
class FirmaRequest(BaseModel):
    firma: str  # base64

class FirmaResponse(BaseModel):
    mensaje: str
    fecha_firma: datetime | None = None
=======
class ChecklistItemResponse(BaseModel):
    id_item: int
    id_categoria: int
    codigo_item: str
    descripcion: str
    criterio_cumplimiento: Optional[str] = None
    nivel_criticidad: str
    obligatorio: Optional[bool] = None
    orden_visualizacion: int

    class Config:
        from_attributes = True

class ChecklistCategoriaResponse(BaseModel):
    id_categoria: int
    nombre_categoria: str
    descripcion: Optional[str] = None
    orden_visualizacion: int
    norma_referencia: Optional[str] = None
    items: list[ChecklistItemResponse] = []

    class Config:
        from_attributes = True


class ObservacionBase(BaseModel):
    id_informe: int
    tipo_observacion: str
    descripcion: str
    nivel_riesgo: str
    requiere_atencion_inmediata: bool = False
    fecha_limite_recomendada: Optional[date] = None

class ObservacionCreate(ObservacionBase):
    pass

class ObservacionUpdate(BaseModel):
    tipo_observacion: Optional[str] = None
    descripcion: Optional[str] = None
    nivel_riesgo: Optional[str] = None
    requiere_atencion_inmediata: Optional[bool] = None
    fecha_limite_recomendada: Optional[date] = None

class ObservacionResponse(ObservacionBase):
    id_observacion: int
    fecha_registro: datetime

    class Config:
        from_attributes = True
>>>>>>> 18177d26d35979b66edf2bf8306e2fa03f251cad
