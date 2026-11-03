"""RNF-012: el log guarda solo lo que cambió, con su valor anterior."""
import json
from datetime import datetime
from unittest.mock import MagicMock

from app.utils.auditoria import auditar_cambio, cambios, registrar_auditoria


def test_cambios_devuelve_solo_los_campos_modificados():
    antes = {"resultado": "Cumple", "observacion": "ok", "id_item": 3}
    despues = {"resultado": "No Cumple", "observacion": "ok", "id_item": 3}
    assert cambios(antes, despues) == ({"resultado": "Cumple"}, {"resultado": "No Cumple"})


def test_auditar_cambio_guarda_usuario_valor_anterior_y_nuevo():
    db = MagicMock()
    assert auditar_cambio(db, 7, "detalle_checklist", 15, {"resultado": "Cumple"}, {"resultado": "No Cumple"}) is True
    registro = db.add.call_args.args[0]
    assert (registro.id_usuario, registro.tabla_afectada, registro.operacion, registro.id_registro) == (7, "detalle_checklist", "UPDATE", 15)
    assert json.loads(registro.datos_anteriores) == {"resultado": "Cumple"}
    assert json.loads(registro.datos_nuevos) == {"resultado": "No Cumple"}
    assert isinstance(registro.fecha_evento, datetime)
    db.commit.assert_not_called()   # va en la misma transacción que el cambio


def test_si_no_cambia_nada_no_registra():
    db = MagicMock()
    assert auditar_cambio(db, 7, "inspeccion", 1, {"estado": "Programada"}, {"estado": "Programada"}) is False
    db.add.assert_not_called()


def test_registrar_convierte_fechas_y_respeta_tildes():
    db = MagicMock()
    registrar_auditoria(db, 1, "inspeccion", "UPDATE", 2, {"fecha_fin": None}, {"fecha_fin": datetime(2026, 11, 3, 10, 0), "estado": "Pendiente revisión"})
    registro = db.add.call_args.args[0]
    assert registro.datos_anteriores is None or json.loads(registro.datos_anteriores) == {"fecha_fin": None}
    assert "Pendiente revisión" in registro.datos_nuevos
    assert "2026-11-03T10:00:00" in registro.datos_nuevos
    db.commit.assert_called_once()
