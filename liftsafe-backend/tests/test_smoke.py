"""Humo: la aplicación importa con todos sus routers y responde sin BD."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_raiz_responde_ok():
    respuesta = client.get("/")
    assert respuesta.status_code == 200
    assert respuesta.json() == {"message": "LiftSafe API funcionando"}


def test_openapi_expone_las_rutas_principales():
    rutas = client.get("/openapi.json").json()["paths"]
    assert "/auth/login" in rutas
    assert "/auth/register" in rutas


def test_ruta_protegida_sin_token_es_rechazada():
    # HTTPBearer responde 401/403 antes de tocar la base de datos
    respuesta = client.get("/auth/me")
    assert respuesta.status_code in (401, 403)
