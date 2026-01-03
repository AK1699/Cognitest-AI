"""
Group Type Model
Defines predefined group types (ADMIN, QA, DEV, PRODUCT) with their associated roles
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey, Table, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime
import uuid

from cognitest_common import Base


class GroupType(Base):
    """
    Predefined group types for organizing teams
    E.g., ADMIN, QA, DEV, PRODUCT
    """
    __tablename__ = "group_types"
    __table_args__ = (
        UniqueConstraint('code', 'organization_id', name='uq_group_type_code_org'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), index=True, nullable=False)  # ADMIN, QA, DEV, PRODUCT
    name = Column(String(100), nullable=False)  # "Administration", "Quality Assurance", etc.
    description = Column(Text, nullable=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organisations.id'), nullable=True)
    organisation = relationship('Organisation', back_populates='group_types')
    is_system_type = Column(Boolean, default=False)  # System types can't be deleted
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)  # Display order
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    roles = relationship(
        'GroupTypeRole',
        back_populates='group_type',
        cascade='all, delete-orphan',
        lazy='selectin'
    )

    def __repr__(self):
        return f"<GroupType {self.code}>"


class GroupTypeRole(Base):
    """
    Roles available for a group type
    E.g., GroupType=QA -> Roles: QA Lead, QA Engineer, QA Manager, Tester
    """
    __tablename__ = "group_type_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_type_id = Column(UUID(as_uuid=True), ForeignKey('group_types.id'), nullable=False)
    role_id = Column(UUID(as_uuid=True), ForeignKey('project_roles.id'), nullable=False)
    role_name = Column(String(100), nullable=False)  # E.g., "QA Lead", "Developer"
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)  # Default role when user joins group
    order = Column(Integer, default=0)  # Display order
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group_type = relationship('GroupType', back_populates='roles')

    def __repr__(self):
        return f"<GroupTypeRole {self.role_name}>"


class GroupTypeAccess(Base):
    """
    Defines access level for group types within an organization
    E.g., ADMIN has org-level access, QA/DEV/PRODUCT have project-level access
    """
    __tablename__ = "group_type_access"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_type_id = Column(UUID(as_uuid=True), ForeignKey('group_types.id'), nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organisations.id'), nullable=False)
    organisation = relationship('Organisation', back_populates='group_type_access')
    access_level = Column(String(50), nullable=False)  # 'organization', 'project', 'limited'
    accessible_modules = Column(ARRAY(String), nullable=True)  # If None, all modules
    can_manage_users = Column(Boolean, default=False)
    can_manage_groups = Column(Boolean, default=False)
    can_manage_roles = Column(Boolean, default=False)
    can_manage_organization = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<GroupTypeAccess {self.access_level}>"


# Update the Group model to reference group type
# This is pseudo-code showing what needs to be added to the existing Group model
GROUP_TYPE_ADDITION = """
# Add to Group model:
group_type_id = Column(UUID(as_uuid=True), ForeignKey('group_types.id'), nullable=True)
group_type = relationship('GroupType', lazy='selectin')
"""
