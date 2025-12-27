from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class ProjectStatus(str, enum.Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    PAUSED = "paused"

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.ACTIVE)

    # Owner/Team/Organisation
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=False, index=True)
    team_ids = Column(JSON, default=list)  # List of team member IDs

    # Settings
    settings = Column(JSON, default=dict)  # Project-specific settings

    # AI Context
    ai_context = Column(JSON, default=dict)  # Stores embeddings metadata

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="projects")
    organisation = relationship("Organisation", back_populates="projects")
    test_plans = relationship("TestPlan", back_populates="project", cascade="all, delete-orphan")
    test_suites = relationship("TestSuite", back_populates="project", cascade="all, delete-orphan")
    test_cases = relationship("TestCase", back_populates="project", cascade="all, delete-orphan")
    approval_workflows = relationship("ApprovalWorkflow", back_populates="project", cascade="all, delete-orphan")
    user_roles = relationship("UserProjectRole", back_populates="project", cascade="all, delete-orphan")
    # issues = relationship("Issue", back_populates="project", cascade="all, delete-orphan")  # Commented out: Issue model has metadata column conflict
    integrations = relationship("Integration", back_populates="project", cascade="all, delete-orphan")
    # api_collections = relationship("ApiCollection", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project {self.name}>"
