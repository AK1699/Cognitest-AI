"""
Schemas for Automation Hub API
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.models.automation import AutomationScriptType, AutomationScriptStatus, ExecutionStatus


# Automation Script Schemas
class AutomationScriptCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    script_type: AutomationScriptType
    script_content: Optional[str] = None
    script_path: Optional[str] = None
    script_repository: Optional[str] = None
    execution_environment: Optional[str] = None
    execution_timeout: int = Field(default=300, ge=1, le=3600)
    retry_count: int = Field(default=0, ge=0, le=5)
    trigger_parameters: Dict[str, Any] = Field(default_factory=dict)
    environment_variables: Dict[str, Any] = Field(default_factory=dict)
    dependencies: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    version: str = Field(default="1.0.0")
    category: Optional[str] = None


class AutomationScriptUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[AutomationScriptStatus] = None
    script_content: Optional[str] = None
    script_path: Optional[str] = None
    script_repository: Optional[str] = None
    execution_environment: Optional[str] = None
    execution_timeout: Optional[int] = Field(None, ge=1, le=3600)
    retry_count: Optional[int] = Field(None, ge=0, le=5)
    trigger_parameters: Optional[Dict[str, Any]] = None
    environment_variables: Optional[Dict[str, Any]] = None
    dependencies: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    version: Optional[str] = None
    category: Optional[str] = None


class AutomationScriptResponse(BaseModel):
    id: UUID
    project_id: UUID
    organisation_id: UUID
    name: str
    description: Optional[str]
    script_type: AutomationScriptType
    status: AutomationScriptStatus
    script_content: Optional[str]
    script_path: Optional[str]
    script_repository: Optional[str]
    execution_environment: Optional[str]
    execution_timeout: int
    retry_count: int
    trigger_parameters: Dict[str, Any]
    environment_variables: Dict[str, Any]
    dependencies: List[str]
    prerequisites: List[str]
    tags: List[str]
    version: str
    category: Optional[str]
    total_executions: int
    successful_executions: int
    failed_executions: int
    average_duration: int
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: str
    last_executed_at: Optional[datetime]

    class Config:
        from_attributes = True


# Test Case Execution Schemas
class ExecutionRecordCreate(BaseModel):
    test_case_id: UUID
    automation_script_id: Optional[UUID] = None
    execution_type: str = Field(default="manual")
    test_data: Dict[str, Any] = Field(default_factory=dict)


class ExecutionRecordUpdate(BaseModel):
    status: Optional[ExecutionStatus] = None
    result: Optional[str] = None
    actual_result: Optional[str] = None
    error_message: Optional[str] = None
    execution_logs: Optional[List[Dict[str, Any]]] = None
    console_logs: Optional[str] = None
    screenshots: Optional[List[str]] = None
    attachments: Optional[List[str]] = None
    duration: Optional[int] = None
    execution_environment: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class ExecutionRecordResponse(BaseModel):
    id: UUID
    test_case_id: UUID
    automation_script_id: Optional[UUID]
    project_id: UUID
    execution_type: str
    status: ExecutionStatus
    result: Optional[str]
    actual_result: Optional[str]
    error_message: Optional[str]
    execution_logs: List[Dict[str, Any]]
    console_logs: Optional[str]
    screenshots: List[str]
    attachments: List[str]
    duration: Optional[int]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    execution_environment: Dict[str, Any]
    triggered_by: Optional[str]
    test_data: Dict[str, Any]
    meta_data: Dict[str, Any]
    notes: Optional[str]
    created_at: datetime
    executed_by: str

    class Config:
        from_attributes = True


# Link Automation to Test Case
class LinkAutomationRequest(BaseModel):
    automation_script_id: UUID
    automation_metadata: Dict[str, Any] = Field(default_factory=dict)


# Trigger Execution
class TriggerExecutionRequest(BaseModel):
    test_data: Dict[str, Any] = Field(default_factory=dict)
    execution_environment: Optional[Dict[str, Any]] = None


class TriggerExecutionResponse(BaseModel):
    success: bool
    message: str
    execution_id: UUID
    status: ExecutionStatus
