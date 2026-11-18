"""Semana 6 · ángulo BD: la tabla `ascensor` contra MySQL real.

Cada restricción de la tabla (NOT NULL, longitud, UNIQUE, llave foránea,
rango de enteros) queda documentada con un test. Un repositorio falso en
memoria NO falla en ninguno de estos casos.
"""
from datetime import datetime

import pytest
from sqlalchemy.exc import DataError, IntegrityError

from app.models.models import Ascensor


def _guardar(db, datos):
    db.add(Ascensor(**datos))
    db.flush()


def test_guardar_ascensor_asigna_id_y_fecha_de_registro(db_session, crear_cliente, crear_ascensor):
    cliente = crear_cliente()

    ascensor = crear_ascensor(cliente)

    assert ascensor.id_ascensor is not None  # lo decide la BD (AUTO_INCREMENT)
    db_session.refresh(ascensor)
    assert isinstance(ascensor.fecha_registro, datetime)  # DEFAULT CURRENT_TIMESTAMP


@pytest.mark.parametrize("columna", ["marca", "modelo", "numero_serie", "tipo_ascensor", "ciudad", "estado", "codigo_interno"])
def test_columna_not_null_rechaza_el_valor_nulo(db_session, crear_cliente, datos_ascensor, columna):
    cliente = crear_cliente()
    datos = datos_ascensor(cliente.id_usuario, **{columna: None})

    with pytest.raises(IntegrityError):
        _guardar(db_session, datos)


@pytest.mark.parametrize(
    "columna, largo_maximo",
    [("codigo_interno", 50), ("marca", 80), ("modelo", 80), ("numero_serie", 80),
     ("tipo_ascensor", 50), ("ubicacion_exacta", 200), ("direccion_completa", 250), ("ciudad", 100)],
)
def test_longitud_maxima_se_acepta_y_un_caracter_mas_se_rechaza(db_session, crear_cliente, datos_ascensor, columna, largo_maximo):
    cliente = crear_cliente()
    _guardar(db_session, datos_ascensor(cliente.id_usuario, **{columna: "x" * largo_maximo}))  # límite: pasa

    with pytest.raises(DataError):  # un carácter más: la BD (modo estricto) rechaza
        _guardar(db_session, datos_ascensor(cliente.id_usuario, **{columna: "y" * (largo_maximo + 1)}))


def test_capacidad_fuera_del_rango_de_int_se_rechaza(db_session, crear_cliente, datos_ascensor):
    cliente = crear_cliente()
    _guardar(db_session, datos_ascensor(cliente.id_usuario, capacidad_kg=2_147_483_647))  # máximo INT: pasa

    with pytest.raises(DataError):
        _guardar(db_session, datos_ascensor(cliente.id_usuario, capacidad_kg=2_147_483_648))


def test_codigo_interno_repetido_viola_unique(db_session, crear_cliente, crear_ascensor, datos_ascensor):
    cliente = crear_cliente()
    existente = crear_ascensor(cliente)

    with pytest.raises(IntegrityError):
        _guardar(db_session, datos_ascensor(cliente.id_usuario, codigo_interno=existente.codigo_interno))


def test_unique_en_mysql_ignora_mayusculas_y_espacios_finales(db_session, crear_cliente, crear_ascensor, datos_ascensor):
    # MySQL ≠ PostgreSQL: con la collation utf8mb4_unicode_ci, 'asc-x' y
    # 'ASC-X ' cuentan como el MISMO código. En PostgreSQL serían distintos.
    cliente = crear_cliente()
    crear_ascensor(cliente, codigo_interno="ASC-MAYUS")

    with pytest.raises(IntegrityError):
        _guardar(db_session, datos_ascensor(cliente.id_usuario, codigo_interno="asc-mayus "))


def test_ascensor_con_cliente_inexistente_viola_la_llave_foranea(db_session, datos_ascensor):
    with pytest.raises(IntegrityError):
        _guardar(db_session, datos_ascensor(id_cliente=2_000_000_000))


def test_no_se_puede_borrar_un_cliente_que_tiene_ascensores(db_session, crear_cliente, crear_ascensor):
    cliente = crear_cliente()
    crear_ascensor(cliente)

    with pytest.raises(IntegrityError):
        db_session.delete(cliente)
        db_session.flush()


def test_ultima_modificacion_se_actualiza_al_editar(db_session, crear_cliente, crear_ascensor):
    ascensor = crear_ascensor(crear_cliente())
    db_session.refresh(ascensor)
    antes = ascensor.ultima_modificacion

    ascensor.estado = "En mantenimiento"
    db_session.flush()
    db_session.refresh(ascensor)

    assert ascensor.estado == "En mantenimiento"
    assert ascensor.ultima_modificacion >= antes
