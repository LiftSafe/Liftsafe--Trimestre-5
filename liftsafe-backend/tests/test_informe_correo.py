"""RF-014: el informe aprobado se envía por correo con el PDF adjunto."""
import asyncio
from unittest.mock import AsyncMock, patch

from app.controllers import email_controller


def test_envia_el_pdf_adjunto_con_copia(tmp_path):
    pdf = tmp_path / "INF-1.pdf"
    pdf.write_bytes(b"%PDF-1.4")
    with patch.object(email_controller, "FastMail") as fm:
        fm.return_value.send_message = AsyncMock()
        ok = asyncio.run(email_controller.send_informe_email(
            ["cliente@x.com"], "Camila", "ASC-001", "INF-1", str(pdf), copia=["coordi@x.com"]))
    assert ok is True
    mensaje = fm.return_value.send_message.await_args.args[0]
    assert [r.email for r in mensaje.recipients] == ["cliente@x.com"]
    assert [c.email for c in mensaje.cc] == ["coordi@x.com"]
    assert len(mensaje.attachments) == 1
    assert "INF-1" in mensaje.subject


def test_sin_pdf_o_sin_destinatario_no_envia(tmp_path):
    assert asyncio.run(email_controller.send_informe_email(["c@x.com"], "C", "A", "I", str(tmp_path / "no.pdf"))) is False
    assert asyncio.run(email_controller.send_informe_email([], "C", "A", "I", "x.pdf")) is False


def test_si_falla_el_correo_devuelve_false(tmp_path):
    pdf = tmp_path / "INF-2.pdf"
    pdf.write_bytes(b"%PDF")
    with patch.object(email_controller, "FastMail") as fm:
        fm.return_value.send_message = AsyncMock(side_effect=RuntimeError("smtp caído"))
        assert asyncio.run(email_controller.send_informe_email(["c@x.com"], "C", "A", "I", str(pdf))) is False
