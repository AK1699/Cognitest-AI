from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID

from app.models.test_plan import GenerationType, TestPlanType, ReviewStatus, ReportingFrequency


# ========== MILESTONE SCHEMA ==========
class MilestoneSchema(BaseModel):
    """Schema for milestone objects"""
    name: str = Field(..., description="Milestone name")
    description: Optional[str] = Field(None, description="Milestone description")
    due_date: Optional[date] = Field(None, description="Expected completion date")
    status: Optional[str] = Field("pending", description="Status: pending, in_progress, completed")
    completed_date: Optional[date] = Field(None, description="Actual completion date")


# ========== BASE SCHEMA ==========
class TestPlanBase(BaseModel):
    # 1. Basic Information
    name: str = Field(..., min_length=1, max_length=255, description="Test plan name")
    version: Optional[str] = Field(None, max_length=100, description="Version/Release identifier")
    modules: List[str] = Field(default_factory=list, description="Modules or features covered")
    test_plan_type: TestPlanType = Field(default=TestPlanType.REGRESSION, description="Type of test plan")

    # 2. Objectives & Scope
    objective: Optional[str] = Field(None, description="Overall goal or purpose")
    description: Optional[str] = Field(None, description="Additional description")
    scope_in: List[str] = Field(default_factory=list, description="Features/areas in scope")
    scope_out: List[str] = Field(default_factory=list, description="Features/areas out of scope")
    assumptions: Optional[str] = Field(None, description="Assumptions made during planning")
    constraints_risks: Optional[str] = Field(None, description="Limitations, dependencies, or risks")
    objectives: List[str] = Field(default_factory=list, description="List of specific objectives")

    # 3. Test Strategy & Approach
    testing_approach: Optional[str] = Field(None, description="High-level testing methodology")
    test_levels: List[str] = Field(default_factory=list, description="Testing levels (Unit, Integration, System, UAT, etc.)")
    test_types: List[str] = Field(default_factory=list, description="Test types (Functional, Performance, Security, etc.)")
    entry_criteria: Optional[str] = Field(None, description="Conditions before testing begins")
    exit_criteria: Optional[str] = Field(None, description="Conditions for successful completion")
    defect_management_approach: Optional[str] = Field(None, description="How defects are tracked and resolved")

    # 4. Environment & Tools
    test_environments: List[str] = Field(default_factory=list, description="Test environments (DEV, QA, STAGE, UAT, etc.)")
    environment_urls: Dict[str, str] = Field(default_factory=dict, description="Environment URLs/access details")
    tools_used: List[str] = Field(default_factory=list, description="Testing tools and frameworks")
    data_setup: Optional[str] = Field(None, description="Test data setup and configuration")

    # 5. Roles & Responsibilities
    test_manager_id: Optional[UUID] = Field(None, description="Test Manager user ID")
    qa_lead_ids: List[UUID] = Field(default_factory=list, description="QA Lead user IDs")
    qa_engineer_ids: List[UUID] = Field(default_factory=list, description="QA Engineer user IDs")
    stakeholder_ids: List[UUID] = Field(default_factory=list, description="Stakeholder/Approver user IDs")

    # 6. Schedule & Milestones
    planned_start_date: Optional[date] = Field(None, description="Planned testing start date")
    planned_end_date: Optional[date] = Field(None, description="Planned testing end date")
    actual_start_date: Optional[date] = Field(None, description="Actual testing start date")
    actual_end_date: Optional[date] = Field(None, description="Actual testing end date")
    milestones: List[MilestoneSchema] = Field(default_factory=list, description="Key milestones and deliverables")

    # 7. Metrics & Reporting
    test_coverage_target: Optional[float] = Field(None, ge=0, le=100, description="Target test coverage percentage")
    automation_coverage_target: Optional[float] = Field(None, ge=0, le=100, description="Target automation coverage percentage")
    defect_density_target: Optional[float] = Field(None, ge=0, description="Expected defect density threshold")
    reporting_frequency: ReportingFrequency = Field(default=ReportingFrequency.WEEKLY, description="Reporting frequency")
    dashboard_links: List[str] = Field(default_factory=list, description="Links to dashboards or reports")

    # 8. Review & Approval
    review_status: ReviewStatus = Field(default=ReviewStatus.DRAFT, description="Review status")
    reviewed_by_ids: List[UUID] = Field(default_factory=list, description="Reviewer user IDs")
    review_comments: Optional[str] = Field(None, description="Review feedback and comments")

    # Metadata
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")
    meta_data: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


# ========== CREATE SCHEMA ==========
class TestPlanCreate(TestPlanBase):
    project_id: UUID = Field(..., description="Project ID this test plan belongs to")
    generated_by: GenerationType = Field(default=GenerationType.MANUAL, description="How the test plan was created")
    source_documents: List[str] = Field(default_factory=list, description="Source documents used for generation")
    created_by: str = Field(..., description="Email or identifier of creator")


# ========== UPDATE SCHEMA ==========
class TestPlanUpdate(BaseModel):
    # 1. Basic Information
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    version: Optional[str] = Field(None, max_length=100)
    modules: Optional[List[str]] = None
    test_plan_type: Optional[TestPlanType] = None

    # 2. Objectives & Scope
    objective: Optional[str] = None
    description: Optional[str] = None
    scope_in: Optional[List[str]] = None
    scope_out: Optional[List[str]] = None
    assumptions: Optional[str] = None
    constraints_risks: Optional[str] = None
    objectives: Optional[List[str]] = None

    # 3. Test Strategy & Approach
    testing_approach: Optional[str] = None
    test_levels: Optional[List[str]] = None
    test_types: Optional[List[str]] = None
    entry_criteria: Optional[str] = None
    exit_criteria: Optional[str] = None
    defect_management_approach: Optional[str] = None

    # 4. Environment & Tools
    test_environments: Optional[List[str]] = None
    environment_urls: Optional[Dict[str, str]] = None
    tools_used: Optional[List[str]] = None
    data_setup: Optional[str] = None

    # 5. Roles & Responsibilities
    test_manager_id: Optional[UUID] = None
    qa_lead_ids: Optional[List[UUID]] = None
    qa_engineer_ids: Optional[List[UUID]] = None
    stakeholder_ids: Optional[List[UUID]] = None

    # 6. Schedule & Milestones
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    milestones: Optional[List[MilestoneSchema]] = None

    # 7. Metrics & Reporting
    test_coverage_target: Optional[float] = Field(None, ge=0, le=100)
    automation_coverage_target: Optional[float] = Field(None, ge=0, le=100)
    defect_density_target: Optional[float] = Field(None, ge=0)
    reporting_frequency: Optional[ReportingFrequency] = None
    dashboard_links: Optional[List[str]] = None

    # 8. Review & Approval
    review_status: Optional[ReviewStatus] = None
    reviewed_by_ids: Optional[List[UUID]] = None
    review_comments: Optional[str] = None
    approval_date: Optional[datetime] = None

    # Metadata
    tags: Optional[List[str]] = None
    meta_data: Optional[Dict[str, Any]] = None
    last_updated_by: Optional[str] = None


# ========== RESPONSE SCHEMA ==========
class TestPlanResponse(TestPlanBase):
    id: UUID
    project_id: UUID

    # AI Generation
    generated_by: GenerationType
    source_documents: List[str]
    confidence_score: Optional[str]

    # Review & Approval
    approval_date: Optional[datetime]

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: str
    last_updated_by: Optional[str]

    @field_validator('objectives', mode='before')
    @classmethod
    def extract_objectives_text(cls, v):
        """Extract objective text from complex objects if needed."""
        if not v:
            return []
        return [
            obj.get("objective", "") if isinstance(obj, dict) else str(obj)
            for obj in v
        ]

    class Config:
        from_attributes = True


# ========== AI GENERATION SCHEMAS ==========
class TestPlanAIGenerateRequest(BaseModel):
    project_id: UUID
    source_documents: List[str] = Field(..., description="URLs or paths to requirement documents")
    additional_context: Optional[str] = Field(None, description="Additional context for AI")
    objectives: Optional[List[str]] = Field(default_factory=list, description="Specific objectives to focus on")


class TestPlanAIGenerateResponse(BaseModel):
    test_plan: TestPlanResponse
    confidence_score: str
    suggestions: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


# ========== APPROVAL WORKFLOW SCHEMAS ==========
class TestPlanApprovalRequest(BaseModel):
    """Schema for approving/rejecting a test plan"""
    review_status: ReviewStatus = Field(..., description="New review status")
    review_comments: Optional[str] = Field(None, description="Comments from reviewer")
    reviewer_id: UUID = Field(..., description="ID of the reviewer")


class TestPlanBulkUpdateRequest(BaseModel):
    """Schema for bulk updating test plan fields"""
    test_plan_ids: List[UUID] = Field(..., description="IDs of test plans to update")
    update_data: TestPlanUpdate = Field(..., description="Fields to update")
