from fastapi import APIRouter, Depends, HTTPException, Request, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import date as date_type
from typing import Optional
from app.database import get_db
from app.models.models import Usuario, Rol, Programacion
from app.schemas.schemas import UsuarioCreate, UsuarioUpdate, MessageResponse
from app.controllers.usuario_controller import get_user_profile, get_admin_stats, get_cliente_ascensores, get_inspector_inspecciones
from app.utils.auth_deps import require_admin_from_request, get_current_user, INSPECTOR_ROL_ID
from app.config import settings
from sqlalchemy import text

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

# ✅ ESQUEMA DE SEGURIDAD
security = HTTPBearer()

DOC_LABELS = {"CC": "Cédula de ciudadanía", "NIT": "NIT", "PPE": "PPE", "CE": "Cédula de extranjería"}

def format_document(user: Usuario) -> str:
    doc = user.nit or user.documento_identidad or ""
    if user.tipo_documento:
        label = DOC_LABELS.get(user.tipo_documento, user.tipo_documento)
        return f"{label}: {doc}" if doc else label
    return doc

# ============================================
# 1. CREAR USUARIO
# ============================================
@router.post("", response_model=MessageResponse)
def crear_usuario(
    request: Request,
    user_data: UsuarioCreate,
    db: Session = Depends(get_db)
):
    require_admin_from_request(request)

    existing = db.query(Usuario).filter(Usuario.correo == user_data.correo).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    rol = db.query(Rol).filter(Rol.id_rol == user_data.id_rol).first()
    if not rol:
        raise HTTPException(status_code=400, detail="Rol no válido")

    # ✅ Insertar con AES_ENCRYPT directo
    db.execute(
        text("""
            INSERT INTO usuario (id_rol, nombre_completo, correo, contrasena_encriptada, 
                               telefono, tipo_documento, documento_identidad, nit, razon_social, estado)
            VALUES (:id_rol, :nombre, :correo, AES_ENCRYPT(:contrasena, :aes_key),
                    :telefono, :tipo_doc, :documento, :nit, :razon_social, 'activo')
        """),
        {
            "id_rol": user_data.id_rol,
            "nombre": user_data.nombre_completo,
            "correo": user_data.correo,
            "contrasena": user_data.contrasena,
            "telefono": user_data.telefono,
            "tipo_doc": user_data.tipo_documento,
            "documento": user_data.documento_identidad,
            "nit": user_data.nit if user_data.tipo_documento == "NIT" else None,
            "razon_social": user_data.razon_social if user_data.tipo_documento == "NIT" else None,
            "aes_key": settings.SECRET_KEY_MYSQL,
        }
    )
    db.commit()
    return {"message": f"Usuario {rol.nombre_rol} creado exitosamente"}

# ============================================
# 2. OBTENER PERFIL DE USUARIO
# ============================================
@router.get("/perfil/{user_id}")
def perfil(user_id: int, db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT u.*, r.nombre_rol 
        FROM vista_usuarios_segura u
        JOIN rol r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = :user_id
    """), {"user_id": user_id}).mappings().first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {
        "id_usuario": result["id_usuario"],
        "nombre_completo": result["nombre_completo"],
        "correo": result["correo"],
        "rol": result["nombre_rol"],
        "telefono": result["telefono"],
        "estado": result["estado"]
    }

# ============================================
# 3. DASHBOARDS
# ============================================
@router.get("/dashboard/admin")
def dashboard_admin(db: Session = Depends(get_db)):
    return get_admin_stats(db)

@router.get("/dashboard/cliente/{client_id}")
def dashboard_cliente(client_id: int, db: Session = Depends(get_db)):
    return get_cliente_ascensores(db, client_id)

@router.get("/dashboard/inspector/{inspector_id}")
def dashboard_inspector(inspector_id: int, db: Session = Depends(get_db)):
    return get_inspector_inspecciones(db, inspector_id)

# ============================================
# 4. LISTADO DE USUARIOS (solo Admin)
# ============================================
@router.get("/listado")
def listado_usuarios(request: Request, db: Session = Depends(get_db)):
    require_admin_from_request(request)
    
    # ✅ Usar vista segura que NO incluye contrasena
    result = db.execute(text("""
        SELECT u.*, r.nombre_rol
        FROM vista_usuarios_segura u
        JOIN rol r ON u.id_rol = r.id_rol
        ORDER BY u.id_usuario DESC
    """)).mappings().all()
    
    return [
        {
            "id_usuario": row["id_usuario"],
            "nombre_completo": row["nombre_completo"],
            "correo": row["correo"],
            "rol": row["nombre_rol"],
            "telefono": row["telefono"],
            "documento_identidad": row["documento_identidad"],
            "estado": row["estado"],
            "fecha_registro": row["fecha_registro"]
        }
        for row in result
    ]

# ============================================
# 4b. LISTADO DE INSPECTORES (para asignar solicitudes/inspecciones)
# ============================================
@router.get("/inspectores")
def listado_inspectores(
    fecha: Optional[date_type] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ✅ FIX: esta ruta no existía -> usuarioService.listarInspectores() (usado por
    CoordinadorDashboard y por el formulario de "Nueva inspección") siempre
    fallaba con 404, así que los selectores de inspector quedaban vacíos.

    Si se pasa "fecha" (YYYY-MM-DD), excluye a los inspectores que ya tienen
    una programación ese día (estado distinto de "Cancelada"), para mostrar
    solo los disponibles.
    """
    inspectores = (
        db.query(Usuario)
        .filter(Usuario.id_rol == INSPECTOR_ROL_ID, Usuario.estado == 'Activo')
        .order_by(Usuario.nombre_completo.asc())
        .all()
    )

    ocupados_ese_dia = set()
    if fecha is not None:
        programaciones = (
            db.query(Programacion.id_inspector)
            .filter(
                Programacion.fecha_programada == fecha,
                Programacion.estado != 'Cancelada',
            )
            .all()
        )
        ocupados_ese_dia = {p.id_inspector for p in programaciones}

    return [
        {
            "id_usuario": i.id_usuario,
            "nombre_completo": i.nombre_completo,
            "correo": i.correo,
            "telefono": i.telefono,
            "disponible": i.id_usuario not in ocupados_ese_dia,
        }
        for i in inspectores
        if i.id_usuario not in ocupados_ese_dia
    ]

# ============================================
# 5. EDITAR USUARIO (solo Admin) - VERSIÓN FUSIONADA
# ============================================
@router.put("/{user_id}", response_model=MessageResponse)
def editar_usuario(
    user_id: int,
    user_data: UsuarioUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    require_admin_from_request(request)

    user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Validar correo único si se está cambiando
    if user_data.correo is not None and user_data.correo != user.correo:
        existing = db.query(Usuario).filter(Usuario.correo == user_data.correo).first()
        if existing:
            raise HTTPException(status_code=400, detail="El correo ya está registrado por otro usuario")
        user.correo = user_data.correo

    # Validar rol si se está cambiando
    if user_data.id_rol is not None:
        rol = db.query(Rol).filter(Rol.id_rol == user_data.id_rol).first()
        if not rol:
            raise HTTPException(status_code=400, detail="Rol no válido")
        # No permitir quitarle el rol de Administrador al último admin
        admin_rol = db.query(Rol).filter(Rol.nombre_rol == "Administrador").first()
        if admin_rol and user.id_rol == admin_rol.id_rol and user_data.id_rol != admin_rol.id_rol:
            total_admins = db.query(Usuario).filter(Usuario.id_rol == admin_rol.id_rol).count()
            if total_admins <= 1:
                raise HTTPException(status_code=400, detail="No se puede quitar el rol al último administrador")
        user.id_rol = user_data.id_rol

    # Actualizar campos simples
    if user_data.nombre_completo is not None:
        user.nombre_completo = user_data.nombre_completo
    if user_data.telefono is not None:
        user.telefono = user_data.telefono
    if user_data.tipo_documento is not None:
        user.tipo_documento = user_data.tipo_documento
    if user_data.documento_identidad is not None:
        user.documento_identidad = user_data.documento_identidad
    if user_data.nit is not None:
        user.nit = user_data.nit
    if user_data.razon_social is not None:
        user.razon_social = user_data.razon_social
    if user_data.estado is not None:
        user.estado = user_data.estado

    db.commit()

    # La contraseña se maneja aparte porque va encriptada con AES_ENCRYPT
    if user_data.contrasena:
        db.execute(
            text("UPDATE usuario SET contrasena_encriptada = AES_ENCRYPT(:contrasena, :aes_key) WHERE id_usuario = :id"),
            {"contrasena": user_data.contrasena, "id": user_id, "aes_key": settings.SECRET_KEY_MYSQL}
        )
        db.commit()

    db.refresh(user)
    return {"message": f"Usuario '{user.nombre_completo}' actualizado exitosamente"}

# ============================================
# 6. ELIMINAR USUARIO (solo Admin)
# ============================================
@router.delete("/{user_id}", response_model=MessageResponse)
def eliminar_usuario(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    require_admin_from_request(request)
    
    # Verificar que el usuario existe
    user = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # No permitir eliminar al último administrador
    admin_rol = db.query(Rol).filter(Rol.nombre_rol == "Administrador").first()
    if admin_rol and user.id_rol == admin_rol.id_rol:
        total_admins = db.query(Usuario).filter(Usuario.id_rol == admin_rol.id_rol).count()
        if total_admins <= 1:
            raise HTTPException(status_code=400, detail="No se puede eliminar el último administrador")
    
    # Eliminar usuario
    db.delete(user)
    db.commit()
    
    return {"message": f"Usuario '{user.nombre_completo}' eliminado exitosamente"}