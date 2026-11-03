"""RNF-003: contraseñas y firmas cifradas con AES-256-GCM."""
import pytest
from cryptography.exceptions import InvalidTag

from app.utils import cifrado
from app.utils.cifrado import (PREFIJO_TEXTO, TextoCifrado, cifrar_contrasena, cifrar_texto,
                               descifrar_contrasena, descifrar_texto, es_formato_nuevo)


def test_la_clave_es_de_256_bits():
    assert len(cifrado._clave()) == 32


def test_contrasena_se_cifra_y_se_descifra():
    c = cifrar_contrasena("Segura#2026")
    assert es_formato_nuevo(c) and b"Segura" not in c
    assert descifrar_contrasena(c) == "Segura#2026"


def test_cada_cifrado_es_distinto_aunque_la_clave_sea_igual():
    assert cifrar_contrasena("123456") != cifrar_contrasena("123456")


def test_un_dato_alterado_no_se_puede_descifrar():
    c = bytearray(cifrar_contrasena("123456"))
    c[-1] ^= 1
    with pytest.raises(InvalidTag):
        descifrar_contrasena(bytes(c))


def test_firma_cifrada_y_lectura_de_firmas_antiguas():
    firma = "data:image/png;base64,iVBORw0KGgo"
    cifrada = cifrar_texto(firma)
    assert cifrada.startswith(PREFIJO_TEXTO) and "iVBOR" not in cifrada
    assert descifrar_texto(cifrada) == firma
    assert cifrar_texto(cifrada) == cifrada          # no se cifra dos veces
    assert descifrar_texto("firma_vieja_sin_cifrar") == "firma_vieja_sin_cifrar"
    assert cifrar_texto(None) is None and descifrar_texto(None) is None


def test_la_columna_cifra_al_guardar_y_descifra_al_leer():
    col = TextoCifrado()
    guardado = col.process_bind_param("mi firma", None)
    assert guardado.startswith(PREFIJO_TEXTO)
    assert col.process_result_value(guardado, None) == "mi firma"


def test_la_contrasena_en_formato_viejo_no_es_formato_nuevo():
    assert not es_formato_nuevo(b"\x01\x02aes128ecb")
    assert not es_formato_nuevo(None)
