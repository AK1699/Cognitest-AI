import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from app.core.config import settings


def render_template(template_name: str, **kwargs) -> str:
    """Render an HTML email template with the given context."""
    template_path = Path(__file__).parent.parent / "templates" / template_name

    if not template_path.exists():
        raise FileNotFoundError(f"Template {template_name} not found")

    with open(template_path, "r") as f:
        template_content = f.read()

    # Simple template rendering - replace {{ variable }} with values
    for key, value in kwargs.items():
        template_content = template_content.replace(f"{{{{ {key} }}}}", str(value))

    return template_content


async def send_email(
    email_to: str,
    subject: str,
    body: str,
    html_body: str = None,
) -> None:
    """Send an email with optional HTML body."""
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD or not settings.EMAILS_FROM_EMAIL:
        print("SMTP settings are not fully configured. Skipping email sending.")
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    message["To"] = email_to

    # Create the plain-text and HTML version of your message
    part1 = MIMEText(body, "plain")
    message.attach(part1)

    if html_body:
        part2 = MIMEText(html_body, "html")
        message.attach(part2)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, email_to, message.as_string())
        print(f"Email sent to {email_to} with subject: {subject}")
    except Exception as e:
        print(f"Failed to send email to {email_to}: {e}")
