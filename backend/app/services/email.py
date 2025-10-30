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
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                }}
                .content {{
                    background: #ffffff;
                    padding: 30px;
                    border: 1px solid #e0e0e0;
                    border-top: none;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 30px;
                    background: #667eea;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    margin: 20px 0;
                }}
                .footer {{
                    background: #f5f5f5;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-radius: 0 0 10px 10px;
                }}
                .info-box {{
                    background: #f0f4ff;
                    padding: 15px;
                    border-left: 4px solid #667eea;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎉 Welcome to CogniTest!</h1>
            </div>

            <div class="content">
                <p>Hi{f' {full_name}' if full_name else ''},</p>

                <p><strong>{inviter_name}</strong> has invited you to join <strong>{organisation_name}</strong> on <strong>CogniTest</strong>, an AI-powered testing platform.</p>

                <div class="info-box">
                    <strong>What is CogniTest?</strong><br>
                    CogniTest is a comprehensive testing platform with modules for:
                    <ul>
                        <li>🤖 Automation Hub - Automate your testing workflows</li>
                        <li>🔌 API Testing - Test and validate APIs</li>
                        <li>📋 Test Management - Organize test cases and suites</li>
                        <li>🔒 Security Testing - Security scanning and compliance</li>
                        <li>⚡ Performance Testing - Load and stress testing</li>
                        <li>📱 Mobile Testing - Mobile app testing</li>
                    </ul>
                </div>

                <p>Click the button below to create your account and get started:</p>

                <div style="text-align: center;">
                    <a href="{invitation_url}" class="button">Accept Invitation & Sign Up</a>
                </div>

                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    <strong>Note:</strong> This invitation will expire in <strong>{expires_in_days} days</strong>.
                </p>

                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

                <p style="font-size: 12px; color: #666;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="{invitation_url}" style="color: #667eea;">{invitation_url}</a>
                </p>
            </div>

            <div class="footer">
                <p>This is an automated email from CogniTest. Please do not reply to this email.</p>
                <p>&copy; {organisation_name} • Powered by CogniTest</p>
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
