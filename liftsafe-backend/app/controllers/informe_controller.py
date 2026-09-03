
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from datetime import datetime
import os
import hashlib
from sqlalchemy.orm import Session

def generar_pdf_informe(db: Session, id_inspeccion: int):
    from app.models.models import Inspeccion, DetalleChecklist, Fotografia, Observacion
    
    inspeccion = db.query(Inspeccion).filter(Inspeccion.id_inspeccion == id_inspeccion).first()
    if not inspeccion:
        raise Exception("Inspeccion no encontrada")
    
    pdf_path = f"informes/INF-{id_inspeccion}-{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    os.makedirs("informes", exist_ok=True)
    
    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4
    
    # Titulo
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, f"INFORME DE INSPECCION N INF-{id_inspeccion}")
    c.line(50, height - 60, width - 50, height - 60)
    
    # Datos del ascensor
    c.setFont("Helvetica", 12)
    y = height - 90
    c.drawString(50, y, f"Ascensor: {inspeccion.ascensor.codigo_interno}")
    y -= 20
    c.drawString(50, y, f"Marca: {inspeccion.ascensor.marca}")
    y -= 20
    c.drawString(50, y, f"Modelo: {inspeccion.ascensor.modelo}")
    y -= 20
    c.drawString(50, y, f"Cliente: {inspeccion.ascensor.cliente.nombre_completo}")
    y -= 20
    c.drawString(50, y, f"Fecha: {inspeccion.fecha_inicio.strftime('%d/%m/%Y')}")
    y -= 30
    
    # Checklist
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "RESULTADOS DEL CHECKLIST")
    y -= 20
    c.setFont("Helvetica", 11)
    
    detalles = db.query(DetalleChecklist).filter(DetalleChecklist.id_inspeccion == id_inspeccion).all()
    for detalle in detalles:
        if y < 50:
            c.showPage()
            y = height - 50
        c.drawString(50, y, f"- {detalle.item.codigo_item}: {detalle.resultado}")
        if detalle.observacion:
            y -= 15
            c.drawString(60, y, f" Obs: {detalle.observacion[:80]}...")
        y -= 20
    y -= 20
    
    # Firmas
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "FIRMAS")
    y -= 30
    c.setFont("Helvetica", 12)
    if inspeccion.firma_inspector:
        # ✅ FIX: el modelo Inspeccion define la relación con Usuario como
        # "inspector_rel" (no "inspector"), que no existe -> generar el PDF
        # siempre fallaba con AttributeError en cuanto el inspector ya había
        # firmado ("'Inspeccion' object has no attribute 'inspector'").
        c.drawString(50, y, f"Inspector: {inspeccion.inspector_rel.nombre_completo}")
        c.drawString(50, y - 20, f"Fecha: {inspeccion.fecha_firma_inspector.strftime('%d/%m/%Y %H:%M')}")
    else:
        c.drawString(50, y, "Inspector: No firmado")
    
    c.save()
    
    with open(pdf_path, "rb") as f:
        hash_documento = hashlib.sha256(f.read()).hexdigest()
    
    return pdf_path, hash_documento
