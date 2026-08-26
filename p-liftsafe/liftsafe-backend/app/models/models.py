# app/models/models.py

from app.database import Base
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime

# ============ MODELO ROL ============

class Rol(Base):
    __tablename__ = "rol"
    
    id_rol = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_rol = Column(String(50), nullable=False, unique=True, comment="Administrador, Director Técnico, Coordinador, Inspector, Asesor, Cliente")
    descripcion = Column(String(200), nullable=True, comment="Descripción de permisos del rol")
    fecha_creacion = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    usuarios = relationship("Usuario", back_populates="rol")

# ============ MODELO USUARIO ============

class Usuario(Base):
    __tablename__ = "usuario"
    
    id_usuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_rol = Column(Integer, ForeignKey("rol.id_rol"), nullable=False)
    nombre_completo = Column(String(150), nullable=False)
    correo = Column(String(120), nullable=False, unique=True)
    contrasena_encriptada = Column(LargeBinary, nullable=True, comment="AES_ENCRYPT de MySQL")
    telefono = Column(String(255), nullable=True)
    # ... resto
    tipo_documento = Column(String(10), nullable=True, comment="CC, CE, PA, RC, TI, NIT, PEP, PPT, CD")
    documento_identidad = Column(String(255), nullable=True)
    razon_social = Column(String(255), nullable=True)
    nit = Column(String(255), nullable=True)
    direccion = Column(String(255), nullable=True)
    estado = Column(String(255), nullable=False)
    fecha_registro = Column(DateTime, nullable=False, default=datetime.utcnow)
    ultima_sesion = Column(DateTime, nullable=True)
    
    # Relaciones
    rol = relationship("Rol", back_populates="usuarios")
    ascensores = relationship("Ascensor", back_populates="cliente", foreign_keys="Ascensor.id_cliente")
    inspecciones = relationship("Inspeccion", back_populates="inspector_rel", foreign_keys="Inspeccion.id_inspector")
    asignaciones = relationship("UsuarioAscensor", back_populates="usuario")
    informes_revisados = relationship("Informe", back_populates="revisor", foreign_keys="Informe.id_revisor")

# ============ MODELO ASCENSOR (ACTUALIZADO CON TODOS LOS CAMPOS) ============

class Ascensor(Base):
    __tablename__ = "ascensor"
    
    id_ascensor = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False, 
                       comment="Usuario con rol Cliente")
    codigo_interno = Column(String(50), nullable=False, unique=True, 
                           comment="Código único de identificación")
    marca = Column(String(80), nullable=False)
    modelo = Column(String(80), nullable=False)
    numero_serie = Column(String(80), nullable=False)
    tipo_ascensor = Column(String(50), nullable=False, 
                          comment="Pasajeros, Carga, Montacamillas, etc.")
    capacidad_kg = Column(Integer, nullable=False)
    capacidad_personas = Column(Integer, nullable=True)
    numero_pisos = Column(Integer, nullable=False)
    velocidad_ms = Column(Float, nullable=True)
    ubicacion_exacta = Column(String(200), nullable=False, 
                             comment="Torre, piso, sector")
    direccion_completa = Column(String(250), nullable=False)
    ciudad = Column(String(100), nullable=False)
    estado = Column(String(255), nullable=False)
    fecha_instalacion = Column(Date, nullable=True)
    fecha_registro = Column(DateTime, nullable=False, default=datetime.utcnow)
    ultima_modificacion = Column(DateTime, nullable=False, default=datetime.utcnow, 
                                  onupdate=datetime.utcnow)
    
    # Relaciones
    cliente = relationship("Usuario", back_populates="ascensores", foreign_keys=[id_cliente])
    inspecciones = relationship("Inspeccion", back_populates="ascensor")
    asignaciones = relationship("UsuarioAscensor", back_populates="ascensor")

# ============ MODELO SOLICITUD ============

class Solicitud(Base):
    __tablename__ = "solicitud"
    
    id_solicitud = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    id_ascensor = Column(Integer, ForeignKey("ascensor.id_ascensor"), nullable=False)
    tipo_servicio = Column(String(100), nullable=False, 
                          comment="Inspección Inicial, Periódica, Extraordinaria, Post-mantenimiento")
    prioridad = Column(String(255), nullable=False)
    fecha_solicitud = Column(Date, nullable=False)
    fecha_deseada = Column(Date, nullable=True, comment="Fecha preferida por el cliente")
    estado = Column(String(255), nullable=False)
    observaciones = Column(Text, nullable=True)
    fecha_registro = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relaciones
    inspecciones = relationship("Inspeccion", back_populates="solicitud")
    programaciones = relationship("Programacion", back_populates="solicitud")

# ============ MODELO PROGRAMACION ============

class Programacion(Base):
    __tablename__ = "programacion"
    
    id_programacion = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_solicitud = Column(Integer, ForeignKey("solicitud.id_solicitud"), nullable=False)
    id_inspector = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False, 
                         comment="Usuario con rol Inspector")
    fecha_programada = Column(Date, nullable=False)
    hora_inicio = Column(DateTime, nullable=False)
    hora_fin_estimada = Column(DateTime, nullable=True)
    estado = Column(String(255), nullable=False)
    motivo_cancelacion = Column(String(255), nullable=True)
    fecha_creacion = Column(DateTime, nullable=False, default=datetime.utcnow)
    fecha_modificacion = Column(DateTime, nullable=False, default=datetime.utcnow, 
                                 onupdate=datetime.utcnow)
    
    # Relaciones
    solicitud = relationship("Solicitud", back_populates="programaciones")
    inspecciones = relationship("Inspeccion", back_populates="programacion")

# ============ MODELO INSPECCION ============

class Inspeccion(Base):
    __tablename__ = "inspeccion"
    
    id_inspeccion = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_programacion = Column(Integer, ForeignKey("programacion.id_programacion"), nullable=False)
    id_ascensor = Column(Integer, ForeignKey("ascensor.id_ascensor"), nullable=False)
    id_inspector = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    id_solicitud = Column(Integer, ForeignKey("solicitud.id_solicitud"), nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_fin = Column(DateTime, nullable=True)
    duracion_minutos = Column(Integer, nullable=True)
    estado = Column(String(255), nullable=False)
    firma_inspector = Column(Text, nullable=True, comment="Firma digital base64")
    fecha_firma_inspector = Column(DateTime, nullable=True)
    firma_cliente = Column(Text, nullable=True, comment="Firma digital base64")
    fecha_firma_cliente = Column(DateTime, nullable=True)
    sincronizado = Column(Boolean, nullable=True)
    fecha_sincronizacion = Column(DateTime, nullable=True)
    observaciones_generales = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, nullable=False, default=datetime.utcnow)
    ultima_modificacion = Column(DateTime, nullable=False, default=datetime.utcnow, 
                                  onupdate=datetime.utcnow)
    
    # Relaciones
    ascensor = relationship("Ascensor", back_populates="inspecciones")
    inspector_rel = relationship("Usuario", back_populates="inspecciones", foreign_keys=[id_inspector])
    programacion = relationship("Programacion", back_populates="inspecciones")
    solicitud = relationship("Solicitud", back_populates="inspecciones")
    informe = relationship("Informe", back_populates="inspeccion", uselist=False)
    detalles = relationship("DetalleChecklist", back_populates="inspeccion")

# ============ MODELO INFORME ============

class Informe(Base):
    __tablename__ = "informe"
    
    id_informe = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_inspeccion = Column(Integer, ForeignKey("inspeccion.id_inspeccion"), nullable=False, unique=True)
    numero_informe = Column(String(50), nullable=False, unique=True, 
                           comment="Código único del informe")
    fecha_generacion = Column(DateTime, nullable=True)
    fecha_revision = Column(DateTime, nullable=True)
    fecha_aprobacion = Column(DateTime, nullable=True)
    estado = Column(String(255), nullable=False)
    id_revisor = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True, 
                       comment="Coordinador o Director Técnico")
    observaciones_revision = Column(Text, nullable=True)
    ruta_pdf = Column(String(500), nullable=True, comment="Ubicación del PDF generado")
    hash_documento = Column(String(64), nullable=True, comment="SHA-256 para integridad")
    conclusion_general = Column(Text, nullable=True)
    concepto_tecnico = Column(String(255), nullable=True)
    fecha_creacion = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relaciones
    inspeccion = relationship("Inspeccion", back_populates="informe")
    revisor = relationship("Usuario", back_populates="informes_revisados", foreign_keys=[id_revisor])
    fotografias = relationship("Fotografia", back_populates="informe")
    observaciones = relationship("Observacion", back_populates="informe")

# ============ MODELO CHECKLIST_CATEGORIA ============

class ChecklistCategoria(Base):
    __tablename__ = "checklist_categoria"
    
    id_categoria = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_categoria = Column(String(150), nullable=False, unique=True)
    descripcion = Column(String(500), nullable=True)
    orden_visualizacion = Column(Integer, nullable=False, default=0)
    norma_referencia = Column(String(100), nullable=True, comment="NTC 5926-1:2012")
    activo = Column(Boolean, nullable=True)
    
    items = relationship("ChecklistItem", back_populates="categoria")

# ============ MODELO CHECKLIST_ITEM ============

class ChecklistItem(Base):
    __tablename__ = "checklist_item"
    
    id_item = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_categoria = Column(Integer, ForeignKey("checklist_categoria.id_categoria"), nullable=False, 
                         comment="Categoría a la que pertenece")
    codigo_item = Column(String(20), nullable=False, unique=True, comment="Ej: CM-01, CAB-03")
    descripcion = Column(Text, nullable=False)
    criterio_cumplimiento = Column(Text, nullable=True, comment="Descripción de qué se considera cumplimiento")
    nivel_criticidad = Column(String(255), nullable=False)
    obligatorio = Column(Boolean, nullable=True)
    orden_visualizacion = Column(Integer, nullable=False, default=0)
    activo = Column(Boolean, nullable=True)
    
    # Relaciones
    categoria = relationship("ChecklistCategoria", back_populates="items")
    detalles = relationship("DetalleChecklist", back_populates="item")
    fotografias = relationship("Fotografia", back_populates="item_rel")

# ============ MODELO DETALLE_CHECKLIST ============

class DetalleChecklist(Base):
    __tablename__ = "detalle_checklist"
    
    id_detalle = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_inspeccion = Column(Integer, ForeignKey("inspeccion.id_inspeccion"), nullable=False)
    id_item = Column(Integer, ForeignKey("checklist_item.id_item"), nullable=False)
    resultado = Column(String(20), nullable=False, comment="Cumple, No Cumple, No Aplica")
    observacion = Column(String(500), nullable=True, comment="Detalle del hallazgo")
    accion_requerida = Column(Text, nullable=True, comment="Corrección o mejora sugerida")
    fecha_registro = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relaciones
    inspeccion = relationship("Inspeccion", back_populates="detalles")
    item = relationship("ChecklistItem", back_populates="detalles")

# ============ MODELO FOTOGRAFIA ============

class Fotografia(Base):
    __tablename__ = "fotografia"
    
    id_foto = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_informe = Column(Integer, ForeignKey("informe.id_informe"), nullable=False, 
                       comment="Informe al que pertenece la fotografía")
    id_item = Column(Integer, ForeignKey("checklist_item.id_item"), nullable=True, 
                    comment="Item del checklist asociado (opcional)")
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=False, comment="URL o path del archivo")
    tamano_kb = Column(Integer, nullable=True)
    descripcion = Column(String(300), nullable=True)
    tipo_evidencia = Column(String(255), nullable=True)
    fecha_captura = Column(DateTime, nullable=False)
    latitud = Column(Float(10, 8), nullable=True, comment="Geolocalización")
    longitud = Column(Float(11, 8), nullable=True)
    sincronizado = Column(Boolean, nullable=True)
    
    # Relaciones
    informe = relationship("Informe", back_populates="fotografias")
    item_rel = relationship("ChecklistItem", back_populates="fotografias")

# ============ MODELO OBSERVACION ============

class Observacion(Base):
    __tablename__ = "observacion"
    
    id_observacion = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_informe = Column(Integer, ForeignKey("informe.id_informe"), nullable=False)
    tipo_observacion = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=False)
    nivel_riesgo = Column(String(255), nullable=False)
    requiere_atencion_inmediata = Column(Boolean, nullable=True)
    fecha_limite_recomendada = Column(Date, nullable=True)
    fecha_registro = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relaciones
    informe = relationship("Informe", back_populates="observaciones")

# ============ MODELO USUARIO_ASCENSOR ============

class UsuarioAscensor(Base):
    __tablename__ = "usuario_ascensor"
    
    id_usuario_ascensor = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False, 
                       comment="Inspector o técnico")
    id_ascensor = Column(Integer, ForeignKey("ascensor.id_ascensor"), nullable=False)
    tipo_asignacion = Column(String(255), nullable=False)
    fecha_asignacion = Column(Date, nullable=False)
    fecha_desasignacion = Column(Date, nullable=True)
    observaciones = Column(String(200), nullable=True)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="asignaciones")
    ascensor = relationship("Ascensor", back_populates="asignaciones")

# ============ MODELO AUDITORIA ============

class Auditoria(Base):
    __tablename__ = "auditoria"
    
    id_auditoria = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True, 
                       comment="Usuario que ejecutó la acción")
    tabla_afectada = Column(String(50), nullable=False)
    operacion = Column(String(20), nullable=False)
    id_registro = Column(Integer, nullable=True, comment="ID del registro afectado")
    datos_anteriores = Column(Text, nullable=True, comment="Valores antes del cambio (JSON)")
    datos_nuevos = Column(Text, nullable=True, comment="Valores después del cambio (JSON)")
    ip_origen = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    fecha_evento = Column(DateTime, nullable=False, default=datetime.utcnow)