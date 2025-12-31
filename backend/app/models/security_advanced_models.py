"""
Advanced Security Module Models
SAST, SCA, IAST, RASP, SBOM, Policy Engine, CI/CD, and Reporting
"""
from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Enum as SQLEnum, Boolean, Integer, Float, Index, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


# ============================================================================
# Enums
# ============================================================================

class SASTEngine(str, enum.Enum):
    """SAST scanning engines"""
    SEMGREP = "semgrep"
    BANDIT = "bandit"
    ESLINT = "eslint"
    CUSTOM = "custom"


class SCAEngine(str, enum.Enum):
    """SCA scanning engines"""
    PIP_AUDIT = "pip_audit"
    NPM_AUDIT = "npm_audit"
    SAFETY = "safety"
    OSV = "osv"


class FindingSeverity(str, enum.Enum):
    """Finding severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class FindingStatus(str, enum.Enum):
    """Finding status"""
    OPEN = "open"
    CONFIRMED = "confirmed"
    FALSE_POSITIVE = "false_positive"
    FIXED = "fixed"
    ACCEPTED_RISK = "accepted_risk"


class AttackType(str, enum.Enum):
    """RASP attack types"""
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    COMMAND_INJECTION = "command_injection"
    PATH_TRAVERSAL = "path_traversal"
    SSRF = "ssrf"
    XXE = "xxe"
    DESERIALIZATION = "deserialization"
    RATE_LIMIT = "rate_limit"
    BRUTE_FORCE = "brute_force"
    OTHER = "other"


class SBOMFormat(str, enum.Enum):
    """SBOM format types"""
    CYCLONEDX_JSON = "cyclonedx_json"
    CYCLONEDX_XML = "cyclonedx_xml"
    SPDX_JSON = "spdx_json"
    SPDX_RDF = "spdx_rdf"


class LicenseRisk(str, enum.Enum):
    """License risk levels"""
    HIGH = "high"  # GPL, AGPL - copyleft
    MEDIUM = "medium"  # LGPL, MPL
    LOW = "low"  # MIT, Apache, BSD
    UNKNOWN = "unknown"


class PolicyAction(str, enum.Enum):
    """Policy rule actions"""
    BLOCK = "block"
    WARN = "warn"
    INFO = "info"


class CICDProvider(str, enum.Enum):
    """CI/CD providers"""
    GITHUB_ACTIONS = "github_actions"
    GITLAB_CI = "gitlab_ci"
    JENKINS = "jenkins"
    AZURE_DEVOPS = "azure_devops"
    BITBUCKET = "bitbucket"
    CIRCLECI = "circleci"


class ReportFormat(str, enum.Enum):
    """Report output formats"""
    PDF = "pdf"
    HTML = "html"
    JSON = "json"
    SARIF = "sarif"


class ReportType(str, enum.Enum):
    """Report types"""
    EXECUTIVE = "executive"
    SCAN_DETAIL = "scan_detail"
    COMPLIANCE = "compliance"
    TREND = "trend"


# ============================================================================
# SAST Models
# ============================================================================

class SASTScan(Base):
    """SAST Scan - Static Application Security Testing scan"""
    __tablename__ = "sast_scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    security_scan_id = Column(UUID(as_uuid=True), ForeignKey("security_scans.id", ondelete="CASCADE"), nullable=True)
    
    human_id = Column(String(20), unique=True, nullable=True)
    name = Column(String(500), nullable=False)
    
    # Repository info
    repo_url = Column(String(2000), nullable=True)
    repo_branch = Column(String(255), nullable=True)
    commit_sha = Column(String(100), nullable=True)
    local_path = Column(String(2000), nullable=True)
    
    # Scan config
    engines = Column(JSON, default=list)  # List of SASTEngine values
    languages = Column(JSON, default=list)  # Python, JavaScript, etc.
    ruleset = Column(String(100), default="default")  # default, owasp, strict
    exclude_patterns = Column(JSON, default=list)
    
    # Results
    status = Column(String(50), default="pending")
    total_findings = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    
    files_scanned = Column(Integer, default=0)
    lines_scanned = Column(Integer, default=0)
    duration_ms = Column(Integer, nullable=True)
    
    error_message = Column(Text, nullable=True)
    
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    findings = relationship("SASTFinding", back_populates="scan", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_sast_scans_project_id', 'project_id'),
        Index('ix_sast_scans_status', 'status'),
    )


class SASTFinding(Base):
    """SAST Finding - Code vulnerability detected by static analysis"""
    __tablename__ = "sast_findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("sast_scans.id", ondelete="CASCADE"), nullable=False)
    
    human_id = Column(String(20), unique=True, nullable=True)
    
    # Finding details
    rule_id = Column(String(255), nullable=False)  # e.g., python.flask.security.injection.sql-injection
    rule_name = Column(String(500), nullable=False)
    engine = Column(SQLEnum(SASTEngine, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    severity = Column(SQLEnum(FindingSeverity, values_callable=lambda x: [e.value for e in x]), nullable=False)
    confidence = Column(String(50), nullable=True)  # high, medium, low
    
    # Location
    file_path = Column(String(2000), nullable=False)
    start_line = Column(Integer, nullable=False)
    end_line = Column(Integer, nullable=True)
    start_column = Column(Integer, nullable=True)
    end_column = Column(Integer, nullable=True)
    
    # Code context
    code_snippet = Column(Text, nullable=True)
    fingerprint = Column(String(255), nullable=True)  # For deduplication
    
    # Categorization
    category = Column(String(255), nullable=True)  # OWASP category
    cwe_id = Column(String(50), nullable=True)
    owasp_id = Column(String(50), nullable=True)
    
    # Description
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    references = Column(JSON, default=list)
    
    # AI suggestions
    ai_fix_suggestion = Column(Text, nullable=True)
    ai_explanation = Column(Text, nullable=True)
    
    # Status
    status = Column(SQLEnum(FindingStatus, values_callable=lambda x: [e.value for e in x]), default=FindingStatus.OPEN)
    suppression_reason = Column(Text, nullable=True)
    suppression_expires = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    scan = relationship("SASTScan", back_populates="findings")
    
    __table_args__ = (
        Index('ix_sast_findings_scan_id', 'scan_id'),
        Index('ix_sast_findings_severity', 'severity'),
        Index('ix_sast_findings_status', 'status'),
        Index('ix_sast_findings_fingerprint', 'fingerprint'),
    )


# ============================================================================
# SCA Models
# ============================================================================

class SCAScan(Base):
    """SCA Scan - Software Composition Analysis scan"""
    __tablename__ = "sca_scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    security_scan_id = Column(UUID(as_uuid=True), ForeignKey("security_scans.id", ondelete="CASCADE"), nullable=True)
    
    human_id = Column(String(20), unique=True, nullable=True)
    name = Column(String(500), nullable=False)
    
    # Source
    manifest_files = Column(JSON, default=list)  # requirements.txt, package.json, etc.
    repo_url = Column(String(2000), nullable=True)
    
    # Scan config
    engines = Column(JSON, default=list)
    check_licenses = Column(Boolean, default=True)
    check_vulnerabilities = Column(Boolean, default=True)
    
    # Results
    status = Column(String(50), default="pending")
    total_dependencies = Column(Integer, default=0)
    vulnerable_dependencies = Column(Integer, default=0)
    license_issues = Column(Integer, default=0)
    
    critical_vulns = Column(Integer, default=0)
    high_vulns = Column(Integer, default=0)
    medium_vulns = Column(Integer, default=0)
    low_vulns = Column(Integer, default=0)
    
    duration_ms = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    findings = relationship("SCAFinding", back_populates="scan", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_sca_scans_project_id', 'project_id'),
    )


class SCAFinding(Base):
    """SCA Finding - Vulnerable dependency or license issue"""
    __tablename__ = "sca_findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("sca_scans.id", ondelete="CASCADE"), nullable=False)
    
    # Package info
    package_name = Column(String(500), nullable=False)
    package_version = Column(String(100), nullable=False)
    package_ecosystem = Column(String(50), nullable=False)  # npm, pypi, maven, etc.
    manifest_file = Column(String(2000), nullable=True)
    
    # Vulnerability info
    is_vulnerability = Column(Boolean, default=True)
    cve_id = Column(String(50), nullable=True)
    ghsa_id = Column(String(100), nullable=True)  # GitHub Security Advisory
    severity = Column(SQLEnum(FindingSeverity, values_callable=lambda x: [e.value for e in x]), nullable=False)
    cvss_score = Column(Float, nullable=True)
    cvss_vector = Column(String(255), nullable=True)
    
    # Description
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    
    # Fix info
    fixed_version = Column(String(100), nullable=True)
    upgrade_path = Column(JSON, nullable=True)  # Transitive upgrade path
    is_direct = Column(Boolean, default=True)  # Direct or transitive dep
    
    # License info (for license findings)
    is_license_issue = Column(Boolean, default=False)
    license_name = Column(String(255), nullable=True)
    license_risk = Column(SQLEnum(LicenseRisk, values_callable=lambda x: [e.value for e in x]), nullable=True)
    
    # References
    references = Column(JSON, default=list)
    
    # Status
    status = Column(SQLEnum(FindingStatus, values_callable=lambda x: [e.value for e in x]), default=FindingStatus.OPEN)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    scan = relationship("SCAScan", back_populates="findings")
    
    __table_args__ = (
        Index('ix_sca_findings_scan_id', 'scan_id'),
        Index('ix_sca_findings_severity', 'severity'),
        Index('ix_sca_findings_package', 'package_name'),
    )


# ============================================================================
# IAST Models
# ============================================================================

class IASTSession(Base):
    """IAST Session - Interactive Application Security Testing session"""
    __tablename__ = "iast_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    
    human_id = Column(String(20), unique=True, nullable=True)
    name = Column(String(500), nullable=False)
    
    # Target application
    app_url = Column(String(2000), nullable=False)
    app_name = Column(String(255), nullable=True)
    
    # Session state
    status = Column(String(50), default="inactive")  # inactive, active, paused, completed
    session_token = Column(String(255), unique=True, nullable=True)
    
    # Configuration
    config = Column(JSON, default=dict)
    detect_sql_injection = Column(Boolean, default=True)
    detect_xss = Column(Boolean, default=True)
    detect_path_traversal = Column(Boolean, default=True)
    detect_command_injection = Column(Boolean, default=True)
    
    # Metrics
    requests_analyzed = Column(Integer, default=0)
    vulnerabilities_found = Column(Integer, default=0)
    
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    findings = relationship("IASTFinding", back_populates="session", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_iast_sessions_project_id', 'project_id'),
        Index('ix_iast_sessions_status', 'status'),
    )


class IASTFinding(Base):
    """IAST Finding - Runtime vulnerability detected during test execution"""
    __tablename__ = "iast_findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("iast_sessions.id", ondelete="CASCADE"), nullable=False)
    
    # Finding details
    vulnerability_type = Column(String(255), nullable=False)
    severity = Column(SQLEnum(FindingSeverity, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    # HTTP context
    http_method = Column(String(20), nullable=True)
    request_url = Column(String(2000), nullable=True)
    request_headers = Column(JSON, nullable=True)
    request_body = Column(Text, nullable=True)
    response_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    
    # Taint tracking
    tainted_input = Column(Text, nullable=True)  # The malicious input
    sink_location = Column(String(500), nullable=True)  # Where it was executed
    data_flow = Column(JSON, nullable=True)  # Taint propagation path
    
    # Code location
    source_file = Column(String(2000), nullable=True)
    source_line = Column(Integer, nullable=True)
    source_function = Column(String(255), nullable=True)
    stack_trace = Column(Text, nullable=True)
    
    # Description
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    
    # Correlation
    test_case_id = Column(UUID(as_uuid=True), nullable=True)  # Link to test case if available
    
    status = Column(SQLEnum(FindingStatus, values_callable=lambda x: [e.value for e in x]), default=FindingStatus.OPEN)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("IASTSession", back_populates="findings")
    
    __table_args__ = (
        Index('ix_iast_findings_session_id', 'session_id'),
        Index('ix_iast_findings_severity', 'severity'),
    )


# ============================================================================
# RASP Models
# ============================================================================

class RASPConfig(Base):
    """RASP Configuration - Runtime Application Self-Protection settings"""
    __tablename__ = "rasp_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(500), nullable=False)
    is_enabled = Column(Boolean, default=True)
    
    # Protection settings
    block_sql_injection = Column(Boolean, default=True)
    block_xss = Column(Boolean, default=True)
    block_command_injection = Column(Boolean, default=True)
    block_path_traversal = Column(Boolean, default=True)
    block_ssrf = Column(Boolean, default=True)
    
    # Rate limiting
    enable_rate_limiting = Column(Boolean, default=True)
    rate_limit_requests = Column(Integer, default=100)  # requests per minute
    rate_limit_window = Column(Integer, default=60)  # seconds
    
    # Alerting
    alert_on_block = Column(Boolean, default=True)
    alert_emails = Column(JSON, default=list)
    webhook_url = Column(String(2000), nullable=True)
    
    # Custom rules
    custom_block_patterns = Column(JSON, default=list)
    whitelist_ips = Column(JSON, default=list)
    whitelist_paths = Column(JSON, default=list)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        Index('ix_rasp_configs_project_id', 'project_id'),
    )


class RASPEvent(Base):
    """RASP Event - Blocked attack or security alert"""
    __tablename__ = "rasp_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    config_id = Column(UUID(as_uuid=True), ForeignKey("rasp_configs.id", ondelete="SET NULL"), nullable=True)
    
    # Attack details
    attack_type = Column(SQLEnum(AttackType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    severity = Column(SQLEnum(FindingSeverity, values_callable=lambda x: [e.value for e in x]), nullable=False)
    was_blocked = Column(Boolean, default=True)
    
    # Request info
    source_ip = Column(String(50), nullable=True)
    user_agent = Column(String(1000), nullable=True)
    http_method = Column(String(20), nullable=True)
    request_path = Column(String(2000), nullable=True)
    request_headers = Column(JSON, nullable=True)
    request_body = Column(Text, nullable=True)
    
    # Attack payload
    attack_payload = Column(Text, nullable=True)
    matched_pattern = Column(String(500), nullable=True)
    
    # Context
    description = Column(Text, nullable=True)
    
    occurred_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('ix_rasp_events_project_id', 'project_id'),
        Index('ix_rasp_events_attack_type', 'attack_type'),
        Index('ix_rasp_events_occurred_at', 'occurred_at'),
    )


# ============================================================================
# SBOM Models
# ============================================================================

class SBOM(Base):
    """SBOM - Software Bill of Materials"""
    __tablename__ = "sboms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    
    human_id = Column(String(20), unique=True, nullable=True)
    name = Column(String(500), nullable=False)
    version = Column(String(100), nullable=True)
    
    # Format
    format = Column(SQLEnum(SBOMFormat, values_callable=lambda x: [e.value for e in x]), nullable=False)
    spec_version = Column(String(50), nullable=True)  # CycloneDX 1.4, SPDX 2.3
    
    # Source
    source_type = Column(String(50), nullable=True)  # repository, container, directory
    source_path = Column(String(2000), nullable=True)
    
    # Stats
    total_components = Column(Integer, default=0)
    direct_dependencies = Column(Integer, default=0)
    transitive_dependencies = Column(Integer, default=0)
    
    # License summary
    licenses_identified = Column(Integer, default=0)
    high_risk_licenses = Column(Integer, default=0)
    
    # Vulnerability summary
    vulnerable_components = Column(Integer, default=0)
    
    # Raw content
    raw_content = Column(Text, nullable=True)  # JSON/XML content
    
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    components = relationship("SBOMComponent", back_populates="sbom", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_sboms_project_id', 'project_id'),
    )


class SBOMComponent(Base):
    """SBOM Component - Individual component in the SBOM"""
    __tablename__ = "sbom_components"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sbom_id = Column(UUID(as_uuid=True), ForeignKey("sboms.id", ondelete="CASCADE"), nullable=False)
    
    # Component info
    component_type = Column(String(50), nullable=False)  # library, framework, application
    name = Column(String(500), nullable=False)
    version = Column(String(100), nullable=True)
    purl = Column(String(1000), nullable=True)  # Package URL
    
    # Identifiers
    cpe = Column(String(500), nullable=True)  # Common Platform Enumeration
    swid = Column(String(500), nullable=True)  # Software Identification
    
    # Ecosystem
    ecosystem = Column(String(50), nullable=True)  # npm, pypi, maven
    
    # License
    license_id = Column(String(100), nullable=True)  # SPDX license ID
    license_name = Column(String(255), nullable=True)
    license_risk = Column(SQLEnum(LicenseRisk, values_callable=lambda x: [e.value for e in x]), nullable=True)
    
    # Dependency type
    is_direct = Column(Boolean, default=True)
    parent_component = Column(String(500), nullable=True)
    
    # Vulnerability status
    is_vulnerable = Column(Boolean, default=False)
    vulnerability_count = Column(Integer, default=0)
    
    # Hashes
    hashes = Column(JSON, default=dict)  # {algorithm: hash}
    
    # External refs
    external_references = Column(JSON, default=list)

    # Relationships
    sbom = relationship("SBOM", back_populates="components")
    
    __table_args__ = (
        Index('ix_sbom_components_sbom_id', 'sbom_id'),
        Index('ix_sbom_components_name', 'name'),
    )


# ============================================================================
# Policy Engine Models
# ============================================================================

class SecurityPolicy(Base):
    """Security Policy - Custom security rules and thresholds"""
    __tablename__ = "security_policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)  # Org-level default
    is_enabled = Column(Boolean, default=True)
    
    # Severity thresholds (max allowed)
    max_critical = Column(Integer, default=0)  # 0 = fail on any critical
    max_high = Column(Integer, default=5)
    max_medium = Column(Integer, default=20)
    max_low = Column(Integer, nullable=True)  # null = no limit
    
    # Quality gate
    fail_on_threshold_breach = Column(Boolean, default=True)
    
    # Scan requirements
    require_sast_scan = Column(Boolean, default=False)
    require_sca_scan = Column(Boolean, default=False)
    require_secret_scan = Column(Boolean, default=True)
    
    # License policy
    block_high_risk_licenses = Column(Boolean, default=False)
    allowed_licenses = Column(JSON, default=list)  # Whitelist
    blocked_licenses = Column(JSON, default=list)  # Blacklist
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    rules = relationship("PolicyRule", back_populates="policy", cascade="all, delete-orphan")
    suppressions = relationship("PolicySuppression", back_populates="policy", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_security_policies_project_id', 'project_id'),
        Index('ix_security_policies_organisation_id', 'organisation_id'),
    )


class PolicyRule(Base):
    """Policy Rule - Individual custom rule within a policy"""
    __tablename__ = "policy_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("security_policies.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    is_enabled = Column(Boolean, default=True)
    
    # Rule type
    rule_type = Column(String(50), nullable=False)  # pattern, cve_block, file_match
    
    # Pattern matching
    pattern = Column(String(2000), nullable=True)  # Regex or glob
    pattern_type = Column(String(50), nullable=True)  # regex, glob, semgrep
    
    # Scope
    applies_to = Column(JSON, default=list)  # sast, sca, secrets, all
    file_patterns = Column(JSON, default=list)  # *.py, src/**
    
    # Action
    action = Column(SQLEnum(PolicyAction, values_callable=lambda x: [e.value for e in x]), default=PolicyAction.BLOCK)
    severity_override = Column(SQLEnum(FindingSeverity, values_callable=lambda x: [e.value for e in x]), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    policy = relationship("SecurityPolicy", back_populates="rules")
    
    __table_args__ = (
        Index('ix_policy_rules_policy_id', 'policy_id'),
    )


class PolicySuppression(Base):
    """Policy Suppression - False positive or accepted risk suppression"""
    __tablename__ = "policy_suppressions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("security_policies.id", ondelete="CASCADE"), nullable=False)
    
    # What to suppress
    suppression_type = Column(String(50), nullable=False)  # cve, rule_id, fingerprint, file
    suppression_value = Column(String(500), nullable=False)  # CVE-2024-1234, python.injection.sql
    
    # Scope
    file_pattern = Column(String(500), nullable=True)  # Only suppress in specific files
    
    # Reason
    reason = Column(Text, nullable=False)
    
    # Expiration
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_permanent = Column(Boolean, default=False)
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    policy = relationship("SecurityPolicy", back_populates="suppressions")


# ============================================================================
# CI/CD Integration Models
# ============================================================================

class CICDPipeline(Base):
    """CI/CD Pipeline - Registered pipeline for security scanning"""
    __tablename__ = "cicd_pipelines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(500), nullable=False)
    provider = Column(SQLEnum(CICDProvider, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    # Webhook config
    webhook_token = Column(String(255), unique=True, nullable=True)
    webhook_secret = Column(String(255), nullable=True)  # For HMAC validation
    
    # Trigger config
    trigger_on_push = Column(Boolean, default=True)
    trigger_on_pr = Column(Boolean, default=True)
    trigger_branches = Column(JSON, default=list)  # Branch patterns
    
    # Scan config
    run_sast = Column(Boolean, default=True)
    run_sca = Column(Boolean, default=True)
    run_secrets = Column(Boolean, default=True)
    
    # Policy
    policy_id = Column(UUID(as_uuid=True), ForeignKey("security_policies.id", ondelete="SET NULL"), nullable=True)
    
    # Stats
    total_runs = Column(Integer, default=0)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    runs = relationship("CICDPipelineRun", back_populates="pipeline", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_cicd_pipelines_project_id', 'project_id'),
        Index('ix_cicd_pipelines_webhook_token', 'webhook_token'),
    )


class CICDPipelineRun(Base):
    """CI/CD Pipeline Run - Individual pipeline execution"""
    __tablename__ = "cicd_pipeline_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pipeline_id = Column(UUID(as_uuid=True), ForeignKey("cicd_pipelines.id", ondelete="CASCADE"), nullable=False)
    
    # Git context
    commit_sha = Column(String(100), nullable=True)
    branch = Column(String(255), nullable=True)
    pr_number = Column(Integer, nullable=True)
    author = Column(String(255), nullable=True)
    
    # Trigger
    trigger_type = Column(String(50), nullable=False)  # push, pull_request, manual, scheduled
    
    # Status
    status = Column(String(50), default="pending")  # pending, running, passed, failed, error
    
    # Results
    sast_scan_id = Column(UUID(as_uuid=True), ForeignKey("sast_scans.id", ondelete="SET NULL"), nullable=True)
    sca_scan_id = Column(UUID(as_uuid=True), ForeignKey("sca_scans.id", ondelete="SET NULL"), nullable=True)
    
    # Quality gate
    gate_passed = Column(Boolean, nullable=True)
    gate_details = Column(JSON, nullable=True)  # Detailed pass/fail reasons
    
    # SARIF output
    sarif_output = Column(Text, nullable=True)
    
    # Timing
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    pipeline = relationship("CICDPipeline", back_populates="runs")
    
    __table_args__ = (
        Index('ix_cicd_pipeline_runs_pipeline_id', 'pipeline_id'),
        Index('ix_cicd_pipeline_runs_status', 'status'),
    )


# ============================================================================
# Security Report Models
# ============================================================================

class SecurityReport(Base):
    """Security Report - Generated PDF/HTML report"""
    __tablename__ = "security_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(500), nullable=False)
    report_type = Column(SQLEnum(ReportType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    format = Column(SQLEnum(ReportFormat, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    # Scope
    scan_ids = Column(JSON, default=list)  # Specific scans included
    date_from = Column(DateTime(timezone=True), nullable=True)
    date_to = Column(DateTime(timezone=True), nullable=True)
    
    # Content
    file_path = Column(String(2000), nullable=True)  # Path to generated file
    file_size = Column(Integer, nullable=True)
    
    # Status
    status = Column(String(50), default="pending")  # pending, generating, completed, failed
    error_message = Column(Text, nullable=True)
    
    generated_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Auto-delete after
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    __table_args__ = (
        Index('ix_security_reports_project_id', 'project_id'),
    )


# ============================================================================
# Issue Tracker Integration Models
# ============================================================================

class SecurityTicket(Base):
    """Security Ticket - Vulnerability ticket synced with Jira/ServiceNow"""
    __tablename__ = "security_tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Linked finding
    finding_type = Column(String(50), nullable=False)  # sast, sca, iast, vulnerability
    finding_id = Column(UUID(as_uuid=True), nullable=False)
    
    # External ticket
    tracker_type = Column(String(50), nullable=False)  # jira, servicenow
    external_id = Column(String(255), nullable=False)  # PROJ-123
    external_url = Column(String(2000), nullable=True)
    
    # Sync status
    external_status = Column(String(100), nullable=True)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    sync_error = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('ix_security_tickets_project_id', 'project_id'),
        Index('ix_security_tickets_finding_id', 'finding_id'),
        Index('ix_security_tickets_external_id', 'external_id'),
    )
