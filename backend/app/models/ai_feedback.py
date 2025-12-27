"""
AI Feedback Model for tracking and learning from user feedback
"""
from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Boolean, Float, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class FeedbackType(str, enum.Enum):
    """Types of feedback"""
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    MODIFIED = "modified"
    RATING = "rating"


class AIFeedback(Base):
    """
    Model for storing AI agent feedback for self-learning.
    """

    __tablename__ = "ai_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Project and context
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    agent_name = Column(String(255), nullable=False, index=True)  # e.g., "test_plan_generator"
    agent_type = Column(String(255), nullable=True)  # e.g., "test_plan", "test_case", "issue_detector"

    # Feedback data
    feedback_type = Column(SQLEnum(FeedbackType), default=FeedbackType.RATING)
    input_data = Column(JSON, nullable=False)  # Original input to agent
    output_data = Column(JSON, nullable=False)  # Agent's output
    user_feedback = Column(JSON, nullable=False)  # User's feedback/modifications

    # Feedback details
    is_accepted = Column(Boolean, default=False, index=True)
    confidence_score = Column(Float, default=0.0)  # AI confidence in its response (0-1)
    user_rating = Column(Float, nullable=True)  # User rating (1-5)
    modifications = Column(Text, nullable=True)  # User modifications to the output

    # Tracking
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    qdrant_point_id = Column(String(255), nullable=True)  # ID in Qdrant vector DB

    # Status and timestamps
    is_processed = Column(Boolean, default=False)  # Whether this feedback has been processed for learning
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", foreign_keys=[project_id])
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<AIFeedback {self.agent_name}:{self.id}>"


class AgentPerformance(Base):
    """
    Model for tracking AI agent performance metrics for analytics.
    """

    __tablename__ = "agent_performance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Agent and project context
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    agent_name = Column(String(255), nullable=False, index=True)

    # Performance metrics
    total_executions = Column(Float, default=0)
    accepted_count = Column(Float, default=0)
    rejected_count = Column(Float, default=0)
    modified_count = Column(Float, default=0)

    # Calculated metrics
    acceptance_rate = Column(Float, default=0.0)  # percentage of accepted responses
    average_confidence = Column(Float, default=0.0)  # average confidence score
    average_user_rating = Column(Float, nullable=True)  # average user rating

    # Learning indicators
    trend = Column(String(50), default="stable")  # "improving", "declining", "stable"
    last_improvement_date = Column(DateTime(timezone=True), nullable=True)

    # Tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", foreign_keys=[project_id])

    def __repr__(self):
        return f"<AgentPerformance {self.agent_name}:{self.project_id}>"
