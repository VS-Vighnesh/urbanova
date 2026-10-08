import smtplib
from email.message import EmailMessage

from app.config import get_settings

settings = get_settings()


class EmailConfigurationError(RuntimeError):
    pass


def send_support_email(
    *,
    customer_name: str,
    customer_email: str,
    subject: str,
    message: str,
    ticket_number: str,
    ai_response: str,
) -> None:
    if not all((
        settings.SMTP_HOST,
        settings.SMTP_USERNAME,
        settings.SMTP_PASSWORD,
        settings.SMTP_FROM_EMAIL,
    )):
        raise EmailConfigurationError(
            "Support email delivery is not configured. Set SMTP_HOST, SMTP_USERNAME, "
            "SMTP_PASSWORD, and SMTP_FROM_EMAIL in the backend environment."
        )

    email = EmailMessage()
    email["Subject"] = f"[Urbanova Support] {subject.replace(chr(10), ' ').replace(chr(13), ' ')}"
    email["From"] = settings.SMTP_FROM_EMAIL
    email["To"] = settings.SUPPORT_EMAIL
    if customer_email:
        email["Reply-To"] = customer_email
    email.set_content(
        f"Ticket: {ticket_number}\n"
        f"From: {customer_name} <{customer_email}>\n\n"
        f"Customer message:\n{message}\n\n"
        f"AI support response:\n{ai_response or 'A support agent will follow up.'}\n"
    )

    if settings.SMTP_USE_SSL:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(email)
    else:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(email)
