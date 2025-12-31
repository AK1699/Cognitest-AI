"""
Advanced Security Schemas
Pydantic schemas for SAST, SCA, IAST, RASP, SBOM, Policy, and CI/CD APIs
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

class SASTEngineEnum(str, Enum):
    SEMGREP = "semgrep"
    BANDIT = "bandit"
    ESLINT = "eslint"
    CUSTOM = "custom"


class SeverityEnum(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class FindingStatusEnum(str, Enum):
    OPEN = "open"
    CONFIRMED = "confirmed"
    FALSE_POSITIVE = "false_positive"
    FIXED = "fixed"
    ACCEPTED_RISK = "accepted_risk"


class SBOMFormatEnum(str, Enum):
    CYCLONEDX_JSON = "cyclonedx_json"
    CYCLONEDX_XML = "cyclonedx_xml"
    SPDX_JSON = "spdx_json"


class CICDProviderEnum(str, Enum):
    GITHUB_ACTIONS = "github_actions"
    GITLAB_CI = "gitlab_ci"
    JENKINS = "jenkins"
    AZURE_DEVOPS = "azure_devops"


class AttackTypeEnum(str, Enum):
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    COMMAND_INJECTION = "command_injection"
    PATH_TRAVERSAL = "path_traversal"
    SSRF = "ssrf"
    RATE_LIMIT = "rate_limit"


# ============================================================================
# SAST Schemas
# ============================================================================

class SASTScanCreate(BaseModel):
    name: str
    repo_path: Optional[str] = None
    repo_url: Optional[str] = None
    engines: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    ruleset: str = "default"
    exclude_patterns: Optional[List[str]] = None


class SASTScanResponse(BaseModel):
    id: UUID
    human_id: Optional[str] = None
    name: str
    status: str
    engines: Optional[List[str]] = None
    total_findings: int = 0
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    files_scanned: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SASTFindingResponse(BaseModel):
    id: UUID
    rule_id: str
    rule_name: str
    engine: str
    severity: SeverityEnum
    file_path: str
    start_line: int
    end_line: Optional[int] = None
    code_snippet: Optional[str] = None
    title: str
    description: Optional[str] = None
    remediation: Optional[str] = None
    cwe_id: Optional[str] = None
    status: FindingStatusEnum
    ai_fix_suggestion: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# SCA Schemas
# ============================================================================

class SCAScanCreate(BaseModel):
    name: str
    project_path: str
    check_licenses: bool = True
    check_vulnerabilities: bool = True


class SCAScanResponse(BaseModel):
    id: UUID
    human_id: Optional[str] = None
    name: str
    status: str
    total_dependencies: int = 0
    vulnerable_dependencies: int = 0
    license_issues: int = 0
    critical_vulns: int = 0
    high_vulns: int = 0
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SCAFindingResponse(BaseModel):
    id: UUID
    package_name: str
    package_version: str
    package_ecosystem: str
    cve_id: Optional[str] = None
    severity: SeverityEnum
    title: str
    fixed_version: Optional[str] = None
    is_direct: bool = True
    is_license_issue: bool = False
    license_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# IAST Schemas
# ============================================================================

class IASTSessionCreate(BaseModel):
    name: str
    app_url: str
    config: Optional[Dict[str, Any]] = None


class IASTSessionResponse(BaseModel):
    id: UUID
    human_id: Optional[str] = None
    name: str
    app_url: str
    status: str
    session_token: Optional[str] = None
    requests_analyzed: int = 0
    vulnerabilities_found: int = 0
    started_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class IASTAnalyzeRequest(BaseModel):
    session_token: str
    method: str
    url: str
    headers: Optional[Dict[str, str]] = None
    body: Optional[str] = None
    response_status: Optional[int] = None
    response_body: Optional[str] = None


class IASTFindingResponse(BaseModel):
    id: UUID
    vulnerability_type: str
    severity: SeverityEnum
    http_method: Optional[str] = None
    request_url: Optional[str] = None
    tainted_input: Optional[str] = None
    title: str
    description: Optional[str] = None
    remediation: Optional[str] = None
    detected_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# RASP Schemas
# ============================================================================

class RASPConfigCreate(BaseModel):
    name: str
    block_sql_injection: bool = True
    block_xss: bool = True
    block_command_injection: bool = True
    block_path_traversal: bool = True
    block_ssrf: bool = True
    enable_rate_limiting: bool = True
    rate_limit_requests: int = 100
    rate_limit_window: int = 60


class RASPConfigResponse(BaseModel):
    id: UUID
    name: str
    is_enabled: bool
    block_sql_injection: bool
    block_xss: bool
    enable_rate_limiting: bool
    rate_limit_requests: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class RASPEventResponse(BaseModel):
    id: UUID
    attack_type: AttackTypeEnum
    severity: SeverityEnum
    was_blocked: bool
    source_ip: Optional[str] = None
    http_method: Optional[str] = None
    request_path: Optional[str] = None
    attack_payload: Optional[str] = None
    occurred_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class RASPStatsResponse(BaseModel):
    total: int
    blocked: int
    by_attack_type: Optional[Dict[str, int]] = None


# ============================================================================
# SBOM Schemas
# ============================================================================

class SBOMGenerateRequest(BaseModel):
    name: str
    source_path: str
    format: SBOMFormatEnum = SBOMFormatEnum.CYCLONEDX_JSON


class SBOMResponse(BaseModel):
    id: UUID
    human_id: Optional[str] = None
    name: str
    format: str
    total_components: int = 0
    direct_dependencies: int = 0
    high_risk_licenses: int = 0
    generated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SBOMComponentResponse(BaseModel):
    id: UUID
    name: str
    version: Optional[str] = None
    ecosystem: Optional[str] = None
    purl: Optional[str] = None
    license_id: Optional[str] = None
    is_direct: bool = True
    is_vulnerable: bool = False
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Policy Schemas
# ============================================================================

class PolicyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    max_critical: int = 0
    max_high: int = 5
    max_medium: int = 20
    fail_on_threshold_breach: bool = True
    block_high_risk_licenses: bool = False


class PolicyResponse(BaseModel):
    id: UUID
    name: str
    is_enabled: bool
    max_critical: Optional[int] = None
    max_high: Optional[int] = None
    max_medium: Optional[int] = None
    fail_on_threshold_breach: bool
    is_default: bool = False
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PolicyEvaluationResponse(BaseModel):
    passed: bool
    violations: List[str]
    warnings: List[str]
    details: Dict[str, Any]


class SuppressionCreate(BaseModel):
    suppression_type: str
    suppression_value: str
    reason: str
    expires_at: Optional[datetime] = None


# ============================================================================
# CI/CD Schemas
# ============================================================================

class PipelineCreate(BaseModel):
    name: str
    provider: CICDProviderEnum
    trigger_on_push: bool = True
    trigger_on_pr: bool = True
    trigger_branches: Optional[List[str]] = None
    run_sast: bool = True
    run_sca: bool = True
    policy_id: Optional[UUID] = None


class PipelineResponse(BaseModel):
    id: UUID
    name: str
    provider: str
    webhook_token: Optional[str] = None
    webhook_url: Optional[str] = None
    is_enabled: bool
    total_runs: int = 0
    last_run_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PipelineRunResponse(BaseModel):
    id: UUID
    trigger_type: str
    status: str
    commit_sha: Optional[str] = None
    branch: Optional[str] = None
    pr_number: Optional[int] = None
    gate_passed: Optional[bool] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Report Schemas
# ============================================================================

class ReportGenerateRequest(BaseModel):
    name: str
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class ReportResponse(BaseModel):
    id: UUID
    name: str
    report_type: str
    format: str
    status: str
    generated_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
