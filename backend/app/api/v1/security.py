"""
Enterprise Security Testing API Endpoints
RESTful API for security scanning, vulnerability management, and compliance
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import asyncio

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.security_scan import (
    SecurityScan, ScanTarget, Vulnerability, ComplianceCheck, ScanSchedule, SecurityAsset,
    ScanType, ScanStatus, SeverityLevel, VulnerabilityCategory,
    ComplianceFramework, ComplianceStatus, TargetType
)
from app.schemas.security import (
    SecurityScanCreate, SecurityScanUpdate, SecurityScanResponse, SecurityScanDetailResponse,
    SecurityScanListResponse, ScanTargetCreate, ScanTargetResponse,
    VulnerabilityCreate, VulnerabilityUpdate, VulnerabilityResponse, VulnerabilityListResponse,
    ComplianceCheckCreate, ComplianceCheckUpdate, ComplianceCheckResponse, ComplianceReportResponse,
    ScanScheduleCreate, ScanScheduleUpdate, ScanScheduleResponse,
    SecurityAssetCreate, SecurityAssetUpdate, SecurityAssetResponse,
    SecurityDashboardStats, RiskScoreResponse, URLScanRequest, SSLCertificateResponse,
    SecurityHeadersResponse, RepoScanRequest, VAPTScanRequest, SeverityBreakdown
)
from app.services.security_scanning_service import SecurityScanningService

router = APIRouter()


# ============================================================================
# Security Scans
# ============================================================================

@router.post("/scans", response_model=SecurityScanResponse, status_code=status.HTTP_201_CREATED)
async def create_security_scan(
    project_id: UUID,
    scan_data: SecurityScanCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new security scan
    """
    # Verify project access
    project = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = project.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    service = SecurityScanningService(db)
    
    # Convert targets to dict format
    targets = [
        {
            "target_type": t.target_type.value,
            "target_value": t.target_value,
            "target_name": t.target_name
        }
        for t in scan_data.targets
    ]
    
    scan = await service.create_scan(
        project_id=project_id,
        organisation_id=project.organisation_id,
        name=scan_data.name,
        scan_type=scan_data.scan_type,
        targets=targets,
        triggered_by=current_user.id,
        config=scan_data.config,
        scan_depth=scan_data.scan_depth,
        enable_active_scanning=scan_data.enable_active_scanning,
        tags=scan_data.tags,
        notes=scan_data.notes
    )
    
    # Start scan in background
    background_tasks.add_task(execute_scan_task, db, scan.id)
    
    return scan


async def execute_scan_task(db: AsyncSession, scan_id: UUID):
    """Background task to execute scan"""
    service = SecurityScanningService(db)
    await service.execute_scan(scan_id)


@router.get("/scans", response_model=SecurityScanListResponse)
async def list_security_scans(
    project_id: UUID,
    scan_type: Optional[ScanType] = None,
    status_filter: Optional[ScanStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List security scans for a project
    """
    service = SecurityScanningService(db)
    skip = (page - 1) * page_size
    
    scans, total = await service.list_scans(
        project_id=project_id,
        scan_type=scan_type,
        status=status_filter,
        skip=skip,
        limit=page_size
    )
    
    return SecurityScanListResponse(
        items=scans,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/scans/{scan_id}", response_model=SecurityScanDetailResponse)
async def get_security_scan(
    scan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get security scan details with vulnerabilities
    """
    service = SecurityScanningService(db)
    scan = await service.get_scan(scan_id)
    
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Load related data
    targets_result = await db.execute(
        select(ScanTarget).where(ScanTarget.scan_id == scan_id)
    )
    targets = targets_result.scalars().all()
    
    vulns, _ = await service.list_vulnerabilities(scan_id=scan_id, limit=100)
    
    compliance_result = await db.execute(
        select(ComplianceCheck).where(ComplianceCheck.scan_id == scan_id)
    )
    compliance_checks = compliance_result.scalars().all()
    
    return SecurityScanDetailResponse(
        **scan.__dict__,
        targets=targets,
        vulnerabilities=vulns,
        compliance_checks=compliance_checks
    )


@router.post("/scans/{scan_id}/execute", response_model=SecurityScanResponse)
async def execute_scan(
    scan_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Execute or re-execute a scan
    """
    service = SecurityScanningService(db)
    scan = await service.get_scan(scan_id)
    
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if scan.status == ScanStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Scan is already running")
    
    # Reset status for re-execution
    scan.status = ScanStatus.PENDING
    scan.progress_percentage = 0
    await db.commit()
    
    background_tasks.add_task(execute_scan_task, db, scan.id)
    
    return scan


@router.delete("/scans/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_security_scan(
    scan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a security scan
    """
    service = SecurityScanningService(db)
    deleted = await service.delete_scan(scan_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Scan not found")


# ============================================================================
# URL Security Scanning
# ============================================================================

@router.post("/url/scan", response_model=SecurityScanResponse, status_code=status.HTTP_201_CREATED)
async def scan_url(
    project_id: UUID,
    scan_request: URLScanRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Quick URL security scan
    """
    project = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = project.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    service = SecurityScanningService(db)
    
    config = {
        "check_ssl": scan_request.check_ssl,
        "check_headers": scan_request.check_headers,
        "check_subdomains": scan_request.check_subdomains,
        "check_ports": scan_request.check_ports,
        "port_range": scan_request.port_range,
        "custom_ports": scan_request.custom_ports
    }
    
    scan = await service.create_scan(
        project_id=project_id,
        organisation_id=project.organisation_id,
        name=f"URL Scan: {scan_request.target_url}",
        scan_type=ScanType.URL_SECURITY,
        targets=[{
            "target_type": TargetType.URL.value,
            "target_value": scan_request.target_url,
            "target_name": scan_request.target_url
        }],
        triggered_by=current_user.id,
        config=config,
        scan_depth=scan_request.scan_depth
    )
    
    background_tasks.add_task(execute_scan_task, db, scan.id)
    
    return scan


@router.get("/url/{scan_id}/ssl", response_model=SSLCertificateResponse)
async def get_ssl_certificate(
    scan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get SSL certificate details from a URL scan
    """
    target = await db.execute(
        select(ScanTarget).where(ScanTarget.scan_id == scan_id)
    )
    target = target.scalar_one_or_none()
    
    if not target or not target.ssl_certificate:
        raise HTTPException(status_code=404, detail="SSL certificate data not found")
    
    cert = target.ssl_certificate
    if "error" in cert:
        raise HTTPException(status_code=400, detail=cert["error"])
    
    return SSLCertificateResponse(
        is_valid=target.ssl_grade not in ["F", "D"],
        issuer=str(cert.get("issuer", {})),
        subject=str(cert.get("subject", {})),
        serial_number=cert.get("serial_number", ""),
        valid_from=datetime.fromisoformat(cert.get("valid_from", datetime.utcnow().isoformat())),
        valid_until=datetime.fromisoformat(cert.get("valid_until", datetime.utcnow().isoformat())),
        days_until_expiry=cert.get("days_until_expiry", 0),
        signature_algorithm="",
        key_size=0,
        grade=target.ssl_grade or "Unknown",
        issues=[],
        chain=[]
    )


@router.get("/url/{scan_id}/headers", response_model=SecurityHeadersResponse)
async def get_security_headers(
    scan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get security headers analysis from a URL scan
    """
    target = await db.execute(
        select(ScanTarget).where(ScanTarget.scan_id == scan_id)
    )
    target = target.scalar_one_or_none()
    
    if not target or not target.http_headers:
        raise HTTPException(status_code=404, detail="Headers data not found")
    
    headers = target.http_headers
    missing = headers.get("missing", [])
    
    # Calculate score (100 - 15 points per missing critical header)
    score = max(0, 100 - len(missing) * 15)
    
    if score >= 90:
        grade = "A"
    elif score >= 75:
        grade = "B"
    elif score >= 60:
        grade = "C"
    elif score >= 40:
        grade = "D"
    else:
        grade = "F"
    
    return SecurityHeadersResponse(
        grade=grade,
        score=score,
        headers_present=headers.get("present", []),
        headers_missing=missing,
        issues=headers.get("issues", []),
        recommendations=[f"Add {header} header" for header in missing]
    )


# ============================================================================
# Repository Security Scanning
# ============================================================================

@router.post("/repo/scan", response_model=SecurityScanResponse, status_code=status.HTTP_201_CREATED)
async def scan_repository(
    project_id: UUID,
    scan_request: RepoScanRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Repository security scan
    """
    project = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = project.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    service = SecurityScanningService(db)
    
    config = {
        "branch": scan_request.branch,
        "scan_secrets": scan_request.scan_secrets,
        "scan_dependencies": scan_request.scan_dependencies,
        "scan_licenses": scan_request.scan_licenses,
        "scan_code_quality": scan_request.scan_code_quality
    }
    
    scan = await service.create_scan(
        project_id=project_id,
        organisation_id=project.organisation_id,
        name=f"Repo Scan: {scan_request.repo_url}",
        scan_type=ScanType.REPO_SECURITY,
        targets=[{
            "target_type": TargetType.REPOSITORY.value,
            "target_value": scan_request.repo_url,
            "target_name": scan_request.repo_url.split("/")[-1]
        }],
        triggered_by=current_user.id,
        config=config
    )
    
    background_tasks.add_task(execute_scan_task, db, scan.id)
    
    return scan


# ============================================================================
# VAPT (Vulnerability Assessment and Penetration Testing)
# ============================================================================

@router.post("/vapt/scan", response_model=SecurityScanResponse, status_code=status.HTTP_201_CREATED)
async def scan_vapt(
    project_id: UUID,
    scan_request: VAPTScanRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    VAPT (Vulnerability Assessment and Penetration Testing) scan
    Tests for OWASP Top 10 vulnerabilities
    """
    project = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = project.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    service = SecurityScanningService(db)
    
    config = {
        "scan_mode": scan_request.scan_mode,
        "test_sql_injection": scan_request.test_sql_injection,
        "test_xss": scan_request.test_xss,
        "test_csrf": scan_request.test_csrf,
        "test_headers": scan_request.test_headers,
        "test_authentication": scan_request.test_authentication,
        "test_access_control": scan_request.test_access_control,
        "test_cryptographic_failures": scan_request.test_cryptographic_failures
    }
    
    scan = await service.create_scan(
        project_id=project_id,
        organisation_id=project.organisation_id,
        name=f"VAPT Scan: {scan_request.target_url}",
        scan_type=ScanType.VAPT,
        targets=[{
            "target_type": TargetType.URL.value,
            "target_value": scan_request.target_url,
            "target_name": scan_request.target_url
        }],
        triggered_by=current_user.id,
        config=config,
        scan_depth=scan_request.scan_depth,
        enable_active_scanning=scan_request.scan_mode == "active"
    )
    
    background_tasks.add_task(execute_scan_task, db, scan.id)
    
    return scan


# ============================================================================
# Vulnerabilities
# ============================================================================

@router.get("/vulnerabilities", response_model=VulnerabilityListResponse)
async def list_vulnerabilities(
    project_id: Optional[UUID] = None,
    scan_id: Optional[UUID] = None,
    severity: Optional[SeverityLevel] = None,
    category: Optional[VulnerabilityCategory] = None,
    is_resolved: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List vulnerabilities with filters
    """
    service = SecurityScanningService(db)
    skip = (page - 1) * page_size
    
    vulns, total = await service.list_vulnerabilities(
        scan_id=scan_id,
        project_id=project_id,
        severity=severity,
        category=category,
        is_resolved=is_resolved,
        skip=skip,
        limit=page_size
    )
    
    return VulnerabilityListResponse(
        items=vulns,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/vulnerabilities/{vuln_id}", response_model=VulnerabilityResponse)
async def get_vulnerability(
    vuln_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get vulnerability details
    """
    service = SecurityScanningService(db)
    vuln = await service.get_vulnerability(vuln_id)
    
    if not vuln:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    
    return vuln


@router.patch("/vulnerabilities/{vuln_id}", response_model=VulnerabilityResponse)
async def update_vulnerability(
    vuln_id: UUID,
    update_data: VulnerabilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update vulnerability status (mark as resolved, false positive, etc.)
    """
    service = SecurityScanningService(db)
    
    vuln = await service.update_vulnerability_status(
        vuln_id=vuln_id,
        is_false_positive=update_data.is_false_positive,
        is_verified=update_data.is_verified,
        is_resolved=update_data.is_resolved,
        resolved_by=current_user.id if update_data.is_resolved else None
    )
    
    if not vuln:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    
    return vuln


@router.post("/vulnerabilities/{vuln_id}/ai-remediation")
async def generate_ai_remediation(
    vuln_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI-powered remediation suggestion
    """
    service = SecurityScanningService(db)
    vuln = await service.get_vulnerability(vuln_id)
    
    if not vuln:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    
    remediation = await service.generate_ai_remediation(vuln)
    
    return {"remediation": remediation}


# ============================================================================
# Dashboard & Statistics
# ============================================================================

@router.get("/dashboard/{project_id}/stats", response_model=SecurityDashboardStats)
async def get_dashboard_stats(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get security dashboard statistics
    """
    service = SecurityScanningService(db)
    stats = await service.get_dashboard_stats(project_id)
    
    return SecurityDashboardStats(
        project_id=project_id,
        total_scans=stats["total_scans"],
        total_assets=0,
        total_vulnerabilities=stats["total_vulnerabilities"],
        open_vulnerabilities=stats["open_vulnerabilities"],
        resolved_vulnerabilities=stats["resolved_vulnerabilities"],
        overall_risk_score=stats["overall_risk_score"],
        risk_grade=stats["risk_grade"],
        risk_trend="stable",
        severity_breakdown=SeverityBreakdown(**stats["severity_breakdown"]),
        top_categories=[],
        scans_last_7_days=stats["scans_last_7_days"],
        scans_last_30_days=stats["scans_last_30_days"],
        new_vulnerabilities_last_7_days=0,
        resolved_last_7_days=0,
        certificates_monitored=0,
        certificates_expiring_soon=0
    )


@router.get("/dashboard/{project_id}/risk-score", response_model=RiskScoreResponse)
async def get_risk_score(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed risk score
    """
    service = SecurityScanningService(db)
    stats = await service.get_dashboard_stats(project_id)
    
    factors = []
    severity = stats["severity_breakdown"]
    
    if severity["critical"] > 0:
        factors.append({
            "factor": "Critical Vulnerabilities",
            "count": severity["critical"],
            "impact": "Very High"
        })
    if severity["high"] > 0:
        factors.append({
            "factor": "High Vulnerabilities",
            "count": severity["high"],
            "impact": "High"
        })
    
    recommendations = []
    if severity["critical"] > 0:
        recommendations.append("Immediately address critical vulnerabilities")
    if severity["high"] > 0:
        recommendations.append("Prioritize remediation of high severity issues")
    if not recommendations:
        recommendations.append("Continue regular security scanning")
    
    return RiskScoreResponse(
        score=stats["overall_risk_score"],
        grade=stats["risk_grade"],
        trend="stable",
        factors=factors,
        recommendations=recommendations
    )


# ============================================================================
# Compliance
# ============================================================================

@router.get("/compliance/{project_id}/report", response_model=ComplianceReportResponse)
async def get_compliance_report(
    project_id: UUID,
    framework: ComplianceFramework,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get compliance report for a specific framework
    """
    service = SecurityScanningService(db)
    report = await service.generate_compliance_report(project_id, framework)
    
    # Get checks
    result = await db.execute(
        select(ComplianceCheck).where(
            ComplianceCheck.project_id == project_id,
            ComplianceCheck.framework == framework
        )
    )
    checks = result.scalars().all()
    
    return ComplianceReportResponse(
        framework=framework,
        project_id=project_id,
        generated_at=datetime.utcnow(),
        total_controls=report["total_controls"],
        compliant_count=report["compliant_count"],
        non_compliant_count=report["non_compliant_count"],
        partial_count=report["partial_count"],
        not_applicable_count=report["not_applicable_count"],
        not_assessed_count=report["not_assessed_count"],
        compliance_percentage=report["compliance_percentage"],
        checks=checks
    )


@router.get("/compliance/frameworks")
async def list_compliance_frameworks(
    current_user: User = Depends(get_current_user)
):
    """
    List available compliance frameworks
    """
    return [
        {"id": f.value, "name": f.value, "description": f"Compliance with {f.value}"}
        for f in ComplianceFramework
    ]


# ============================================================================
# Security Assets
# ============================================================================

@router.post("/assets", response_model=SecurityAssetResponse, status_code=status.HTTP_201_CREATED)
async def create_security_asset(
    project_id: UUID,
    asset_data: SecurityAssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Register a security asset for monitoring
    """
    project = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = project.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    asset = SecurityAsset(
        project_id=project_id,
        organisation_id=project.organisation_id,
        name=asset_data.name,
        description=asset_data.description,
        asset_type=asset_data.asset_type,
        asset_value=asset_data.asset_value,
        criticality=asset_data.criticality,
        data_classification=asset_data.data_classification,
        owner=asset_data.owner,
        monitoring_enabled=asset_data.monitoring_enabled,
        ssl_monitoring_enabled=asset_data.ssl_monitoring_enabled,
        tags=asset_data.tags,
        custom_attributes=asset_data.custom_attributes,
        created_by=current_user.id
    )
    
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    
    return asset


@router.get("/assets", response_model=List[SecurityAssetResponse])
async def list_security_assets(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List security assets for a project
    """
    result = await db.execute(
        select(SecurityAsset).where(SecurityAsset.project_id == project_id)
    )
    return result.scalars().all()


@router.get("/assets/{asset_id}", response_model=SecurityAssetResponse)
async def get_security_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get security asset details
    """
    result = await db.execute(
        select(SecurityAsset).where(SecurityAsset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return asset


@router.patch("/assets/{asset_id}", response_model=SecurityAssetResponse)
async def update_security_asset(
    asset_id: UUID,
    update_data: SecurityAssetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update security asset
    """
    result = await db.execute(
        select(SecurityAsset).where(SecurityAsset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(asset, key, value)
    
    await db.commit()
    await db.refresh(asset)
    
    return asset


@router.delete("/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_security_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete security asset
    """
    result = await db.execute(
        select(SecurityAsset).where(SecurityAsset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    await db.delete(asset)
    await db.commit()


# ============================================================================
# Scan Schedules
# ============================================================================

@router.post("/schedules", response_model=ScanScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_scan_schedule(
    project_id: UUID,
    schedule_data: ScanScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a scheduled scan
    """
    project = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = project.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    targets = [t.model_dump() for t in schedule_data.targets]
    
    schedule = ScanSchedule(
        project_id=project_id,
        organisation_id=project.organisation_id,
        name=schedule_data.name,
        description=schedule_data.description,
        scan_type=schedule_data.scan_type,
        targets=targets,
        scan_config=schedule_data.scan_config,
        frequency=schedule_data.frequency,
        cron_expression=schedule_data.cron_expression,
        timezone=schedule_data.timezone,
        is_enabled=schedule_data.is_enabled,
        notify_on_complete=schedule_data.notify_on_complete,
        notify_on_critical=schedule_data.notify_on_critical,
        notification_emails=schedule_data.notification_emails,
        created_by=current_user.id
    )
    
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    
    return schedule


@router.get("/schedules", response_model=List[ScanScheduleResponse])
async def list_scan_schedules(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List scan schedules for a project
    """
    result = await db.execute(
        select(ScanSchedule).where(ScanSchedule.project_id == project_id)
    )
    return result.scalars().all()


@router.patch("/schedules/{schedule_id}", response_model=ScanScheduleResponse)
async def update_scan_schedule(
    schedule_id: UUID,
    update_data: ScanScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update scan schedule
    """
    result = await db.execute(
        select(ScanSchedule).where(ScanSchedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    
    if "targets" in update_dict:
        update_dict["targets"] = [t.model_dump() for t in update_data.targets]
    
    for key, value in update_dict.items():
        setattr(schedule, key, value)
    
    await db.commit()
    await db.refresh(schedule)
    
    return schedule


@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete scan schedule
    """
    result = await db.execute(
        select(ScanSchedule).where(ScanSchedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    await db.delete(schedule)
    await db.commit()
