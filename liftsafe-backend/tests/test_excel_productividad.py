"""RF-024: el Excel del reporte de productividad es un .xlsx válido, con logo y los datos."""
import io
import zipfile
from datetime import datetime

from app.utils.excel_productividad import generar_excel_productividad

DATOS = {
    "desde": "2026-10-01", "hasta": "2026-10-31",
    "total": {"asignadas": 7, "terminadas": 5, "en_curso": 2, "canceladas": 0, "aprobadas": 3, "rechazadas": 1,
              "tasa_cumplimiento": 71, "tasa_aprobacion": 75, "horas_promedio": 2.3},
    "inspectores": [
        {"id_inspector": 4, "inspector": "Andrés & Cía", "asignadas": 5, "terminadas": 4, "en_curso": 1, "canceladas": 0,
         "aprobadas": 3, "rechazadas": 1, "tasa_cumplimiento": 80, "tasa_aprobacion": 75, "horas_promedio": 2.0},
        {"id_inspector": 5, "inspector": "Juan Pérez", "asignadas": 2, "terminadas": 1, "en_curso": 1, "canceladas": 0,
         "aprobadas": 0, "rechazadas": 0, "tasa_cumplimiento": 50, "tasa_aprobacion": None, "horas_promedio": None},
    ],
}


def abrir(datos=DATOS):
    return zipfile.ZipFile(io.BytesIO(generar_excel_productividad(datos, "Laura Gómez", datetime(2026, 11, 3, 20, 52))))


def test_es_un_xlsx_con_logo_y_hoja():
    z = abrir()
    nombres = set(z.namelist())
    assert {"[Content_Types].xml", "xl/workbook.xml", "xl/styles.xml", "xl/worksheets/sheet1.xml", "xl/media/image1.png"} <= nombres
    assert z.read("xl/media/image1.png")[:8] == b"\x89PNG\r\n\x1a\n"


def test_trae_titulo_periodo_y_datos():
    hoja = abrir().read("xl/worksheets/sheet1.xml").decode()
    assert "Reporte de productividad de inspectores" in hoja
    assert "01/10/2026 a 31/10/2026" in hoja and "Laura Gómez" in hoja
    assert "Andrés &amp; Cía" in hoja           # caracteres especiales escapados
    assert "<v>0.8</v>" in hoja                  # 80 % guardado como número con formato de porcentaje
    assert "—" in hoja                           # sin datos de aprobación ni horas
    assert "TOTAL" in hoja and "dataBar" in hoja


def test_sin_inspectores_no_falla():
    vacio = {**DATOS, "inspectores": [], "total": {k: 0 for k in DATOS["total"]} | {"tasa_aprobacion": None, "horas_promedio": None}}
    hoja = abrir(vacio).read("xl/worksheets/sheet1.xml").decode()
    assert "No hay inspecciones en este periodo." in hoja and "autoFilter" not in hoja
