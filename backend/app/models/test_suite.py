from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base
from app.models.test_plan import GenerationType

class TestSuite(Base):
    __tablename__ = "test_suites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    test_plan_id = Column(UUID(as_uuid=True), ForeignKey("test_plans.id", ondelete="CASCADE"), nullable=True)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # AI Generation
    generated_by = Column(SQLEnum(GenerationType), default=GenerationType.MANUAL)

    # Execution history
    execution_history = Column(JSON, default=list)

    # Metadata
    tags = Column(JSON, default=list)
    meta_data = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="test_suites")
    test_plan = relationship("TestPlan", back_populates="test_suites")
    test_cases = relationship("TestCase", back_populates="test_suite", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TestSuite {self.name}>"
