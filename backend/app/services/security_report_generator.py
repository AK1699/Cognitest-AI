"""
Security Report Generator Service
Generate PDF and executive reports
"""
import io
import json
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timedelta
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.security_advanced_models import (
    SecurityReport, ReportFormat, ReportType,
    SASTScan, SCAScan, SASTFinding, SCAFinding
)

logger = logging.getLogger(__name__)


class SecurityReportGenerator:
    """Generate PDF and executive security reports"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_executive_report(
        self,
        project_id: UUID,
        organisation_id: UUID,
        name: str,
        date_from: datetime = None,
        date_to: datetime = None,
        created_by: UUID = None
    ) -> SecurityReport:
        """Generate executive summary report"""
        
        if not date_from:
            date_from = datetime.utcnow() - timedelta(days=30)
        if not date_to:
            date_to = datetime.utcnow()
        
        report = SecurityReport(
            project_id=project_id,
            organisation_id=organisation_id,
            name=name,
            report_type=ReportType.EXECUTIVE,
            format=ReportFormat.JSON,  # Can be converted to PDF
            date_from=date_from,
            date_to=date_to,
            status="generating",
            created_by=created_by
        )
        self.db.add(report)
        await self.db.commit()
        
        try:
            # Gather data
            data = await self._gather_report_data(project_id, date_from, date_to)
            
            # Generate content
            content = self._generate_executive_content(data)
            
            report.status = "completed"
            report.file_path = f"/reports/{report.id}.json"
            report.generated_at = datetime.utcnow()
            
            await self.db.commit()
            
            # Store content (in production, save to file storage)
            # For now, we'll return the report object
            
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            report.status = "failed"
            report.error_message = str(e)
            await self.db.commit()
        
        return report

    async def _gather_report_data(
        self,
        project_id: UUID,
        date_from: datetime,
        date_to: datetime
    ) -> Dict[str, Any]:
        """Gather all data for report"""
        
        # SAST scan stats
        sast_result = await self.db.execute(
            select(SASTScan).where(
                SASTScan.project_id == project_id,
                SASTScan.created_at >= date_from,
                SASTScan.created_at <= date_to
            )
        )
        sast_scans = sast_result.scalars().all()
        
        # SCA scan stats
        sca_result = await self.db.execute(
            select(SCAScan).where(
                SCAScan.project_id == project_id,
                SCAScan.created_at >= date_from,
                SCAScan.created_at <= date_to
            )
        )
        sca_scans = sca_result.scalars().all()
        
        # Aggregate findings
        total_critical = sum(s.critical_count or 0 for s in sast_scans)
        total_high = sum(s.high_count or 0 for s in sast_scans)
        total_medium = sum(s.medium_count or 0 for s in sast_scans)
        total_low = sum(s.low_count or 0 for s in sast_scans)
        
        # SCA vulnerabilities
        sca_critical = sum(s.critical_vulns or 0 for s in sca_scans)
        sca_high = sum(s.high_vulns or 0 for s in sca_scans)
        
        return {
            "period": {
                "from": date_from.isoformat(),
                "to": date_to.isoformat()
            },
            "summary": {
                "total_sast_scans": len(sast_scans),
                "total_sca_scans": len(sca_scans),
                "sast_findings": {
                    "critical": total_critical,
                    "high": total_high,
                    "medium": total_medium,
                    "low": total_low,
                    "total": total_critical + total_high + total_medium + total_low
                },
                "sca_vulnerabilities": {
                    "critical": sca_critical,
                    "high": sca_high
                }
            },
            "risk_score": self._calculate_risk_score(
                total_critical, total_high, total_medium,
                sca_critical, sca_high
            )
        }

    def _calculate_risk_score(
        self,
        sast_critical: int,
        sast_high: int,
        sast_medium: int,
        sca_critical: int,
        sca_high: int
    ) -> int:
        """Calculate overall risk score (0-100)"""
        score = 100
        score -= sast_critical * 20
        score -= sast_high * 10
        score -= sast_medium * 3
        score -= sca_critical * 15
        score -= sca_high * 8
        return max(0, min(100, score))

    def _generate_executive_content(self, data: Dict) -> str:
        """Generate executive report content"""
        return json.dumps({
            "title": "Security Executive Report",
            "generated_at": datetime.utcnow().isoformat(),
            **data
        }, indent=2)

    async def generate_scan_report(
        self,
        scan_id: UUID,
        scan_type: str,  # sast or sca
        format: ReportFormat = ReportFormat.JSON
    ) -> Dict[str, Any]:
        """Generate detailed scan report"""
        
        if scan_type == "sast":
            result = await self.db.execute(select(SASTScan).where(SASTScan.id == scan_id))
            scan = result.scalar_one_or_none()
            if not scan:
                raise ValueError("Scan not found")
            
            # Get findings
            findings_result = await self.db.execute(
                select(SASTFinding).where(SASTFinding.scan_id == scan_id)
            )
            findings = findings_result.scalars().all()
            
            return {
                "scan": {
                    "id": str(scan.id),
                    "name": scan.name,
                    "status": scan.status,
                    "files_scanned": scan.files_scanned,
                    "engines": scan.engines
                },
                "summary": {
                    "critical": scan.critical_count,
                    "high": scan.high_count,
                    "medium": scan.medium_count,
                    "low": scan.low_count
                },
                "findings": [
                    {
                        "rule_id": f.rule_id,
                        "title": f.title,
                        "severity": f.severity.value if f.severity else None,
                        "file": f.file_path,
                        "line": f.start_line
                    }
                    for f in findings[:100]  # Limit for performance
                ]
            }
        
        else:  # sca
            result = await self.db.execute(select(SCAScan).where(SCAScan.id == scan_id))
            scan = result.scalar_one_or_none()
            if not scan:
                raise ValueError("Scan not found")
            
            findings_result = await self.db.execute(
                select(SCAFinding).where(SCAFinding.scan_id == scan_id)
            )
            findings = findings_result.scalars().all()
            
            return {
                "scan": {
                    "id": str(scan.id),
                    "name": scan.name,
                    "status": scan.status,
                    "dependencies": scan.total_dependencies
                },
                "summary": {
                    "vulnerable": scan.vulnerable_dependencies,
                    "license_issues": scan.license_issues
                },
                "findings": [
                    {
                        "package": f.package_name,
                        "version": f.package_version,
                        "cve": f.cve_id,
                        "severity": f.severity.value if f.severity else None,
                        "fixed_version": f.fixed_version
                    }
                    for f in findings[:100]
                ]
            }

    async def get_report(self, report_id: UUID) -> Optional[SecurityReport]:
        result = await self.db.execute(select(SecurityReport).where(SecurityReport.id == report_id))
        return result.scalar_one_or_none()

    async def list_reports(self, project_id: UUID, limit: int = 50) -> List[SecurityReport]:
        result = await self.db.execute(
            select(SecurityReport)
            .where(SecurityReport.project_id == project_id)
            .order_by(SecurityReport.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
