from sqlalchemy import create_engine
<<<<<<< HEAD
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

=======
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

<<<<<<< HEAD
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"charset": "utf8mb4"},
)
=======
# Conexión a la base de datos (toma la URL de tu config.py)
engine = create_engine(settings.DATABASE_URL)

# Sesión de base de datos
>>>>>>> feature/luz
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# Función para obtener la sesión de BD en las rutas
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()