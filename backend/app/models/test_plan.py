from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class GenerationType(str, enum.Enum):
    AI = "ai"
    MANUAL = "manual"
    HYBRID = "hybrid"

class TestPlan(Base):
    __tablename__ = "test_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    objectives = Column(JSON, default=list)  # List of objectives

    # AI Generation
    generated_by = Column(SQLEnum(GenerationType), default=GenerationType.MANUAL)
    source_documents = Column(JSON, default=list)  # List of source doc URLs/paths
    confidence_score = Column(String(50), nullable=True)  # AI confidence

    # Metadata
    tags = Column(JSON, default=list)
    meta_data = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="test_plans")
    test_suites = relationship("TestSuite", back_populates="test_plan", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TestPlan {self.name}>"
