"""Pruebas del PDF del informe de inspección (app/controllers/informe_controller.py)."""
import base64
import io
from datetime import datetime
from types import SimpleNamespace as N

import pytest
from PIL import Image as PILImage

from app.controllers.informe_controller import _resultado, _txt, construir_pdf


def _firma_png():
    buffer = io.BytesIO()
    PILImage.new("RGBA", (200, 80), (0, 0, 0, 255)).save(buffer, "PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode()


def _inspeccion(firmas=True, observaciones=None):
    cliente = N(nombre_completo="Cliente Prueba")
    ascensor = N(codigo_interno="ASC-001", marca="Otis", modelo="Gen2", numero_serie="S-1",
                 tipo_ascensor="Pasajeros", capacidad_kg=630, capacidad_personas=8, numero_pisos=5,
                 velocidad_ms=1.0, direccion_completa="Calle 1", ciudad="Bogotá",
                 ubicacion_exacta="Torre A", cliente=cliente)
    return N(id_inspeccion=1, ascensor=ascensor, inspector_rel=N(nombre_completo="Inspector Prueba"),
             fecha_inicio=datetime(2026, 10, 1, 8, 0), fecha_fin=datetime(2026, 10, 1, 9, 0),
             estado="Finalizada", observaciones_generales=observaciones,
             firma_inspector=_firma_png() if firmas else None, fecha_firma_inspector=datetime(2026, 10, 1, 9, 5),
             firma_cliente=_firma_png() if firmas else None, fecha_firma_cliente=datetime(2026, 10, 1, 9, 10))


def _detalle(codigo, resultado, categoria="Cabina", observacion=None, accion=None):
    item = N(codigo_item=codigo, descripcion=f"Ítem {codigo}", nivel_criticidad="Alta",
             orden_visualizacion=0, categoria=N(nombre_categoria=categoria, orden_visualizacion=0))
    return N(resultado=resultado, observacion=observacion, accion_requerida=accion, item=item)


@pytest.mark.parametrize("entrada, esperado", [
    ("Cumple", "CUMPLE"), ("cumple ", "CUMPLE"), ("No Cumple", "NO CUMPLE"),
    ("no_cumple", "NO CUMPLE"), ("No Aplica", "NO APLICA"), (None, "NO APLICA"),
])
def test_resultado_se_normaliza(entrada, esperado):
    assert _resultado(entrada)[0] == esperado


def test_txt_escapa_html_y_usa_guion_si_esta_vacio():
    assert _txt("a < b & c") == "a &lt; b &amp; c"
    assert _txt(None) == "—"


def test_construye_un_pdf_valido_con_checklist_y_firmas(tmp_path):
    # Arrange
    ruta = tmp_path / "informe.pdf"
    detalles = [_detalle("CAB-01", "Cumple"), _detalle("PU-01", "No Cumple", "Puertas", "Falla", "Corregir"),
                _detalle("SEG-01", "No Aplica", "Seguridad")]
    informe = N(numero_informe="INF-1-20261001", concepto_tecnico=None, conclusion_general="Revisar puertas",
                observaciones=[N(tipo_observacion="Correctiva", nivel_riesgo="Alto", descripcion="Sensor")])

    # Act
    construir_pdf(str(ruta), _inspeccion(observaciones="Todo en orden"), detalles, informe)

    # Assert
    contenido = ruta.read_bytes()
    assert contenido.startswith(b"%PDF")
    assert len(contenido) > 2000


def test_construye_pdf_sin_items_ni_firmas(tmp_path):
    ruta = tmp_path / "vacio.pdf"
    construir_pdf(str(ruta), _inspeccion(firmas=False), [], None)
    assert ruta.read_bytes().startswith(b"%PDF")


def _foto_png(ruta, color=(30, 120, 200)):
    from PIL import Image as PILImage
    PILImage.new("RGB", (80, 60), color).save(ruta)
    return str(ruta)


def test_pone_la_foto_al_lado_de_su_item(tmp_path):
    # Arrange
    ruta = tmp_path / "con_fotos.pdf"
    detalle = _detalle("CAB-01", "No Cumple")
    detalle.id_item = 7
    foto = _foto_png(tmp_path / "cabina.png")

    # Act
    construir_pdf(str(ruta), _inspeccion(), [detalle], None, {7: [foto]})
    sin_fotos = tmp_path / "sin_fotos.pdf"
    construir_pdf(str(sin_fotos), _inspeccion(), [detalle], None)

    # Assert: el PDF con foto trae una imagen más que el que no tiene
    con = ruta.read_bytes().count(b"/Subtype /Image")
    sin = sin_fotos.read_bytes().count(b"/Subtype /Image")
    assert con == sin + 1


def test_miniaturas_del_item_ignoran_archivos_que_no_existen_y_cuentan_las_extra(tmp_path):
    from reportlab.platypus import Paragraph, Table
    from app.controllers.informe_controller import _fotos_item

    fotos = [_foto_png(tmp_path / f"f{i}.png") for i in range(4)]
    assert isinstance(_fotos_item([str(tmp_path / "no_existe.png")]), Paragraph)
    tabla = _fotos_item(fotos + [str(tmp_path / "no_existe.png")], maximo=2)
    assert isinstance(tabla, Table)
    assert len(tabla._cellvalues) == 3  # 2 fotos + "+2 más"


def test_url_foto_arma_el_enlace_publico_con_barras_normales():
    from app.controllers.informe_controller import url_foto
    assert url_foto("uploads/fotos\\20261017_a b.jpg", "http://localhost:8000/") == \
        "http://localhost:8000/uploads/fotos/20261017_a%20b.jpg"


def test_el_pdf_trae_enlace_para_abrir_cada_foto(tmp_path):
    ruta = tmp_path / "enlaces.pdf"
    detalle = _detalle("CAB-01", "Cumple")
    detalle.id_item = 3
    foto = _foto_png(tmp_path / "cab.png")
    construir_pdf(str(ruta), _inspeccion(), [detalle], None, {3: [foto]}, base_url_fotos="http://api.test")
    contenido = ruta.read_bytes()
    assert b"/URI" in contenido
    assert b"http://api.test/" in contenido
