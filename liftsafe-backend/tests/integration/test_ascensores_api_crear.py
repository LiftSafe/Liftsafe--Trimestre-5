"""Semana 6 · ángulo API (parte 1): POST /ascensores/ contra la BD real.

El caso feliz se verifica EN LA BD (no solo en la respuesta) y cada violación
de restricción debe responder 4xx con el formato del contrato, nunca 500.
"""
from app.models.models import Ascensor


def _filas(db, codigo):
    return db.query(Ascensor).filter(Ascensor.codigo_interno == codigo).all()


# ---------------- crear ----------------
def test_crear_ascensor_lo_guarda_en_la_bd(db_client, db_session, token, crear_cliente, datos_ascensor):
    cliente = crear_cliente()
    datos = datos_ascensor(cliente.id_usuario)

    r = db_client.post("/ascensores/", json=datos, headers=token("Administrador"))

    assert r.status_code == 201
    # Se verifica en la BD, no solo en la respuesta: el id devuelto es el de la fila.
    guardado = _filas(db_session, datos["codigo_interno"])
    assert len(guardado) == 1
    assert r.json()["id_ascensor"] == guardado[0].id_ascensor
    assert (guardado[0].id_cliente, guardado[0].marca) == (cliente.id_usuario, "Schindler")


def test_crear_con_codigo_repetido_da_409_y_no_duplica(db_client, db_session, token, crear_cliente, crear_ascensor, datos_ascensor):
    cliente = crear_cliente()
    existente = crear_ascensor(cliente)

    r = db_client.post("/ascensores/", json=datos_ascensor(cliente.id_usuario, codigo_interno=existente.codigo_interno), headers=token("Administrador"))

    assert r.status_code == 409
    assert len(_filas(db_session, existente.codigo_interno)) == 1


def test_crear_con_codigo_en_otras_mayusculas_tambien_da_409(db_client, token, crear_cliente, crear_ascensor, datos_ascensor):
    # La collation de MySQL ya trata 'ASC-MIX' y 'asc-mix' como iguales.
    cliente = crear_cliente()
    crear_ascensor(cliente, codigo_interno="ASC-MIX")

    r = db_client.post("/ascensores/", json=datos_ascensor(cliente.id_usuario, codigo_interno="asc-mix"), headers=token("Administrador"))

    assert r.status_code == 409


def test_crear_con_cliente_inexistente_da_404_y_no_guarda(db_client, db_session, token, datos_ascensor):
    datos = datos_ascensor(id_cliente=2_000_000_000)

    r = db_client.post("/ascensores/", json=datos, headers=token("Administrador"))

    assert r.status_code == 404
    assert _filas(db_session, datos["codigo_interno"]) == []


def test_crear_sin_permiso_da_403(db_client, token, crear_cliente, datos_ascensor):
    cliente = crear_cliente()

    r = db_client.post("/ascensores/", json=datos_ascensor(cliente.id_usuario), headers=token("Inspector"))

    assert r.status_code == 403


# ---- HALLAZGOS: valores que la BD rechaza deben ser 422, no 500 ----
def test_crear_con_marca_de_81_caracteres_da_422(db_client, db_session, token, crear_cliente, datos_ascensor):
    cliente = crear_cliente()
    datos = datos_ascensor(cliente.id_usuario, marca="x" * 81)

    r = db_client.post("/ascensores/", json=datos, headers=token("Administrador"))

    assert r.status_code == 422
    assert _filas(db_session, datos["codigo_interno"]) == []


def test_crear_con_codigo_de_51_caracteres_da_422(db_client, token, crear_cliente, datos_ascensor):
    r = db_client.post("/ascensores/", json=datos_ascensor(crear_cliente().id_usuario, codigo_interno="x" * 51), headers=token("Administrador"))

    assert r.status_code == 422


def test_crear_con_capacidad_fuera_del_rango_de_int_da_422(db_client, token, crear_cliente, datos_ascensor):
    r = db_client.post("/ascensores/", json=datos_ascensor(crear_cliente().id_usuario, capacidad_kg=2_147_483_648), headers=token("Administrador"))

    assert r.status_code == 422
