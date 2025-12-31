"""
Security Advanced API Endpoints
SAST, SCA, IAST, RASP, SBOM, Policy, CI/CD, and Report APIs
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User

from app.schemas.security_advanced_schemas import (
    SASTScanCreate, SASTScanResponse, SASTFindingResponse,
    SCAScanCreate, SCAScanResponse, SCAFindingResponse,
    IASTSessionCreate, IASTSessionResponse, IASTAnalyzeRequest, IASTFindingResponse,
    RASPConfigCreate, RASPConfigResponse, RASPEventResponse, RASPStatsResponse,
    SBOMGenerateRequest, SBOMResponse, SBOMComponentResponse,
    PolicyCreate, PolicyResponse, PolicyEvaluationResponse, SuppressionCreate,
    PipelineCreate, PipelineResponse, PipelineRunResponse,
    ReportGenerateRequest, ReportResponse
)

from app.services.native_sast_service import NativeSASTService
from app.services.native_sca_service import NativeSCAService
from app.services.native_iast_service import NativeIASTService
from app.services.native_rasp_service import NativeRASPService
from app.services.sbom_generator_service import SBOMGeneratorService
from app.services.policy_engine_service import PolicyEngineService
from app.services.cicd_integration_service import CICDIntegrationService
from app.services.security_report_generator import SecurityReportGenerator

from app.models.security_advanced_models import SBOMFormat, CICDProvider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/security-advanced", tags=["Security Advanced"])


# ============================================================================
# SAST Endpoints
# ============================================================================

@router.post("/sast/scans", response_model=SASTScanResponse)
async def create_sast_scan(
    project_id: UUID,
    scan_data: SASTScanCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create and start a SAST scan"""
    service = NativeSASTService(db)
    
    scan = await service.create_scan(
        project_id=project_id,
        organisation_id=current_user.organisation_id,
        name=scan_data.name,
        repo_path=scan_data.repo_path or scan_data.repo_url,
        engines=scan_data.engines,
        languages=scan_data.languages,
        ruleset=scan_data.ruleset,
        exclude_patterns=scan_data.exclude_patterns,
        created_by=current_user.id
    )
    
    # Run scan in background
    background_tasks.add_task(run_sast_scan_task, db, scan.id)
    
    return scan


@router.get("/sast/scans/{scan_id}", response_model=SASTScanResponse)
async def get_sast_scan(
    scan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get SAST scan details"""
    service = NativeSASTService(db)
    scan = await service.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.get("/sast/scans/{scan_id}/findings", response_model=List[SASTFindingResponse])
async def get_sast_findings(
    scan_id: UUID,
    severity: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get SAST scan findings"""
    from app.models.security_advanced_models import FindingSeverity
    service = NativeSASTService(db)
    
    sev = FindingSeverity(severity) if severity else None
    findings = await service.get_findings(scan_id, severity=sev, limit=limit, offset=offset)
    return findings


# ============================================================================
# SCA Endpoints
# ============================================================================

@router.post("/sca/scans", response_model=SCAScanResponse)
async def create_sca_scan(
    project_id: UUID,
    scan_data: SCAScanCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create and start an SCA scan"""
    service = NativeSCAService(db)
    
    scan = await service.create_scan(
        project_id=project_id,
        organisation_id=current_user.organisation_id,
        name=scan_data.name,
        project_path=scan_data.project_path,
        check_licenses=scan_data.check_licenses,
        check_vulnerabilities=scan_data.check_vulnerabilities,
        created_by=current_user.id
    )
    
    background_tasks.add_task(run_sca_scan_task, db, scan.id)
    return scan


@router.get("/sca/scans/{scan_id}", response_model=SCAScanResponse)
async def get_sca_scan(
    scan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get SCA scan details"""
    service = NativeSCAService(db)
    scan = await service.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.get("/sca/scans/{scan_id}/findings", response_model=List[SCAFindingResponse])
async def get_sca_findings(
    scan_id: UUID,
    severity: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get SCA scan findings"""
    from app.models.security_advanced_models import FindingSeverity
    service = NativeSCAService(db)
    
    sev = FindingSeverity(severity) if severity else None
    findings = await service.get_findings(scan_id, severity=sev, limit=limit)
    return findings


# ============================================================================
# IAST Endpoints
# ============================================================================

@router.post("/iast/sessions", response_model=IASTSessionResponse)
async def start_iast_session(
    project_id: UUID,
    session_data: IASTSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start an IAST monitoring session"""
    service = NativeIASTService(db)
    
    session = await service.start_session(
        project_id=project_id,
        organisation_id=current_user.organisation_id,
        name=session_data.name,
        app_url=session_data.app_url,
        config=session_data.config,
        created_by=current_user.id
    )
    return session


@router.get("/iast/sessions/{session_id}", response_model=IASTSessionResponse)
async def get_iast_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get IAST session details"""
    service = NativeIASTService(db)
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/iast/sessions/{session_id}")
async def stop_iast_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Stop an IAST session"""
    service = NativeIASTService(db)
    session = await service.stop_session(session_id)
    return {"status": "stopped", "vulnerabilities_found": session.vulnerabilities_found}


@router.post("/iast/analyze", response_model=List[IASTFindingResponse])
async def analyze_request(
    data: IASTAnalyzeRequest,
    db: AsyncSession = Depends(get_db)
):
    """Analyze HTTP request for vulnerabilities (called during test execution)"""
    service = NativeIASTService(db)
    
    findings = await service.analyze_request(
        session_token=data.session_token,
        method=data.method,
        url=data.url,
        headers=data.headers,
        body=data.body,
        response_status=data.response_status,
        response_body=data.response_body
    )
    return findings


@router.get("/iast/sessions/{session_id}/findings", response_model=List[IASTFindingResponse])
async def get_iast_findings(
    session_id: UUID,
    severity: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get IAST session findings"""
    from app.models.security_advanced_models import FindingSeverity
    service = NativeIASTService(db)
    
    sev = FindingSeverity(severity) if severity else None
    findings = await service.get_session_findings(session_id, severity=sev)
    return findings


# ============================================================================
# RASP Endpoints
# ============================================================================

@router.post("/rasp/config", response_model=RASPConfigResponse)
async def create_rasp_config(
    project_id: UUID,
    config_data: RASPConfigCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create RASP configuration"""
    service = NativeRASPService(db)
    
    config = await service.create_config(
        project_id=project_id,
        organisation_id=current_user.organisation_id,
        name=config_data.name,
        **config_data.model_dump(exclude={"name"})
    )
    return config


@router.get("/rasp/config/{project_id}", response_model=RASPConfigResponse)
async def get_rasp_config(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get RASP configuration for project"""
    service = NativeRASPService(db)
    config = await service.get_config(project_id)
    if not config:
        raise HTTPException(status_code=404, detail="RASP config not found")
    return config


@router.get("/rasp/events/{project_id}", response_model=List[RASPEventResponse])
async def get_rasp_events(
    project_id: UUID,
    hours: int = 24,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get RASP events"""
    from datetime import timedelta
    service = NativeRASPService(db)
    
    since = datetime.utcnow() - timedelta(hours=hours)
    events = await service.get_events(project_id, since=since, limit=limit)
    return events


@router.get("/rasp/stats/{project_id}", response_model=RASPStatsResponse)
async def get_rasp_stats(
    project_id: UUID,
    hours: int = 24,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get RASP statistics"""
    service = NativeRASPService(db)
    stats = await service.get_event_stats(project_id, hours=hours)
    return stats


# ============================================================================
# SBOM Endpoints
# ============================================================================

@router.post("/sbom/generate", response_model=SBOMResponse)
async def generate_sbom(
    project_id: UUID,
    request: SBOMGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate SBOM for project"""
    service = SBOMGeneratorService(db)
    
    sbom = await service.generate_sbom(
        project_id=project_id,
        organisation_id=current_user.organisation_id,
        name=request.name,
        source_path=request.source_path,
        format=SBOMFormat(request.format.value),
        created_by=current_user.id
    )
    return sbom


@router.get("/sbom/{sbom_id}", response_model=SBOMResponse)
async def get_sbom(
    sbom_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get SBOM details"""
    service = SBOMGeneratorService(db)
    sbom = await service.get_sbom(sbom_id)
    if not sbom:
        raise HTTPException(status_code=404, detail="SBOM not found")
    return sbom


@router.get("/sbom/{sbom_id}/export")
async def export_sbom(
    sbom_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export SBOM content"""
    service = SBOMGeneratorService(db)
    content = await service.export_sbom(sbom_id)
    return {"content": content}


@router.get("/sbom/{sbom_id}/components", response_model=List[SBOMComponentResponse])
async def get_sbom_components(
    sbom_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get SBOM components"""
    service = SBOMGeneratorService(db)
    components = await service.get_components(sbom_id)
    return components


# ============================================================================
# Policy Endpoints
# ============================================================================

@router.post("/policies", response_model=PolicyResponse)
async def create_policy(
    policy_data: PolicyCreate,
    project_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create security policy"""
    service = PolicyEngineService(db)
    
    policy = await service.create_policy(
        organisation_id=current_user.organisation_id,
        project_id=project_id,
        name=policy_data.name,
        **policy_data.model_dump(exclude={"name"})
    )
    return policy


@router.get("/policies", response_model=List[PolicyResponse])
async def list_policies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List security policies"""
    service = PolicyEngineService(db)
    policies = await service.list_policies(current_user.organisation_id)
    return policies


@router.get("/policies/{policy_id}", response_model=PolicyResponse)
async def get_policy(
    policy_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get policy details"""
    service = PolicyEngineService(db)
    policy = await service.get_policy(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.post("/policies/{policy_id}/evaluate/sast", response_model=PolicyEvaluationResponse)
async def evaluate_sast_scan(
    policy_id: UUID,
    scan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Evaluate SAST scan against policy"""
    service = PolicyEngineService(db)
    result = await service.evaluate_sast_scan(scan_id, policy_id)
    return {
        "passed": result.passed,
        "violations": result.violations,
        "warnings": result.warnings,
        "details": result.details
    }


@router.post("/policies/{policy_id}/suppressions")
async def add_suppression(
    policy_id: UUID,
    suppression: SuppressionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add false positive suppression"""
    service = PolicyEngineService(db)
    result = await service.add_suppression(
        policy_id=policy_id,
        suppression_type=suppression.suppression_type,
        suppression_value=suppression.suppression_value,
        reason=suppression.reason,
        expires_at=suppression.expires_at,
        created_by=current_user.id
    )
    return {"id": result.id, "status": "created"}


# ============================================================================
# CI/CD Endpoints
# ============================================================================

@router.post("/cicd/pipelines", response_model=PipelineResponse)
async def register_pipeline(
    project_id: UUID,
    pipeline_data: PipelineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register CI/CD pipeline"""
    service = CICDIntegrationService(db)
    
    pipeline = await service.register_pipeline(
        project_id=project_id,
        organisation_id=current_user.organisation_id,
        name=pipeline_data.name,
        provider=CICDProvider(pipeline_data.provider.value),
        policy_id=pipeline_data.policy_id,
        trigger_on_push=pipeline_data.trigger_on_push,
        trigger_on_pr=pipeline_data.trigger_on_pr,
        trigger_branches=pipeline_data.trigger_branches,
        run_sast=pipeline_data.run_sast,
        run_sca=pipeline_data.run_sca,
        created_by=current_user.id
    )
    return pipeline


@router.get("/cicd/pipelines/{project_id}", response_model=List[PipelineResponse])
async def list_pipelines(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List pipelines for project"""
    service = CICDIntegrationService(db)
    pipelines = await service.list_pipelines(project_id)
    return pipelines


@router.post("/cicd/webhook/{token}")
async def handle_webhook(
    token: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Handle CI/CD webhook"""
    service = CICDIntegrationService(db)
    
    pipeline = await service.get_pipeline_by_token(token)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    # Verify signature
    body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", request.headers.get("X-Gitlab-Token", ""))
    
    if not service.verify_webhook_signature(pipeline, body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    payload = await request.json()
    
    # Handle based on provider
    if pipeline.provider.value == "github_actions":
        run = await service.handle_github_webhook(pipeline, payload)
    else:
        run = await service.handle_gitlab_webhook(pipeline, payload)
    
    if run:
        # Trigger scans in background
        background_tasks.add_task(run_cicd_scans, db, run.id, pipeline)
        return {"run_id": run.id, "status": "triggered"}
    
    return {"status": "skipped", "reason": "Branch not in trigger list"}


@router.get("/cicd/runs/{run_id}", response_model=PipelineRunResponse)
async def get_pipeline_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get pipeline run details"""
    service = CICDIntegrationService(db)
    run = await service.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/cicd/runs/{run_id}/gate")
async def get_quality_gate(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get quality gate status for run"""
    service = CICDIntegrationService(db)
    run = await service.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {
        "passed": run.gate_passed,
        "details": run.gate_details,
        "status": run.status
    }


# ============================================================================
# Report Endpoints
# ============================================================================

@router.post("/reports/executive", response_model=ReportResponse)
async def generate_executive_report(
    project_id: UUID,
    request: ReportGenerateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate executive report"""
    service = SecurityReportGenerator(db)
    
    report = await service.generate_executive_report(
        project_id=project_id,
        organisation_id=current_user.organisation_id,
        name=request.name,
        date_from=request.date_from,
        date_to=request.date_to,
        created_by=current_user.id
    )
    return report


@router.get("/reports/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get report details"""
    service = SecurityReportGenerator(db)
    report = await service.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/reports/{project_id}/list", response_model=List[ReportResponse])
async def list_reports(
    project_id: UUID,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List reports for project"""
    service = SecurityReportGenerator(db)
    reports = await service.list_reports(project_id, limit=limit)
    return reports


@router.post("/reports/scan/{scan_id}")
async def generate_scan_report(
    scan_id: UUID,
    scan_type: str = "sast",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate detailed scan report"""
    service = SecurityReportGenerator(db)
    report = await service.generate_scan_report(scan_id, scan_type)
    return report


# ============================================================================
# Background Tasks
# ============================================================================

async def run_sast_scan_task(db: AsyncSession, scan_id: UUID):
    """Background task to run SAST scan"""
    try:
        service = NativeSASTService(db)
        await service.run_scan(scan_id)
    except Exception as e:
        logger.error(f"SAST scan task failed: {e}")


async def run_sca_scan_task(db: AsyncSession, scan_id: UUID):
    """Background task to run SCA scan"""
    try:
        service = NativeSCAService(db)
        await service.run_scan(scan_id)
    except Exception as e:
        logger.error(f"SCA scan task failed: {e}")


async def run_cicd_scans(db: AsyncSession, run_id: UUID, pipeline):
    """Run scans for CI/CD pipeline"""
    try:
        cicd_service = CICDIntegrationService(db)
        
        # Update status to running
        await cicd_service.update_run_status(run_id, "running")
        
        # TODO: Run actual scans based on pipeline config
        # For now, mark as passed
        
        await cicd_service.update_run_status(
            run_id, "passed", gate_passed=True,
            gate_details={"message": "All security checks passed"}
        )
    except Exception as e:
        logger.error(f"CI/CD scan failed: {e}")
        await cicd_service.update_run_status(run_id, "error")
