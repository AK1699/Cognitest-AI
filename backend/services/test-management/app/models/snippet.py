"""
Snippet Model for Reusable Test Step Groups
Parameterized snippets allow grouping test steps into reusable functions
"""
from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from cognitest_common import Base


class TestSnippet(Base):
    """
    TestSnippet - Reusable parameterized group of test steps
    
    Works like a function: define parameters, reuse with different values.
    Example: "Login Flow" snippet with username and password parameters
    """
    __tablename__ = "test_snippets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)

    # Snippet Details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Parameters - Array of parameter definitions
    # [{"name": "username", "type": "string", "default": "", "description": "User login"}]
    parameters = Column(JSON, default=list)
    
    # Steps - Array of step objects (same structure as TestFlow.nodes)
    # Each step can reference {{param_name}} which gets substituted at execution
    steps = Column(JSON, default=list)
    
    # Metadata
    tags = Column(JSON, default=list)
    is_global = Column(Boolean, default=False)  # True = share across all projects in org
    version = Column(String(50), default="1.0.0")
    
    # Usage Statistics
    usage_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    project = relationship("Project")
    organisation = relationship("Organisation")
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<TestSnippet {self.name}>"
