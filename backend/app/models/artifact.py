"""
Artifact Model - Test execution artifacts (screenshots, videos)
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class ArtifactType(str, enum.Enum):
    SCREENSHOT = "screenshot"
    VIDEO = "video"


class TestArtifact(Base):
    """
    Test Artifact - Screenshots and video recordings from test executions
    """
    __tablename__ = "test_artifacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Optional links to execution context
    execution_run_id = Column(UUID(as_uuid=True), ForeignKey("execution_runs.id", ondelete="SET NULL"), nullable=True)
    step_result_id = Column(UUID(as_uuid=True), ForeignKey("step_results.id", ondelete="SET NULL"), nullable=True)
    
    # File info
    name = Column(String(500), nullable=False)
    type = Column(SQLEnum(ArtifactType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    file_path = Column(String(1000), nullable=False)  # Server path
    file_url = Column(String(1000), nullable=True)    # Public access URL
    size_bytes = Column(Integer, nullable=True)
    
    # Video-specific
    duration_ms = Column(Integer, nullable=True)
    
    # Context info
    test_name = Column(String(500), nullable=True)
    step_name = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project")
    execution_run = relationship("ExecutionRun", foreign_keys=[execution_run_id])
    step_result = relationship("StepResult", foreign_keys=[step_result_id])

    def __repr__(self):
        return f"<TestArtifact {self.name} ({self.type})>"
