# app/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # ============================================
    # CONFIGURACIÓN DE ENTORNO
    # ============================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # ============================================
    # BASE DE DATOS
    # ============================================
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_HOST: str = "127.0.0.1"
    DB_PORT: str = "3306"
    DB_NAME: str = "liftsafe_db"

    # ============================================
    # JWT - SEGURIDAD
    # ✅ Sin valor por defecto: debe definirse en .env (ver .env.example).
    # Antes había una clave real quemada en el código y subida a git.
    # ============================================
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas (antes 30 min, muy corto para desarrollo/pruebas)

    # ============================================
    # AES - cifrado de contraseñas en MySQL (AES_ENCRYPT/AES_DECRYPT)
    # ✅ Antes estaba duplicada como literal en 6 archivos distintos
    # (auth_controller.py, routes/auth.py, routes/usuarios.py,
    # set_dev_admin_password.py, update_all_passwords.py). Ahora vive solo
    # aquí. Debe coincidir EXACTAMENTE con la clave usada al crear/importar
    # los usuarios en liftsafe_db.sql, o ningún login existente funcionará.
    # ============================================
    SECRET_KEY_MYSQL: str

    # ============================================
    # CORREO (Gmail con SSL)
    # ✅ Sin valores por defecto: deben definirse en .env (ver .env.example).
    # Antes había credenciales reales de Gmail quemadas en el código y
    # subidas a git.
    # ============================================
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int = 465
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = False
    MAIL_SSL_TLS: bool = True

    # ============================================
    # URL DE BASE DE DATOS
    # ============================================
    @property
    def DATABASE_URL(self):
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

settings = Settings()
