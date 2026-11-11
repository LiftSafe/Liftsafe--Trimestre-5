"""La encuesta se crea una sola vez cuando termina el proceso."""
import asyncio
from types import SimpleNamespace as N
from unittest.mock import AsyncMock, MagicMock, patch

from app.routes import informes


def _db(ya_existe):
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = ya_existe
    return db


INSP, ASC = N(id_inspeccion=63), N(codigo_interno="ASC-002")
CLI = N(id_usuario=5, correo="c@x.com", nombre_completo="Camila")


def test_crea_encuesta_notifica_y_manda_correo():
    db = _db(None)
    with patch.object(informes, "send_encuesta_email", AsyncMock()) as correo:
        creada = asyncio.run(informes.crear_encuesta_si_falta(db, INSP, ASC, CLI, "Cuéntanos"))
    assert creada is True
    agregados = [c.args[0] for c in db.add.call_args_list]
    assert any(type(a).__name__ == "Encuesta" and a.id_inspeccion == 63 for a in agregados)
    assert any(type(a).__name__ == "Notificacion" and a.enlace == "/dashboard/encuestas" for a in agregados)
    correo.assert_awaited_once_with("c@x.com", "Camila", "ASC-002")


def test_no_duplica_la_encuesta():
    db = _db(N(id_encuesta=1))
    with patch.object(informes, "send_encuesta_email", AsyncMock()) as correo:
        assert asyncio.run(informes.crear_encuesta_si_falta(db, INSP, ASC, CLI, "x")) is False
    db.add.assert_not_called()
    correo.assert_not_awaited()


def test_si_falla_el_correo_igual_queda_la_encuesta():
    db = _db(None)
    with patch.object(informes, "send_encuesta_email", AsyncMock(side_effect=RuntimeError("smtp"))):
        assert asyncio.run(informes.crear_encuesta_si_falta(db, INSP, ASC, CLI, "x")) is True
    db.commit.assert_called()


def test_sin_cliente_no_hace_nada():
    db = _db(None)
    assert asyncio.run(informes.crear_encuesta_si_falta(db, INSP, ASC, None, "x")) is False
    db.add.assert_not_called()


def test_finalizar_solicitud_la_marca_una_sola_vez():
    solicitud = N(estado="Programada")
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = solicitud
    assert informes.finalizar_solicitud(db, N(id_solicitud=4)) is True
    assert solicitud.estado == "Finalizada"
    assert informes.finalizar_solicitud(db, N(id_solicitud=4)) is False
    assert informes.finalizar_solicitud(db, None) is False
    assert informes.finalizar_solicitud(db, N(id_solicitud=None)) is False


def test_puede_crear_la_encuesta_sin_mandar_el_correo():
    db = _db(None)
    with patch.object(informes, "send_encuesta_email", AsyncMock()) as correo:
        assert asyncio.run(informes.crear_encuesta_si_falta(db, INSP, ASC, CLI, "x", enviar_correo=False)) is True
    correo.assert_not_awaited()
    db.commit.assert_called()


def test_los_correos_al_aprobar_salen_con_su_propia_sesion():
    informe = N(id_informe=8)
    db = _db(informe)
    with patch.object(informes, "SessionLocal", return_value=db), \
         patch.object(informes, "enviar_informe_por_correo", AsyncMock()) as informe_correo, \
         patch.object(informes, "send_encuesta_email", AsyncMock()) as encuesta_correo:
        asyncio.run(informes.correos_al_aprobar(8, ("c@x.com", "Camila", "ASC-002")))
    informe_correo.assert_awaited_once_with(db, informe)
    encuesta_correo.assert_awaited_once_with("c@x.com", "Camila", "ASC-002")
    db.close.assert_called_once()


def test_si_falla_el_smtp_en_segundo_plano_no_revienta():
    db = _db(N(id_informe=8))
    with patch.object(informes, "SessionLocal", return_value=db), \
         patch.object(informes, "enviar_informe_por_correo", AsyncMock(side_effect=OSError("smtp caído"))):
        asyncio.run(informes.correos_al_aprobar(8, None))
    db.close.assert_called_once()
