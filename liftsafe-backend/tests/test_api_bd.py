"""Pruebas de API — ángulo BD: respuestas que dependen de lo que hay guardado.

Duplicados (409), registros con dependientes (409) y búsquedas. Todo con la
sesión simulada: no se toca ninguna base de datos.
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


def test_crear_ascensor_con_codigo_repetido_responde_409(client, db):
    # Arrange: el cliente existe y YA hay un ascensor con ese código interno
    db.firsts = [fila(id_usuario=5), fila(id_ascensor=7)]

    # Act
    respuesta = client.post("/ascensores/", json=ASCENSOR_VALIDO, headers=auth("Administrador"))

    # Assert
    assert respuesta.status_code == 409
    assert respuesta.json() == {"detail": "El código interno ya está registrado"}
    assert db.commits == 0  # no se guardó nada


def test_eliminar_ascensor_con_inspecciones_responde_409_y_no_lo_borra(client, db):
    db.firsts = [fila(id_ascensor=1, inspecciones=[object()])]

    respuesta = client.delete("/ascensores/1", headers=auth("Administrador"))

    assert respuesta.status_code == 409
    assert "tiene inspecciones asociadas" in respuesta.json()["detail"]
    assert db.deleted == []


def test_crear_sede_con_nombre_repetido_responde_409(client, db):
    # Arrange: el cliente existe y ya tiene una sede con ese nombre
    db.firsts = [fila(id_usuario=5), fila(id_sede=3)]

    respuesta = client.post("/clientes/5/sedes", json={"nombre": "Norte"}, headers=auth("Administrador"))

    assert respuesta.status_code == 409
    assert respuesta.json() == {"detail": "Este cliente ya tiene una sede con ese nombre"}


def test_eliminar_sede_con_ascensores_responde_409_y_no_la_borra(client, db):
    db.firsts = [fila(id_sede=3)]
    db.count_value = 2  # la sede tiene 2 ascensores

    respuesta = client.delete("/clientes/sedes/3", headers=auth("Administrador"))

    assert respuesta.status_code == 409
    assert respuesta.json()["detail"].startswith("No se puede eliminar: la sede tiene 2 ascensor(es)")
    assert db.deleted == []


def test_eliminar_sede_sin_ascensores_responde_200(client, db):
    sede = fila(id_sede=3)
    db.firsts = [sede]
    db.count_value = 0

    respuesta = client.delete("/clientes/sedes/3", headers=auth("Administrador"))

    assert respuesta.status_code == 200
    assert respuesta.json() == {"message": "Sede eliminada"}
    assert db.deleted == [sede]


def test_listar_sedes_de_un_cliente_incluye_el_total_de_ascensores_de_cada_una(client, db):
    # Arrange: 1) el cliente  2) sus sedes  3) conteo (id_sede, total) por sede
    sede = fila(id_sede=3, id_cliente=5, nombre="Norte", direccion="Cra 1", ciudad="Bogotá")
    db.firsts = [fila(id_usuario=5)]
    db.alls = [[sede], [(3, 2)]]

    respuesta = client.get("/clientes/5/sedes", headers=auth("Administrador"))

    assert respuesta.status_code == 200
    assert respuesta.json() == [
        {"id_sede": 3, "id_cliente": 5, "nombre": "Norte", "direccion": "Cra 1", "ciudad": "Bogotá", "total_ascensores": 2}
    ]


def test_listar_sedes_de_un_cliente_inexistente_responde_404(client, db):
    db.firsts = [None]

    respuesta = client.get("/clientes/999/sedes", headers=auth("Administrador"))

    assert respuesta.status_code == 404
    assert respuesta.json() == {"detail": "Cliente no encontrado"}


def test_registro_con_correo_ya_registrado_responde_409(client, db):
    db.firsts = [fila(id_usuario=1)]  # el correo ya existe
    datos = {
        "nombre_completo": "Ana Pérez",
        "correo": "ana@example.com",
        "contrasena": "Segura2024x",
        "tipo_documento": "CC",
        "documento_identidad": "123456789",
    }

    respuesta = client.post("/auth/register", json=datos)

    assert respuesta.status_code == 409
    assert respuesta.json() == {"detail": "El correo ya está registrado"}
