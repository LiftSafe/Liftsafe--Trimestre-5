"""Rutas con sesión de BD falsa (semana 5): encuestas, notificaciones, vistas y auditoría.

La sesión es un doble (MagicMock): STUB cuando devuelve datos preparados y SPY
cuando se verifica a qué se llamó (commit, update, parámetros del SQL).
La autenticación usa tokens reales firmados con la clave de pruebas.
"""
from datetime import datetime
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.controllers.auth_controller import create_access_token
from app.database import get_db
from app.main import app


@pytest.fixture
def db(mocker):
    sesion = mocker.MagicMock()
    app.dependency_overrides[get_db] = lambda: sesion
    yield sesion
    app.dependency_overrides.clear()


@pytest.fixture
def client(db):
    return TestClient(app)


def con_sesion(rol, user_id=7):
    token = create_access_token({"rol": rol, "sub": "a@x.com", "user_id": user_id})
    return {"Authorization": f"Bearer {token}"}


# ── Encuestas ─────────────────────────────────────────────────────────────────

def test_listar_encuestas_solo_para_clientes(client):
    respuesta = client.get("/encuestas/", headers=con_sesion("Inspector"))
    assert respuesta.status_code == 403
    assert respuesta.json()["detail"] == "Solo los clientes tienen encuestas"


def test_listar_encuestas_devuelve_el_codigo_del_ascensor(client, db):
    encuesta = SimpleNamespace(
        id_encuesta=1, id_inspeccion=2, calificacion=None, comentario=None,
        respondida=0, fecha_creacion=None, fecha_respuesta=None,
        inspeccion=SimpleNamespace(ascensor=SimpleNamespace(codigo_interno="ASC-001")),
    )
    db.query.return_value.options.return_value.filter.return_value.order_by.return_value.all.return_value = [encuesta]

    respuesta = client.get("/encuestas/", headers=con_sesion("Cliente"))

    assert respuesta.status_code == 200
    assert respuesta.json()[0]["codigo_ascensor"] == "ASC-001"
    assert respuesta.json()[0]["respondida"] is False


def test_listar_encuestas_sin_inspeccion_deja_el_codigo_vacio(client, db):
    encuesta = SimpleNamespace(
        id_encuesta=1, id_inspeccion=2, calificacion=None, comentario=None,
        respondida=1, fecha_creacion=None, fecha_respuesta=None, inspeccion=None,
    )
    db.query.return_value.options.return_value.filter.return_value.order_by.return_value.all.return_value = [encuesta]

    respuesta = client.get("/encuestas/", headers=con_sesion("Cliente"))

    assert respuesta.json()[0]["codigo_ascensor"] is None
    assert respuesta.json()[0]["respondida"] is True


def test_responder_encuesta_inexistente_responde_404(client, db):
    db.query.return_value.filter.return_value.first.return_value = None
    respuesta = client.put("/encuestas/9/responder", json={"calificacion": 5}, headers=con_sesion("Cliente"))
    assert respuesta.status_code == 404


def test_responder_la_encuesta_de_otro_cliente_responde_403(client, db):
    db.query.return_value.filter.return_value.first.return_value = SimpleNamespace(id_cliente=99, respondida=False)
    respuesta = client.put("/encuestas/1/responder", json={"calificacion": 5}, headers=con_sesion("Cliente", 7))
    assert respuesta.status_code == 403
    db.commit.assert_not_called()


def test_responder_una_encuesta_ya_respondida_responde_400(client, db):
    db.query.return_value.filter.return_value.first.return_value = SimpleNamespace(id_cliente=7, respondida=True)
    respuesta = client.put("/encuestas/1/responder", json={"calificacion": 5}, headers=con_sesion("Cliente", 7))
    assert respuesta.status_code == 400
    db.commit.assert_not_called()


def test_responder_encuesta_guarda_calificacion_y_comentario(client, db):
    encuesta = SimpleNamespace(id_cliente=7, respondida=False)
    db.query.return_value.filter.return_value.first.return_value = encuesta

    respuesta = client.put(
        "/encuestas/1/responder",
        json={"calificacion": 5, "comentario": "Muy buen servicio"},
        headers=con_sesion("Cliente", 7),
    )

    assert respuesta.status_code == 200
    assert encuesta.respondida is True
    assert encuesta.calificacion == 5
    assert encuesta.comentario == "Muy buen servicio"
    db.commit.assert_called_once()


def test_responder_con_calificacion_fuera_de_rango_es_rechazado(client):
    respuesta = client.put("/encuestas/1/responder", json={"calificacion": 6}, headers=con_sesion("Cliente"))
    assert respuesta.status_code == 422


# ── Notificaciones ────────────────────────────────────────────────────────────

def notificacion_falsa(leida=False):
    return SimpleNamespace(
        id_notificacion=1, id_usuario_destino=7, mensaje="Hola", enlace=None,
        leida=leida, fecha_creacion=datetime(2026, 11, 10),
    )


def test_crear_notificacion_guarda_una_no_leida(client, db):
    def completar(n):
        n.id_notificacion = 1
        n.fecha_creacion = datetime(2026, 11, 10)

    db.refresh.side_effect = completar

    respuesta = client.post("/notificaciones/", json={"id_usuario_destino": 7, "mensaje": "Hola"})

    assert respuesta.status_code == 201
    guardada = db.add.call_args.args[0]
    assert guardada.leida is False
    assert guardada.id_usuario_destino == 7
    db.commit.assert_called_once()


def test_listar_notificaciones_del_usuario(client, db):
    db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [notificacion_falsa()]
    respuesta = client.get("/notificaciones/", headers=con_sesion("Cliente"))
    assert respuesta.status_code == 200
    assert respuesta.json()[0]["mensaje"] == "Hola"


def test_marcar_una_notificacion_como_leida(client, db):
    notificacion = notificacion_falsa(leida=False)
    db.query.return_value.filter.return_value.first.return_value = notificacion

    respuesta = client.put("/notificaciones/1/leer", headers=con_sesion("Cliente"))

    assert respuesta.status_code == 200
    assert respuesta.json()["leida"] is True
    db.commit.assert_called_once()


def test_marcar_como_leida_una_notificacion_ajena_responde_404(client, db):
    db.query.return_value.filter.return_value.first.return_value = None
    respuesta = client.put("/notificaciones/1/leer", headers=con_sesion("Cliente"))
    assert respuesta.status_code == 404
    db.commit.assert_not_called()


def test_marcar_todas_como_leidas_actualiza_en_bloque(client, db):
    respuesta = client.put("/notificaciones/leer-todas", headers=con_sesion("Cliente"))
    assert respuesta.status_code == 200
    db.query.return_value.filter.return_value.update.assert_called_once_with({"leida": True})
    db.commit.assert_called_once()


# ── Vistas: qué ve cada rol ───────────────────────────────────────────────────

def filas(db, datos):
    db.execute.return_value.mappings.return_value.all.return_value = datos


def test_resumen_de_inspecciones_devuelve_las_filas_de_la_vista(client, db):
    filas(db, [{"id_inspeccion": 1}])
    respuesta = client.get("/vistas/resumen-inspecciones", headers=con_sesion("Cliente"))
    assert respuesta.json() == [{"id_inspeccion": 1}]


def test_el_administrador_ve_todo_con_el_procedimiento_almacenado(client, db):
    filas(db, [{"id_inspeccion": 1}])
    respuesta = client.get("/vistas/inspecciones-por-estado/Finalizada", headers=con_sesion("Administrador"))
    assert respuesta.json() == [{"id_inspeccion": 1}]
    assert "sp_listar_inspecciones_por_estado" in str(db.execute.call_args.args[0])


def test_el_cliente_solo_consulta_sus_propios_ascensores(client, db):
    # SPY: lo importante de seguridad es el parámetro que filtra por cliente
    filas(db, [])
    client.get("/vistas/inspecciones-por-estado/Finalizada", headers=con_sesion("Cliente", 7))
    assert db.execute.call_args.args[1] == {"estado": "Finalizada", "client_id": 7}


def test_el_inspector_solo_consulta_sus_propias_inspecciones(client, db):
    filas(db, [])
    client.get("/vistas/inspecciones-por-estado/Finalizada", headers=con_sesion("Inspector", 4))
    assert db.execute.call_args.args[1] == {"estado": "Finalizada", "inspector_id": 4}


def test_un_rol_sin_permiso_recibe_403_y_no_consulta_la_bd(client, db):
    respuesta = client.get("/vistas/inspecciones-por-estado/Finalizada", headers=con_sesion("Asesor"))
    assert respuesta.status_code == 403
    db.execute.assert_not_called()


def test_vistas_rechaza_un_token_invalido(client):
    respuesta = client.get(
        "/vistas/inspecciones-por-estado/Finalizada", headers={"Authorization": "Bearer basura"}
    )
    assert respuesta.status_code == 401
    assert respuesta.json()["detail"] == "Token inválido"


# ── Auditoría (solo Administrador) ────────────────────────────────────────────

def test_auditoria_rechaza_a_quien_no_es_administrador(client):
    respuesta = client.get("/auditoria/", headers=con_sesion("Cliente"))
    assert respuesta.status_code == 403


def test_auditoria_aplica_los_dos_filtros_y_devuelve_lista(client, db):
    consulta = db.query.return_value.options.return_value
    consulta.filter.return_value = consulta  # cada filtro devuelve la misma consulta
    consulta.order_by.return_value.all.return_value = []

    respuesta = client.get("/auditoria/?tabla=usuario&usuario=3", headers=con_sesion("Administrador"))

    assert respuesta.status_code == 200
    assert respuesta.json() == []
    assert consulta.filter.call_count == 2  # SPY: uno por tabla y otro por usuario