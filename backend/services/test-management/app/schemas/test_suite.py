from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.models.test_plan import GenerationType


# Base schema
class TestSuiteBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    meta_data: Dict[str, Any] = Field(default_factory=dict)


# Schema for creating a test suite
class TestSuiteCreate(TestSuiteBase):
    project_id: UUID
    test_plan_id: Optional[UUID] = None
    generated_by: GenerationType = GenerationType.MANUAL
    created_by: str


# Schema for updating a test suite
class TestSuiteUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    test_plan_id: Optional[UUID] = None
    tags: Optional[List[str]] = None
    meta_data: Optional[Dict[str, Any]] = None


# Schema for response
class TestSuiteResponse(TestSuiteBase):
    id: UUID
    project_id: UUID
    test_plan_id: Optional[UUID]
    generated_by: GenerationType
    execution_history: List[Dict[str, Any]]
    # Human-friendly IDs
    numeric_id: Optional[int] = None
    human_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: str

    class Config:
        from_attributes = True


# Schema for AI generation request
class TestSuiteAIGenerateRequest(BaseModel):
    project_id: UUID
    test_plan_id: Optional[UUID] = None
    requirements: Optional[str] = Field(None, description="Requirements or user stories")
    test_scenarios: Optional[List[str]] = Field(default_factory=list)


# Schema for AI generation response
class TestSuiteAIGenerateResponse(BaseModel):
    test_suite: TestSuiteResponse
    suggested_test_cases: List[str] = Field(default_factory=list)


# Schema for test suite with test cases
class TestSuiteWithCasesResponse(TestSuiteResponse):
    test_cases: List[Dict[str, Any]] = Field(default_factory=list)


# Schema for bulk updates
class TestSuiteBulkUpdateRequest(BaseModel):
    test_suite_ids: List[UUID]
    update_data: TestSuiteUpdate
