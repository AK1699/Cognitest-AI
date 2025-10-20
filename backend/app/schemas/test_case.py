from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.models.test_case import TestCaseStatus, TestCasePriority
from app.models.test_plan import GenerationType


# Test step schema
class TestStep(BaseModel):
    step_number: int
    action: str
    expected_result: str
    data: Optional[Dict[str, Any]] = None


# Base schema
class TestCaseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    steps: List[TestStep] = Field(default_factory=list)
    expected_result: Optional[str] = None
    priority: TestCasePriority = TestCasePriority.MEDIUM
    tags: List[str] = Field(default_factory=list)
    meta_data: Dict[str, Any] = Field(default_factory=dict)


# Schema for creating a test case
class TestCaseCreate(TestCaseBase):
    project_id: UUID
    test_suite_id: Optional[UUID] = None
    ai_generated: bool = False
    generated_by: GenerationType = GenerationType.MANUAL
    created_by: str
    assigned_to: Optional[str] = None


# Schema for updating a test case
class TestCaseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    steps: Optional[List[TestStep]] = None
    expected_result: Optional[str] = None
    actual_result: Optional[str] = None
    status: Optional[TestCaseStatus] = None
    priority: Optional[TestCasePriority] = None
    test_suite_id: Optional[UUID] = None
    assigned_to: Optional[str] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[str]] = None
    meta_data: Optional[Dict[str, Any]] = None


# Schema for response
class TestCaseResponse(TestCaseBase):
    id: UUID
    project_id: UUID
    test_suite_id: Optional[UUID]
    actual_result: Optional[str]
    status: TestCaseStatus
    ai_generated: bool
    generated_by: GenerationType
    confidence_score: Optional[str]
    execution_logs: List[Dict[str, Any]]
    attachments: List[str]
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: str
    assigned_to: Optional[str]

    class Config:
        from_attributes = True


# Schema for AI generation request
class TestCaseAIGenerateRequest(BaseModel):
    project_id: UUID
    test_suite_id: Optional[UUID] = None
    feature_description: str = Field(..., description="Description of the feature to test")
    test_scenarios: Optional[List[str]] = Field(default_factory=list)
    user_stories: Optional[List[str]] = Field(default_factory=list)
    count: int = Field(5, ge=1, le=50, description="Number of test cases to generate")


# Schema for AI generation response
class TestCaseAIGenerateResponse(BaseModel):
    test_cases: List[TestCaseResponse]
    coverage_analysis: str
    suggestions: List[str] = Field(default_factory=list)


# Schema for test execution
class TestExecutionRequest(BaseModel):
    test_case_id: UUID
    status: TestCaseStatus
    actual_result: Optional[str] = None
    execution_notes: Optional[str] = None
    attachments: Optional[List[str]] = Field(default_factory=list)


class TestExecutionResponse(BaseModel):
    success: bool
    test_case: TestCaseResponse
    execution_log: Dict[str, Any]
