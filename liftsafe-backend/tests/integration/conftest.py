"""Semana 6 · Integración con la BD real (MySQL de pruebas).

- La conexión llega SOLO por DATABASE_URL, p. ej.
  mysql+pymysql://root:<clave>@127.0.0.1:3307/liftsafe_test
  Sin DATABASE_URL todos los tests de esta carpeta se SALTAN (el CI de hoy
  sigue en verde: la BD llega al CI en la semana 8).
- Seguridad: si el nombre de la BD no termina en `_test`, pytest se detiene.
- Limpieza por ROLLBACK: cada test corre dentro de una transacción que nunca
  se confirma; los commit() del código se vuelven savepoints
  (join_transaction_mode="create_savepoint"). Cada test crea sus datos.
"""
import itertools
import os
from datetime import timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

DATABASE_URL = os.environ.get("DATABASE_URL")
CARPETA = os.path.dirname(__file__)


def pytest_collection_modifyitems(config, items):
    if DATABASE_URL:
        return
    saltar = pytest.mark.skip(reason="integración: falta DATABASE_URL (ver README)")
    for item in items:
        if str(item.path).startswith(CARPETA):
            item.add_marker(saltar)


@pytest.fixture(scope="session")
def engine():
    nombre_bd = make_url(DATABASE_URL).database or ""
    if not nombre_bd.endswith("_test"):
        pytest.exit(f"DATABASE_URL apunta a '{nombre_bd}': solo se permiten BD que terminen en _test", returncode=2)
    motor = create_engine(DATABASE_URL, pool_pre_ping=True)
    yield motor
    motor.dispose()


@pytest.fixture
def db_session(engine):
    """Sesión que se deshace al final de cada test (ROLLBACK)."""
    with engine.connect() as conexion:
        transaccion = conexion.begin()
        sesion = Session(bind=conexion, join_transaction_mode="create_savepoint")
        yield sesion
        sesion.close()
        transaccion.rollback()


# ---------- datos que cada test se prepara solo ----------
_contador = itertools.count(1)


def _unico():
    return next(_contador)


@pytest.fixture
def crear_cliente(db_session):
    from app.models.models import Rol, Usuario

    def _crear(**extra):
        rol = db_session.query(Rol).filter(Rol.nombre_rol == "Cliente").one()
        n = _unico()
        datos = dict(
            id_rol=rol.id_rol, nombre_completo=f"Cliente {n}",
            correo=f"cliente{n}@example.com", estado="Activo",
        )
        datos.update(extra)
        cliente = Usuario(**datos)
        db_session.add(cliente)
        db_session.flush()
        return cliente

    return _crear


@pytest.fixture
def datos_ascensor():
    """Diccionario válido para crear un ascensor (lo que manda el formulario)."""
    def _datos(id_cliente, **extra):
        n = _unico()
        datos = dict(
            id_cliente=id_cliente, codigo_interno=f"ASC-T{n:04d}", marca="Schindler",
            modelo="3300", numero_serie=f"SN-{n}", tipo_ascensor="Pasajeros",
            capacidad_kg=630, numero_pisos=8, ubicacion_exacta="Torre A",
            direccion_completa="Calle 1 # 2-3", ciudad="Bogotá", estado="Operativo",
        )
        datos.update(extra)
        return datos

    return _datos


@pytest.fixture
def crear_ascensor(db_session, datos_ascensor):
    from app.models.models import Ascensor

    def _crear(cliente, **extra):
        ascensor = Ascensor(**datos_ascensor(cliente.id_usuario, **extra))
        db_session.add(ascensor)
        db_session.flush()
        return ascensor

    return _crear


@pytest.fixture
def token():
    from app.controllers.auth_controller import create_access_token

    def _token(rol, user_id=1, correo="admin@example.com"):
        return {"Authorization": "Bearer " + create_access_token({"sub": correo, "rol": rol, "user_id": user_id})}

    return _token


@pytest.fixture
def db_client(db_session):
    """Cliente HTTP: el API real, pero sobre la sesión que se deshace.

    raise_server_exceptions=False → un error de la BD sin manejar se ve como
    lo vería un navegador: respuesta 500 (así los hallazgos se leen con status).
    """
    from fastapi.testclient import TestClient

    from app.database import get_db
    from app.main import app

    app.dependency_overrides[get_db] = lambda: db_session
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()
