"""
Enterprise Security Testing Module Models
Comprehensive security scanning, VAPT, and compliance governance
"""
from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum, Boolean, Integer, Float, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


# ============================================================================
# Enums
# ============================================================================

class ScanType(str, enum.Enum):
    """Type of security scan"""
    URL_SECURITY = "url_security"           # External attack surface
    REPO_SECURITY = "repo_security"         # Repository/DevSecOps
    VAPT = "vapt"                           # Vulnerability Assessment
    COMPLIANCE = "compliance"               # Compliance audit
    API_SECURITY = "api_security"           # API security testing
    NETWORK_SECURITY = "network_security"   # Network scanning


class ScanStatus(str, enum.Enum):
    """Status of a security scan"""
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class SeverityLevel(str, enum.Enum):
    """Vulnerability severity levels (CVSS-based)"""
    CRITICAL = "critical"   # 9.0-10.0
    HIGH = "high"           # 7.0-8.9
    MEDIUM = "medium"       # 4.0-6.9
    LOW = "low"             # 0.1-3.9
    INFO = "info"           # Informational


class VulnerabilityCategory(str, enum.Enum):
    """OWASP Top 10 2021 + Additional security categories"""
    # OWASP Top 10 2021
    A01_BROKEN_ACCESS_CONTROL = "A01:2021-Broken Access Control"
    A02_CRYPTOGRAPHIC_FAILURES = "A02:2021-Cryptographic Failures"
    A03_INJECTION = "A03:2021-Injection"
    A04_INSECURE_DESIGN = "A04:2021-Insecure Design"
    A05_SECURITY_MISCONFIGURATION = "A05:2021-Security Misconfiguration"
    A06_VULNERABLE_COMPONENTS = "A06:2021-Vulnerable and Outdated Components"
    A07_AUTH_FAILURES = "A07:2021-Identification and Authentication Failures"
    A08_DATA_INTEGRITY_FAILURES = "A08:2021-Software and Data Integrity Failures"
    A09_LOGGING_FAILURES = "A09:2021-Security Logging and Monitoring Failures"
    A10_SSRF = "A10:2021-Server-Side Request Forgery"
    
    # URL Security
    SSL_TLS = "SSL/TLS Issues"
    DNS_SECURITY = "DNS Security"
    HTTP_HEADERS = "HTTP Security Headers"
    SUBDOMAIN = "Subdomain Issues"
    PORT_EXPOSURE = "Open Port Exposure"
    
    # Repository Security
    SECRET_EXPOSURE = "Secret Exposure"
    DEPENDENCY_VULNERABILITY = "Dependency Vulnerability"
    LICENSE_VIOLATION = "License Violation"
    CODE_QUALITY = "Code Quality Issue"
    
    # Network Security
    FIREWALL = "Firewall Configuration"
    NETWORK_EXPOSURE = "Network Exposure"
    
    # General
    OTHER = "Other"


class ComplianceFramework(str, enum.Enum):
    """Supported compliance frameworks"""
    ISO_27001 = "ISO 27001"
    SOC_2 = "SOC 2"
    GDPR = "GDPR"
    PCI_DSS = "PCI DSS"
    HIPAA = "HIPAA"
    NIST = "NIST CSF"
    CIS = "CIS Controls"


class ComplianceStatus(str, enum.Enum):
    """Status of compliance check"""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIAL = "partial"
    NOT_APPLICABLE = "not_applicable"
    NOT_ASSESSED = "not_assessed"


class TargetType(str, enum.Enum):
    """Type of scan target"""
    URL = "url"
    DOMAIN = "domain"
    IP = "ip"
    REPOSITORY = "repository"
    API_ENDPOINT = "api_endpoint"
    NETWORK_RANGE = "network_range"


class ScheduleFrequency(str, enum.Enum):
    """Scan schedule frequency"""
    ONCE = "once"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


# ============================================================================
# Models
# ============================================================================

class SecurityScan(Base):
    """
    Security Scan - Main entity for any type of security scan
    """
    __tablename__ = "security_scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    
    # Human-friendly ID for display (SCAN-XXXXX)
    human_id = Column(String(15), unique=True, nullable=True)

    # Scan Identification
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    scan_type = Column(SQLEnum(ScanType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    # Status & Progress
    status = Column(SQLEnum(ScanStatus, values_callable=lambda x: [e.value for e in x]), default=ScanStatus.PENDING)
    progress_percentage = Column(Integer, default=0)
    
    # Scan Configuration
    config = Column(JSON, default=dict)  # Type-specific configuration
    scan_depth = Column(String(50), default="standard")  # quick, standard, deep
    enable_active_scanning = Column(Boolean, default=False)  # Active vs passive
    
    # Results Summary
    total_vulnerabilities = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    
    # Risk Score (0-100)
    risk_score = Column(Float, default=0.0)
    risk_grade = Column(String(5), nullable=True)  # A+, A, B, C, D, F
    
    # Performance Metrics
    duration_ms = Column(Integer, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    
    # Metadata
    tags = Column(JSON, default=list)
    notes = Column(Text, nullable=True)
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    trigger_source = Column(String(100), default="manual")  # manual, scheduled, ci, api
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    organisation = relationship("Organisation")
    triggered_by_user = relationship("User", foreign_keys=[triggered_by])
    targets = relationship("ScanTarget", back_populates="scan", cascade="all, delete-orphan")
    vulnerabilities = relationship("Vulnerability", back_populates="scan", cascade="all, delete-orphan")
    compliance_checks = relationship("ComplianceCheck", back_populates="scan", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('ix_security_scans_project_id', 'project_id'),
        Index('ix_security_scans_organisation_id', 'organisation_id'),
        Index('ix_security_scans_status', 'status'),
        Index('ix_security_scans_scan_type', 'scan_type'),
    )

    def __repr__(self):
        return f"<SecurityScan {self.name} - {self.scan_type}>"


class ScanTarget(Base):
    """
    Scan Target - URL, repository, or asset being scanned
    """
    __tablename__ = "scan_targets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("security_scans.id", ondelete="CASCADE"), nullable=False)
    
    # Target Details
    target_type = Column(SQLEnum(TargetType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    target_value = Column(String(2000), nullable=False)  # URL, IP, repo URL
    target_name = Column(String(500), nullable=True)  # Friendly name
    
    # Status
    status = Column(SQLEnum(ScanStatus, values_callable=lambda x: [e.value for e in x]), default=ScanStatus.PENDING)
    
    # URL Security Specific
    ssl_certificate = Column(JSON, nullable=True)  # Certificate details
    ssl_grade = Column(String(5), nullable=True)  # A+, A, B, C, D, F
    ssl_expires_at = Column(DateTime(timezone=True), nullable=True)
    open_ports = Column(JSON, default=list)  # [{port, service, state}]
    http_headers = Column(JSON, nullable=True)  # Security headers analysis
    subdomains_discovered = Column(JSON, default=list)
    dns_records = Column(JSON, nullable=True)
    
    # Repository Security Specific
    repo_branch = Column(String(255), nullable=True)
    last_commit_sha = Column(String(100), nullable=True)
    dependencies_count = Column(Integer, nullable=True)
    secrets_found = Column(Integer, default=0)
    
    # Results Summary
    vulnerability_count = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    
    # Timestamps
    scanned_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    scan = relationship("SecurityScan", back_populates="targets")
    vulnerabilities = relationship("Vulnerability", back_populates="target", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ScanTarget {self.target_value}>"


class Vulnerability(Base):
    """
    Vulnerability - Detected security issue
    """
    __tablename__ = "vulnerabilities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("security_scans.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(UUID(as_uuid=True), ForeignKey("scan_targets.id", ondelete="CASCADE"), nullable=True)
    
    # Human-friendly ID (VULN-XXXXX)
    human_id = Column(String(15), unique=True, nullable=True)
    
    # Vulnerability Details
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(SQLEnum(VulnerabilityCategory, values_callable=lambda x: [e.value for e in x]), nullable=False)
    severity = Column(SQLEnum(SeverityLevel, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    # CVSS Score
    cvss_score = Column(Float, nullable=True)  # 0.0-10.0
    cvss_vector = Column(String(255), nullable=True)
    
    # Location
    affected_component = Column(String(500), nullable=True)
    affected_url = Column(String(2000), nullable=True)
    affected_file = Column(String(1000), nullable=True)
    affected_line = Column(Integer, nullable=True)
    
    # Technical Details
    evidence = Column(Text, nullable=True)  # Proof of vulnerability
    request = Column(Text, nullable=True)   # HTTP request that triggered it
    response = Column(Text, nullable=True)  # HTTP response
    payload = Column(Text, nullable=True)   # Attack payload used
    
    # CVE Information
    cve_id = Column(String(50), nullable=True)  # CVE-XXXX-XXXXX
    cwe_id = Column(String(50), nullable=True)  # CWE-XXX
    
    # Dependency Vulnerability Specific
    package_name = Column(String(255), nullable=True)
    package_version = Column(String(100), nullable=True)
    fixed_version = Column(String(100), nullable=True)
    
    # Remediation
    remediation = Column(Text, nullable=True)
    remediation_complexity = Column(String(50), nullable=True)  # low, medium, high
    remediation_priority = Column(Integer, nullable=True)  # 1-10
    
    # AI-Suggested Remediation
    ai_remediation = Column(Text, nullable=True)
    ai_code_fix = Column(Text, nullable=True)
    
    # References
    references = Column(JSON, default=list)  # URLs to documentation
    
    # Status Tracking
    is_false_positive = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    discovered_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    scan = relationship("SecurityScan", back_populates="vulnerabilities")
    target = relationship("ScanTarget", back_populates="vulnerabilities")
    resolved_by_user = relationship("User", foreign_keys=[resolved_by])

    # Indexes
    __table_args__ = (
        Index('ix_vulnerabilities_scan_id', 'scan_id'),
        Index('ix_vulnerabilities_severity', 'severity'),
        Index('ix_vulnerabilities_category', 'category'),
    )

    def __repr__(self):
        return f"<Vulnerability {self.title} - {self.severity}>"


class ComplianceCheck(Base):
    """
    Compliance Check - Mapping vulnerabilities to compliance frameworks
    """
    __tablename__ = "compliance_checks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("security_scans.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Framework Details
    framework = Column(SQLEnum(ComplianceFramework, values_callable=lambda x: [e.value for e in x]), nullable=False)
    control_id = Column(String(50), nullable=False)  # e.g., "A.5.1.1" for ISO 27001
    control_name = Column(String(500), nullable=False)
    control_description = Column(Text, nullable=True)
    
    # Status
    status = Column(SQLEnum(ComplianceStatus, values_callable=lambda x: [e.value for e in x]), default=ComplianceStatus.NOT_ASSESSED)
    
    # Assessment Details
    assessment_notes = Column(Text, nullable=True)
    evidence_provided = Column(JSON, default=list)  # List of evidence documents/screenshots
    gaps_identified = Column(JSON, default=list)
    
    # Related Vulnerabilities
    related_vulnerabilities = Column(JSON, default=list)  # List of vulnerability IDs
    
    # Risk Assessment
    inherent_risk = Column(String(50), nullable=True)  # high, medium, low
    residual_risk = Column(String(50), nullable=True)
    
    # Timestamps
    assessed_at = Column(DateTime(timezone=True), nullable=True)
    next_review_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    scan = relationship("SecurityScan", back_populates="compliance_checks")
    project = relationship("Project")

    # Indexes
    __table_args__ = (
        Index('ix_compliance_checks_project_id', 'project_id'),
        Index('ix_compliance_checks_framework', 'framework'),
    )

    def __repr__(self):
        return f"<ComplianceCheck {self.framework} - {self.control_id}>"


class ScanSchedule(Base):
    """
    Scan Schedule - Automated recurring security scans
    """
    __tablename__ = "scan_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    
    # Schedule Details
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    scan_type = Column(SQLEnum(ScanType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    # Target Configuration
    targets = Column(JSON, nullable=False)  # List of targets to scan
    scan_config = Column(JSON, default=dict)  # Scan configuration
    
    # Schedule Configuration
    frequency = Column(SQLEnum(ScheduleFrequency, values_callable=lambda x: [e.value for e in x]), nullable=False)
    cron_expression = Column(String(100), nullable=True)  # For custom schedules
    timezone = Column(String(100), default="UTC")
    
    # Status
    is_enabled = Column(Boolean, default=True)
    
    # Execution Tracking
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)
    last_scan_id = Column(UUID(as_uuid=True), ForeignKey("security_scans.id", ondelete="SET NULL"), nullable=True)
    total_runs = Column(Integer, default=0)
    
    # Notifications
    notify_on_complete = Column(Boolean, default=True)
    notify_on_critical = Column(Boolean, default=True)
    notification_emails = Column(JSON, default=list)
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    organisation = relationship("Organisation")
    creator = relationship("User", foreign_keys=[created_by])
    last_scan = relationship("SecurityScan", foreign_keys=[last_scan_id])

    def __repr__(self):
        return f"<ScanSchedule {self.name}>"


class SecurityAsset(Base):
    """
    Security Asset - Registered assets for continuous monitoring
    """
    __tablename__ = "security_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    
    # Asset Details
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    asset_type = Column(SQLEnum(TargetType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    asset_value = Column(String(2000), nullable=False)
    
    # Classification
    criticality = Column(String(50), default="medium")  # critical, high, medium, low
    data_classification = Column(String(100), nullable=True)  # public, internal, confidential, restricted
    owner = Column(String(255), nullable=True)
    
    # Current Security Status
    current_risk_score = Column(Float, default=0.0)
    last_scan_at = Column(DateTime(timezone=True), nullable=True)
    last_scan_id = Column(UUID(as_uuid=True), ForeignKey("security_scans.id", ondelete="SET NULL"), nullable=True)
    vulnerability_count = Column(Integer, default=0)
    
    # Monitoring Configuration
    monitoring_enabled = Column(Boolean, default=True)
    ssl_monitoring_enabled = Column(Boolean, default=True)
    
    # Metadata
    tags = Column(JSON, default=list)
    custom_attributes = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    project = relationship("Project")
    organisation = relationship("Organisation")
    creator = relationship("User", foreign_keys=[created_by])
    last_scan = relationship("SecurityScan", foreign_keys=[last_scan_id])

    def __repr__(self):
        return f"<SecurityAsset {self.name}>"
