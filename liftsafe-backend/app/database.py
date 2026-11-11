from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# ============================================
# CONFIGURACIÓN DE BASE DE DATOS
# ============================================
# Usar la URL de la base de datos desde settings
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# RNF-007: con el valor por defecto (5 conexiones + 10 extra) las peticiones
# hacían fila con 100 usuarios a la vez y fallaban a los 30 s. FastAPI atiende
# hasta 40 peticiones en paralelo, así que se deja espacio para todas.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=20,
    max_overflow=30,
    pool_timeout=30,
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