from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# ============================================
# CONFIGURACIÓN DE BASE DE DATOS
# ============================================
# Usar la URL de la base de datos desde settings
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# ============================================
# DEPENDENCIA PARA OBTENER SESIÓN DE BD
# ============================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()