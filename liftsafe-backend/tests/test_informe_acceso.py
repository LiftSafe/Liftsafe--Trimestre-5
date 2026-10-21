"""El cliente solo descarga el informe cuando está aprobado."""
from datetime import datetime

from app.controllers.informe_acceso_controller import cliente_puede_descargar, informe_para_usuario
from app.models.models import Informe


def _informe(estado):
    return Informe(id_informe=1, id_inspeccion=63, numero_informe="INF-63", estado=estado,
                   ruta_pdf="informes/INF-63.pdf", hash_documento="abc", fecha_creacion=datetime(2026, 10, 20))


def test_solo_aprobado_o_enviado_se_descarga():
    assert cliente_puede_descargar("Aprobado")
    assert cliente_puede_descargar("Enviado")
    assert not cliente_puede_descargar("Generado")
    assert not cliente_puede_descargar("Rechazado")
    assert not cliente_puede_descargar(None)


def test_al_cliente_se_le_oculta_el_pdf_mientras_esta_en_revision():
    datos = informe_para_usuario(_informe("Generado"), "Cliente")
    assert datos["ruta_pdf"] is None
    assert datos["hash_documento"] is None
    assert datos["pendiente_aprobacion"] is True
    assert datos["estado"] == "Generado"


def test_el_cliente_descarga_cuando_esta_aprobado():
    datos = informe_para_usuario(_informe("Aprobado"), "Cliente")
    assert datos["ruta_pdf"] == "informes/INF-63.pdf"
    assert datos["pendiente_aprobacion"] is False


def test_el_coordinador_siempre_ve_el_pdf():
    datos = informe_para_usuario(_informe("Generado"), "Coordinador")
    assert datos["ruta_pdf"] == "informes/INF-63.pdf"
    assert datos["pendiente_aprobacion"] is False
