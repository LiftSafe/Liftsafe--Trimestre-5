"""El Administrador gestiona a todos; el Asesor solo a los clientes."""
import pytest
from fastapi import HTTPException

from app.controllers.gestion_usuarios_controller import exigir_gestor, exigir_rol_permitido, solo_clientes


@pytest.mark.parametrize("rol", ["Administrador", "Asesor"])
def test_admin_y_asesor_gestionan_usuarios(rol):
    assert exigir_gestor(rol) == rol


@pytest.mark.parametrize("rol", ["Coordinador", "Inspector", "Cliente", "Director Técnico", None])
def test_los_demas_roles_no_gestionan_usuarios(rol):
    with pytest.raises(HTTPException) as error:
        exigir_gestor(rol)
    assert error.value.status_code == 403


def test_el_asesor_solo_trabaja_con_clientes():
    exigir_rol_permitido("Asesor", "Cliente")
    for rol in ["Administrador", "Inspector", "Coordinador", None]:
        with pytest.raises(HTTPException) as error:
            exigir_rol_permitido("Asesor", rol)
        assert "solo puede gestionar clientes" in error.value.detail


def test_el_administrador_trabaja_con_cualquier_rol():
    for rol in ["Administrador", "Inspector", "Cliente"]:
        exigir_rol_permitido("Administrador", rol)
    assert solo_clientes("Asesor") and not solo_clientes("Administrador")
