"""
Celery Tasks for Security Scanning
Async task definitions for long-running security operations
"""
from celery import shared_task, current_task
from typing import Dict, Any, Optional
from uuid import UUID
import asyncio
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# Helper Functions
# ============================================================================

def run_async(coro):
    """Helper to run async code in Celery tasks"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def update_task_progress(current: int, total: int, message: str = ""):
    """Update task progress metadata"""
    current_task.update_state(
        state="PROGRESS",
        meta={
            "current": current,
            "total": total,
            "percent": int((current / total) * 100) if total > 0 else 0,
            "message": message
        }
    )


# ============================================================================
# URL Security Scan Task
# ============================================================================

@shared_task(bind=True, name="app.tasks.security_tasks.run_url_scan")
def run_url_scan(
    self,
    scan_id: str,
    project_id: str,
    target_url: str,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Execute URL security scan as async task
    
    Args:
        scan_id: UUID of the scan record
        project_id: UUID of the project
        target_url: URL to scan
        config: Scan configuration options
    """
    from app.core.database import async_session_maker
    from app.services.security_scanning_service import SecurityScanningService
    from app.services.external_scanners import ExternalScannerFactory, ScannerType
    
    logger.info(f"Starting URL scan task for {target_url}")
    
    async def execute_scan():
        async with async_session_maker() as db:
            service = SecurityScanningService(db)
            
            # Get scan record
            scan = await service.get_scan(UUID(scan_id))
            if not scan:
                return {"status": "error", "message": "Scan not found"}
            
            try:
                # Update progress
                update_task_progress(0, 100, "Initializing scan")
                
                # Run the URL security scan
                result = await service.run_url_security_scan(scan)
                
                # Try external scanners if available
                if config.get("use_external_scanners", False):
                    # Try Nmap for enhanced port scanning
                    nmap = ExternalScannerFactory.get_scanner(ScannerType.NMAP)
                    if nmap.is_available():
                        update_task_progress(70, 100, "Running Nmap scan")
                        nmap_result = await nmap.scan(target_url, config)
                        # Merge results if successful
                        if nmap_result.success:
                            # Store in scan metadata
                            scan.config["nmap_results"] = nmap_result.metadata
                
                update_task_progress(100, 100, "Scan completed")
                
                return {
                    "status": "success",
                    "scan_id": scan_id,
                    "vulnerabilities_found": result.total_vulnerabilities,
                    "risk_grade": result.risk_grade
                }
                
            except Exception as e:
                logger.error(f"URL scan failed: {e}")
                return {"status": "error", "message": str(e)}
    
    return run_async(execute_scan())


# ============================================================================
# Repository Security Scan Task
# ============================================================================

@shared_task(bind=True, name="app.tasks.security_tasks.run_repo_scan")
def run_repo_scan(
    self,
    scan_id: str,
    project_id: str,
    repo_url: str,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Execute repository security scan as async task
    
    Args:
        scan_id: UUID of the scan record
        project_id: UUID of the project
        repo_url: Repository URL to scan
        config: Scan configuration options
    """
    from app.core.database import async_session_maker
    from app.services.security_scanning_service import SecurityScanningService
    from app.services.external_scanners import ExternalScannerFactory, ScannerType
    from app.services.entropy_analyzer import EntropyAnalyzer
    
    logger.info(f"Starting repo scan task for {repo_url}")
    
    async def execute_scan():
        async with async_session_maker() as db:
            service = SecurityScanningService(db)
            
            scan = await service.get_scan(UUID(scan_id))
            if not scan:
                return {"status": "error", "message": "Scan not found"}
            
            try:
                update_task_progress(0, 100, "Cloning repository")
                
                # Run the repo security scan
                result = await service.run_repo_security_scan(scan)
                
                # Try TruffleHog for enhanced secret detection
                if config.get("use_external_scanners", False):
                    trufflehog = ExternalScannerFactory.get_scanner(ScannerType.TRUFFLEHOG)
                    if trufflehog.is_available():
                        update_task_progress(50, 100, "Running TruffleHog scan")
                        th_result = await trufflehog.scan(repo_url, {
                            "branch": config.get("branch", "main"),
                            "only_verified": True
                        })
                        if th_result.success:
                            scan.config["trufflehog_results"] = {
                                "secrets_found": len(th_result.vulnerabilities)
                            }
                
                # Try Trivy for dependency scanning
                if config.get("scan_dependencies", True):
                    trivy = ExternalScannerFactory.get_scanner(ScannerType.TRIVY)
                    if trivy.is_available():
                        update_task_progress(75, 100, "Running Trivy scan")
                        trivy_result = await trivy.scan(repo_url, {"scan_type": "repo"})
                        if trivy_result.success:
                            scan.config["trivy_results"] = {
                                "vulnerabilities_found": len(trivy_result.vulnerabilities)
                            }
                
                update_task_progress(100, 100, "Scan completed")
                
                return {
                    "status": "success",
                    "scan_id": scan_id,
                    "vulnerabilities_found": result.total_vulnerabilities,
                    "secrets_found": scan.config.get("trufflehog_results", {}).get("secrets_found", 0)
                }
                
            except Exception as e:
                logger.error(f"Repo scan failed: {e}")
                return {"status": "error", "message": str(e)}
    
    return run_async(execute_scan())


# ============================================================================
# VAPT Scan Task
# ============================================================================

@shared_task(bind=True, name="app.tasks.security_tasks.run_vapt_scan")
def run_vapt_scan(
    self,
    scan_id: str,
    project_id: str,
    target_url: str,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Execute VAPT scan as async task
    
    Args:
        scan_id: UUID of the scan record
        project_id: UUID of the project
        target_url: Target application URL
        config: Scan configuration options
    """
    from app.core.database import async_session_maker
    from app.services.security_scanning_service import SecurityScanningService
    from app.services.external_scanners import ExternalScannerFactory, ScannerType
    
    logger.info(f"Starting VAPT scan task for {target_url}")
    
    async def execute_scan():
        async with async_session_maker() as db:
            service = SecurityScanningService(db)
            
            scan = await service.get_scan(UUID(scan_id))
            if not scan:
                return {"status": "error", "message": "Scan not found"}
            
            try:
                update_task_progress(0, 100, "Initializing VAPT scan")
                
                # Run the VAPT scan
                result = await service.run_vapt_scan(scan)
                
                # Try OWASP ZAP for enhanced scanning
                if config.get("use_external_scanners", False):
                    zap = ExternalScannerFactory.get_scanner(ScannerType.OWASP_ZAP)
                    if zap.is_available():
                        update_task_progress(50, 100, "Running OWASP ZAP scan")
                        scan_type = "active" if config.get("scan_mode") == "active" else "passive"
                        zap_result = await zap.scan(target_url, {"scan_type": scan_type})
                        
                        if zap_result.success:
                            # Add ZAP vulnerabilities to scan
                            for vuln in zap_result.vulnerabilities:
                                await service._create_vulnerability(
                                    scan=scan,
                                    target=None,
                                    title=vuln["title"],
                                    description=vuln.get("description", ""),
                                    category=service._map_owasp_category(vuln.get("cwe_id", "")),
                                    severity=service._map_severity(vuln["severity"]),
                                    remediation=vuln.get("solution", ""),
                                    evidence=vuln.get("evidence", "")
                                )
                            
                            scan.config["zap_results"] = {
                                "alerts_count": len(zap_result.vulnerabilities)
                            }
                
                update_task_progress(100, 100, "VAPT scan completed")
                
                return {
                    "status": "success",
                    "scan_id": scan_id,
                    "vulnerabilities_found": result.total_vulnerabilities,
                    "risk_grade": result.risk_grade
                }
                
            except Exception as e:
                logger.error(f"VAPT scan failed: {e}")
                return {"status": "error", "message": str(e)}
    
    return run_async(execute_scan())


# ============================================================================
# Compliance Report Task
# ============================================================================

@shared_task(bind=True, name="app.tasks.security_tasks.generate_compliance_report")
def generate_compliance_report(
    self,
    project_id: str,
    framework: str
) -> Dict[str, Any]:
    """
    Generate compliance report as async task
    
    Args:
        project_id: UUID of the project
        framework: Compliance framework (iso27001, soc2, gdpr, etc.)
    """
    from app.core.database import async_session_maker
    from app.services.security_scanning_service import SecurityScanningService
    from app.models.security_scan import ComplianceFramework
    
    logger.info(f"Generating compliance report for project {project_id}, framework: {framework}")
    
    async def execute_report():
        async with async_session_maker() as db:
            service = SecurityScanningService(db)
            
            try:
                update_task_progress(0, 100, "Analyzing compliance status")
                
                # Map framework string to enum
                framework_enum = ComplianceFramework(framework)
                
                update_task_progress(50, 100, "Generating report")
                
                report = await service.generate_compliance_report(
                    UUID(project_id),
                    framework_enum
                )
                
                update_task_progress(100, 100, "Report complete")
                
                return {
                    "status": "success",
                    "framework": framework,
                    "compliance_percentage": report.get("compliance_percentage", 0),
                    "total_controls": report.get("total_controls", 0)
                }
                
            except Exception as e:
                logger.error(f"Compliance report generation failed: {e}")
                return {"status": "error", "message": str(e)}
    
    return run_async(execute_report())


# ============================================================================
# Scheduled Scan Processing
# ============================================================================

@shared_task(name="app.tasks.security_tasks.process_scheduled_scans")
def process_scheduled_scans() -> Dict[str, Any]:
    """
    Process scheduled security scans
    Called periodically by Celery Beat
    """
    from app.core.database import async_session_maker
    from app.models.security_scan import ScanSchedule
    from sqlalchemy import select
    from datetime import datetime
    
    async def process():
        async with async_session_maker() as db:
            # Find schedules that need to run
            now = datetime.utcnow()
            result = await db.execute(
                select(ScanSchedule).where(
                    ScanSchedule.is_enabled == True,
                    ScanSchedule.next_run_at <= now
                )
            )
            schedules = result.scalars().all()
            
            triggered = 0
            for schedule in schedules:
                # Trigger the appropriate scan task based on type
                scan_type = schedule.scan_type.value
                targets = schedule.targets
                
                for target in targets:
                    if scan_type == "url_security":
                        run_url_scan.delay(
                            str(schedule.id),
                            str(schedule.project_id),
                            target.get("target_value", ""),
                            schedule.scan_config
                        )
                    elif scan_type == "repo_security":
                        run_repo_scan.delay(
                            str(schedule.id),
                            str(schedule.project_id),
                            target.get("target_value", ""),
                            schedule.scan_config
                        )
                    elif scan_type == "vapt":
                        run_vapt_scan.delay(
                            str(schedule.id),
                            str(schedule.project_id),
                            target.get("target_value", ""),
                            schedule.scan_config
                        )
                    triggered += 1
                
                # Update next run time
                # (simplified - in production, calculate based on cron/frequency)
                schedule.last_run_at = now
                schedule.total_runs += 1
            
            await db.commit()
            
            return {"status": "success", "scans_triggered": triggered}
    
    return run_async(process())


# Export all
__all__ = [
    "run_url_scan",
    "run_repo_scan", 
    "run_vapt_scan",
    "generate_compliance_report",
    "process_scheduled_scans"
]
