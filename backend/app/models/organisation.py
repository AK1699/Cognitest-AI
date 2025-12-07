"""
Organisation and Role Models

Defines Organisation, OrganizationRole, and UserOrganisation models
for organization-level role-based access control.
"""

from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class OrgRoleType(str, enum.Enum):
    """Organization role types with hierarchy (higher = more permissions)"""
    OWNER = "owner"      # Full control - billing, delete org, manage all
    ADMIN = "admin"      # Manage users, settings, all features
    MEMBER = "member"    # Standard access to allowed features
    VIEWER = "viewer"    # Read-only access


# Role hierarchy: higher number = more permissions
ROLE_HIERARCHY = {
    OrgRoleType.VIEWER.value: 1,
    OrgRoleType.MEMBER.value: 2,
    OrgRoleType.ADMIN.value: 3,
    OrgRoleType.OWNER.value: 4,
}


# Default permissions for each role type
DEFAULT_ROLE_PERMISSIONS = {
    OrgRoleType.OWNER.value: {
        "can_manage_billing": True,
        "can_delete_org": True,
        "can_manage_users": True,
        "can_manage_roles": True,
        "can_manage_settings": True,
        "can_create_projects": True,
        "can_delete_projects": True,
        "can_view_audit_logs": True,
        "can_manage_integrations": True,
        "can_execute_tests": True,
        "can_write_tests": True,
        "can_read_tests": True,
    },
    OrgRoleType.ADMIN.value: {
        "can_manage_billing": False,
        "can_delete_org": False,
        "can_manage_users": True,
        "can_manage_roles": True,
        "can_manage_settings": True,
        "can_create_projects": True,
        "can_delete_projects": True,
        "can_view_audit_logs": True,
        "can_manage_integrations": True,
        "can_execute_tests": True,
        "can_write_tests": True,
        "can_read_tests": True,
    },
    OrgRoleType.MEMBER.value: {
        "can_manage_billing": False,
        "can_delete_org": False,
        "can_manage_users": False,
        "can_manage_roles": False,
        "can_manage_settings": False,
        "can_create_projects": False,
        "can_delete_projects": False,
        "can_view_audit_logs": False,
        "can_manage_integrations": False,
        "can_execute_tests": True,
        "can_write_tests": True,
        "can_read_tests": True,
    },
    OrgRoleType.VIEWER.value: {
        "can_manage_billing": False,
        "can_delete_org": False,
        "can_manage_users": False,
        "can_manage_roles": False,
        "can_manage_settings": False,
        "can_create_projects": False,
        "can_delete_projects": False,
        "can_view_audit_logs": False,
        "can_manage_integrations": False,
        "can_execute_tests": False,
        "can_write_tests": False,
        "can_read_tests": True,
    },
}


class Organisation(Base):
    """
    Represents an organization/workspace in the system.
    Organizations contain projects, users, and settings.
    """
    __tablename__ = "organisations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    website = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    logo = Column(Text, nullable=True)

    # Owner (legacy - kept for backwards compatibility, use user_memberships instead)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Settings - stores enabled modules and other org-level settings
    settings = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    integrations = relationship("Integration", back_populates="organisation", cascade="all, delete-orphan")
    subscription = relationship("OrganizationSubscription", back_populates="organisation", uselist=False)
    roles = relationship("OrganizationRole", back_populates="organisation", cascade="all, delete-orphan")
    user_memberships = relationship("UserOrganisation", back_populates="organisation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Organisation {self.name}>"


class OrganizationRole(Base):
    """
    Defines roles within an organization.
    System roles are created automatically, custom roles can be added (Pro+ plans).
    """
    __tablename__ = "organization_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Role definition
    name = Column(String(100), nullable=False)  # Display name
    role_type = Column(String(50), nullable=False)  # owner, admin, member, viewer
    description = Column(Text, nullable=True)
    color = Column(String(20), nullable=True)  # For UI badge color
    
    # Role settings
    is_system_role = Column(Boolean, default=False)  # System roles cannot be deleted
    is_default = Column(Boolean, default=False)  # Default role for new members
    
    # Permissions (JSON object of permission flags)
    permissions = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organisation = relationship("Organisation", back_populates="roles")
    user_assignments = relationship("UserOrganisation", back_populates="role_obj", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<OrganizationRole {self.name} ({self.role_type})>"
    
    def has_permission(self, permission: str) -> bool:
        """Check if this role has a specific permission"""
        return self.permissions.get(permission, False)
    
    @property
    def hierarchy_level(self) -> int:
        """Get the hierarchy level of this role"""
        return ROLE_HIERARCHY.get(self.role_type, 0)
    
    def can_manage_role(self, other_role: "OrganizationRole") -> bool:
        """Check if this role can manage another role"""
        return self.hierarchy_level > other_role.hierarchy_level


class UserOrganisation(Base):
    """
    Links users to organizations with their assigned role.
    Each user can have one role per organization.
    """
    __tablename__ = "user_organisations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Role assignment (simple string for backwards compatibility)
    role = Column(String(50), default="member")  # owner, admin, member, viewer
    
    # Optional link to OrganizationRole for custom roles
    role_id = Column(UUID(as_uuid=True), ForeignKey("organization_roles.id", ondelete="SET NULL"), nullable=True)
    
    # Membership metadata
    invited_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    invited_at = Column(DateTime(timezone=True), nullable=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="organisation_memberships")
    organisation = relationship("Organisation", back_populates="user_memberships")
    role_obj = relationship("OrganizationRole", back_populates="user_assignments")
    inviter = relationship("User", foreign_keys=[invited_by])

    def __repr__(self):
        return f"<UserOrganisation user={self.user_id} org={self.organisation_id} role={self.role}>"
    
    @property
    def effective_role_type(self) -> str:
        """Get the effective role type (from role_obj if set, otherwise from role string)"""
        if self.role_obj:
            return self.role_obj.role_type
        return self.role
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission in this org"""
        if self.role_obj:
            return self.role_obj.has_permission(permission)
        # Fallback to default permissions based on role string
        return DEFAULT_ROLE_PERMISSIONS.get(self.role, {}).get(permission, False)
    
    @property
    def hierarchy_level(self) -> int:
        """Get the hierarchy level of this membership"""
        return ROLE_HIERARCHY.get(self.effective_role_type, 0)


# Default system roles to create for each organization
DEFAULT_SYSTEM_ROLES = [
    {
        "name": "Owner",
        "role_type": OrgRoleType.OWNER.value,
        "description": "Full control over the organization including billing and deletion",
        "color": "#EF4444",  # Red
        "is_system_role": True,
        "is_default": False,
        "permissions": DEFAULT_ROLE_PERMISSIONS[OrgRoleType.OWNER.value],
    },
    {
        "name": "Administrator",
        "role_type": OrgRoleType.ADMIN.value,
        "description": "Manage users, settings, and all features",
        "color": "#F59E0B",  # Amber
        "is_system_role": True,
        "is_default": False,
        "permissions": DEFAULT_ROLE_PERMISSIONS[OrgRoleType.ADMIN.value],
    },
    {
        "name": "Member",
        "role_type": OrgRoleType.MEMBER.value,
        "description": "Standard access to create and run tests",
        "color": "#10B981",  # Green
        "is_system_role": True,
        "is_default": True,
        "permissions": DEFAULT_ROLE_PERMISSIONS[OrgRoleType.MEMBER.value],
    },
    {
        "name": "Viewer",
        "role_type": OrgRoleType.VIEWER.value,
        "description": "Read-only access to view tests and results",
        "color": "#6B7280",  # Gray
        "is_system_role": True,
        "is_default": False,
        "permissions": DEFAULT_ROLE_PERMISSIONS[OrgRoleType.VIEWER.value],
    },
]

