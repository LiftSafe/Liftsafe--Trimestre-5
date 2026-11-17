"""Muestra los grupos de la lista de chequeo y repara el grupo 6.2 si quedó con
un nombre de menos de 3 caracteres (p. ej. "o"). Deja el resultado también en
logs/estado_checklist.txt."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.database import SessionLocal  # noqa: E402
from app.models.models import ChecklistCategoria  # noqa: E402

NOMBRE_62 = "6.2 Cables de tracción y sus amarres"
lineas = []
db = SessionLocal()
try:
    for c in db.query(ChecklistCategoria).order_by(ChecklistCategoria.orden_visualizacion, ChecklistCategoria.id_categoria):
        lineas.append(f"id={c.id_categoria} orden={c.orden_visualizacion} activo={c.activo} items={len(c.items)} nombre={c.nombre_categoria!r}")
    rotos = [c for c in db.query(ChecklistCategoria).all()
             if len((c.nombre_categoria or "").strip()) < 3 and (c.descripcion or "").startswith("Cables de suspensión")]
    ya_existe = db.query(ChecklistCategoria).filter(ChecklistCategoria.nombre_categoria == NOMBRE_62).first()
    if len(rotos) == 1 and not ya_existe:
        lineas.append(f"Reparado: id={rotos[0].id_categoria} {rotos[0].nombre_categoria!r} -> {NOMBRE_62!r}")
        rotos[0].nombre_categoria = NOMBRE_62
        db.commit()
    else:
        lineas.append(f"Sin reparar (rotos={len(rotos)}, ya_existe={bool(ya_existe)})")
finally:
    db.close()
texto = "\n".join(lineas)
print(texto)
Path("logs").mkdir(exist_ok=True)
Path("logs/estado_checklist.txt").write_text(texto, encoding="utf-8")
