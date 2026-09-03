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
    # ============================================
    SECRET_KEY: str = "liftsafe-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas (antes 30 min, muy corto para desarrollo/pruebas)
    
    # ============================================
    # CORREO (Gmail con SSL)
    # ============================================
    MAIL_USERNAME: str = "liftsafe2025@gmail.com"
    MAIL_PASSWORD: str = "rgib yzdb cmny skpv"
    MAIL_FROM: str = "liftsafe2025@gmail.com"
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