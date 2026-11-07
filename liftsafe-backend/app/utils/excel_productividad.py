"""Excel (.xlsx) del reporte de productividad (RF-024), con logo y formato.

Se arma el archivo a mano (un .xlsx es un ZIP de XML) para no agregar
dependencias al proyecto: solo usa la librería estándar de Python.
"""
import io
import os
import zipfile
from datetime import date, datetime
from xml.sax.saxutils import escape

LOGO = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "logo_excel.png")
COLUMNAS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
ENCABEZADOS = ["Inspector", "Asignadas", "Terminadas", "En curso", "Canceladas", "Aprobadas",
               "Rechazadas", "Cumplimiento", "Aprobación", "Tiempo promedio"]

# Índices de estilo (cellXfs en styles.xml)
TITULO, SUBTITULO, ENCABEZADO = 1, 2, 3
TXT, NUM, PCT, HRS, GUION = 4, 5, 6, 7, 23
TXT_Z, NUM_Z, PCT_Z, HRS_Z, GUION_Z = 8, 9, 10, 11, 24
TOT_TXT, TOT_NUM, TOT_PCT, TOT_HRS, TOT_GUION = 12, 13, 14, 15, 25
KPI_LABEL, KPI_NUM, KPI_PCT, KPI_HRS, KPI_GUION = 16, 17, 18, 19, 26
SECCION, NOTA, LINEA = 20, 21, 22

ESTILOS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="0%"/><numFmt numFmtId="165" formatCode="0.0 &quot;h&quot;"/></numFmts>
<fonts count="9">
<font><sz val="11"/><color rgb="FF1A2332"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="18"/><color rgb="FF0B1929"/><name val="Calibri"/><family val="2"/></font>
<font><sz val="10"/><color rgb="FF6B7A8C"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
<font><sz val="9"/><color rgb="FF6B7A8C"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="20"/><color rgb="FF0066CC"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="12"/><color rgb="FF0B1929"/><name val="Calibri"/><family val="2"/></font>
<font><i/><sz val="9"/><color rgb="FF6B7A8C"/><name val="Calibri"/><family val="2"/></font>
<font><sz val="11"/><color rgb="FF1A2332"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="6">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF0B1929"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF4F7FA"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFEAF2FC"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFDCE6F4"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="5">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFD0D7DE"/></left><right style="thin"><color rgb="FFD0D7DE"/></right><top style="thin"><color rgb="FFD0D7DE"/></top><bottom style="thin"><color rgb="FFD0D7DE"/></bottom><diagonal/></border>
<border><left/><right/><top/><bottom style="medium"><color rgb="FF0066CC"/></bottom><diagonal/></border>
<border><left style="thin"><color rgb="FFD0D7DE"/></left><right style="thin"><color rgb="FFD0D7DE"/></right><top style="medium"><color rgb="FF0B1929"/></top><bottom style="medium"><color rgb="FF0B1929"/></bottom><diagonal/></border>
<border><left style="thin"><color rgb="FFB7CBE6"/></left><right style="thin"><color rgb="FFB7CBE6"/></right><top style="thin"><color rgb="FFB7CBE6"/></top><bottom style="thin"><color rgb="FFB7CBE6"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="27">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="8" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="1" fontId="8" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="164" fontId="8" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="165" fontId="8" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="8" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="1" fontId="8" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="164" fontId="8" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="165" fontId="8" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="6" fillId="5" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="1" fontId="6" fillId="5" borderId="3" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="164" fontId="6" fillId="5" borderId="3" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="165" fontId="6" fillId="5" borderId="3" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="4" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="1" fontId="5" fillId="4" borderId="4" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="164" fontId="5" fillId="4" borderId="4" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="165" fontId="5" fillId="4" borderId="4" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="6" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="2" xfId="0" applyBorder="1"/>
<xf numFmtId="0" fontId="8" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="8" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="6" fillId="5" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="5" fillId="4" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>"""


def _fecha(d: str) -> str:
    try:
        return date.fromisoformat(d).strftime("%d/%m/%Y")
    except (TypeError, ValueError):
        return d or ""


def _celda(ref, valor, estilo):
    if valor is None:
        return f'<c r="{ref}" s="{estilo}"/>'
    if isinstance(valor, (int, float)) and not isinstance(valor, bool):
        return f'<c r="{ref}" s="{estilo}"><v>{valor}</v></c>'
    return f'<c r="{ref}" s="{estilo}" t="inlineStr"><is><t xml:space="preserve">{escape(str(valor))}</t></is></c>'


def _fila(n, celdas, alto=None):
    attr = f' ht="{alto}" customHeight="1"' if alto else ""
    return f'<row r="{n}"{attr}>{"".join(celdas)}</row>'


def _valores(r: dict, cebra: bool, total: bool = False):
    """Celdas B..J de un inspector o del total, con su estilo."""
    if total:
        num, pct, hrs, guion = TOT_NUM, TOT_PCT, TOT_HRS, TOT_GUION
    elif cebra:
        num, pct, hrs, guion = NUM_Z, PCT_Z, HRS_Z, GUION_Z
    else:
        num, pct, hrs, guion = NUM, PCT, HRS, GUION
    tasa_apr = r.get("tasa_aprobacion")
    horas = r.get("horas_promedio")
    return [
        (r.get("asignadas", 0), num), (r.get("terminadas", 0), num), (r.get("en_curso", 0), num),
        (r.get("canceladas", 0), num), (r.get("aprobadas", 0), num), (r.get("rechazadas", 0), num),
        ((r.get("tasa_cumplimiento") or 0) / 100, pct),
        (tasa_apr / 100, pct) if tasa_apr is not None else ("—", guion),
        (horas, hrs) if horas is not None else ("—", guion),
    ]


def generar_excel_productividad(datos: dict, generado_por: str = "", ahora: datetime | None = None) -> bytes:
    """datos: lo que devuelve /reportes/productividad (desde, hasta, total, inspectores)."""
    ahora = ahora or datetime.now()
    total, inspectores = datos["total"], datos["inspectores"]
    periodo = f'{_fecha(datos["desde"])} a {_fecha(datos["hasta"])}'
    filas = []

    # Encabezado con logo (filas 1 a 4)
    filas.append(_fila(1, [], 8))
    filas.append(_fila(2, [_celda("B2", "Reporte de productividad de inspectores", TITULO)], 30))
    sub = f"Periodo: {periodo}   ·   Generado el {ahora.strftime('%d/%m/%Y %H:%M')}" + (f"   ·   Por: {generado_por}" if generado_por else "")
    filas.append(_fila(3, [_celda("B3", sub, SUBTITULO)], 20))
    filas.append(_fila(4, [_celda("B4", "LiftSafe · Inspección técnica de ascensores (NTC 5926-1:2012)", SUBTITULO)], 18))
    filas.append(_fila(5, [_celda(f"{c}5", None, LINEA) for c in COLUMNAS], 10))

    # Indicadores (filas 7 y 8): 5 recuadros de 2 columnas
    kpis = [
        ("Inspecciones asignadas", total["asignadas"], KPI_NUM),
        ("Terminadas", total["terminadas"], KPI_NUM),
        ("Cumplimiento", (total.get("tasa_cumplimiento") or 0) / 100, KPI_PCT),
        ("Tasa de aprobación", total["tasa_aprobacion"] / 100 if total.get("tasa_aprobacion") is not None else "—",
         KPI_PCT if total.get("tasa_aprobacion") is not None else KPI_GUION),
        ("Tiempo promedio por inspección", total["horas_promedio"] if total.get("horas_promedio") is not None else "—",
         KPI_HRS if total.get("horas_promedio") is not None else KPI_GUION),
    ]
    etiquetas, valores, combinadas = [], [], []
    for k, (etiqueta, valor, estilo) in enumerate(kpis):
        c1, c2 = COLUMNAS[2 * k], COLUMNAS[2 * k + 1]
        etiquetas += [_celda(f"{c1}7", etiqueta.upper(), KPI_LABEL), _celda(f"{c2}7", None, KPI_LABEL)]
        valores += [_celda(f"{c1}8", valor, estilo), _celda(f"{c2}8", None, estilo)]
        combinadas += [f"{c1}7:{c2}7", f"{c1}8:{c2}8"]
    filas.append(_fila(7, etiquetas, 22))
    filas.append(_fila(8, valores, 36))

    # Tabla por inspector
    filas.append(_fila(10, [_celda("A10", "Detalle por inspector", SECCION)], 22))
    filas.append(_fila(11, [_celda(f"{c}11", t, ENCABEZADO) for c, t in zip(COLUMNAS, ENCABEZADOS)], 32))
    n = 12
    for i, r in enumerate(inspectores):
        cebra = i % 2 == 1
        celdas = [_celda(f"A{n}", r.get("inspector") or "Sin nombre", TXT_Z if cebra else TXT)]
        celdas += [_celda(f"{c}{n}", v, s) for c, (v, s) in zip(COLUMNAS[1:], _valores(r, cebra))]
        filas.append(_fila(n, celdas, 20))
        n += 1
    if not inspectores:
        filas.append(_fila(n, [_celda(f"A{n}", "No hay inspecciones en este periodo.", TXT)], 20))
        n += 1
    ultima_dato = n - 1
    celdas = [_celda(f"A{n}", "TOTAL", TOT_TXT)] + [_celda(f"{c}{n}", v, s) for c, (v, s) in zip(COLUMNAS[1:], _valores(total, False, True))]
    filas.append(_fila(n, celdas, 24))

    nota = n + 2
    filas.append(_fila(nota, [_celda(f"A{nota}", (
        "Cumplimiento = terminadas ÷ asignadas.   Rechazadas = inspecciones con algún informe rechazado (aunque luego se corrigiera).   Aprobación = aprobadas ÷ (aprobadas + rechazadas).   "
        "Tiempo promedio por inspección terminada. Se cuentan las inspecciones iniciadas dentro del periodo."), NOTA)], 30))
    combinadas += [f"B2:J2", f"B3:J3", f"B4:J4", f"A{nota}:J{nota}"]

    anchos = [34, 12, 12, 11, 12, 12, 12, 15, 13, 16]
    cols = "".join(f'<col min="{i}" max="{i}" width="{w}" customWidth="1"/>' for i, w in enumerate(anchos, 1))
    barra = ""
    if inspectores:
        barra = (f'<conditionalFormatting sqref="H12:H{ultima_dato}"><cfRule type="dataBar" priority="1"><dataBar>'
                 '<cfvo type="num" val="0"/><cfvo type="num" val="1"/><color rgb="FF5B9BD5"/></dataBar></cfRule></conditionalFormatting>')
    hoja = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>'
        f'<dimension ref="A1:J{nota}"/>'
        '<sheetViews><sheetView workbookViewId="0" showGridLines="0" zoomScale="100">'
        '<pane ySplit="11" topLeftCell="A12" activePane="bottomLeft" state="frozen"/>'
        '<selection pane="bottomLeft" activeCell="A12" sqref="A12"/></sheetView></sheetViews>'
        '<sheetFormatPr defaultRowHeight="15"/>'
        f'<cols>{cols}</cols>'
        f'<sheetData>{"".join(filas)}</sheetData>'
        + (f'<autoFilter ref="A11:J{ultima_dato}"/>' if inspectores else "")
        + f'<mergeCells count="{len(combinadas)}">' + "".join(f'<mergeCell ref="{m}"/>' for m in combinadas) + '</mergeCells>'
        + barra
        + '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>'
        '<pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>'
        '<headerFooter><oddFooter>&amp;L&amp;8LiftSafe · Reporte de productividad&amp;R&amp;8Página &amp;P de &amp;N</oddFooter></headerFooter>'
        '<drawing r:id="rId1"/>'
        '</worksheet>'
    )

    # Logo: 76 px de alto en la esquina superior izquierda
    alto_px, ancho_px = 76, round(76 * 171 / 150)
    dibujo = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f'<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>{(243 - ancho_px) // 2 * 9525}</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>38100</xdr:rowOff></xdr:from>'
        f'<xdr:ext cx="{ancho_px * 9525}" cy="{alto_px * 9525}"/>'
        '<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Logo LiftSafe" descr="Logo LiftSafe"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>'
        '<xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>'
        f'<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{ancho_px * 9525}" cy="{alto_px * 9525}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>'
        '</xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>'
    )

    archivos = {
        "[Content_Types].xml": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Default Extension="png" ContentType="image/png"/>'
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>'
            '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
            '</Types>'),
        "_rels/.rels": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
            '</Relationships>'),
        "docProps/core.xml": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
            'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            f'<dc:title>Reporte de productividad LiftSafe ({escape(periodo)})</dc:title><dc:creator>LiftSafe</dc:creator>'
            f'<dcterms:created xsi:type="dcterms:W3CDTF">{ahora.strftime("%Y-%m-%dT%H:%M:%SZ")}</dcterms:created>'
            '</cp:coreProperties>'),
        "xl/workbook.xml": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            '<sheets><sheet name="Productividad" sheetId="1" r:id="rId1"/></sheets>'
            + (f'<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">Productividad!$A$11:$J${ultima_dato}</definedName>'
               f'<definedName name="_xlnm.Print_Titles" localSheetId="0">Productividad!$11:$11</definedName></definedNames>' if inspectores else "")
            + '</workbook>'),
        "xl/_rels/workbook.xml.rels": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            '</Relationships>'),
        "xl/styles.xml": ESTILOS,
        "xl/worksheets/sheet1.xml": hoja,
        "xl/worksheets/_rels/sheet1.xml.rels": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>'
            '</Relationships>'),
        "xl/drawings/drawing1.xml": dibujo,
        "xl/drawings/_rels/drawing1.xml.rels": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>'
            '</Relationships>'),
    }
    salida = io.BytesIO()
    with zipfile.ZipFile(salida, "w", zipfile.ZIP_DEFLATED) as z:
        for nombre, contenido in archivos.items():
            z.writestr(nombre, contenido.encode("utf-8"))
        with open(LOGO, "rb") as f:
            z.writestr("xl/media/image1.png", f.read())
    return salida.getvalue()
