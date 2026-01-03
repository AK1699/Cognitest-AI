"""
Pydantic schemas for AI-powered test plan generation
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uuid


class TestPlanGenerationRequest(BaseModel):
    """Request for test plan generation"""
    project_id: uuid.UUID
    user_story_key: Optional[str] = None
    user_story_text: Optional[str] = None
    brd_document_id: Optional[str] = None
    use_jira_integration: bool = False
    jira_url: Optional[str] = None
    jira_username: Optional[str] = None
    jira_token: Optional[str] = None
    additional_context: Optional[str] = None


class TestCaseResponse(BaseModel):
    """Response for a test case"""
    id: Optional[str] = None
    title: str
    preconditions: Optional[str] = None
    steps: List[str]
    expected_result: str
    priority: Optional[str] = "medium"


class TestPlanGenerationResponse(BaseModel):
    """Response for test plan generation"""
    generation_id: str
    project_id: str
    user_story_key: Optional[str]
    test_plan: str
    test_cases: List[TestCaseResponse] = []
    brd_used: bool
    similar_plans_referenced: int = 0
    metadata: Dict[str, Any]
    message: str


class TestPlanFeedbackRequest(BaseModel):
    """Request for test plan feedback"""
    project_id: uuid.UUID
    user_story_key: str
    original_test_plan: str
    test_cases_count: int
    is_accepted: bool
    user_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    ai_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    modifications: Optional[str] = None
    comments: Optional[str] = None
    brd_used: bool
    brd_document_id: Optional[str] = None
    brd_effectiveness: Optional[float] = Field(None, ge=0.0, le=1.0)


class TestPlanFeedbackResponse(BaseModel):
    """Response for test plan feedback"""
    generation_id: str
    status: str
    message: str
    learning_recorded: bool
    effectiveness_score: Optional[float] = None


class TestPlanHistoryResponse(BaseModel):
    """Response for test plan history"""
    total_generated: int
    accepted_count: int
    rejected_count: int
    average_rating: float
    generations: List[Dict[str, Any]]


class TestPlanLearningInsightsResponse(BaseModel):
    """Response for learning insights"""
    test_plan_patterns: List[str]
    effective_brd_sections: List[str]
    jira_patterns: List[str]
    recommendations: List[str]
