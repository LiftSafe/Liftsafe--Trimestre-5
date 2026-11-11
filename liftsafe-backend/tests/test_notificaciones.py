"""Dobles de prueba (semana 5): el correo como dependencia externa.

Se reemplaza send_reset_email DONDE SE USA (app.routes.auth) y _enviar, la
interfaz propia sobre FastMail. Nunca se toca la librería ni se envía un correo real.
"""
import asyncio

import pytest
from fastapi.testclient import TestClient

from app.controllers import email_controller as ec
from app.database import get_db
from app.main import app

CORREO = "ana@example.com"


@pytest.fixture
def db(mocker):
    """Fake de la sesión de BD: no se toca MySQL."""
    sesion = mocker.MagicMock()
    app.dependency_overrides[get_db] = lambda: sesion
    yield sesion
    app.dependency_overrides.clear()


@pytest.fixture
def client(db):
    return TestClient(app)


def _usuario_existe(db, existe):
    db.query.return_value.filter.return_value.first.return_value = object() if existe else None


# ── Endpoint /auth/recuperar-clave ────────────────────────────────────────────

def test_recuperar_clave_envia_el_codigo_una_sola_vez(client, db, mocker):
    # Doble: SPY (send_reset_email) + STUB (generate_reset_code devuelve "123456").
    # Verifica COMPORTAMIENTO: enviar el correo ES el resultado que importa.
    _usuario_existe(db, True)
    mocker.patch("app.routes.auth.generate_reset_code", return_value="123456")
    enviar = mocker.patch("app.routes.auth.send_reset_email")

    respuesta = client.post("/auth/recuperar-clave", json={"correo": CORREO})

    assert respuesta.status_code == 200
    enviar.assert_called_once_with(CORREO, "123456")


def test_recuperar_clave_no_envia_correo_si_el_usuario_no_existe(client, db, mocker):
    # Doble: SPY con assert_not_called + el fake de BD como STUB (no hay usuario).
    # Comportamiento (no se llamó) y ESTADO (mensaje genérico, no revela si existe).
    _usuario_existe(db, False)
    enviar = mocker.patch("app.routes.auth.send_reset_email")

    respuesta = client.post("/auth/recuperar-clave", json={"correo": CORREO})

    assert respuesta.status_code == 200
    assert "Si el correo existe" in respuesta.json()["message"]
    enviar.assert_not_called()


def test_recuperar_clave_responde_503_si_el_servidor_de_correo_falla(client, db, mocker):
    # Doble: STUB que lanza error (smtp caído). Verifica ESTADO: la app resiste
    # con un 503 controlado en vez de un 500 sin manejar.
    _usuario_existe(db, True)
    mocker.patch("app.routes.auth.generate_reset_code", return_value="123456")
    mocker.patch("app.routes.auth.send_reset_email", side_effect=Exception("smtp down"))

    respuesta = client.post("/auth/recuperar-clave", json={"correo": CORREO})

    assert respuesta.status_code == 503
    assert "Error al enviar el correo" in respuesta.json()["detail"]


# ── email_controller: la interfaz propia _enviar ──────────────────────────────

def test_send_encuesta_email_devuelve_false_si_el_envio_falla(mocker):
    # STUB que falla. ESTADO: no relanza, para no tumbar el finalizar la inspección.
    mocker.patch.object(ec, "_enviar", side_effect=RuntimeError("smtp down"))

    resultado = asyncio.run(ec.send_encuesta_email("a@x.com", "Ana", "ASC-1"))

    assert resultado is False


def test_send_encuesta_email_envia_un_solo_mensaje_al_cliente(mocker):
    # SPY sobre _enviar. COMPORTAMIENTO: un mensaje, al destinatario correcto.
    enviar = mocker.patch.object(ec, "_enviar")

    resultado = asyncio.run(ec.send_encuesta_email("a@x.com", "Ana", "ASC-1"))

    assert resultado is True
    enviar.assert_called_once()
    mensaje = enviar.call_args.args[0]
    assert mensaje.recipients[0].email == "a@x.com"


def test_send_reset_email_relanza_el_error_si_el_envio_falla(mocker):
    # STUB que falla. ESTADO: aquí SÍ se relanza, porque la ruta lo convierte en 503.
    mocker.patch.object(ec, "_enviar", side_effect=RuntimeError("smtp down"))

    with pytest.raises(Exception, match="Error al enviar correo: smtp down"):
        asyncio.run(ec.send_reset_email("a@x.com", "123456"))