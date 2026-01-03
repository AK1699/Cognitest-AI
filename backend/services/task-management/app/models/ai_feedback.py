from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Boolean, Float, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from .base import Base

class FeedbackType(str, enum.Enum):
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    MODIFIED = "modified"
    RATING = "rating"

class AIFeedback(Base):
    __tablename__ = "ai_feedback"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    agent_name = Column(String(255), nullable=False, index=True)
    agent_type = Column(String(255), nullable=True)
    feedback_type = Column(SQLEnum(FeedbackType), default=FeedbackType.RATING)
    input_data = Column(JSON, nullable=False)
    output_data = Column(JSON, nullable=False)
    user_feedback = Column(JSON, nullable=False)
    is_accepted = Column(Boolean, default=False, index=True)
    confidence_score = Column(Float, default=0.0)
    user_rating = Column(Float, nullable=True)
    modifications = Column(Text, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    qdrant_point_id = Column(String(255), nullable=True)
    is_processed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AgentPerformance(Base):
    __tablename__ = "agent_performance"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    agent_name = Column(String(255), nullable=False, index=True)
    total_executions = Column(Float, default=0)
    accepted_count = Column(Float, default=0)
    rejected_count = Column(Float, default=0)
    modified_count = Column(Float, default=0)
    acceptance_rate = Column(Float, default=0.0)
    average_confidence = Column(Float, default=0.0)
    average_user_rating = Column(Float, nullable=True)
    trend = Column(String(50), default="stable")
    last_improvement_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
