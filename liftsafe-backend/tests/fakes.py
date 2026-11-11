"""Dobles de prueba para las pruebas de API (semana 4).

Reemplazan la sesión de SQLAlchemy: ningún test necesita MySQL, Docker ni la BD
de desarrollo. Cada consulta devuelve lo que el test dejó preparado.
"""
import time
from types import SimpleNamespace

from jose import jwt
from sqlalchemy import inspect as sa_inspect

from app.config import settings


class FakeQuery:
    """Consulta encadenable: db.query(X).join(...).filter(...).order_by(...).all()"""

    def __init__(self, session):
        self._session = session

    def _chain(self, *_args, **_kwargs):
        return self

    join = outerjoin = filter = filter_by = order_by = group_by = distinct = limit = offset = _chain

    def first(self):
        return self._session._next(self._session.firsts, None)

    def all(self):
        return self._session._next(self._session.alls, [])

    def count(self):
        return self._session.count_value


class FakeResult:
    """Resultado de db.execute(text(...)).mappings().first()"""

    def __init__(self, rows):
        self._rows = rows

    def mappings(self):
        return self

    def first(self):
        return self._rows[0] if self._rows else None

    def all(self):
        return list(self._rows)


class FakeSession:
    """Doble de Session.

    firsts: valores que devuelven, en orden, las llamadas a .first()
    alls:   listas que devuelven, en orden, las llamadas a .all()
    count_value: lo que devuelve .count()
    exec_rows: filas de db.execute(...)
    error: si se da, cualquier db.query(...) lanza esa excepción (simula una BD caída)
    """

    def __init__(self, firsts=(), alls=(), count_value=0, exec_rows=(), error=None):
        self.firsts = list(firsts)
        self.alls = list(alls)
        self.count_value = count_value
        self.exec_rows = list(exec_rows)
        self.error = error
        self.added = []
        self.deleted = []
        self.commits = 0

    @staticmethod
    def _next(queue, default):
        return queue.pop(0) if queue else default

    def query(self, *_args, **_kwargs):
        if self.error:
            raise self.error
        return FakeQuery(self)

    def execute(self, *_args, **_kwargs):
        if self.error:
            raise self.error
        return FakeResult(self.exec_rows)

    def add(self, obj):
        self.added.append(obj)

    def delete(self, obj):
        self.deleted.append(obj)

    def commit(self):
        self.commits += 1

    def refresh(self, obj):
        # Simula que la BD asignó la clave primaria al insertar
        pk = sa_inspect(obj).mapper.primary_key[0].name
        if getattr(obj, pk) is None:
            setattr(obj, pk, 99)

    def close(self):
        pass


def fila(**campos):
    """Objeto con atributos, como una fila/modelo devuelto por SQLAlchemy."""
    return SimpleNamespace(**campos)


# ── Autenticación en tests ───────────────────────────────────────────────────
def token_para(rol="Administrador", user_id=1, correo="usuario@example.com", **extra):
    """JWT firmado con la clave de PRUEBA (la que conftest.py fija en SECRET_KEY)."""
    claims = {"sub": correo, "user_id": user_id, "rol": rol, **extra}
    return jwt.encode(claims, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def auth(rol="Administrador", user_id=1, **extra):
    """Encabezado Authorization listo para pasar a client.get(..., headers=auth('Cliente'))."""
    return {"Authorization": f"Bearer {token_para(rol, user_id, **extra)}"}


def token_vencido(rol="Administrador"):
    return jwt.encode(
        {"sub": "a@example.com", "user_id": 1, "rol": rol, "exp": int(time.time()) - 60},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
