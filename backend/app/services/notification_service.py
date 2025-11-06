"""
Notification Service for sending notifications about issues, assignments, and updates
"""
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
from uuid import UUID

from app.services.email import send_email  # Assuming email service exists

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service for managing notifications across the platform
    """

    def __init__(self):
        """Initialize notification service"""
        pass

    async def notify_issue_assigned(
        self,
        issue_id: UUID,
        issue_title: str,
        assigned_to_email: str,
        assigned_to_name: str,
        assigned_by_name: str,
        project_name: str,
        issue_url: str,
    ) -> bool:
        """
        Notify user when an issue is assigned to them

        Args:
            issue_id: Issue ID
            issue_title: Issue title
            assigned_to_email: Assignee email
            assigned_to_name: Assignee name
            assigned_by_name: Name of person who assigned
            project_name: Project name
            issue_url: URL to view the issue

        Returns:
            Success status
        """
        try:
            subject = f"Issue Assigned: {issue_title}"

            body = f"""
            <html>
            <body>
                <h2>You have been assigned a new issue</h2>
                <p>Hi {assigned_to_name},</p>
                <p><strong>{assigned_by_name}</strong> has assigned you an issue in <strong>{project_name}</strong>:</p>

                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                    <h3 style="margin-top: 0;">{issue_title}</h3>
                    <p><strong>Issue ID:</strong> {issue_id}</p>
                </div>

                <p>
                    <a href="{issue_url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                        View Issue
                    </a>
                </p>

                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    This is an automated notification from Cognitest AI.
                </p>
            </body>
            </html>
            """

            await send_email(
                to_email=assigned_to_email,
                subject=subject,
                body=body,
            )

            logger.info(f"Sent assignment notification for issue {issue_id} to {assigned_to_email}")
            return True

        except Exception as e:
            logger.error(f"Error sending assignment notification: {e}")
            return False

    async def notify_issue_status_changed(
        self,
        issue_id: UUID,
        issue_title: str,
        old_status: str,
        new_status: str,
        changed_by_name: str,
        stakeholder_emails: List[str],
        project_name: str,
        issue_url: str,
        notes: Optional[str] = None,
    ) -> bool:
        """
        Notify stakeholders when issue status changes

        Args:
            issue_id: Issue ID
            issue_title: Issue title
            old_status: Previous status
            new_status: New status
            changed_by_name: Person who changed status
            stakeholder_emails: List of emails to notify
            project_name: Project name
            issue_url: URL to view the issue
            notes: Optional status change notes

        Returns:
            Success status
        """
        try:
            subject = f"Issue Status Updated: {issue_title}"

            notes_html = ""
            if notes:
                notes_html = f"<p><strong>Notes:</strong> {notes}</p>"

            body = f"""
            <html>
            <body>
                <h2>Issue Status Updated</h2>
                <p><strong>{changed_by_name}</strong> updated the status of an issue in <strong>{project_name}</strong>:</p>

                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
                    <h3 style="margin-top: 0;">{issue_title}</h3>
                    <p><strong>Status Change:</strong> {old_status} → {new_status}</p>
                    {notes_html}
                </div>

                <p>
                    <a href="{issue_url}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                        View Issue
                    </a>
                </p>

                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    This is an automated notification from Cognitest AI.
                </p>
            </body>
            </html>
            """

            # Send to all stakeholders
            for email in stakeholder_emails:
                await send_email(
                    to_email=email,
                    subject=subject,
                    body=body,
                )

            logger.info(f"Sent status change notification for issue {issue_id} to {len(stakeholder_emails)} recipients")
            return True

        except Exception as e:
            logger.error(f"Error sending status change notification: {e}")
            return False

    async def notify_issue_commented(
        self,
        issue_id: UUID,
        issue_title: str,
        comment: str,
        commenter_name: str,
        stakeholder_emails: List[str],
        project_name: str,
        issue_url: str,
    ) -> bool:
        """
        Notify stakeholders when a comment is added to an issue

        Args:
            issue_id: Issue ID
            issue_title: Issue title
            comment: Comment text
            commenter_name: Person who commented
            stakeholder_emails: List of emails to notify
            project_name: Project name
            issue_url: URL to view the issue

        Returns:
            Success status
        """
        try:
            subject = f"New Comment on Issue: {issue_title}"

            # Truncate comment if too long
            comment_preview = comment[:200] + "..." if len(comment) > 200 else comment

            body = f"""
            <html>
            <body>
                <h2>New Comment on Issue</h2>
                <p><strong>{commenter_name}</strong> commented on an issue in <strong>{project_name}</strong>:</p>

                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0;">
                    <h3 style="margin-top: 0;">{issue_title}</h3>
                    <div style="background-color: white; padding: 10px; margin-top: 10px; border-radius: 4px;">
                        <p style="margin: 0;">{comment_preview}</p>
                    </div>
                </div>

                <p>
                    <a href="{issue_url}" style="background-color: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                        View Issue & Comment
                    </a>
                </p>

                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    This is an automated notification from Cognitest AI.
                </p>
            </body>
            </html>
            """

            # Send to all stakeholders (excluding commenter)
            for email in stakeholder_emails:
                await send_email(
                    to_email=email,
                    subject=subject,
                    body=body,
                )

            logger.info(f"Sent comment notification for issue {issue_id} to {len(stakeholder_emails)} recipients")
            return True

        except Exception as e:
            logger.error(f"Error sending comment notification: {e}")
            return False

    async def notify_issue_resolved(
        self,
        issue_id: UUID,
        issue_title: str,
        resolved_by_name: str,
        resolution: str,
        resolution_notes: Optional[str],
        reporter_email: str,
        reporter_name: str,
        project_name: str,
        issue_url: str,
    ) -> bool:
        """
        Notify reporter when their issue is resolved

        Args:
            issue_id: Issue ID
            issue_title: Issue title
            resolved_by_name: Person who resolved
            resolution: Resolution type
            resolution_notes: Resolution notes
            reporter_email: Reporter email
            reporter_name: Reporter name
            project_name: Project name
            issue_url: URL to view the issue

        Returns:
            Success status
        """
        try:
            subject = f"Issue Resolved: {issue_title}"

            notes_html = ""
            if resolution_notes:
                notes_html = f"""
                <div style="background-color: white; padding: 10px; margin-top: 10px; border-radius: 4px;">
                    <p><strong>Resolution Notes:</strong></p>
                    <p>{resolution_notes}</p>
                </div>
                """

            body = f"""
            <html>
            <body>
                <h2>Issue Resolved</h2>
                <p>Hi {reporter_name},</p>
                <p>Your issue has been resolved by <strong>{resolved_by_name}</strong> in <strong>{project_name}</strong>:</p>

                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                    <h3 style="margin-top: 0;">{issue_title}</h3>
                    <p><strong>Resolution:</strong> {resolution}</p>
                    {notes_html}
                </div>

                <p>
                    <a href="{issue_url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                        View Issue
                    </a>
                </p>

                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    This is an automated notification from Cognitest AI.
                </p>
            </body>
            </html>
            """

            await send_email(
                to_email=reporter_email,
                subject=subject,
                body=body,
            )

            logger.info(f"Sent resolution notification for issue {issue_id} to {reporter_email}")
            return True

        except Exception as e:
            logger.error(f"Error sending resolution notification: {e}")
            return False

    async def notify_test_plan_created(
        self,
        test_plan_id: UUID,
        test_plan_name: str,
        created_by_name: str,
        team_member_emails: List[str],
        project_name: str,
        test_plan_url: str,
    ) -> bool:
        """
        Notify team members when a new test plan is created

        Args:
            test_plan_id: Test plan ID
            test_plan_name: Test plan name
            created_by_name: Creator name
            team_member_emails: List of team member emails
            project_name: Project name
            test_plan_url: URL to view test plan

        Returns:
            Success status
        """
        try:
            subject = f"New Test Plan Created: {test_plan_name}"

            body = f"""
            <html>
            <body>
                <h2>New Test Plan Created</h2>
                <p><strong>{created_by_name}</strong> created a new test plan in <strong>{project_name}</strong>:</p>

                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #9C27B0; margin: 20px 0;">
                    <h3 style="margin-top: 0;">{test_plan_name}</h3>
                </div>

                <p>
                    <a href="{test_plan_url}" style="background-color: #9C27B0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                        View Test Plan
                    </a>
                </p>

                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    This is an automated notification from Cognitest AI.
                </p>
            </body>
            </html>
            """

            for email in team_member_emails:
                await send_email(
                    to_email=email,
                    subject=subject,
                    body=body,
                )

            logger.info(f"Sent test plan creation notification to {len(team_member_emails)} recipients")
            return True

        except Exception as e:
            logger.error(f"Error sending test plan notification: {e}")
            return False

    async def notify_integration_sync_completed(
        self,
        integration_name: str,
        sync_status: str,
        items_synced: int,
        items_failed: int,
        admin_emails: List[str],
        errors: List[str],
    ) -> bool:
        """
        Notify admins when an integration sync completes

        Args:
            integration_name: Integration name
            sync_status: Sync status (success, failed, partial)
            items_synced: Number of items synced
            items_failed: Number of items failed
            admin_emails: List of admin emails
            errors: List of error messages

        Returns:
            Success status
        """
        try:
            status_color = {
                "success": "#4CAF50",
                "failed": "#f44336",
                "partial": "#FF9800",
            }.get(sync_status, "#2196F3")

            subject = f"Integration Sync {sync_status.upper()}: {integration_name}"

            errors_html = ""
            if errors:
                error_list = "".join([f"<li>{error}</li>" for error in errors[:5]])
                errors_html = f"""
                <div style="background-color: #ffebee; padding: 10px; margin-top: 10px; border-radius: 4px;">
                    <p><strong>Errors:</strong></p>
                    <ul>{error_list}</ul>
                </div>
                """

            body = f"""
            <html>
            <body>
                <h2>Integration Sync Completed</h2>
                <p>Sync operation for <strong>{integration_name}</strong> has completed:</p>

                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid {status_color}; margin: 20px 0;">
                    <p><strong>Status:</strong> {sync_status.upper()}</p>
                    <p><strong>Items Synced:</strong> {items_synced}</p>
                    <p><strong>Items Failed:</strong> {items_failed}</p>
                    {errors_html}
                </div>

                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px;">
                    This is an automated notification from Cognitest AI.
                </p>
            </body>
            </html>
            """

            for email in admin_emails:
                await send_email(
                    to_email=email,
                    subject=subject,
                    body=body,
                )

            logger.info(f"Sent integration sync notification to {len(admin_emails)} admins")
            return True

        except Exception as e:
            logger.error(f"Error sending integration sync notification: {e}")
            return False


# Singleton instance
_notification_service: Optional[NotificationService] = None


def get_notification_service() -> NotificationService:
    """
    Get singleton notification service instance

    Returns:
        NotificationService instance
    """
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service
