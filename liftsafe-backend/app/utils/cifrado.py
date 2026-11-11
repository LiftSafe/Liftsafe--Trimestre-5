"""RNF-003: cifrado AES-256 de la información sensible (contraseñas y firmas).

Se usa AES-256-GCM (clave de 256 bits, autenticado: si alguien altera el dato
cifrado, descifrar falla). La clave se deriva con SHA-256 de SECRET_KEY_MYSQL,
que ya está en el .env, así que no hay que configurar nada nuevo.

Formatos guardados:
- Contraseñas (columna varbinary): b"AES256:" + nonce(12) + cifrado + tag(16)
- Firmas (columna de texto):       "aes256gcm:" + base64(nonce + cifrado + tag)

Los datos antiguos (contraseñas con AES_ENCRYPT de MySQL, que por defecto es
AES-128, y firmas sin cifrar) se siguen leyendo; run_migration.py los pasa
al formato nuevo.
"""
import base64
import hashlib
import hmac
import os

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy import Text
from sqlalchemy.types import TypeDecorator

from app.config import settings

PREFIJO_CLAVE = b"AES256:"
PREFIJO_TEXTO = "aes256gcm:"


def _clave() -> bytes:
    return hashlib.sha256(("liftsafe-aes256:" + settings.SECRET_KEY_MYSQL).encode("utf-8")).digest()


def _cifrar(datos: bytes, contexto: bytes) -> bytes:
    nonce = os.urandom(12)
    return nonce + AESGCM(_clave()).encrypt(nonce, datos, contexto)


def _descifrar(paquete: bytes, contexto: bytes) -> bytes:
    return AESGCM(_clave()).decrypt(paquete[:12], paquete[12:], contexto)


# ---------- contraseñas ----------

def cifrar_contrasena(contrasena: str) -> bytes:
    return PREFIJO_CLAVE + _cifrar(contrasena.encode("utf-8"), b"contrasena")


def es_formato_nuevo(valor) -> bool:
    return isinstance(valor, (bytes, bytearray)) and bytes(valor).startswith(PREFIJO_CLAVE)


def descifrar_contrasena(valor: bytes) -> str:
    return _descifrar(bytes(valor)[len(PREFIJO_CLAVE):], b"contrasena").decode("utf-8")


def contrasena_coincide(db, correo: str, contrasena: str) -> bool:
    """Compara la contraseña escrita con la guardada. Si estaba en el formato
    viejo (AES_ENCRYPT de MySQL) y coincide, la pasa a AES-256."""
    from sqlalchemy import text
    fila = db.execute(
        text("SELECT contrasena_encriptada AS cifrada, AES_DECRYPT(contrasena_encriptada, :k) AS vieja "
             "FROM usuario WHERE correo = :correo"),
        {"correo": correo, "k": settings.SECRET_KEY_MYSQL},
    ).mappings().first()
    if not fila or not fila["cifrada"]:
        return False
    if es_formato_nuevo(fila["cifrada"]):
        try:
            guardada = descifrar_contrasena(fila["cifrada"])
        except (InvalidTag, ValueError):
            return False
        return hmac.compare_digest(guardada.encode("utf-8"), contrasena.encode("utf-8"))
    vieja = fila["vieja"]
    if vieja is None:
        return False
    vieja = vieja.decode("utf-8") if isinstance(vieja, (bytes, bytearray)) else str(vieja)
    if not hmac.compare_digest(vieja.encode("utf-8"), contrasena.encode("utf-8")):
        return False
    db.execute(text("UPDATE usuario SET contrasena_encriptada = :c WHERE correo = :correo"),
               {"c": cifrar_contrasena(contrasena), "correo": correo})
    db.commit()
    return True


# ---------- firmas y otros textos ----------

def cifrar_texto(valor):
    if valor is None or str(valor).startswith(PREFIJO_TEXTO):
        return valor
    return PREFIJO_TEXTO + base64.b64encode(_cifrar(str(valor).encode("utf-8"), b"texto")).decode("ascii")


def descifrar_texto(valor):
    if valor is None or not str(valor).startswith(PREFIJO_TEXTO):
        return valor  # dato antiguo sin cifrar
    return _descifrar(base64.b64decode(valor[len(PREFIJO_TEXTO):]), b"texto").decode("utf-8")


class TextoCifrado(TypeDecorator):
    """Columna de texto que se guarda cifrada con AES-256 y se lee descifrada."""
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return cifrar_texto(value)

    def process_result_value(self, value, dialect):
        return descifrar_texto(value)
