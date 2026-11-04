"""Pruebas de _cancelar_programacion (app/routes/programacion.py)."""
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.models.models import Inspeccion, Solicitud
from app.routes.programacion import _cancelar_programacion


class SesionFalsa:
    def __init__(self, inspeccion, solicitud):
        self.filas = {Inspeccion: inspeccion, Solicitud: solicitud}
        self.agregados = []
        self.confirmado = False

    def query(self, modelo):
        fila = self.filas.get(modelo)
        return SimpleNamespace(filter=lambda *a: SimpleNamespace(first=lambda: fila))

    def add(self, obj):
        self.agregados.append(obj)

    def commit(self):
        self.confirmado = True


def _datos(estado_inspeccion="Programada"):
    prog = SimpleNamespace(id_programacion=1, id_solicitud=7, id_inspector=3, estado="Programada", motivo_cancelacion=None)
    insp = SimpleNamespace(estado=estado_inspeccion)
    sol = SimpleNamespace(id_solicitud=7, id_cliente=9, estado="Programada")
    return prog, insp, sol


def test_cancela_y_devuelve_la_solicitud_a_pendiente():
    prog, insp, sol = _datos()
    db = SesionFalsa(insp, sol)
    _cancelar_programacion(db, prog, "  El cliente no estará  ")
    assert prog.estado == "Cancelada" and prog.motivo_cancelacion == "El cliente no estará"
    assert insp.estado == "Cancelada"
    assert sol.estado == "Pendiente"
    assert len(db.agregados) == 2 and db.confirmado


def test_puede_cancelar_tambien_la_solicitud():
    prog, insp, sol = _datos()
    _cancelar_programacion(SesionFalsa(insp, sol), prog, "Duplicada", cancelar_solicitud=True)
    assert sol.estado == "Cancelada"


def test_exige_motivo():
    prog, insp, sol = _datos()
    with pytest.raises(HTTPException) as e:
        _cancelar_programacion(SesionFalsa(insp, sol), prog, "   ")
    assert e.value.status_code == 400
    assert prog.estado == "Programada"


def test_no_cancela_una_inspeccion_que_ya_empezo():
    prog, insp, sol = _datos("En Progreso")
    with pytest.raises(HTTPException):
        _cancelar_programacion(SesionFalsa(insp, sol), prog, "Motivo")
    assert prog.estado == "Programada" and sol.estado == "Programada"
