"""
Enterprise Security Testing Module Schemas
API request/response validation schemas for security scanning
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.models.security_scan import (
    ScanType, ScanStatus, SeverityLevel, VulnerabilityCategory,
    ComplianceFramework, ComplianceStatus, TargetType, ScheduleFrequency
)


# ============================================================================
# Security Scan Schemas
# ============================================================================

class SecurityScanCreate(BaseModel):
    """Create a new security scan"""
    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    scan_type: ScanType
    targets: List["ScanTargetCreate"] = Field(..., min_items=1)
    config: Dict[str, Any] = Field(default_factory=dict)
    scan_depth: str = Field(default="standard")  # quick, standard, deep
    enable_active_scanning: bool = False
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class SecurityScanUpdate(BaseModel):
    """Update an existing security scan"""
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None


class SecurityScanResponse(BaseModel):
    """Response schema for security scan"""
    id: UUID
    project_id: UUID
    organisation_id: UUID
    human_id: Optional[str]
    name: str
    description: Optional[str]
    scan_type: ScanType
    status: ScanStatus
    progress_percentage: int
    config: Dict[str, Any]
    scan_depth: str
    enable_active_scanning: bool
    
    # Results Summary
    total_vulnerabilities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    
    # Risk
    risk_score: float
    risk_grade: Optional[str]
    
    # Performance
    duration_ms: Optional[int]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    # Error
    error_message: Optional[str]
    
    # Metadata
    tags: List[str]
    notes: Optional[str]
    triggered_by: Optional[UUID]
    trigger_source: str
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SecurityScanDetailResponse(SecurityScanResponse):
    """Detailed response including targets and vulnerabilities"""
    targets: List["ScanTargetResponse"] = []
    vulnerabilities: List["VulnerabilityResponse"] = []
    compliance_checks: List["ComplianceCheckResponse"] = []


class SecurityScanListResponse(BaseModel):
    """Paginated list of security scans"""
    items: List[SecurityScanResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ============================================================================
# Scan Target Schemas
# ============================================================================

class ScanTargetCreate(BaseModel):
    """Create a scan target"""
    target_type: TargetType
    target_value: str = Field(..., min_length=1, max_length=2000)
    target_name: Optional[str] = Field(None, max_length=500)


class ScanTargetResponse(BaseModel):
    """Response schema for scan target"""
    id: UUID
    scan_id: UUID
    target_type: TargetType
    target_value: str
    target_name: Optional[str]
    status: ScanStatus
    
    # URL Security Specific
    ssl_certificate: Optional[Dict[str, Any]]
    ssl_grade: Optional[str]
    ssl_expires_at: Optional[datetime]
    open_ports: List[Dict[str, Any]]
    http_headers: Optional[Dict[str, Any]]
    subdomains_discovered: List[str]
    dns_records: Optional[Dict[str, Any]]
    
    # Repository Specific
    repo_branch: Optional[str]
    last_commit_sha: Optional[str]
    dependencies_count: Optional[int]
    secrets_found: int
    
    # Results
    vulnerability_count: int
    risk_score: float
    scanned_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Vulnerability Schemas
# ============================================================================

class VulnerabilityCreate(BaseModel):
    """Create a vulnerability (typically done by scan service)"""
    title: str = Field(..., min_length=1, max_length=500)
    description: str
    category: VulnerabilityCategory
    severity: SeverityLevel
    cvss_score: Optional[float] = Field(None, ge=0.0, le=10.0)
    cvss_vector: Optional[str] = None
    affected_component: Optional[str] = None
    affected_url: Optional[str] = None
    affected_file: Optional[str] = None
    affected_line: Optional[int] = None
    evidence: Optional[str] = None
    cve_id: Optional[str] = None
    cwe_id: Optional[str] = None
    package_name: Optional[str] = None
    package_version: Optional[str] = None
    fixed_version: Optional[str] = None
    remediation: Optional[str] = None
    references: List[str] = Field(default_factory=list)


class VulnerabilityUpdate(BaseModel):
    """Update vulnerability status"""
    is_false_positive: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_resolved: Optional[bool] = None
    notes: Optional[str] = None


class VulnerabilityResponse(BaseModel):
    """Response schema for vulnerability"""
    id: UUID
    scan_id: UUID
    target_id: Optional[UUID]
    human_id: Optional[str]
    
    # Details
    title: str
    description: str
    category: VulnerabilityCategory
    severity: SeverityLevel
    
    # CVSS
    cvss_score: Optional[float]
    cvss_vector: Optional[str]
    
    # Location
    affected_component: Optional[str]
    affected_url: Optional[str]
    affected_file: Optional[str]
    affected_line: Optional[int]
    
    # Evidence
    evidence: Optional[str]
    request: Optional[str]
    response: Optional[str]
    payload: Optional[str]
    
    # CVE/CWE
    cve_id: Optional[str]
    cwe_id: Optional[str]
    
    # Dependency Info
    package_name: Optional[str]
    package_version: Optional[str]
    fixed_version: Optional[str]
    
    # Remediation
    remediation: Optional[str]
    remediation_complexity: Optional[str]
    remediation_priority: Optional[int]
    ai_remediation: Optional[str]
    ai_code_fix: Optional[str]
    
    # References
    references: List[str]
    
    # Status
    is_false_positive: bool
    is_verified: bool
    is_resolved: bool
    resolved_at: Optional[datetime]
    
    # Timestamps
    discovered_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class VulnerabilityListResponse(BaseModel):
    """Paginated list of vulnerabilities"""
    items: List[VulnerabilityResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ============================================================================
# Compliance Schemas
# ============================================================================

class ComplianceCheckCreate(BaseModel):
    """Create a compliance check"""
    framework: ComplianceFramework
    control_id: str = Field(..., max_length=50)
    control_name: str = Field(..., max_length=500)
    control_description: Optional[str] = None
    status: ComplianceStatus = ComplianceStatus.NOT_ASSESSED


class ComplianceCheckUpdate(BaseModel):
    """Update compliance check"""
    status: Optional[ComplianceStatus] = None
    assessment_notes: Optional[str] = None
    evidence_provided: Optional[List[str]] = None
    gaps_identified: Optional[List[str]] = None


class ComplianceCheckResponse(BaseModel):
    """Response schema for compliance check"""
    id: UUID
    scan_id: UUID
    project_id: UUID
    framework: ComplianceFramework
    control_id: str
    control_name: str
    control_description: Optional[str]
    status: ComplianceStatus
    assessment_notes: Optional[str]
    evidence_provided: List[str]
    gaps_identified: List[str]
    related_vulnerabilities: List[str]
    inherent_risk: Optional[str]
    residual_risk: Optional[str]
    assessed_at: Optional[datetime]
    next_review_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ComplianceReportResponse(BaseModel):
    """Compliance report for a framework"""
    framework: ComplianceFramework
    project_id: UUID
    generated_at: datetime
    total_controls: int
    compliant_count: int
    non_compliant_count: int
    partial_count: int
    not_applicable_count: int
    not_assessed_count: int
    compliance_percentage: float
    checks: List[ComplianceCheckResponse]


# ============================================================================
# Scan Schedule Schemas
# ============================================================================

class ScanScheduleCreate(BaseModel):
    """Create a scan schedule"""
    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    scan_type: ScanType
    targets: List[ScanTargetCreate]
    scan_config: Dict[str, Any] = Field(default_factory=dict)
    frequency: ScheduleFrequency
    cron_expression: Optional[str] = None
    timezone: str = Field(default="UTC")
    is_enabled: bool = True
    notify_on_complete: bool = True
    notify_on_critical: bool = True
    notification_emails: List[str] = Field(default_factory=list)


class ScanScheduleUpdate(BaseModel):
    """Update scan schedule"""
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    targets: Optional[List[ScanTargetCreate]] = None
    scan_config: Optional[Dict[str, Any]] = None
    frequency: Optional[ScheduleFrequency] = None
    cron_expression: Optional[str] = None
    timezone: Optional[str] = None
    is_enabled: Optional[bool] = None
    notify_on_complete: Optional[bool] = None
    notify_on_critical: Optional[bool] = None
    notification_emails: Optional[List[str]] = None


class ScanScheduleResponse(BaseModel):
    """Response schema for scan schedule"""
    id: UUID
    project_id: UUID
    organisation_id: UUID
    name: str
    description: Optional[str]
    scan_type: ScanType
    targets: List[Dict[str, Any]]
    scan_config: Dict[str, Any]
    frequency: ScheduleFrequency
    cron_expression: Optional[str]
    timezone: str
    is_enabled: bool
    last_run_at: Optional[datetime]
    next_run_at: Optional[datetime]
    last_scan_id: Optional[UUID]
    total_runs: int
    notify_on_complete: bool
    notify_on_critical: bool
    notification_emails: List[str]
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================================
# Security Asset Schemas
# ============================================================================

class SecurityAssetCreate(BaseModel):
    """Create a security asset for monitoring"""
    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    asset_type: TargetType
    asset_value: str = Field(..., min_length=1, max_length=2000)
    criticality: str = Field(default="medium")
    data_classification: Optional[str] = None
    owner: Optional[str] = None
    monitoring_enabled: bool = True
    ssl_monitoring_enabled: bool = True
    tags: List[str] = Field(default_factory=list)
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)


class SecurityAssetUpdate(BaseModel):
    """Update security asset"""
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    criticality: Optional[str] = None
    data_classification: Optional[str] = None
    owner: Optional[str] = None
    monitoring_enabled: Optional[bool] = None
    ssl_monitoring_enabled: Optional[bool] = None
    tags: Optional[List[str]] = None
    custom_attributes: Optional[Dict[str, Any]] = None


class SecurityAssetResponse(BaseModel):
    """Response schema for security asset"""
    id: UUID
    project_id: UUID
    organisation_id: UUID
    name: str
    description: Optional[str]
    asset_type: TargetType
    asset_value: str
    criticality: str
    data_classification: Optional[str]
    owner: Optional[str]
    current_risk_score: float
    last_scan_at: Optional[datetime]
    last_scan_id: Optional[UUID]
    vulnerability_count: int
    monitoring_enabled: bool
    ssl_monitoring_enabled: bool
    tags: List[str]
    custom_attributes: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[UUID]

    class Config:
        from_attributes = True


# ============================================================================
# Dashboard & Statistics Schemas
# ============================================================================

class SeverityBreakdown(BaseModel):
    """Breakdown by severity level"""
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0


class CategoryBreakdown(BaseModel):
    """Breakdown by vulnerability category"""
    category: str
    count: int
    percentage: float


class SecurityDashboardStats(BaseModel):
    """Security dashboard statistics"""
    project_id: UUID
    
    # Overview
    total_scans: int
    total_assets: int
    total_vulnerabilities: int
    open_vulnerabilities: int
    resolved_vulnerabilities: int
    
    # Risk
    overall_risk_score: float
    risk_grade: str
    risk_trend: str  # improving, stable, declining
    
    # Severity Breakdown
    severity_breakdown: SeverityBreakdown
    
    # Category Breakdown
    top_categories: List[CategoryBreakdown]
    
    # Recent Activity
    scans_last_7_days: int
    scans_last_30_days: int
    new_vulnerabilities_last_7_days: int
    resolved_last_7_days: int
    
    # SSL Monitoring
    certificates_monitored: int
    certificates_expiring_soon: int
    
    # Compliance
    compliance_score: Optional[float] = None


class RiskScoreResponse(BaseModel):
    """Risk score details"""
    score: float  # 0-100
    grade: str    # A+, A, B, C, D, F
    trend: str    # improving, stable, declining
    factors: List[Dict[str, Any]]
    recommendations: List[str]


class SecurityTrendResponse(BaseModel):
    """Security trends over time"""
    period: str  # daily, weekly, monthly
    data_points: List[Dict[str, Any]]


# ============================================================================
# URL Security Specific Schemas
# ============================================================================

class URLScanRequest(BaseModel):
    """Request to scan a URL"""
    target_url: str = Field(..., min_length=1, max_length=2000)
    scan_depth: str = Field(default="standard")
    check_ssl: bool = True
    check_headers: bool = True
    check_subdomains: bool = True
    check_ports: bool = True
    port_range: str = Field(default="common")  # common, full, custom
    custom_ports: Optional[List[int]] = None


class SSLCertificateResponse(BaseModel):
    """SSL certificate details"""
    is_valid: bool
    issuer: str
    subject: str
    serial_number: str
    valid_from: datetime
    valid_until: datetime
    days_until_expiry: int
    signature_algorithm: str
    key_size: int
    grade: str  # A+, A, B, C, D, F
    issues: List[str]
    chain: List[Dict[str, Any]]


class PortScanResult(BaseModel):
    """Port scan result"""
    port: int
    state: str  # open, closed, filtered
    service: Optional[str]
    version: Optional[str]
    is_secure: bool
    notes: Optional[str]


class SecurityHeadersResponse(BaseModel):
    """Security headers analysis"""
    grade: str
    score: int  # 0-100
    headers_present: List[str]
    headers_missing: List[str]
    issues: List[Dict[str, Any]]
    recommendations: List[str]


# ============================================================================
# Repository Security Specific Schemas
# ============================================================================

class RepoScanRequest(BaseModel):
    """Request to scan a repository"""
    repo_url: str = Field(..., min_length=1, max_length=2000)
    branch: str = Field(default="main")
    scan_secrets: bool = True
    scan_dependencies: bool = True
    scan_licenses: bool = True
    scan_code_quality: bool = False


class VAPTScanRequest(BaseModel):
    """Request to run VAPT scan (Vulnerability Assessment and Penetration Testing)"""
    target_url: str = Field(..., min_length=1, max_length=2000)
    scan_mode: str = Field(default="passive")  # passive, active
    test_sql_injection: bool = True
    test_xss: bool = True
    test_csrf: bool = True
    test_headers: bool = True
    test_authentication: bool = True
    test_access_control: bool = False
    test_cryptographic_failures: bool = False
    scan_depth: str = Field(default="standard")


class SecretFindingResponse(BaseModel):
    """Detected secret in repository"""
    id: UUID
    secret_type: str  # api_key, password, token, etc.
    file_path: str
    line_number: int
    commit_sha: Optional[str]
    severity: SeverityLevel
    is_active: bool
    is_verified: bool
    masked_value: str
    remediation: str


class DependencyVulnerabilityResponse(BaseModel):
    """Vulnerable dependency"""
    package_name: str
    current_version: str
    fixed_version: Optional[str]
    severity: SeverityLevel
    cve_id: Optional[str]
    cvss_score: Optional[float]
    description: str
    is_direct: bool
    dependency_path: List[str]


class LicenseCheckResponse(BaseModel):
    """License compliance check"""
    package_name: str
    version: str
    license: str
    license_type: str  # permissive, copyleft, proprietary, unknown
    is_compliant: bool
    issues: List[str]


# Update forward references
SecurityScanCreate.model_rebuild()
SecurityScanDetailResponse.model_rebuild()
