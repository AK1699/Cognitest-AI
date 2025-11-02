from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Table, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class ProjectRoleType(str, enum.Enum):
    """Predefined project role types"""
    OWNER = "owner"
    ADMIN = "admin"
    QA_MANAGER = "qa_manager"
    QA_LEAD = "qa_lead"
    QA_ENGINEER = "qa_engineer"
    PRODUCT_OWNER = "product_owner"
    VIEWER = "viewer"


class PermissionAction(str, enum.Enum):
    """Permission actions"""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    EXECUTE = "execute"
    MANAGE = "manage"
    WRITE = "write"  # Combination of CREATE and UPDATE


class PermissionResource(str, enum.Enum):
    """Resources that can have permissions"""
    # Core resources
    PROJECT = "project"
    TEST_PLAN = "test_plan"
    TEST_SUITE = "test_suite"
    TEST_CASE = "test_case"
    TEST_EXECUTION = "test_execution"
    USER = "user"
    GROUP = "group"
    ROLE = "role"
    SETTINGS = "settings"

    # Module-based resources
    AUTOMATION_HUB = "automation_hub"
    API_TESTING = "api_testing"
    TEST_MANAGEMENT = "test_management"
    SECURITY_TESTING = "security_testing"
    PERFORMANCE_TESTING = "performance_testing"
    MOBILE_TESTING = "mobile_testing"


# Association table for many-to-many relationship between Roles and Permissions
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column('role_id', UUID(as_uuid=True), ForeignKey('project_roles.id', ondelete='CASCADE'), nullable=False),
    Column('permission_id', UUID(as_uuid=True), ForeignKey('permissions.id', ondelete='CASCADE'), nullable=False),
    Column('assigned_at', DateTime(timezone=True), server_default=func.now()),
    Column('assigned_by', String(255), nullable=True)
)


class ProjectRole(Base):
    """
    Represents a role that can be assigned to users within a project.
    Roles define what actions users can perform.
    """
    __tablename__ = "project_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(255), nullable=False)
    role_type = Column(String(100), nullable=False)  # owner, admin, qa_manager, qa_lead, qa_engineer, product_owner, viewer
    description = Column(Text, nullable=True)

    # Role settings
    is_system_role = Column(Boolean, default=False)  # System roles cannot be deleted
    is_active = Column(Boolean, default=True)

    # Metadata
    meta_data = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=False)

    # Relationships
    organisation = relationship("Organisation")
    permissions = relationship(
        "Permission",
        secondary=role_permissions,
        back_populates="roles"
    )
    user_project_roles = relationship("UserProjectRole", back_populates="role", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ProjectRole {self.name} ({self.role_type})>"


class Permission(Base):
    """
    Represents a specific permission that can be granted to roles.
    Permissions define granular access control.
    """
    __tablename__ = "permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String(255), nullable=False, unique=True)
    resource = Column(String(100), nullable=False)  # project, test_plan, test_suite, etc.
    action = Column(String(100), nullable=False)  # create, read, update, delete, execute, manage
    description = Column(Text, nullable=True)

    # Permission settings
    is_system_permission = Column(Boolean, default=True)  # System permissions cannot be deleted

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    roles = relationship(
        "ProjectRole",
        secondary=role_permissions,
        back_populates="permissions"
    )

    def __repr__(self):
        return f"<Permission {self.name} ({self.resource}:{self.action})>"


class UserProjectRole(Base):
    """
    Associates users with roles for specific projects.
    This allows users to have different roles in different projects.
    """
    __tablename__ = "user_project_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(UUID(as_uuid=True), ForeignKey("project_roles.id", ondelete="CASCADE"), nullable=False)

    # Assignment details
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_by = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Optional expiration

    # Relationships
    user = relationship("User", back_populates="project_roles")
    project = relationship("Project", back_populates="user_roles")
    role = relationship("ProjectRole", back_populates="user_project_roles")

    def __repr__(self):
        return f"<UserProjectRole user={self.user_id} project={self.project_id} role={self.role_id}>"


class GroupProjectRole(Base):
    """
    Associates groups with roles for specific projects.
    All users in the group inherit the role for that project.
    """
    __tablename__ = "group_project_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(UUID(as_uuid=True), ForeignKey("project_roles.id", ondelete="CASCADE"), nullable=False)

    # Assignment details
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_by = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    group = relationship("Group")
    project = relationship("Project")
    role = relationship("ProjectRole")

    def __repr__(self):
        return f"<GroupProjectRole group={self.group_id} project={self.project_id} role={self.role_id}>"
