from cognitest_common import send_email, render_template
from ..core.config import settings

class EmailService:
    @staticmethod
    async def send_invitation_email(
        to_email: str,
        full_name: str,
        organisation_name: str,
        inviter_name: str,
        invitation_token: str,
        expires_in_days: int
    ):
        subject = f"You've been invited to join {organisation_name} on Cognitest"
        
        # In a real microservices world, this URL would come from config
        invitation_url = f"{settings.FRONTEND_URL}/accept-invitation?token={invitation_token}"
        
        context = {
            "full_name": full_name,
            "organisation_name": organisation_name,
            "inviter_name": inviter_name,
            "invitation_url": invitation_url,
            "expires_in_days": expires_in_days
        }
        
        # Fallback to plain text if template fails (though it shouldn't)
        body = f"Hello {full_name},\n\nYou have been invited to join {organisation_name} by {inviter_name}.\nClick the link below to accept your invitation:\n{invitation_url}"
        
        try:
            html_body = render_template("invitation_email.html", **context)
        except Exception:
            html_body = None
            
        await send_email(
            email_to=to_email,
            subject=subject,
            body=body,
            html_body=html_body,
            smtp_host=settings.SMTP_HOST,
            smtp_port=settings.SMTP_PORT,
            smtp_user=settings.SMTP_USER,
            smtp_password=settings.SMTP_PASSWORD,
            from_email=settings.EMAILS_FROM_EMAIL,
            from_name=settings.EMAILS_FROM_NAME,
            use_tls=settings.SMTP_TLS
        )

email_service = EmailService()
