"""Actualiza la contraseña del administrador principal para entorno de desarrollo."""
from app.database import SessionLocal
from app.models.models import Usuario, Rol
from app.config import settings
from sqlalchemy import text

DEV_PASSWORD = "Admin123!"


def main():
    db = SessionLocal()
    admin = (
        db.query(Usuario)
        .join(Rol)
        .filter(Rol.nombre_rol == "Administrador")
        .order_by(Usuario.id_usuario.asc())
        .first()
    )
    if not admin:
        print("No hay administrador en la base de datos.")
        return

    # Usamos SQL directo con AES_ENCRYPT, igual que espera auth_controller.py
    db.execute(
        text(
            "UPDATE usuario SET contrasena_encriptada = AES_ENCRYPT(:password, :key) "
            "WHERE id_usuario = :id_usuario"
        ),
        {"password": DEV_PASSWORD, "key": settings.SECRET_KEY_MYSQL, "id_usuario": admin.id_usuario}
    )
    db.commit()
    print(f"Contraseña del administrador actualizada.")
    print(f"Correo: {admin.correo}")
    print(f"Nueva contraseña: {DEV_PASSWORD}")
    db.close()


if __name__ == "__main__":
    main()
