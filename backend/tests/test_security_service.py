"""
Unit and Integration tests for Security Testing Module
Tests for security scanning service, API endpoints, and compliance
"""
import pytest
import uuid
import json
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.security_scan import (
    SecurityScan, ScanTarget, Vulnerability, ComplianceCheck,
    ScanType, ScanStatus, SeverityLevel, VulnerabilityCategory,
    ComplianceFramework, ComplianceStatus, TargetType
)
from app.schemas.security import (
    URLScanRequest, RepoScanRequest, VAPTScanRequest,
    SecurityScanCreate, ScanTargetCreate
)
from app.services.security_scanning_service import SecurityScanningService


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def mock_db():
    """Create a mock async database session"""
    db = AsyncMock(spec=AsyncSession)
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    db.delete = AsyncMock()
    return db


@pytest.fixture
def security_service(mock_db):
    """Create a SecurityScanningService with mock db"""
    return SecurityScanningService(mock_db)


@pytest.fixture
def sample_project_id():
    """Generate sample project UUID"""
    return uuid.uuid4()


@pytest.fixture
def sample_org_id():
    """Generate sample organization UUID"""
    return uuid.uuid4()


# ============================================================================
# Security Scan Create Tests
# ============================================================================

@pytest.mark.asyncio
class TestSecurityScanCreate:
    """Tests for security scan creation"""

    async def test_create_url_scan(self, security_service, sample_project_id, sample_org_id, mock_db):
        """Test creating a URL security scan"""
        # Mock the execute for count query
        mock_result = AsyncMock()
        mock_result.scalar.return_value = 0
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        targets = [{
            "target_type": TargetType.URL.value,
            "target_value": "https://example.com",
            "target_name": "Example Site"
        }]
        
        scan = await security_service.create_scan(
            project_id=sample_project_id,
            organisation_id=sample_org_id,
            name="Test URL Scan",
            scan_type=ScanType.URL_SECURITY,
            targets=targets,
            config={"check_ssl": True}
        )
        
        # Verify db.add was called
        assert mock_db.add.called
        assert mock_db.commit.called

    async def test_create_repo_scan(self, security_service, sample_project_id, sample_org_id, mock_db):
        """Test creating a repository security scan"""
        mock_result = AsyncMock()
        mock_result.scalar.return_value = 0
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        targets = [{
            "target_type": TargetType.REPOSITORY.value,
            "target_value": "https://github.com/test/repo",
            "target_name": "test-repo"
        }]
        
        scan = await security_service.create_scan(
            project_id=sample_project_id,
            organisation_id=sample_org_id,
            name="Test Repo Scan",
            scan_type=ScanType.REPO_SECURITY,
            targets=targets,
            config={"scan_secrets": True}
        )
        
        assert mock_db.add.called

    async def test_create_vapt_scan(self, security_service, sample_project_id, sample_org_id, mock_db):
        """Test creating a VAPT scan"""
        mock_result = AsyncMock()
        mock_result.scalar.return_value = 0
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        targets = [{
            "target_type": TargetType.URL.value,
            "target_value": "https://app.example.com",
            "target_name": "Test App"
        }]
        
        scan = await security_service.create_scan(
            project_id=sample_project_id,
            organisation_id=sample_org_id,
            name="Test VAPT Scan",
            scan_type=ScanType.VAPT,
            targets=targets,
            enable_active_scanning=True,
            config={"test_sql_injection": True}
        )
        
        assert mock_db.add.called


# ============================================================================
# URL Security Tests
# ============================================================================

@pytest.mark.asyncio
class TestURLSecurity:
    """Tests for URL security scanning functionality"""

    def test_url_scan_request_defaults(self):
        """Test URLScanRequest default values"""
        request = URLScanRequest(target_url="https://example.com")
        
        assert request.check_ssl is True
        assert request.check_headers is True
        assert request.check_ports is True
        assert request.check_subdomains is True
        assert request.scan_depth == "standard"

    def test_url_scan_request_custom(self):
        """Test URLScanRequest with custom values"""
        request = URLScanRequest(
            target_url="https://example.com",
            scan_depth="deep",
            check_ssl=False,
            check_ports=False
        )
        
        assert request.scan_depth == "deep"
        assert request.check_ssl is False
        assert request.check_ports is False


# ============================================================================
# Repository Security Tests
# ============================================================================

@pytest.mark.asyncio  
class TestRepoSecurity:
    """Tests for repository security scanning functionality"""

    def test_repo_scan_request_defaults(self):
        """Test RepoScanRequest default values"""
        request = RepoScanRequest(repo_url="https://github.com/test/repo")
        
        assert request.branch == "main"
        assert request.scan_secrets is True
        assert request.scan_dependencies is True
        assert request.scan_licenses is True
        assert request.scan_code_quality is False

    def test_repo_scan_request_custom(self):
        """Test RepoScanRequest with custom values"""
        request = RepoScanRequest(
            repo_url="https://github.com/test/repo",
            branch="develop",
            scan_code_quality=True
        )
        
        assert request.branch == "develop"
        assert request.scan_code_quality is True


# ============================================================================
# VAPT Tests
# ============================================================================

@pytest.mark.asyncio
class TestVAPT:
    """Tests for VAPT scanning functionality"""

    def test_vapt_scan_request_defaults(self):
        """Test VAPTScanRequest default values"""
        request = VAPTScanRequest(target_url="https://app.example.com")
        
        assert request.scan_mode == "passive"
        assert request.test_sql_injection is True
        assert request.test_xss is True
        assert request.test_csrf is True
        assert request.test_headers is True
        assert request.test_authentication is True
        assert request.test_access_control is False

    def test_vapt_scan_request_active_mode(self):
        """Test VAPTScanRequest with active mode"""
        request = VAPTScanRequest(
            target_url="https://app.example.com",
            scan_mode="active",
            test_access_control=True,
            test_cryptographic_failures=True
        )
        
        assert request.scan_mode == "active"
        assert request.test_access_control is True
        assert request.test_cryptographic_failures is True


# ============================================================================
# Risk Scoring Tests
# ============================================================================

@pytest.mark.asyncio
class TestRiskScoring:
    """Tests for risk scoring functionality"""

    def test_risk_grade_a_plus(self):
        """Test A+ risk grade calculation"""
        score = 0.0  # No vulnerabilities
        grade = calculate_risk_grade(score)
        assert grade == "A+"

    def test_risk_grade_f(self):
        """Test F risk grade for high risk"""
        score = 95.0  # Very high risk
        grade = calculate_risk_grade(score)
        assert grade == "F"

    def test_risk_grade_c(self):
        """Test C risk grade for moderate risk"""
        score = 50.0  # Moderate risk
        grade = calculate_risk_grade(score)
        assert grade == "C"


def calculate_risk_grade(score: float) -> str:
    """Helper function to calculate risk grade from score"""
    if score <= 10:
        return "A+"
    elif score <= 20:
        return "A"
    elif score <= 35:
        return "B"
    elif score <= 55:
        return "C"
    elif score <= 75:
        return "D"
    else:
        return "F"


# ============================================================================
# Vulnerability Tests
# ============================================================================

@pytest.mark.asyncio
class TestVulnerabilities:
    """Tests for vulnerability management"""

    async def test_vulnerability_severity_levels(self):
        """Test all severity levels are valid"""
        levels = [
            SeverityLevel.CRITICAL,
            SeverityLevel.HIGH,
            SeverityLevel.MEDIUM,
            SeverityLevel.LOW,
            SeverityLevel.INFO
        ]
        
        for level in levels:
            assert level.value in ["critical", "high", "medium", "low", "info"]

    async def test_vulnerability_categories(self):
        """Test OWASP vulnerability categories"""
        categories = [
            VulnerabilityCategory.A01_BROKEN_ACCESS_CONTROL,
            VulnerabilityCategory.A02_CRYPTOGRAPHIC_FAILURES,
            VulnerabilityCategory.A03_INJECTION,
            VulnerabilityCategory.A05_SECURITY_MISCONFIGURATION
        ]
        
        for cat in categories:
            assert cat.value is not None


# ============================================================================
# Compliance Tests
# ============================================================================

@pytest.mark.asyncio
class TestCompliance:
    """Tests for compliance functionality"""

    async def test_compliance_frameworks(self):
        """Test all compliance frameworks are valid"""
        frameworks = [
            ComplianceFramework.ISO_27001,
            ComplianceFramework.SOC2,
            ComplianceFramework.GDPR,
            ComplianceFramework.PCI_DSS,
            ComplianceFramework.HIPAA,
            ComplianceFramework.NIST_CSF
        ]
        
        for fw in frameworks:
            assert fw.value is not None

    async def test_compliance_status(self):
        """Test compliance status values"""
        statuses = [
            ComplianceStatus.COMPLIANT,
            ComplianceStatus.NON_COMPLIANT,
            ComplianceStatus.PARTIAL,
            ComplianceStatus.NOT_APPLICABLE,
            ComplianceStatus.NOT_ASSESSED
        ]
        
        for status in statuses:
            assert status.value is not None


# ============================================================================
# Scan Target Tests
# ============================================================================

@pytest.mark.asyncio
class TestScanTargets:
    """Tests for scan target management"""

    def test_target_types(self):
        """Test all target types are valid"""
        types = [
            TargetType.URL,
            TargetType.REPOSITORY,
            TargetType.IP_ADDRESS,
            TargetType.DOMAIN,
            TargetType.API_ENDPOINT
        ]
        
        for t in types:
            assert t.value is not None

    def test_scan_target_create(self):
        """Test ScanTargetCreate validation"""
        target = ScanTargetCreate(
            target_type=TargetType.URL,
            target_value="https://example.com",
            target_name="Example"
        )
        
        assert target.target_type == TargetType.URL
        assert target.target_value == "https://example.com"


# ============================================================================
# Dashboard Stats Tests
# ============================================================================

@pytest.mark.asyncio
class TestDashboardStats:
    """Tests for dashboard statistics"""

    async def test_get_dashboard_stats(self, security_service, sample_project_id, mock_db):
        """Test getting dashboard statistics"""
        # Mock empty scan results
        mock_result = AsyncMock()
        mock_result.scalar.return_value = 0
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        stats = await security_service.get_dashboard_stats(sample_project_id)
        
        assert isinstance(stats, dict)
        assert "total_scans" in stats
        assert "total_vulnerabilities" in stats
        assert "severity_breakdown" in stats


# ============================================================================
# Integration Tests
# ============================================================================

@pytest.mark.asyncio
class TestSecurityIntegration:
    """Integration tests for security module"""

    async def test_scan_workflow(self, mock_db):
        """Test complete scan workflow"""
        service = SecurityScanningService(mock_db)
        project_id = uuid.uuid4()
        org_id = uuid.uuid4()
        
        # Mock db responses
        mock_result = AsyncMock()
        mock_result.scalar.return_value = 0
        mock_db.execute = AsyncMock(return_value=mock_result)
        
        # Create scan
        scan = await service.create_scan(
            project_id=project_id,
            organisation_id=org_id,
            name="Integration Test Scan",
            scan_type=ScanType.URL_SECURITY,
            targets=[{
                "target_type": TargetType.URL.value,
                "target_value": "https://test.com",
                "target_name": "Test"
            }],
            config={}
        )
        
        # Verify scan was created
        assert mock_db.add.called
        assert mock_db.commit.called


# ============================================================================
# Schema Validation Tests
# ============================================================================

class TestSchemaValidation:
    """Tests for schema validation"""

    def test_security_scan_create_validation(self):
        """Test SecurityScanCreate validation"""
        scan = SecurityScanCreate(
            name="Test Scan",
            scan_type=ScanType.URL_SECURITY,
            targets=[ScanTargetCreate(
                target_type=TargetType.URL,
                target_value="https://example.com"
            )]
        )
        
        assert scan.name == "Test Scan"
        assert len(scan.targets) == 1

    def test_security_scan_create_with_config(self):
        """Test SecurityScanCreate with custom config"""
        scan = SecurityScanCreate(
            name="Configured Scan",
            scan_type=ScanType.URL_SECURITY,
            targets=[ScanTargetCreate(
                target_type=TargetType.URL,
                target_value="https://example.com"
            )],
            config={"check_ssl": True, "check_headers": False},
            scan_depth="deep",
            enable_active_scanning=True
        )
        
        assert scan.config["check_ssl"] is True
        assert scan.scan_depth == "deep"
        assert scan.enable_active_scanning is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
