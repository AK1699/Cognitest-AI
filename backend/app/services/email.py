"""
Email Service

Handles sending emails for user invitations, notifications, etc.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os

from app.core.config import settings


class EmailService:
    """Email service for sending invitations and notifications"""

    def __init__(self):
        self.smtp_host = settings.SMTP_HOST or "smtp.gmail.com"
        self.smtp_port = int(settings.SMTP_PORT or 587)
        self.smtp_user = settings.SMTP_USER or ""
        self.smtp_password = settings.SMTP_PASSWORD or ""
        self.from_email = settings.EMAILS_FROM_EMAIL or "noreply@cognitest.ai"
        self.from_name = settings.EMAILS_FROM_NAME or "CogniTest"

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text fallback (optional)

        Returns:
            True if sent successfully, False otherwise
        """
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email

            # Add text and HTML parts
            if text_content:
                part1 = MIMEText(text_content, "plain")
                message.attach(part1)

            part2 = MIMEText(html_content, "html")
            message.attach(part2)

            # For development: just print the email instead of sending
            if not self.smtp_user or not self.smtp_password:
                print(f"\n{'='*60}")
                print(f"📧 EMAIL (Development Mode)")
                print(f"{'='*60}")
                print(f"To: {to_email}")
                print(f"Subject: {subject}")
                print(f"\n{html_content}")
                print(f"{'='*60}\n")
                return True

            # Send email via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)

            print(f"✅ Email sent successfully to {to_email}")
            return True

        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {str(e)}")
            return False

    def send_invitation_email(
        self,
        to_email: str,
        full_name: Optional[str],
        organisation_name: str,
        inviter_name: str,
        invitation_token: str,
        expires_in_days: int = 7
    ) -> bool:
        """
        Send welcome invitation email

        Args:
            to_email: Email address of the invited user
            full_name: Full name of the invited user
            organisation_name: Name of the organization
            inviter_name: Name of the person who sent the invitation
            invitation_token: Unique invitation token
            expires_in_days: Number of days until invitation expires

        Returns:
            True if sent successfully, False otherwise
        """
        # Generate invitation URL
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        invitation_url = f"{frontend_url}/auth/accept-invitation?token={invitation_token}"

        # Email subject
        subject = f"You're invited to join {organisation_name} on CogniTest"

        # HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                    line-height: 1.6;
                    color: #1a1a1a;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 0;
                    background-color: #f8fafc;
                }}
                .container {{
                    background: #ffffff;
                    margin: 20px auto;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }}
                .header {{
                    background-color: #007780;
                    background-image: linear-gradient(135deg, #007780 0%, #006670 100%);
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 28px;
                    font-weight: 700;
                    letter-spacing: -0.025em;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .welcome-text {{
                    font-size: 18px;
                    font-weight: 600;
                    color: #007780;
                    margin-bottom: 20px;
                }}
                .invitation-text {{
                    font-size: 16px;
                    color: #4a5568;
                    margin-bottom: 30px;
                }}
                .info-box {{
                    background-color: #F2FDFA;
                    padding: 24px;
                    border-radius: 8px;
                    border-left: 4px solid #007780;
                    margin: 30px 0;
                }}
                .info-box strong {{
                    color: #005560;
                    font-size: 16px;
                    display: block;
                    margin-bottom: 12px;
                }}
                .info-box ul {{
                    margin: 0;
                    padding-left: 20px;
                    color: #334e4e;
                }}
                .info-box li {{
                    margin-bottom: 8px;
                }}
                .button-container {{
                    text-align: center;
                    margin: 35px 0;
                }}
                .button {{
                    display: inline-block;
                    padding: 14px 36px;
                    background-color: #007780;
                    color: #ffffff !important;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    transition: background-color 0.2s;
                }}
                .footer {{
                    background-color: #f1f5f9;
                    padding: 30px;
                    text-align: center;
                    font-size: 13px;
                    color: #64748b;
                }}
                .expiry-note {{
                    font-size: 14px;
                    color: #718096;
                    text-align: center;
                    margin-top: 20px;
                }}
                .link-fallback {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    font-size: 12px;
                    word-break: break-all;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>CogniTest</h1>
                </div>

                <div class="content">
                    <p class="welcome-text">Hi{f' {full_name}' if full_name else ''},</p>

                    <p class="invitation-text">
                        <strong>{inviter_name}</strong> has invited you to join <strong>{organisation_name}</strong> on <strong>CogniTest</strong>, the next-generation AI-powered testing platform.
                    </p>

                    <div class="info-box">
                        <strong>What can you do with CogniTest?</strong>
                        <ul>
                            <li><strong>Automation Hub:</strong> Effortlessly automate your testing workflows</li>
                            <li><strong>API Testing:</strong> Comprehensive validation for all your endpoints</li>
                            <li><strong>Test Management:</strong> Organize cases and suites with ease</li>
                            <li><strong>Security & Performance:</strong> Scalable scanning and stress testing</li>
                        </ul>
                    </div>

                    <p style="text-align: center; color: #4a5568;">Ready to dive in? Click below to set up your account:</p>

                    <div class="button-container">
                        <a href="{invitation_url}" class="button">Accept Invitation</a>
                    </div>

                    <p class="expiry-note">
                        This invitation will expire in <strong>{expires_in_days} days</strong>.
                    </p>

                    <div class="link-fallback">
                        If the button above doesn't work, copy and paste this URL into your browser:<br>
                        <a href="{invitation_url}" style="color: #007780;">{invitation_url}</a>
                    </div>
                </div>

                <div class="footer">
                    <p>You received this email because you were invited to CogniTest.</p>
                    <p><strong>&copy; {organisation_name}</strong> • Built with ❤️ by CogniTest</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Plain text fallback
        text_content = f"""
        Hi{f' {full_name}' if full_name else ''},

        {inviter_name} has invited you to join {organisation_name} on CogniTest.

        Click here to accept the invitation and create your account:
        {invitation_url}

        This invitation will expire in {expires_in_days} days.

        If you have any questions, please contact your organization administrator.

        Best regards,
        The CogniTest Team
        """

        return self.send_email(to_email, subject, html_content, text_content)


# Create singleton instance
email_service = EmailService()
