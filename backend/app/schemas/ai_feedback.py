"""
Pydantic schemas for AI feedback
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class AIFeedbackBase(BaseModel):
    """Base feedback schema"""
    project_id: uuid.UUID
    agent_name: str
    agent_type: Optional[str] = None
    feedback_type: str = "rating"
    input_data: Dict[str, Any]
    output_data: Dict[str, Any]
    user_feedback: Dict[str, Any]
    is_accepted: bool = False
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    user_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    modifications: Optional[str] = None


class AIFeedbackCreate(AIFeedbackBase):
    """Schema for creating feedback"""
    pass


class AIFeedbackResponse(AIFeedbackBase):
    """Schema for feedback response"""
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    qdrant_point_id: Optional[str] = None
    is_processed: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentPerformanceBase(BaseModel):
    """Base agent performance schema"""
    agent_name: str
    total_executions: float = 0.0
    accepted_count: float = 0.0
    rejected_count: float = 0.0
    modified_count: float = 0.0
    acceptance_rate: float = 0.0
    average_confidence: float = 0.0
    average_user_rating: Optional[float] = None
    trend: str = "stable"


class AgentPerformanceResponse(AgentPerformanceBase):
    """Schema for performance response"""
    id: uuid.UUID
    project_id: uuid.UUID
    last_improvement_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FeedbackSummaryResponse(BaseModel):
    """Summary of feedback across agents"""
    project_id: uuid.UUID
    total_feedback_count: int
    agents: Dict[str, Dict[str, Any]]  # agent_name -> metrics
    overall_acceptance_rate: float
    overall_average_rating: Optional[float] = None
    last_updated: datetime
