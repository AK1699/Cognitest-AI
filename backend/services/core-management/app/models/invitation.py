"""
User Invitation Model

Handles email-based user invitations with token-based acceptance flow.
"""

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime, timedelta

from cognitest_common import Base


class InvitationStatus(str, enum.Enum):
    """Invitation status"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    REVOKED = "revoked"


class UserInvitation(Base):
    """
    User invitation for email-based onboarding.

    When an organization invites a user, this creates an invitation record.
    The invited user receives an email with a unique token to sign up.
    """
    __tablename__ = "user_invitations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)

    # Invited user details
    email = Column(String(255), nullable=False, index=True)
    full_name = Column(String(255), nullable=True)

    # Invitation metadata
    invitation_token = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(SQLEnum(InvitationStatus, values_callable=lambda obj: [e.value for e in obj]), default=InvitationStatus.PENDING, nullable=False)

    # Who invited
    invited_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)

    # Optional: Pre-assign to groups
    group_ids = Column(String, nullable=True)  # Comma-separated group IDs

    # Optional: Pre-assign role
    role_id = Column(UUID(as_uuid=True), nullable=True)  # Role to assign at organization level
    role = Column(String(50), nullable=True)  # Organization role (string)

    # Relationships
    organisation = relationship("Organisation")
    inviter = relationship("User", foreign_keys=[invited_by])

    def is_valid(self) -> bool:
        """Check if invitation is still valid"""
        if self.status != InvitationStatus.PENDING:
            return False
        if self.expires_at and datetime.now(self.expires_at.tzinfo) > self.expires_at:
            return False
        return True

    @staticmethod
    def generate_token() -> str:
        """Generate a unique invitation token"""
        return str(uuid.uuid4())

    @staticmethod
    def calculate_expiry(days: int = 7) -> datetime:
        """Calculate expiration date (default: 7 days)"""
        return datetime.utcnow() + timedelta(days=days)

    def __repr__(self):
        return f"<UserInvitation {self.email} - {self.status}>"
