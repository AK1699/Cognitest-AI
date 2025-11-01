from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Table, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


# Association table for many-to-many relationship between Users and Groups
user_groups = Table(
    'user_groups',
    Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
    Column('group_id', UUID(as_uuid=True), ForeignKey('groups.id', ondelete='CASCADE'), nullable=False),
    Column('added_at', DateTime(timezone=True), server_default=func.now()),
    Column('added_by', String(255), nullable=True)
)


class Group(Base):
    """
    Represents a group of users for organizational purposes.
    Groups can be used to assign roles and permissions to multiple users at once.
    """
    __tablename__ = "groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Group settings
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=False)

    # Group Type Reference (for predefined group types: ADMIN, QA, DEV, PRODUCT)
    group_type_id = Column(UUID(as_uuid=True), ForeignKey("group_types.id"), nullable=True)

    # Relationships
    organisation = relationship("Organisation")
    group_type = relationship("GroupType", lazy="selectin")
    users = relationship(
        "User",
        secondary=user_groups,
        back_populates="groups"
    )

    def __repr__(self):
        return f"<Group {self.name}>"
