"""Pruebas de regresión de defectos corregidos en T6 (ciclo detectar → corregir → verificar).

Cada prueba reproduce el defecto tal como se detectó; antes del arreglo fallaba y
ahora pasa. El identificador DEF-xx enlaza con docs/t6/06-registro-defectos.md.
"""
import asyncio
import json
from datetime import date
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from starlette.requests import Request

from app import main
from app.routes import checklist_admin, inspecciones, reportes
from app.schemas.schemas import FirmaRequest


def _request(origin=None):
    headers = [(b"origin", origin.encode())] if origin else []
    return Request({"type": "http", "method": "POST", "path": "/auth/login", "headers": headers, "query_string": b""})


# ---------------------------------------------------------------------------
# DEF-01 — Un error 500 llegaba sin cabeceras CORS: el navegador mostraba
# "Failed to fetch" en vez de "Error interno del servidor".
# ---------------------------------------------------------------------------
def test_def01_error_500_incluye_cors_para_el_frontend():
    respuesta = asyncio.run(main.handle_unexpected_error(_request("http://localhost:5173"), RuntimeError("BD caída")))
    assert respuesta.status_code == 500
    assert respuesta.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert json.loads(respuesta.body) == {"detail": "Error interno del servidor"}


def test_def01_error_500_no_abre_cors_a_otros_dominios():
    respuesta = asyncio.run(main.handle_unexpected_error(_request("https://sitio-ajeno.com"), RuntimeError("x")))
    assert "access-control-allow-origin" not in respuesta.headers


# ---------------------------------------------------------------------------
# DEF-02 — Se podía guardar un grupo de la lista de chequeo con un nombre
# como "o" (se perdió el nombre "6.2 Cables de tracción y sus amarres").
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("nombre", ["o", "ab", "   o  "])
def test_def02_nombre_de_grupo_muy_corto_se_rechaza(nombre):
    with pytest.raises(ValidationError):
        checklist_admin.CategoriaUpdate(nombre_categoria=nombre)
    with pytest.raises(ValidationError):
        checklist_admin.CategoriaIn(nombre_categoria=nombre)


def test_def02_nombre_valido_se_acepta():
    assert checklist_admin.CategoriaUpdate(nombre_categoria=" 6.2 Cables ").nombre_categoria == "6.2 Cables"


# ---------------------------------------------------------------------------
# DEF-03 — El reporte de productividad dejaba fuera una inspección terminada
# hoy si estaba programada para mañana (filtraba solo por fecha_inicio).
# ---------------------------------------------------------------------------
class _ConsultaEspia:
    def __init__(self):
        self.filtros = []

    def outerjoin(self, *_a, **_k):
        return self

    def filter(self, *condiciones):
        self.filtros.extend(condiciones)
        return self

    def all(self):
        return []


def test_def03_productividad_filtra_por_fecha_de_terminacion(monkeypatch):
    consulta = _ConsultaEspia()
    db = SimpleNamespace(query=lambda *_a: consulta)
    monkeypatch.setattr(reportes, "rechazos_por_inspeccion", lambda _db: {})
    datos = reportes._datos_productividad(date(2026, 11, 1), date(2026, 11, 13), {"rol": "Administrador"}, db)
    sql = " ".join(str(c) for c in consulta.filtros).lower()
    assert "coalesce(inspeccion.fecha_fin, inspeccion.fecha_inicio)" in sql
    assert datos["desde"] == "2026-11-01" and datos["hasta"] == "2026-11-13"


# ---------------------------------------------------------------------------
# MEJ-01 — El inspector no podía recoger la firma del cliente en su equipo:
# el cliente tenía que entrar después con su cuenta (mejora pedida en la demo).
# ---------------------------------------------------------------------------
class _SesionSimple:
    """Sesión mínima: cada .first() devuelve el siguiente objeto preparado."""

    def __init__(self, *objetos):
        self._objetos = list(objetos)
        self.commits = 0

    def query(self, *_a):
        return self

    def filter(self, *_a):
        return self

    def first(self):
        return self._objetos.pop(0) if self._objetos else None

    def commit(self):
        self.commits += 1

    def refresh(self, _obj):
        pass


def _firma_cliente(monkeypatch, rol, user_id, datos, firma_inspector="data:image/png;base64,AAA"):
    insp = SimpleNamespace(id_inspeccion=73, id_inspector=7, id_ascensor=5, firma_inspector=firma_inspector,
                           firma_cliente=None, fecha_firma_cliente=None, estado="Pendiente firma cliente")
    asc = SimpleNamespace(id_ascensor=5, id_cliente=11)
    db = _SesionSimple(insp, asc)
    auditoria = []
    monkeypatch.setattr(inspecciones, "get_current_user_role", lambda _c: (rol, "x@y.com", user_id))
    monkeypatch.setattr(inspecciones, "registrar_auditoria", lambda *a, **k: auditoria.append(a))
    monkeypatch.setattr(inspecciones, "notificar_pendiente_revision", lambda *a: None)
    resultado = asyncio.run(inspecciones.firmar_cliente(73, FirmaRequest(**datos), credentials=None, db=db))
    return resultado, insp, auditoria


def test_mej01_inspector_asignado_recoge_firma_presencial(monkeypatch):
    r, insp, auditoria = _firma_cliente(monkeypatch, "Inspector", 7,
                                        {"firma": "data:x", "nombre_firmante": "Ana Ruiz", "documento_firmante": "52123456"})
    assert insp.firma_cliente == "data:x" and insp.estado == "Pendiente revisión"
    assert auditoria[0][-1]["presencial"] is True and auditoria[0][-1]["nombre_firmante"] == "Ana Ruiz"
    assert "revisión" in r["message"]


def test_mej01_firma_presencial_exige_nombre_y_documento(monkeypatch):
    with pytest.raises(HTTPException) as e:
        _firma_cliente(monkeypatch, "Inspector", 7, {"firma": "data:x"})
    assert e.value.status_code == 400


def test_mej01_firma_presencial_exige_que_el_inspector_firme_primero(monkeypatch):
    with pytest.raises(HTTPException) as e:
        _firma_cliente(monkeypatch, "Inspector", 7,
                       {"firma": "data:x", "nombre_firmante": "Ana", "documento_firmante": "1"}, firma_inspector=None)
    assert e.value.status_code == 400


def test_mej01_otro_inspector_no_puede_firmar_por_el_cliente(monkeypatch):
    with pytest.raises(HTTPException) as e:
        _firma_cliente(monkeypatch, "Inspector", 99, {"firma": "data:x", "nombre_firmante": "Ana", "documento_firmante": "1"})
    assert e.value.status_code == 403
