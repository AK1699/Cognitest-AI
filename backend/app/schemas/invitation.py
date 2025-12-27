"""
User Invitation Schemas
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.models.invitation import InvitationStatus


class InvitationCreate(BaseModel):
    """Schema for creating a new invitation"""
    email: EmailStr = Field(..., description="Email address of the user to invite")
    full_name: Optional[str] = Field(None, description="Full name of the user")
    organisation_id: UUID = Field(..., description="Organisation ID")
    group_ids: Optional[List[UUID]] = Field(None, description="Groups to add user to after signup")
    expiry_days: int = Field(7, ge=1, le=30, description="Number of days until invitation expires")
    role_id: Optional[UUID] = Field(None, description="Role ID to assign to user at organization level")
    role: Optional[str] = Field(None, description="Organization role (e.g., 'admin', 'member', 'viewer')")


class InvitationResponse(BaseModel):
    """Schema for invitation response"""
    id: UUID
    email: str
    full_name: Optional[str]
    organisation_id: UUID
    invitation_token: str
    status: InvitationStatus
    invited_by: Optional[UUID]
    created_at: datetime
    expires_at: datetime
    accepted_at: Optional[datetime]
    role: Optional[str]

    class Config:
        from_attributes = True


class InvitationAccept(BaseModel):
    """Schema for accepting an invitation"""
    invitation_token: str = Field(..., description="Unique invitation token from email")
    username: str = Field(..., min_length=3, max_length=50, description="Desired username")
    password: str = Field(..., min_length=8, description="Password")
    full_name: Optional[str] = Field(None, description="Full name (if not provided in invitation)")


class InvitationList(BaseModel):
    """Schema for list of invitations"""
    invitations: List[InvitationResponse]
    total: int


class InvitationResend(BaseModel):
    """Schema for resending an invitation"""
    invitation_id: UUID = Field(..., description="Invitation ID to resend")
