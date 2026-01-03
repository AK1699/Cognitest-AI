import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from pathlib import Path

def render_template(template_name: str, **kwargs) -> str:
    """Render an HTML email template with the given context."""
    # Templates are located in the same directory as this file in a 'templates' folder
    template_path = Path(__file__).parent / "templates" / template_name

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
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_password: str,
    from_email: str,
    from_name: str,
    html_body: str = None,
    use_tls: bool = True
) -> None:
    """Send an email with optional HTML body."""
    if not smtp_host or not smtp_user or not smtp_password:
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{from_name} <{from_email}>"
    message["To"] = email_to

    part1 = MIMEText(body, "plain")
    message.attach(part1)

    if html_body:
        part2 = MIMEText(html_body, "html")
        message.attach(part2)

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            if use_tls:
                server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, email_to, message.as_string())
    except Exception as e:
        print(f"Failed to send email to {email_to}: {e}")
