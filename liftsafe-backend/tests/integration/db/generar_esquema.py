"""Regenera 01-esquema.sql a partir de liftsafe_db.sql (sin datos de ejemplo).

Uso (desde la raíz del repo):  python liftsafe-backend/tests/integration/db/generar_esquema.py
"""
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[4]
ORIGEN = RAIZ / "liftsafe_db.sql"
DESTINO = Path(__file__).with_name("01-esquema.sql")
CATALOGOS = {"rol", "checklist_categoria", "checklist_item"}
CABECERA = (
    "-- Esquema de la BD de PRUEBAS de LiftSafe (semana 6). Generado desde liftsafe_db.sql:\n"
    "-- misma estructura, sin datos de ejemplo; solo los catálogos que exigen las llaves foráneas.\n"
    "-- Docker lo ejecuta al crear el contenedor (docker-entrypoint-initdb.d).\n"
)

lineas = []
for linea in ORIGEN.read_text(encoding="utf-8", errors="surrogateescape").split("\n"):
    if linea.startswith(("CREATE DATABASE", "USE `")):
        continue
    insercion = re.match(r"^INSERT INTO `(\w+)`", linea)
    if insercion and insercion.group(1) not in CATALOGOS:
        continue
    lineas.append(linea)
# El esquema de producción = dump + migraciones que el dump todavía no trae.
MIGRACIONES = []  # el dump ya trae notificacion.enlace
extra = ["", "-- ===== migraciones del proyecto aplicadas sobre el dump ====="]
for nombre in MIGRACIONES:
    extra += [f"-- {nombre}", (RAIZ / "liftsafe-backend" / "migrations" / nombre).read_text(encoding="utf-8")]
DESTINO.write_text(CABECERA + "\n".join(lineas + extra), encoding="utf-8", errors="surrogateescape")
print(f"Escrito {DESTINO}")
