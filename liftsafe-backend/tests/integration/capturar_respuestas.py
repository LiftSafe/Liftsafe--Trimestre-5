"""Semana 6 · ángulo FRONT: captura las respuestas REALES del backend.

Corre el API contra la BD de pruebas (con DATABASE_URL), llama a los endpoints
de /ascensores y guarda status + cuerpo en
LiftSafe_FrontendV2/src/test/respuestas-reales.json. Esas respuestas son la
referencia con la que se comparan los handlers de MSW (ver
src/services/contratoReal.test.js). No deja datos: todo se deshace al final.

Uso (desde liftsafe-backend, con la BD de pruebas arriba):
    DATABASE_URL=... uv run python tests/integration/capturar_respuestas.py
"""
import json
import os
import sys
from pathlib import Path

RAIZ_BACKEND = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ_BACKEND))
os.environ.setdefault("SECRET_KEY", "clave-solo-para-pruebas")
os.environ.setdefault("SECRET_KEY_MYSQL", "aes-solo-para-pruebas")
os.environ.setdefault("MAIL_USERNAME", "pruebas@example.com")
os.environ.setdefault("MAIL_PASSWORD", "no-es-una-clave-real")
os.environ.setdefault("MAIL_FROM", "pruebas@example.com")

URL = os.environ.get("DATABASE_URL")
if not URL or not URL.rsplit("/", 1)[-1].split("?")[0].endswith("_test"):
    sys.exit("Define DATABASE_URL apuntando a una BD que termine en _test")

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.controllers.auth_controller import create_access_token  # noqa: E402
from app.database import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.models import Ascensor, Rol, Usuario  # noqa: E402

DESTINO = RAIZ_BACKEND.parent / "LiftSafe_FrontendV2" / "src" / "test" / "respuestas-reales.json"


def cabecera(rol, user_id=1, correo="admin@example.com"):
    return {"Authorization": "Bearer " + create_access_token({"sub": correo, "rol": rol, "user_id": user_id})}


def main():
    motor = create_engine(URL)
    with motor.connect() as conexion:
        transaccion = conexion.begin()
        db = Session(bind=conexion, join_transaction_mode="create_savepoint")
        rol = db.query(Rol).filter(Rol.nombre_rol == "Cliente").one()
        cliente = Usuario(id_rol=rol.id_rol, nombre_completo="Torre Norte", correo="torre@example.com",
                          estado="Activo", telefono="3001234567", tipo_documento="NIT", documento_identidad="900123456",
                          razon_social="Torre Norte SAS", nit="900123456", direccion="Calle 100 # 15-20")
        db.add(cliente)
        db.flush()
        datos = dict(id_cliente=cliente.id_usuario, codigo_interno="ASC-100", marca="Schindler", modelo="3300",
                     numero_serie="SN-100", tipo_ascensor="Pasajeros", capacidad_kg=630, numero_pisos=8,
                     ubicacion_exacta="Torre A", direccion_completa="Calle 100 # 15-20", ciudad="Bogotá", estado="Operativo")
        db.add(Ascensor(**datos))
        db.add(Ascensor(**{**datos, "codigo_interno": "ASC-101", "numero_serie": "SN-101"}))
        db.flush()

        app.dependency_overrides[get_db] = lambda: db
        http = TestClient(app, raise_server_exceptions=False)
        admin = cabecera("Administrador")
        casos = {
            "listado_ok": http.get("/ascensores/listado", headers=admin),
            "edificios_ok": http.get("/ascensores/edificios", headers=admin),
            "sin_token": http.get("/ascensores/listado"),
            "crear_sin_permiso": http.post("/ascensores/", json=datos, headers=cabecera("Inspector")),
            "crear_cliente_inexistente": http.post("/ascensores/", json={**datos, "id_cliente": 2_000_000_000, "codigo_interno": "ASC-X"}, headers=admin),
            "crear_codigo_repetido": http.post("/ascensores/", json=datos, headers=admin),
            "crear_marca_81": http.post("/ascensores/", json={**datos, "codigo_interno": "ASC-Y", "marca": "x" * 81}, headers=admin),
            "editar_inexistente": http.put("/ascensores/2147483648", json={"estado": "x"}, headers=admin),
        }
        app.dependency_overrides.clear()
        salida = {}
        for nombre, r in casos.items():
            try:
                cuerpo = r.json()
            except ValueError:
                cuerpo = r.text
            salida[nombre] = {"status": r.status_code, "body": cuerpo}
        db.close()
        transaccion.rollback()
    DESTINO.write_text(json.dumps(salida, indent=2, ensure_ascii=False, default=str) + "\n", encoding="utf-8")
    print(f"Escrito {DESTINO}")
    for nombre, r in salida.items():
        print(f"  {nombre:28} {r['status']}")


if __name__ == "__main__":
    main()
