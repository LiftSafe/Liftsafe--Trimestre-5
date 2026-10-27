"""Pruebas de API — ángulo API: el CRUD del recurso central (ascensores).

Sin servidor y sin BD: la sesión es un FakeSession (ver tests/fakes.py).
"""
from tests.fakes import auth, fila

ASCENSOR_VALIDO = {
    "id_cliente": 5,
    "codigo_interno": "ASC-001",
    "marca": "Otis",
    "modelo": "Gen2",
    "numero_serie": "SN-1",
    "tipo_ascensor": "Pasajeros",
    "capacidad_kg": 630,
    "numero_pisos": 8,
    "ubicacion_exacta": "Torre A",
    "direccion_completa": "Cra 1 # 2-3",
    "ciudad": "Bogotá",
    "estado": "Activo",
}


def test_crear_ascensor_responde_201_con_mensaje_e_id(client, db):
    # Arrange: el cliente existe y el código interno no está repetido
    db.firsts = [fila(id_usuario=5), None]

    # Act
    respuesta = client.post("/ascensores/", json=ASCENSOR_VALIDO, headers=auth("Administrador"))

    # Assert: código, cuerpo y Content-Type
    assert respuesta.status_code == 201
    assert respuesta.json() == {"message": "Ascensor creado exitosamente", "id_ascensor": 99}
    assert respuesta.headers["content-type"] == "application/json"
    assert db.commits == 1


def test_crear_ascensor_con_capacidad_no_numerica_responde_422_con_el_campo(client):
    datos = {**ASCENSOR_VALIDO, "capacidad_kg": "mucha"}

    respuesta = client.post("/ascensores/", json=datos, headers=auth("Administrador"))

    assert respuesta.status_code == 422
    assert respuesta.json()["detail"][0]["loc"] == ["body", "capacidad_kg"]


def test_crear_ascensor_de_un_cliente_inexistente_responde_404(client, db):
    db.firsts = [None]  # el cliente no existe

    respuesta = client.post("/ascensores/", json=ASCENSOR_VALIDO, headers=auth("Administrador"))

    assert respuesta.status_code == 404
    assert respuesta.json() == {"detail": "Cliente no encontrado"}


def test_editar_ascensor_inexistente_responde_404(client, db):
    db.firsts = [None]

    respuesta = client.put("/ascensores/999", json={"marca": "Schindler"}, headers=auth("Coordinador"))

    assert respuesta.status_code == 404
    assert respuesta.json() == {"detail": "Ascensor no encontrado"}


def test_eliminar_ascensor_responde_200_y_borra_el_registro(client, db):
    ascensor = fila(id_ascensor=1, inspecciones=[])
    db.firsts = [ascensor]

    respuesta = client.delete("/ascensores/1", headers=auth("Administrador"))

    assert respuesta.status_code == 200
    assert respuesta.json() == {"message": "Ascensor eliminado exitosamente"}
    assert db.deleted == [ascensor]


def test_eliminar_ascensor_inexistente_responde_404(client, db):
    db.firsts = [None]

    respuesta = client.delete("/ascensores/999", headers=auth("Administrador"))

    assert respuesta.status_code == 404
    assert respuesta.json() == {"detail": "Ascensor no encontrado"}
