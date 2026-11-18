"""Semana 6 · ángulo BD: los modelos de SQLAlchemy deben coincidir con las tablas reales.

Un repositorio falso nunca nota que a la BD le falta una columna que el
modelo ya usa: el primer INSERT o SELECT real responde 500.
"""
import pytest
from sqlalchemy import inspect

from app.database import Base
import app.models.models  # noqa: F401  (registra todos los modelos en Base)


@pytest.mark.parametrize("tabla", sorted(Base.metadata.tables))
def test_cada_columna_del_modelo_existe_en_la_tabla_real(engine, tabla):
    columnas_bd = {c["name"] for c in inspect(engine).get_columns(tabla)}
    columnas_modelo = {c.name for c in Base.metadata.tables[tabla].columns}

    assert columnas_modelo - columnas_bd == set(), f"faltan en la BD (tabla {tabla})"
