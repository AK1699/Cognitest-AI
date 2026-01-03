from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum, Boolean, Integer, Float, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from .base import Base

# Enums
class ScanType(str, enum.Enum):
    URL_SECURITY = "url_security"
    REPO_SECURITY = "repo_security"
    VAPT = "vapt"
    COMPLIANCE = "compliance"
    API_SECURITY = "api_security"
    NETWORK_SECURITY = "network_security"

class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"

class SeverityLevel(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class VulnerabilityCategory(str, enum.Enum):
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
    SSL_TLS = "SSL/TLS Issues"
    DNS_SECURITY = "DNS Security"
    HTTP_HEADERS = "HTTP Security Headers"
    SUBDOMAIN = "Subdomain Issues"
    PORT_EXPOSURE = "Open Port Exposure"
    SECRET_EXPOSURE = "Secret Exposure"
    DEPENDENCY_VULNERABILITY = "Dependency Vulnerability"
    LICENSE_VIOLATION = "License Violation"
    CODE_QUALITY = "Code Quality Issue"
    FIREWALL = "Firewall Configuration"
    NETWORK_EXPOSURE = "Network Exposure"
    OTHER = "Other"

class ComplianceFramework(str, enum.Enum):
    ISO_27001 = "ISO 27001"
    SOC_2 = "SOC 2"
    GDPR = "GDPR"
    PCI_DSS = "PCI DSS"
    HIPAA = "HIPAA"
    NIST = "NIST CSF"
    CIS = "CIS Controls"

class ComplianceStatus(str, enum.Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIAL = "partial"
    NOT_APPLICABLE = "not_applicable"
    NOT_ASSESSED = "not_assessed"

class TargetType(str, enum.Enum):
    URL = "url"
    DOMAIN = "domain"
    IP = "ip"
    REPOSITORY = "repository"
    API_ENDPOINT = "api_endpoint"
    NETWORK_RANGE = "network_range"

class ScheduleFrequency(str, enum.Enum):
    ONCE = "once"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"

# Models
class SecurityScan(Base):
    __tablename__ = "security_scans"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    human_id = Column(String(15), unique=True, nullable=True)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    scan_type = Column(SQLEnum(ScanType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    status = Column(SQLEnum(ScanStatus, values_callable=lambda x: [e.value for e in x]), default=ScanStatus.PENDING)
    progress_percentage = Column(Integer, default=0)
    config = Column(JSON, default=dict)
    scan_depth = Column(String(50), default="standard")
    enable_active_scanning = Column(Boolean, default=False)
    total_vulnerabilities = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    risk_grade = Column(String(5), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    tags = Column(JSON, default=list)
    notes = Column(Text, nullable=True)
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    trigger_source = Column(String(100), default="manual")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    targets = relationship("ScanTarget", back_populates="scan", cascade="all, delete-orphan")
    vulnerabilities = relationship("Vulnerability", back_populates="scan", cascade="all, delete-orphan")
    compliance_checks = relationship("ComplianceCheck", back_populates="scan", cascade="all, delete-orphan")

class ScanTarget(Base):
    __tablename__ = "scan_targets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("security_scans.id", ondelete="CASCADE"), nullable=False)
    target_type = Column(SQLEnum(TargetType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    target_value = Column(String(2000), nullable=False)
    target_name = Column(String(500), nullable=True)
    status = Column(SQLEnum(ScanStatus, values_callable=lambda x: [e.value for e in x]), default=ScanStatus.PENDING)
    ssl_certificate = Column(JSON, nullable=True)
    ssl_grade = Column(String(5), nullable=True)
    ssl_expires_at = Column(DateTime(timezone=True), nullable=True)
    open_ports = Column(JSON, default=list)
    http_headers = Column(JSON, nullable=True)
    subdomains_discovered = Column(JSON, default=list)
    dns_records = Column(JSON, nullable=True)
    repo_branch = Column(String(255), nullable=True)
    last_commit_sha = Column(String(100), nullable=True)
    dependencies_count = Column(Integer, nullable=True)
    secrets_found = Column(Integer, default=0)
    vulnerability_count = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    scanned_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    scan = relationship("SecurityScan", back_populates="targets")
    vulnerabilities = relationship("Vulnerability", back_populates="target", cascade="all, delete-orphan")

class Vulnerability(Base):
    __tablename__ = "vulnerabilities"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("security_scans.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(UUID(as_uuid=True), ForeignKey("scan_targets.id", ondelete="CASCADE"), nullable=True)
    human_id = Column(String(15), unique=True, nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(SQLEnum(VulnerabilityCategory, values_callable=lambda x: [e.value for e in x]), nullable=False)
    severity = Column(SQLEnum(SeverityLevel, values_callable=lambda x: [e.value for e in x]), nullable=False)
    cvss_score = Column(Float, nullable=True)
    cvss_vector = Column(String(255), nullable=True)
    affected_component = Column(String(500), nullable=True)
    affected_url = Column(String(2000), nullable=True)
    affected_file = Column(String(1000), nullable=True)
    affected_line = Column(Integer, nullable=True)
    evidence = Column(Text, nullable=True)
    request = Column(Text, nullable=True)
    response = Column(Text, nullable=True)
    payload = Column(Text, nullable=True)
    cve_id = Column(String(50), nullable=True)
    cwe_id = Column(String(50), nullable=True)
    package_name = Column(String(255), nullable=True)
    package_version = Column(String(100), nullable=True)
    fixed_version = Column(String(100), nullable=True)
    remediation = Column(Text, nullable=True)
    remediation_complexity = Column(String(50), nullable=True)
    remediation_priority = Column(Integer, nullable=True)
    ai_remediation = Column(Text, nullable=True)
    ai_code_fix = Column(Text, nullable=True)
    references = Column(JSON, default=list)
    is_false_positive = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    discovered_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    scan = relationship("SecurityScan", back_populates="vulnerabilities")
    target = relationship("ScanTarget", back_populates="vulnerabilities")

class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("security_scans.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    framework = Column(SQLEnum(ComplianceFramework, values_callable=lambda x: [e.value for e in x]), nullable=False)
    control_id = Column(String(50), nullable=False)
    control_name = Column(String(500), nullable=False)
    control_description = Column(Text, nullable=True)
    status = Column(SQLEnum(ComplianceStatus, values_callable=lambda x: [e.value for e in x]), default=ComplianceStatus.NOT_ASSESSED)
    assessment_notes = Column(Text, nullable=True)
    evidence_provided = Column(JSON, default=list)
    gaps_identified = Column(JSON, default=list)
    related_vulnerabilities = Column(JSON, default=list)
    inherent_risk = Column(String(50), nullable=True)
    residual_risk = Column(String(50), nullable=True)
    assessed_at = Column(DateTime(timezone=True), nullable=True)
    next_review_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    scan = relationship("SecurityScan", back_populates="compliance_checks")

class ScanSchedule(Base):
    __tablename__ = "scan_schedules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    scan_type = Column(SQLEnum(ScanType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    targets = Column(JSON, nullable=False)
    scan_config = Column(JSON, default=dict)
    frequency = Column(SQLEnum(ScheduleFrequency, values_callable=lambda x: [e.value for e in x]), nullable=False)
    cron_expression = Column(String(100), nullable=True)
    timezone = Column(String(100), default="UTC")
    is_enabled = Column(Boolean, default=True)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)
    last_scan_id = Column(UUID(as_uuid=True), ForeignKey("security_scans.id", ondelete="SET NULL"), nullable=True)
    total_runs = Column(Integer, default=0)
    notify_on_complete = Column(Boolean, default=True)
    notify_on_critical = Column(Boolean, default=True)
    notification_emails = Column(JSON, default=list)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    last_scan = relationship("SecurityScan", foreign_keys=[last_scan_id])
