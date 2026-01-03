"""
Issue (Defect/Bug) Schemas for comprehensive defect management
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.models.issue import IssueSeverity, IssueStatus, IssuePriority, IssueDetectedBy


# ========== COMMENT SCHEMA ==========
class IssueCommentSchema(BaseModel):
    """Schema for issue comments"""
    comment_id: str = Field(..., description="Comment ID")
    user_id: UUID = Field(..., description="User who commented")
    user_name: str = Field(..., description="User name")
    comment: str = Field(..., description="Comment text")
    created_at: datetime = Field(..., description="Comment timestamp")
    attachments: List[str] = Field(default_factory=list, description="Attachment URLs")


# ========== STATUS HISTORY SCHEMA ==========
class StatusHistorySchema(BaseModel):
    """Schema for status change history"""
    changed_at: datetime = Field(..., description="Timestamp of change")
    changed_by: UUID = Field(..., description="User who made the change")
    changed_by_name: str = Field(..., description="Name of user")
    from_status: Optional[IssueStatus] = Field(None, description="Previous status")
    to_status: IssueStatus = Field(..., description="New status")
    notes: Optional[str] = Field(None, description="Change notes")


# ========== STEP TO REPRODUCE SCHEMA ==========
class StepToReproduceSchema(BaseModel):
    """Schema for steps to reproduce an issue"""
    step_number: int = Field(..., description="Step number")
    action: str = Field(..., description="Action to perform")
    expected: str = Field(..., description="Expected result")
    actual: Optional[str] = Field(None, description="Actual result")


# ========== BASE SCHEMA ==========
class IssueBase(BaseModel):
    # Basic Information
    title: str = Field(..., min_length=1, max_length=500, description="Issue title")
    description: Optional[str] = Field(None, description="Detailed description")

    # Classification
    severity: IssueSeverity = Field(default=IssueSeverity.MEDIUM, description="Issue severity")
    priority: IssuePriority = Field(default=IssuePriority.MEDIUM, description="Issue priority")
    status: IssueStatus = Field(default=IssueStatus.NEW, description="Current status")
    detected_by: IssueDetectedBy = Field(default=IssueDetectedBy.MANUAL, description="Detection method")

    # Related entities
    related_test_case_id: Optional[UUID] = Field(None, description="Related test case ID")
    test_run_id: Optional[UUID] = Field(None, description="Test run where issue was found")
    test_plan_id: Optional[UUID] = Field(None, description="Related test plan ID")

    # External linkage
    external_issue_key: Optional[str] = Field(None, description="External issue key (e.g., JIRA-123)")
    external_system: Optional[str] = Field(None, description="External system name")
    external_url: Optional[str] = Field(None, description="External issue URL")

    # Assignment
    assigned_to: Optional[UUID] = Field(None, description="Assigned user ID")
    assigned_to_name: Optional[str] = Field(None, description="Assigned user name")
    reporter_id: Optional[UUID] = Field(None, description="Reporter user ID")

    # Resolution
    resolution: Optional[str] = Field(None, description="Resolution type")
    resolution_notes: Optional[str] = Field(None, description="Resolution notes")
    fixed_in_version: Optional[str] = Field(None, description="Version where fixed")

    # Tracking
    steps_to_reproduce: List[StepToReproduceSchema] = Field(default_factory=list, description="Reproduction steps")
    actual_result: Optional[str] = Field(None, description="Actual result")
    expected_result: Optional[str] = Field(None, description="Expected result")
    environment: Dict[str, Any] = Field(default_factory=dict, description="Environment details")
    attachments: List[str] = Field(default_factory=list, description="Attachment URLs")

    # Impact
    affected_features: List[str] = Field(default_factory=list, description="Affected features")
    affected_users: Optional[str] = Field(None, description="Affected user groups")
    workaround: Optional[str] = Field(None, description="Workaround description")

    # AI Insights
    remediation_suggestions: List[str] = Field(default_factory=list, description="AI-generated suggestions")
    ai_confidence: Optional[str] = Field(None, description="AI confidence level")
    root_cause_analysis: Optional[str] = Field(None, description="AI root cause analysis")

    # Comments (stored as structured data)
    comments: List[IssueCommentSchema] = Field(default_factory=list, description="Issue comments")

    # Metrics
    estimated_effort_hours: Optional[str] = Field(None, description="Estimated effort")
    actual_effort_hours: Optional[str] = Field(None, description="Actual effort")

    # Metadata
    tags: List[str] = Field(default_factory=list, description="Issue tags")
    labels: List[str] = Field(default_factory=list, description="Issue labels")
    meta_data: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

    # Timestamps
    assigned_at: Optional[datetime] = Field(None, description="Assignment timestamp")
    resolved_at: Optional[datetime] = Field(None, description="Resolution timestamp")
    closed_at: Optional[datetime] = Field(None, description="Close timestamp")
    retested_at: Optional[datetime] = Field(None, description="Retest timestamp")
    due_date: Optional[datetime] = Field(None, description="Due date")


# ========== CREATE SCHEMA ==========
class IssueCreate(IssueBase):
    project_id: UUID = Field(..., description="Project ID")
    created_by: str = Field(..., description="Creator email or ID")


# ========== UPDATE SCHEMA ==========
class IssueUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    severity: Optional[IssueSeverity] = None
    priority: Optional[IssuePriority] = None
    status: Optional[IssueStatus] = None
    detected_by: Optional[IssueDetectedBy] = None

    related_test_case_id: Optional[UUID] = None
    test_run_id: Optional[UUID] = None
    test_plan_id: Optional[UUID] = None

    external_issue_key: Optional[str] = None
    external_system: Optional[str] = None
    external_url: Optional[str] = None

    assigned_to: Optional[UUID] = None
    assigned_to_name: Optional[str] = None

    resolution: Optional[str] = None
    resolution_notes: Optional[str] = None
    fixed_in_version: Optional[str] = None

    steps_to_reproduce: Optional[List[StepToReproduceSchema]] = None
    actual_result: Optional[str] = None
    expected_result: Optional[str] = None
    environment: Optional[Dict[str, Any]] = None
    attachments: Optional[List[str]] = None

    affected_features: Optional[List[str]] = None
    affected_users: Optional[str] = None
    workaround: Optional[str] = None

    remediation_suggestions: Optional[List[str]] = None
    ai_confidence: Optional[str] = None
    root_cause_analysis: Optional[str] = None

    estimated_effort_hours: Optional[str] = None
    actual_effort_hours: Optional[str] = None

    tags: Optional[List[str]] = None
    labels: Optional[List[str]] = None
    meta_data: Optional[Dict[str, Any]] = None

    assigned_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    retested_at: Optional[datetime] = None
    due_date: Optional[datetime] = None


# ========== RESPONSE SCHEMA ==========
class IssueResponse(IssueBase):
    id: UUID
    project_id: UUID

    created_at: datetime
    updated_at: Optional[datetime]
    created_by: str

    status_history: List[StatusHistorySchema] = Field(default_factory=list, description="Status change history")

    class Config:
        from_attributes = True


# ========== STATUS CHANGE SCHEMA ==========
class IssueStatusChangeRequest(BaseModel):
    """Schema for changing issue status"""
    status: IssueStatus = Field(..., description="New status")
    notes: Optional[str] = Field(None, description="Status change notes")
    user_id: UUID = Field(..., description="User making the change")
    user_name: str = Field(..., description="User name")


# ========== ASSIGNMENT SCHEMA ==========
class IssueAssignmentRequest(BaseModel):
    """Schema for assigning an issue"""
    assigned_to: UUID = Field(..., description="User ID to assign to")
    assigned_to_name: str = Field(..., description="User name")
    notify: bool = Field(default=True, description="Send notification")


# ========== COMMENT SCHEMA ==========
class IssueCommentRequest(BaseModel):
    """Schema for adding a comment"""
    comment: str = Field(..., min_length=1, description="Comment text")
    user_id: UUID = Field(..., description="User ID")
    user_name: str = Field(..., description="User name")
    attachments: List[str] = Field(default_factory=list, description="Attachment URLs")


# ========== METRICS SCHEMA ==========
class IssueMetrics(BaseModel):
    """Schema for issue metrics"""
    total_issues: int
    open_issues: int
    closed_issues: int
    in_progress_issues: int
    by_severity: Dict[str, int]
    by_priority: Dict[str, int]
    by_status: Dict[str, int]
    avg_resolution_time_hours: Optional[float]
    defect_density: Optional[float]


# ========== BULK OPERATIONS ==========
class IssueBulkUpdateRequest(BaseModel):
    """Schema for bulk updating issues"""
    issue_ids: List[UUID] = Field(..., description="Issue IDs to update")
    update_data: IssueUpdate = Field(..., description="Update data")


class IssueBulkAssignRequest(BaseModel):
    """Schema for bulk assignment"""
    issue_ids: List[UUID] = Field(..., description="Issue IDs to assign")
    assigned_to: UUID = Field(..., description="User ID to assign to")
    assigned_to_name: str = Field(..., description="User name")


# ========== AI GENERATION SCHEMAS ==========
class IssueAIAnalysisRequest(BaseModel):
    """Request AI analysis for an issue"""
    issue_id: UUID = Field(..., description="Issue ID")
    analyze_root_cause: bool = Field(default=True, description="Perform root cause analysis")
    generate_remediation: bool = Field(default=True, description="Generate remediation suggestions")


class IssueAIAnalysisResponse(BaseModel):
    """Response from AI analysis"""
    root_cause_analysis: Optional[str]
    remediation_suggestions: List[str]
    similar_issues: List[UUID]
    confidence: str


# ========== EXTERNAL SYNC SCHEMAS ==========
class IssueExternalSyncRequest(BaseModel):
    """Sync issue with external system"""
    external_system: str = Field(..., description="External system (jira, github, testrail)")
    external_issue_key: Optional[str] = Field(None, description="External issue key if already exists")
    create_if_not_exists: bool = Field(default=True, description="Create in external system if not exists")


class IssueExternalSyncResponse(BaseModel):
    """Response from external sync"""
    success: bool
    external_issue_key: str
    external_url: str
    message: str
