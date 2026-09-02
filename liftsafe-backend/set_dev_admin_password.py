"""Actualiza la contraseña del administrador principal para entorno de desarrollo."""
from app.database import SessionLocal
from app.models.models import Usuario, Rol
<<<<<<< HEAD
from app.controllers.auth_controller import hash_password

DEV_PASSWORD = "Admin123!"


=======
from sqlalchemy import text
 
DEV_PASSWORD = "Admin123!"
SECRET_KEY_MYSQL = 'LiftSafeSecretKey2026!'  # debe coincidir con auth_controller.py
 
 
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
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
<<<<<<< HEAD

    admin.contrasena = hash_password(DEV_PASSWORD)
=======
 
    # Usamos SQL directo con AES_ENCRYPT, igual que espera auth_controller.py
    db.execute(
        text(
            "UPDATE usuario SET contrasena_encriptada = AES_ENCRYPT(:password, :key) "
            "WHERE id_usuario = :id_usuario"
        ),
        {"password": DEV_PASSWORD, "key": SECRET_KEY_MYSQL, "id_usuario": admin.id_usuario}
    )
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    db.commit()
    print(f"Contraseña del administrador actualizada.")
    print(f"Correo: {admin.correo}")
    print(f"Nueva contraseña: {DEV_PASSWORD}")
    db.close()
<<<<<<< HEAD


if __name__ == "__main__":
    main()
=======
 
 
if __name__ == "__main__":
    main()
 
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
