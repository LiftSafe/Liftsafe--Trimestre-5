"""Semana 6 · ángulo API (parte 2): editar, eliminar y consultas propias de /ascensores.

Cada test crea sus datos; el estado se verifica en la BD real.
"""
from app.models.models import Ascensor


def test_editar_con_marca_de_81_caracteres_da_422_y_no_cambia_la_fila(db_client, db_session, token, crear_cliente, crear_ascensor):
    ascensor = crear_ascensor(crear_cliente())

    r = db_client.put(f"/ascensores/{ascensor.id_ascensor}", json={"marca": "x" * 81}, headers=token("Administrador"))

    assert r.status_code == 422
    db_session.refresh(ascensor)
    assert ascensor.marca == "Schindler"


# ---------------- editar / eliminar ----------------
def test_editar_cambia_solo_lo_enviado(db_client, db_session, token, crear_cliente, crear_ascensor):
    ascensor = crear_ascensor(crear_cliente())

    r = db_client.put(f"/ascensores/{ascensor.id_ascensor}", json={"estado": "Fuera de servicio"}, headers=token("Coordinador"))

    assert r.status_code == 200
    db_session.refresh(ascensor)
    assert (ascensor.estado, ascensor.marca) == ("Fuera de servicio", "Schindler")


def test_editar_con_id_gigante_da_404(db_client, token):
    r = db_client.put("/ascensores/2147483648", json={"estado": "x"}, headers=token("Administrador"))

    assert r.status_code == 404


def test_eliminar_borra_la_fila(db_client, db_session, token, crear_cliente, crear_ascensor):
    ascensor = crear_ascensor(crear_cliente())
    id_ascensor = ascensor.id_ascensor

    r = db_client.delete(f"/ascensores/{id_ascensor}", headers=token("Administrador"))

    assert r.status_code == 200
    db_session.expire_all()
    assert db_session.get(Ascensor, id_ascensor) is None


# ---------------- consultas propias ----------------
def test_listado_ordena_del_mas_nuevo_al_mas_viejo(db_client, token, crear_cliente, crear_ascensor):
    cliente = crear_cliente()
    primero = crear_ascensor(cliente)
    segundo = crear_ascensor(cliente)

    r = db_client.get("/ascensores/listado", headers=token("Administrador"))

    ids = [a["id_ascensor"] for a in r.json()]
    assert ids.index(segundo.id_ascensor) < ids.index(primero.id_ascensor)


def test_listado_del_cliente_solo_trae_sus_ascensores(db_client, token, crear_cliente, crear_ascensor):
    ana, beto = crear_cliente(), crear_cliente()
    suyo = crear_ascensor(ana)
    ajeno = crear_ascensor(beto)

    r = db_client.get("/ascensores/listado", headers=token("Cliente", user_id=ana.id_usuario, correo=ana.correo))

    ids = [a["id_ascensor"] for a in r.json()]
    assert suyo.id_ascensor in ids and ajeno.id_ascensor not in ids


def test_edificios_cuenta_los_ascensores_de_cada_cliente(db_client, token, crear_cliente, crear_ascensor):
    cliente = crear_cliente()
    crear_ascensor(cliente)
    crear_ascensor(cliente)

    r = db_client.get("/ascensores/edificios", headers=token("Administrador"))

    suyo = next(e for e in r.json() if e["id_cliente"] == cliente.id_usuario)
    assert suyo["total_ascensores"] == 2
