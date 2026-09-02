# app/config.py

<<<<<<< HEAD
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_USER: str = "liftsafe_app"
    DB_PASSWORD: str = "123456"
=======
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    DB_HOST: str = "127.0.0.1"
    DB_PORT: str = "3306"
    DB_NAME: str = "liftsafe_db"
    SECRET_KEY: str = "liftsafe-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # ✅ CAMBIADO: Configuración SSL para Gmail (puerto 465)
    MAIL_USERNAME: str = "liftsafe2025@gmail.com"
    MAIL_PASSWORD: str = "rgib yzdb cmny skpv"  # ← Verifica que esta contraseña de app sea válida
    MAIL_FROM: str = "liftsafe2025@gmail.com"
    MAIL_PORT: int = 465        # ← Cambiado de 587 a 465
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = False  # ← Desactivado
    MAIL_SSL_TLS: bool = True    # ← Activado SSL

<<<<<<< HEAD
    @property
    def DATABASE_URL(self):
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
=======
    model_config = SettingsConfigDict(env_file=".env")
    
    @property
    def DATABASE_URL(self):
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869

settings = Settings()