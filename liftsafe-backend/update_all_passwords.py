# update_all_passwords.py
# Script de desarrollo: pone la misma contraseña temporal a TODOS los usuarios.
# Usa la configuración real del proyecto (app/config.py -> .env), no valores
# sueltos copiados a mano.

from sqlalchemy import create_engine, text
from app.config import settings

# ============ CONFIGURACIÓN ============

NUEVA_CONTRASENA = "123456"

DATABASE_URL = settings.DATABASE_URL

# ============ SCRIPT ============

def update_all_passwords():
    engine = create_engine(DATABASE_URL)

    with engine.begin() as conn:
        result = conn.execute(text("""
            SELECT id_usuario, correo, nombre_completo
            FROM usuario
            ORDER BY id_usuario
        """)).mappings().all()

        print(f"{'='*60}")
        print(f"🔐 ACTUALIZANDO CONTRASEÑAS DE {len(result)} USUARIOS")
        print(f"{'='*60}")
        print(f"Nueva contraseña: {NUEVA_CONTRASENA}")
        print(f"{'='*60}\n")

        for user in result:
            conn.execute(
                text("""
                    UPDATE usuario
                    SET contrasena_encriptada = AES_ENCRYPT(:pwd, :secret)
                    WHERE id_usuario = :id
                """),
                {
                    "pwd": NUEVA_CONTRASENA,
                    "secret": settings.SECRET_KEY_MYSQL,
                    "id": user["id_usuario"]
                }
            )
            print(f"✅ ID {user['id_usuario']:3d} | {user['correo']:30s} | {user['nombre_completo']}")

        print(f"\n{'='*60}")
        print(f"✅ {len(result)} usuarios actualizados correctamente")
        print(f"{'='*60}")
        print(f"\n⚠️  IMPORTANTE: Todos los usuarios ahora tienen la misma contraseña:")
        print(f"   '{NUEVA_CONTRASENA}'")
        print(f"\n🔒 Cambia tu contraseña personal después de iniciar sesión.")

if __name__ == "__main__":
    update_all_passwords()

## ejecucion
## python update_all_passwords.py
