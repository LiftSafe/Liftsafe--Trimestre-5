"""Configuración global de pytest para LiftSafe.

app/config.py exige SECRET_KEY, SECRET_KEY_MYSQL y MAIL_* sin valor por
defecto, así que importar `app` sin un .env falla. Aquí se definen valores
falsos ANTES de que cualquier test importe la aplicación.

Las variables de entorno tienen prioridad sobre el .env, así que las pruebas
nunca usan credenciales reales de correo ni la clave real de MySQL.
"""
import os

os.environ.setdefault("SECRET_KEY", "clave-solo-para-pruebas")
os.environ.setdefault("SECRET_KEY_MYSQL", "aes-solo-para-pruebas")
os.environ.setdefault("MAIL_USERNAME", "pruebas@example.com")
os.environ.setdefault("MAIL_PASSWORD", "no-es-una-clave-real")
os.environ.setdefault("MAIL_FROM", "pruebas@example.com")

# Seguridad: las pruebas JAMÁS apuntan a la base de datos de desarrollo.
# Se fuerza (no se usa setdefault) para que un .env no la pise.
# Apunta al MySQL de pruebas de docker-compose.test.yml (puerto 3307).
os.environ["DB_HOST"] = "127.0.0.1"
os.environ["DB_PORT"] = "3307"
os.environ["DB_USER"] = "root"
os.environ["DB_PASSWORD"] = "test_root"
os.environ["DB_NAME"] = "liftsafe_test"
