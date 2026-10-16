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
