"""
Email Integration
Send emails via SMTP or email service APIs
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional, List
from .base import (
    BaseIntegration,
    IntegrationConfig,
    IntegrationCategory,
    IntegrationResult,
    IntegrationRegistry
)


@IntegrationRegistry.register("email")
class EmailIntegration(BaseIntegration):
    """
    Email integration for sending emails via SMTP.
    Supports HTML and plain text emails with attachments.
    """
    
    @property
    def config(self) -> IntegrationConfig:
        return IntegrationConfig(
            type="email",
            name="Email",
            description="Send emails via SMTP",
            category=IntegrationCategory.COMMUNICATION,
            icon="mail",
            color="#EA4335",
            auth_type="custom",
            config_schema={
                "type": "object",
                "required": ["to", "subject"],
                "properties": {
                    "to": {
                        "type": "string",
                        "title": "To",
                        "description": "Recipient email addresses (comma-separated)"
                    },
                    "cc": {
                        "type": "string",
                        "title": "CC",
                        "description": "CC email addresses (comma-separated)"
                    },
                    "bcc": {
                        "type": "string",
                        "title": "BCC",
                        "description": "BCC email addresses (comma-separated)"
                    },
                    "subject": {
                        "type": "string",
                        "title": "Subject"
                    },
                    "body": {
                        "type": "string",
                        "title": "Body",
                        "description": "Email body content"
                    },
                    "body_type": {
                        "type": "string",
                        "enum": ["plain", "html"],
                        "default": "plain",
                        "title": "Body Type"
                    },
                    "from_name": {
                        "type": "string",
                        "title": "From Name",
                        "description": "Sender display name"
                    },
                    "reply_to": {
                        "type": "string",
                        "title": "Reply-To",
                        "description": "Reply-to email address"
                    }
                }
            },
            credential_fields=[
                {"name": "smtp_host", "type": "text", "required": True, "title": "SMTP Host"},
                {"name": "smtp_port", "type": "number", "required": True, "title": "SMTP Port"},
                {"name": "smtp_user", "type": "text", "required": True, "title": "SMTP Username"},
                {"name": "smtp_password", "type": "password", "required": True, "title": "SMTP Password"},
                {"name": "smtp_tls", "type": "boolean", "required": False, "title": "Use TLS"},
                {"name": "from_email", "type": "text", "required": True, "title": "From Email"},
            ]
        )
    
    async def execute(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> IntegrationResult:
        result = IntegrationResult(success=False)
        result.add_log("info", "Starting email send")
        
        if not credentials:
            result.error = "SMTP credentials are required"
            result.error_type = "missing_credentials"
            return result
        
        # Get recipients
        to_emails = self._parse_emails(
            self.interpolate_variables(node_config.get("to", ""), input_data)
        )
        if not to_emails:
            result.error = "At least one recipient is required"
            result.error_type = "missing_config"
            return result
        
        cc_emails = self._parse_emails(
            self.interpolate_variables(node_config.get("cc", ""), input_data)
        )
        bcc_emails = self._parse_emails(
            self.interpolate_variables(node_config.get("bcc", ""), input_data)
        )
        
        # Build email
        subject = self.interpolate_variables(node_config.get("subject", ""), input_data)
        body = self.interpolate_variables(node_config.get("body", ""), input_data)
        body_type = node_config.get("body_type", "plain")
        
        from_email = credentials.get("from_email", credentials.get("smtp_user"))
        from_name = node_config.get("from_name", "")
        
        # Create message
        if body_type == "html":
            msg = MIMEMultipart("alternative")
            msg.attach(MIMEText(body, "plain"))
            msg.attach(MIMEText(body, "html"))
        else:
            msg = MIMEMultipart()
            msg.attach(MIMEText(body, "plain"))
        
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>" if from_name else from_email
        msg["To"] = ", ".join(to_emails)
        
        if cc_emails:
            msg["Cc"] = ", ".join(cc_emails)
        
        if node_config.get("reply_to"):
            msg["Reply-To"] = self.interpolate_variables(node_config["reply_to"], input_data)
        
        # All recipients
        all_recipients = to_emails + cc_emails + bcc_emails
        
        result.add_log("info", f"Sending email to {len(all_recipients)} recipients")
        
        try:
            smtp_host = credentials.get("smtp_host")
            smtp_port = int(credentials.get("smtp_port", 587))
            smtp_user = credentials.get("smtp_user")
            smtp_password = credentials.get("smtp_password")
            use_tls = credentials.get("smtp_tls", True)
            
            await aiosmtplib.send(
                msg,
                hostname=smtp_host,
                port=smtp_port,
                username=smtp_user,
                password=smtp_password,
                start_tls=use_tls,
                recipients=all_recipients
            )
            
            result.success = True
            result.data = {
                "to": to_emails,
                "cc": cc_emails,
                "bcc": bcc_emails,
                "subject": subject,
                "from": from_email
            }
            result.add_log("info", "Email sent successfully")
        
        except aiosmtplib.SMTPAuthenticationError as e:
            result.error = f"SMTP authentication failed: {str(e)}"
            result.error_type = "auth_error"
            result.add_log("error", result.error)
        except aiosmtplib.SMTPConnectError as e:
            result.error = f"Failed to connect to SMTP server: {str(e)}"
            result.error_type = "connection_error"
            result.add_log("error", result.error)
        except Exception as e:
            result.error = f"Failed to send email: {str(e)}"
            result.error_type = "unknown_error"
            result.add_log("error", result.error)
        
        return result
    
    def _parse_emails(self, emails_str: str) -> List[str]:
        """Parse comma-separated email list"""
        if not emails_str:
            return []
        return [e.strip() for e in emails_str.split(",") if e.strip()]
    
    async def test_connection(self, credentials: Dict[str, Any]) -> IntegrationResult:
        result = IntegrationResult(success=False)
        
        try:
            smtp_host = credentials.get("smtp_host")
            smtp_port = int(credentials.get("smtp_port", 587))
            smtp_user = credentials.get("smtp_user")
            smtp_password = credentials.get("smtp_password")
            use_tls = credentials.get("smtp_tls", True)
            
            async with aiosmtplib.SMTP(
                hostname=smtp_host,
                port=smtp_port,
                start_tls=use_tls
            ) as smtp:
                await smtp.login(smtp_user, smtp_password)
            
            result.success = True
            result.data = {"message": "SMTP connection successful"}
        
        except Exception as e:
            result.error = f"Connection test failed: {str(e)}"
        
        return result
