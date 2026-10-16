"""Pruebas unitarias de registrar_auditoria (app/utils/auditoria.py) con una BD falsa."""
import json
from datetime import datetime

from app.utils.auditoria import registrar_auditoria


class FakeDB:
    def __init__(self):
        self.agregados = []
        self.commits = 0

    def add(self, obj):
        self.agregados.append(obj)

    def commit(self):
        self.commits += 1


def test_guarda_los_datos_como_json_y_hace_commit():
    # Arrange
    db = FakeDB()
    # Act
    registro = registrar_auditoria(
        db, 3, "inspeccion", "UPDATE", 10,
        datos_anteriores={"estado": "Borrador"}, datos_nuevos={"estado": "Finalizada"},
    )
    # Assert
    assert json.loads(registro.datos_anteriores) == {"estado": "Borrador"}
    assert json.loads(registro.datos_nuevos) == {"estado": "Finalizada"}
    assert db.agregados == [registro] and db.commits == 1


def test_sin_datos_guarda_none():
    registro = registrar_auditoria(FakeDB(), 1, "usuario", "CREATE", 2)
    assert registro.datos_anteriores is None and registro.datos_nuevos is None


def test_un_diccionario_vacio_se_guarda_como_none():
    # Borde: {} es "falsy", así que no se serializa
    registro = registrar_auditoria(FakeDB(), 1, "usuario", "UPDATE", 2, datos_nuevos={})
    assert registro.datos_nuevos is None


def test_registra_tabla_operacion_ip_y_fecha():
    registro = registrar_auditoria(FakeDB(), 9, "ascensor", "DELETE", 4)
    assert (registro.tabla_afectada, registro.operacion, registro.id_registro) == ("ascensor", "DELETE", 4)
    assert registro.ip_origen == "127.0.0.1"
    assert isinstance(registro.fecha_evento, datetime)
