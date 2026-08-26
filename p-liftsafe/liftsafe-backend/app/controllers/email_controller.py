# app/controllers/email_controller.py

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# ✅ Configuración SSL para puerto 465
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,  # False
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,    # True
    USE_CREDENTIALS=True,
)

async def send_reset_email(email: str, code: str):
    """Envía un email con código numérico de 6 dígitos para recuperar contraseña."""
    
    # Loguear el código siempre (backup)
    logger.info(f"=" * 50)
    logger.info(f"🔐 CÓDIGO DE RECUPERACIÓN PARA: {email}")
    logger.info(f"🔢 CÓDIGO: {code}")
    logger.info(f"=" * 50)
    
    try:
        message = MessageSchema(
            subject="Código de recuperación de contraseña - LiftSafe",
            recipients=[email],
            body=f"""
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
                <h2 style="color: #1a1a2e; margin-bottom: 8px;">Recuperación de contraseña</h2>
                <p style="color: #555; margin-bottom: 24px;">Usa el siguiente código para restablecer tu contraseña en LiftSafe. Expira en <strong>1 hora</strong>.</p>
                <div style="background: #1a1a2e; color: #fff; font-size: 36px; font-weight: bold; letter-spacing: 12px; text-align: center; padding: 20px 16px; border-radius: 8px; margin-bottom: 24px;">
                    {code}
                </div>
                <p style="color: #888; font-size: 13px;">Si no solicitaste este código, puedes ignorar este mensaje. Tu cuenta permanece segura.</p>
            </div>
            """,
            subtype="html"
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"✅ Email enviado exitosamente a {email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error enviando email: {str(e)}")
        raise Exception(f"Error al enviar correo: {str(e)}")