"""Generación del PDF del informe de inspección (diseño con logo LiftSafe).

generar_pdf_informe() carga los datos de la BD y construir_pdf() dibuja el
documento: encabezado con logo en cada página, datos del ascensor, resumen
de resultados, checklist agrupado por categoría, observaciones y firmas.
"""
import base64
import hashlib
import io
import os
from datetime import datetime
from urllib.parse import quote

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (Image, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table,
                                TableStyle)
from sqlalchemy.orm import Session

# ── Identidad visual ─────────────────────────────────────────────────────────
AZUL_OSCURO = colors.HexColor("#0B1F3A")
AZUL = colors.HexColor("#1565C0")
AZUL_CLARO = colors.HexColor("#E8F0FB")
GRIS_BORDE = colors.HexColor("#C9D3E0")
GRIS_TEXTO = colors.HexColor("#5B6B7F")
VERDE, VERDE_FONDO = colors.HexColor("#2E7D32"), colors.HexColor("#E6F4EA")
ROJO, ROJO_FONDO = colors.HexColor("#C62828"), colors.HexColor("#FDECEA")
GRIS, GRIS_FONDO = colors.HexColor("#616161"), colors.HexColor("#EEEEEE")

LOGO_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "logo_liftsafe.png")
MARGEN = 15 * mm
ALTO_ENCABEZADO = 30 * mm

_base = getSampleStyleSheet()
EST = {
    "seccion": ParagraphStyle("seccion", parent=_base["Heading2"], fontName="Helvetica-Bold", fontSize=11,
                              textColor=colors.white, leading=14, spaceBefore=0, spaceAfter=0),
    "etiqueta": ParagraphStyle("etiqueta", fontName="Helvetica-Bold", fontSize=7.5, textColor=GRIS_TEXTO, leading=9),
    "valor": ParagraphStyle("valor", fontName="Helvetica", fontSize=9, textColor=AZUL_OSCURO, leading=11),
    "celda": ParagraphStyle("celda", fontName="Helvetica", fontSize=8, leading=10, textColor=colors.black),
    "celda_b": ParagraphStyle("celda_b", fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=AZUL_OSCURO),
    "th": ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=colors.white),
    "texto": ParagraphStyle("texto", fontName="Helvetica", fontSize=9, leading=12),
    "nota": ParagraphStyle("nota", fontName="Helvetica-Oblique", fontSize=7, leading=9, textColor=GRIS_TEXTO),
    "enlace": ParagraphStyle("enlace", fontName="Helvetica", fontSize=6.5, leading=8, alignment=TA_CENTER),
    "centro": ParagraphStyle("centro", fontName="Helvetica", fontSize=8, leading=10, alignment=TA_CENTER),
    "numero": ParagraphStyle("numero", fontName="Helvetica-Bold", fontSize=16, leading=20, alignment=TA_CENTER),
    "chip": ParagraphStyle("chip", fontName="Helvetica-Bold", fontSize=7.5, leading=9, alignment=TA_CENTER),
}


# ── Utilidades ───────────────────────────────────────────────────────────────
def _txt(valor, defecto="—"):
    if valor is None or valor == "":
        return defecto
    return str(valor).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _fecha(valor, con_hora=False):
    if not valor:
        return "—"
    return valor.strftime("%d/%m/%Y %H:%M" if con_hora else "%d/%m/%Y")


def _resultado(valor):
    """Normaliza el resultado y devuelve (texto, color, fondo)."""
    v = (valor or "").strip().lower()
    if v == "cumple":
        return "CUMPLE", VERDE, VERDE_FONDO
    if v in ("no cumple", "no_cumple", "nocumple"):
        return "NO CUMPLE", ROJO, ROJO_FONDO
    return "NO APLICA", GRIS, GRIS_FONDO


def _imagen_firma(data_url, ancho=55 * mm, alto=20 * mm):
    """Convierte la firma (data URL base64 PNG) en una imagen para el PDF."""
    if not data_url:
        return None
    try:
        datos = data_url.split(",", 1)[1] if "," in data_url else data_url
        lector = ImageReader(io.BytesIO(base64.b64decode(datos)))
        w, h = lector.getSize()
        escala = min(ancho / w, alto / h)
        return Image(io.BytesIO(base64.b64decode(datos)), width=w * escala, height=h * escala)
    except Exception:
        return None


def _titulo_seccion(texto, ancho):
    t = Table([[Paragraph(texto, EST["seccion"])]], colWidths=[ancho])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), AZUL_OSCURO),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -1), 2, AZUL),
    ]))
    return t


def _grilla_datos(pares, ancho, columnas=4):
    """Tabla de 'etiqueta / valor' en varias columnas, como un formulario."""
    celdas = [[Paragraph(_txt(e).upper(), EST["etiqueta"]), Paragraph(_txt(v), EST["valor"])] for e, v in pares]
    filas = []
    for i in range(0, len(celdas), columnas):
        fila = celdas[i:i + columnas]
        fila += [[Paragraph("", EST["etiqueta"]), Paragraph("", EST["valor"])]] * (columnas - len(fila))
        filas.append(fila)
    t = Table(filas, colWidths=[ancho / columnas] * columnas)
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, GRIS_BORDE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


# ── Encabezado y pie de cada página ──────────────────────────────────────────
def _dibujar_marco(numero_informe, fecha_emision):
    def dibujar(c, doc):
        ancho, alto = A4
        c.saveState()
        top = alto - MARGEN
        # Caja del encabezado
        c.setStrokeColor(AZUL_OSCURO)
        c.setLineWidth(1)
        c.rect(MARGEN, top - ALTO_ENCABEZADO, ancho - 2 * MARGEN, ALTO_ENCABEZADO)
        col1, col3 = MARGEN + 38 * mm, ancho - MARGEN - 48 * mm
        c.line(col1, top - ALTO_ENCABEZADO, col1, top)
        c.line(col3, top - ALTO_ENCABEZADO, col3, top)
        # Logo
        if os.path.exists(LOGO_PATH):
            c.drawImage(LOGO_PATH, MARGEN + 9 * mm, top - ALTO_ENCABEZADO + 2 * mm, width=20 * mm,
                        height=26 * mm, preserveAspectRatio=True, mask="auto")
        # Título central
        centro = (col1 + col3) / 2
        c.setFillColor(AZUL_OSCURO)
        c.setFont("Helvetica-Bold", 13)
        c.drawCentredString(centro, top - 11 * mm, "INFORME DE INSPECCIÓN")
        c.drawCentredString(centro, top - 17 * mm, "DE SEGURIDAD DE ASCENSORES")
        c.setFont("Helvetica", 8)
        c.setFillColor(GRIS_TEXTO)
        c.drawCentredString(centro, top - 24 * mm, "Referencia normativa: NTC 5926-1")
        # Datos del documento (derecha)
        filas = [("Informe N°", numero_informe), ("Emisión", fecha_emision), ("Página", str(doc.page))]
        alto_fila = ALTO_ENCABEZADO / 3
        for i, (etq, val) in enumerate(filas):
            y = top - (i + 1) * alto_fila
            if i:
                c.line(col3, y + alto_fila, ancho - MARGEN, y + alto_fila)
            c.setFillColor(GRIS_TEXTO)
            c.setFont("Helvetica-Bold", 7)
            c.drawString(col3 + 2 * mm, y + alto_fila - 4 * mm, etq.upper())
            c.setFillColor(AZUL_OSCURO)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(col3 + 2 * mm, y + 2 * mm, val)
        # Franja de color bajo el encabezado
        c.setFillColor(AZUL)
        c.rect(MARGEN, top - ALTO_ENCABEZADO - 1.5 * mm, ancho - 2 * MARGEN, 1.5 * mm, stroke=0, fill=1)
        # Pie de página
        c.setStrokeColor(GRIS_BORDE)
        c.line(MARGEN, 12 * mm, ancho - MARGEN, 12 * mm)
        c.setFont("Helvetica", 7)
        c.setFillColor(GRIS_TEXTO)
        c.drawString(MARGEN, 8 * mm, "LiftSafe · Sistema de gestión de inspecciones de ascensores")
        c.drawRightString(ancho - MARGEN, 8 * mm, f"{numero_informe} · Página {doc.page}")
        c.restoreState()
    return dibujar


# ── Documento ────────────────────────────────────────────────────────────────
def url_foto(ruta, base_url):
    """URL pública de una foto guardada en uploads/ (la sirve FastAPI como
    archivo estático, así el navegador la abre en una pestaña sin descargarla)."""
    relativa = str(ruta).replace("\\", "/").lstrip("./")
    return f"{base_url.rstrip('/')}/{quote(relativa)}"


def _fotos_item(rutas, lado=17 * mm, maximo=2, base_url=None):
    """Miniaturas de las fotos de un ítem del checklist (una debajo de otra),
    cada una con un enlace "Ver foto" que la abre en el navegador.
    Si hay más de `maximo`, se indica cuántas más hay. Ignora archivos que
    ya no existan o no se puedan leer."""
    celdas = []
    validas = [r for r in rutas if r and os.path.exists(r)]
    for i, ruta in enumerate(validas[:maximo], start=1):
        try:
            ancho_px, alto_px = ImageReader(ruta).getSize()
            escala = min(lado / ancho_px, lado / alto_px)
            celdas.append([Image(ruta, width=ancho_px * escala, height=alto_px * escala)])
        except Exception:
            continue
        if base_url:
            texto = "Ver foto" if len(validas) == 1 else f"Ver foto {i}"
            celdas.append([Paragraph(
                f'<link href="{url_foto(ruta, base_url)}" color="#0066CC"><u>{texto}</u></link>', EST["enlace"])])
    if not celdas:
        return Paragraph("—", EST["centro"])
    if len(validas) > maximo:
        extra = len(validas) - maximo
        if base_url:
            enlaces = " ".join(
                f'<link href="{url_foto(r, base_url)}" color="#0066CC"><u>{maximo + j}</u></link>'
                for j, r in enumerate(validas[maximo:], start=1))
            celdas.append([Paragraph(f"+{extra} más: {enlaces}", EST["enlace"])])
        else:
            celdas.append([Paragraph(f"+{extra} más", EST["centro"])])
    t = Table(celdas, colWidths=[lado + 2 * mm])
    t.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                           ("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    return t


def construir_pdf(pdf_path, inspeccion, detalles, informe=None, fotos_por_item=None, base_url_fotos=None):
    """Dibuja el PDF. Recibe objetos ya cargados (modelos o equivalentes).
    `fotos_por_item`: {id_item: [rutas de imagen]} para mostrar la evidencia
    fotográfica al lado de cada ítem del checklist."""
    fotos_por_item = fotos_por_item or {}
    ascensor = inspeccion.ascensor
    cliente = getattr(ascensor, "cliente", None)
    inspector = getattr(inspeccion, "inspector_rel", None)
    numero = getattr(informe, "numero_informe", None) or f"INF-{inspeccion.id_inspeccion}"

    doc = SimpleDocTemplate(pdf_path, pagesize=A4, leftMargin=MARGEN, rightMargin=MARGEN,
                            topMargin=MARGEN + ALTO_ENCABEZADO + 6 * mm, bottomMargin=18 * mm,
                            title=f"Informe de inspección {numero}", author="LiftSafe")
    ancho = A4[0] - 2 * MARGEN
    h = []

    # 1. Datos generales
    h.append(_titulo_seccion("1. DATOS DEL ASCENSOR Y DEL SERVICIO", ancho))
    capacidad = f"{_txt(getattr(ascensor, 'capacidad_kg', None))} kg"
    if getattr(ascensor, "capacidad_personas", None):
        capacidad += f" / {ascensor.capacidad_personas} personas"
    velocidad = getattr(ascensor, "velocidad_ms", None)
    h.append(_grilla_datos([
        ("Código del equipo", getattr(ascensor, "codigo_interno", None)),
        ("Marca", getattr(ascensor, "marca", None)),
        ("Modelo", getattr(ascensor, "modelo", None)),
        ("N° de serie", getattr(ascensor, "numero_serie", None)),
        ("Tipo", getattr(ascensor, "tipo_ascensor", None)),
        ("Capacidad", capacidad),
        ("N° de paradas", getattr(ascensor, "numero_pisos", None)),
        ("Velocidad", f"{velocidad} m/s" if velocidad else None),
        ("Cliente", getattr(cliente, "nombre_completo", None)),
        ("Dirección", getattr(ascensor, "direccion_completa", None)),
        ("Ciudad", getattr(ascensor, "ciudad", None)),
        ("Ubicación", getattr(ascensor, "ubicacion_exacta", None)),
        ("Inspector", getattr(inspector, "nombre_completo", None)),
        ("Inicio", _fecha(getattr(inspeccion, "fecha_inicio", None), True)),
        ("Fin", _fecha(getattr(inspeccion, "fecha_fin", None), True)),
        ("Estado", getattr(inspeccion, "estado", None)),
    ], ancho))
    h.append(Spacer(1, 6 * mm))

    # 2. Resumen
    conteo = {"CUMPLE": 0, "NO CUMPLE": 0, "NO APLICA": 0}
    for d in detalles:
        conteo[_resultado(d.resultado)[0]] += 1
    evaluados = conteo["CUMPLE"] + conteo["NO CUMPLE"]
    porcentaje = round(100 * conteo["CUMPLE"] / evaluados) if evaluados else 0
    concepto = getattr(informe, "concepto_tecnico", None) or ("CONFORME" if conteo["NO CUMPLE"] == 0 else "NO CONFORME")
    conforme = "NO" not in concepto.upper()

    def caja(titulo, valor, color, fondo):
        return [Paragraph(f'<font color="{color.hexval()}">{valor}</font>', EST["numero"]),
                Paragraph(f'<font color="{GRIS_TEXTO.hexval()}">{titulo}</font>', EST["centro"])]
    resumen = Table([[
        caja("Ítems evaluados", len(detalles), AZUL_OSCURO, AZUL_CLARO),
        caja("Cumple", conteo["CUMPLE"], VERDE, VERDE_FONDO),
        caja("No cumple", conteo["NO CUMPLE"], ROJO, ROJO_FONDO),
        caja("No aplica", conteo["NO APLICA"], GRIS, GRIS_FONDO),
        caja("Cumplimiento", f"{porcentaje}%", AZUL, AZUL_CLARO),
    ]], colWidths=[ancho / 5] * 5)
    resumen.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), AZUL_CLARO), ("BACKGROUND", (1, 0), (1, 0), VERDE_FONDO),
        ("BACKGROUND", (2, 0), (2, 0), ROJO_FONDO), ("BACKGROUND", (3, 0), (3, 0), GRIS_FONDO),
        ("BACKGROUND", (4, 0), (4, 0), AZUL_CLARO),
        ("BOX", (0, 0), (-1, -1), 0.5, GRIS_BORDE), ("INNERGRID", (0, 0), (-1, -1), 2, colors.white),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    color_concepto = VERDE if conforme else ROJO
    concepto_t = Table([[Paragraph("CONCEPTO TÉCNICO", EST["celda_b"]),
                         Paragraph(f'<font color="white"><b>{_txt(concepto).upper()}</b></font>', EST["centro"])]],
                       colWidths=[ancho * 0.7, ancho * 0.3])
    concepto_t.setStyle(TableStyle([
        ("BACKGROUND", (1, 0), (1, 0), color_concepto), ("BOX", (0, 0), (-1, -1), 0.8, color_concepto),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    h.append(KeepTogether([_titulo_seccion("2. RESUMEN DE RESULTADOS", ancho), resumen, Spacer(1, 2 * mm), concepto_t]))
    h.append(Spacer(1, 6 * mm))

    # 3. Checklist agrupado por categoría
    h.append(_titulo_seccion("3. LISTA DE VERIFICACIÓN (CHECKLIST)", ancho))
    anchos = [16 * mm, ancho - 16 * mm - 20 * mm - 22 * mm - 38 * mm - 21 * mm, 20 * mm, 22 * mm, 38 * mm, 21 * mm]
    filas = [[Paragraph(t, EST["th"]) for t in ("Código", "Ítem verificado", "Criticidad", "Resultado", "Observación", "Foto")]]
    estilos = [("BACKGROUND", (0, 0), (-1, 0), AZUL), ("GRID", (0, 0), (-1, -1), 0.4, GRIS_BORDE),
               ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 3),
               ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]

    def orden(d):
        item = d.item
        cat = getattr(item, "categoria", None)
        return (getattr(cat, "orden_visualizacion", 0) or 0, getattr(cat, "nombre_categoria", "") or "",
                getattr(item, "orden_visualizacion", 0) or 0, item.codigo_item or "")

    categoria_actual = object()
    for d in sorted(detalles, key=orden):
        cat = getattr(d.item, "categoria", None)
        nombre_cat = getattr(cat, "nombre_categoria", None) or "Sin categoría"
        if nombre_cat != categoria_actual:
            categoria_actual = nombre_cat
            filas.append([Paragraph(_txt(nombre_cat).upper(), EST["celda_b"]), "", "", "", "", ""])
            n = len(filas) - 1
            estilos += [("SPAN", (0, n), (-1, n)), ("BACKGROUND", (0, n), (-1, n), AZUL_CLARO)]
        texto, color, fondo = _resultado(d.resultado)
        obs = d.observacion or ""
        if getattr(d, "accion_requerida", None):
            obs += f"<br/><b>Acción:</b> {_txt(d.accion_requerida)}"
        filas.append([
            Paragraph(_txt(d.item.codigo_item), EST["celda_b"]),
            Paragraph(_txt(getattr(d.item, "descripcion", None)), EST["celda"]),
            Paragraph(_txt(getattr(d.item, "nivel_criticidad", None)), EST["centro"]),
            Paragraph(f'<font color="{color.hexval()}">{texto}</font>', EST["chip"]),
            Paragraph(obs if obs else "—", EST["celda"]),
            _fotos_item(fotos_por_item.get(getattr(d, "id_item", None) or getattr(d.item, "id_item", None), []),
                        base_url=base_url_fotos),
        ])
        n = len(filas) - 1
        estilos.append(("BACKGROUND", (3, n), (3, n), fondo))
    if len(filas) == 1:
        filas.append([Paragraph("No hay ítems registrados en esta inspección.", EST["celda"]), "", "", "", "", ""])
        estilos.append(("SPAN", (0, 1), (-1, 1)))
    tabla = Table(filas, colWidths=anchos, repeatRows=1)
    tabla.setStyle(TableStyle(estilos))
    h.append(tabla)
    if any(fotos_por_item.values()) and base_url_fotos:
        h.append(Spacer(1, 1.5 * mm))
        h.append(Paragraph(
            "Para ver una foto sin cerrar este informe: <b>Ctrl + clic</b> (o clic con la rueda del mouse) "
            "sobre «Ver foto»; se abrirá en otra pestaña.", EST["nota"]))
    h.append(Spacer(1, 6 * mm))

    # 4. Observaciones
    bloques = []
    if getattr(inspeccion, "observaciones_generales", None):
        bloques.append(Paragraph(_txt(inspeccion.observaciones_generales), EST["texto"]))
    for o in (getattr(informe, "observaciones", None) or []):
        riesgo = f" (riesgo {_txt(o.nivel_riesgo)})" if getattr(o, "nivel_riesgo", None) else ""
        bloques.append(Paragraph(f"• <b>{_txt(o.tipo_observacion)}{riesgo}:</b> {_txt(o.descripcion)}", EST["texto"]))
    if getattr(informe, "conclusion_general", None):
        bloques.append(Paragraph(f"<b>Conclusión:</b> {_txt(informe.conclusion_general)}", EST["texto"]))
    if not bloques:
        bloques.append(Paragraph("Sin observaciones adicionales.", EST["texto"]))
    caja_obs = Table([[b] for b in bloques], colWidths=[ancho])
    caja_obs.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.5, GRIS_BORDE), ("LEFTPADDING", (0, 0), (-1, -1), 6),
                                  ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    h.append(KeepTogether([_titulo_seccion("4. OBSERVACIONES", ancho), caja_obs]))
    h.append(Spacer(1, 6 * mm))

    # 5. Firmas
    def bloque_firma(rol, firma, nombre, fecha):
        img = _imagen_firma(firma) or Paragraph('<font color="#9E9E9E">Sin firma</font>', EST["centro"])
        return [img, Paragraph(f"<b>{_txt(nombre)}</b>", EST["centro"]),
                Paragraph(f"{rol} · {_fecha(fecha, True)}", EST["centro"])]
    firmas = Table([
        [bloque_firma("Inspector", getattr(inspeccion, "firma_inspector", None),
                      getattr(inspector, "nombre_completo", None), getattr(inspeccion, "fecha_firma_inspector", None)),
         bloque_firma("Cliente", getattr(inspeccion, "firma_cliente", None),
                      getattr(cliente, "nombre_completo", None), getattr(inspeccion, "fecha_firma_cliente", None))],
    ], colWidths=[ancho / 2] * 2, rowHeights=[34 * mm])
    firmas.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.5, GRIS_BORDE),
                                ("INNERGRID", (0, 0), (-1, -1), 0.5, GRIS_BORDE),
                                ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "BOTTOM")]))
    h.append(KeepTogether([_titulo_seccion("5. FIRMAS", ancho), firmas]))

    marco = _dibujar_marco(numero, datetime.now().strftime("%d/%m/%Y"))
    doc.build(h, onFirstPage=marco, onLaterPages=marco)


def generar_pdf_informe(db: Session, id_inspeccion: int):
    from sqlalchemy import or_

    from app.models.models import DetalleChecklist, Fotografia, Informe, Inspeccion

    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id_inspeccion).first()
    if not inspeccion:
        raise Exception("Inspeccion no encontrada")

    detalles = db.query(DetalleChecklist).filter(DetalleChecklist.id_inspeccion == id_inspeccion).all()
    informe = db.query(Informe).filter(Informe.id_inspeccion == id_inspeccion).first()

    pdf_path = f"informes/INF-{id_inspeccion}-{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    os.makedirs("informes", exist_ok=True)
    # Fotos tomadas en cada ítem del checklist (por inspección o por informe)
    condicion = Fotografia.id_inspeccion == id_inspeccion
    if informe:
        condicion = or_(condicion, Fotografia.id_informe == informe.id_informe)
    fotos_por_item = {}
    for foto in db.query(Fotografia).filter(condicion, Fotografia.id_item.isnot(None)).order_by(Fotografia.id_foto):
        fotos_por_item.setdefault(foto.id_item, []).append(foto.ruta_archivo)

    from app.config import settings

    construir_pdf(pdf_path, inspeccion, detalles, informe, fotos_por_item,
                  base_url_fotos=getattr(settings, "API_PUBLIC_URL", None) or "http://localhost:8000")

    with open(pdf_path, "rb") as f:
        hash_documento = hashlib.sha256(f.read()).hexdigest()

    return pdf_path, hash_documento
