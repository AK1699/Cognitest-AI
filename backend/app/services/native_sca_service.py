"""
Native SCA Service
Built-in Software Composition Analysis using pip-audit, npm audit, and OSV database
"""
import asyncio
import subprocess
import json
import os
import re
import aiohttp
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.security_advanced_models import (
    SCAScan, SCAFinding, SCAEngine, FindingSeverity, FindingStatus, LicenseRisk
)

logger = logging.getLogger(__name__)


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class SCAResult:
    """Result from an SCA scan"""
    success: bool
    findings: List[Dict[str, Any]] = field(default_factory=list)
    total_dependencies: int = 0
    vulnerable_dependencies: int = 0
    license_issues: int = 0
    error: Optional[str] = None
    engine: str = ""


@dataclass
class DependencyVuln:
    """Vulnerable dependency finding"""
    package_name: str
    package_version: str
    ecosystem: str
    manifest_file: Optional[str]
    cve_id: Optional[str]
    ghsa_id: Optional[str]
    severity: FindingSeverity
    cvss_score: Optional[float]
    cvss_vector: Optional[str]
    title: str
    description: Optional[str]
    fixed_version: Optional[str]
    is_direct: bool = True
    references: List[str] = field(default_factory=list)


@dataclass
class LicenseIssue:
    """License compliance issue"""
    package_name: str
    package_version: str
    ecosystem: str
    license_name: str
    license_risk: LicenseRisk
    reason: str


# ============================================================================
# License Risk Mapping
# ============================================================================

HIGH_RISK_LICENSES = {
    "GPL-3.0", "GPL-2.0", "GPL-3.0-only", "GPL-2.0-only",
    "AGPL-3.0", "AGPL-3.0-only", "AGPL-1.0",
    "SSPL-1.0", "SSPL", "CC-BY-NC", "CC-BY-NC-SA"
}

MEDIUM_RISK_LICENSES = {
    "LGPL-3.0", "LGPL-2.1", "LGPL-2.0", "LGPL-3.0-only", "LGPL-2.1-only",
    "MPL-2.0", "MPL-1.1", "EPL-2.0", "EPL-1.0", "CDDL-1.0", "CDDL-1.1"
}

LOW_RISK_LICENSES = {
    "MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC",
    "Unlicense", "WTFPL", "CC0-1.0", "0BSD", "Zlib", "BSL-1.0"
}


# ============================================================================
# Native SCA Service
# ============================================================================

class NativeSCAService:
    """
    Native SCA engine using pip-audit, npm audit, and OSV database.
    Scans dependencies for known vulnerabilities and license compliance.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.osv_api_url = "https://api.osv.dev/v1/query"
        self._pip_audit_available = None
        self._npm_available = None
        self._safety_available = None

    # ========================================================================
    # Availability Checks
    # ========================================================================

    def is_pip_audit_available(self) -> bool:
        """Check if pip-audit is installed"""
        if self._pip_audit_available is None:
            import shutil
            self._pip_audit_available = shutil.which("pip-audit") is not None
        return self._pip_audit_available

    def is_npm_available(self) -> bool:
        """Check if npm is installed"""
        if self._npm_available is None:
            import shutil
            self._npm_available = shutil.which("npm") is not None
        return self._npm_available

    def is_safety_available(self) -> bool:
        """Check if safety is installed"""
        if self._safety_available is None:
            import shutil
            self._safety_available = shutil.which("safety") is not None
        return self._safety_available

    def get_available_engines(self) -> List[str]:
        """Get list of available scanning engines"""
        engines = ["osv"]  # OSV API always available
        if self.is_pip_audit_available():
            engines.append("pip_audit")
        if self.is_npm_available():
            engines.append("npm_audit")
        if self.is_safety_available():
            engines.append("safety")
        return engines

    # ========================================================================
    # Main Scan Methods
    # ========================================================================

    async def create_scan(
        self,
        project_id: UUID,
        organisation_id: UUID,
        name: str,
        project_path: str,
        check_licenses: bool = True,
        check_vulnerabilities: bool = True,
        created_by: UUID = None
    ) -> SCAScan:
        """Create a new SCA scan record"""
        
        # Find manifest files
        manifest_files = await self._find_manifest_files(project_path)
        
        # Generate human ID
        human_id = await self._generate_human_id()
        
        scan = SCAScan(
            project_id=project_id,
            organisation_id=organisation_id,
            human_id=human_id,
            name=name,
            manifest_files=manifest_files,
            engines=self.get_available_engines(),
            check_licenses=check_licenses,
            check_vulnerabilities=check_vulnerabilities,
            status="pending",
            created_by=created_by
        )
        
        self.db.add(scan)
        await self.db.commit()
        await self.db.refresh(scan)
        
        return scan

    async def run_scan(self, scan_id: UUID) -> SCAScan:
        """Execute SCA scan on all manifest files"""
        
        # Get scan
        result = await self.db.execute(
            select(SCAScan).where(SCAScan.id == scan_id)
        )
        scan = result.scalar_one_or_none()
        
        if not scan:
            raise ValueError(f"Scan {scan_id} not found")
        
        # Update status
        scan.status = "running"
        scan.started_at = datetime.utcnow()
        await self.db.commit()
        
        all_findings: List[DependencyVuln] = []
        license_issues: List[LicenseIssue] = []
        total_deps = 0
        
        try:
            for manifest in scan.manifest_files:
                manifest_path = manifest.get("path", "")
                manifest_type = manifest.get("type", "")
                
                # Scan for vulnerabilities
                if scan.check_vulnerabilities:
                    if manifest_type == "requirements.txt" and self.is_pip_audit_available():
                        pip_result = await self.run_pip_audit(manifest_path)
                        all_findings.extend(pip_result.findings)
                        total_deps += pip_result.total_dependencies
                    
                    elif manifest_type == "package.json" and self.is_npm_available():
                        npm_result = await self.run_npm_audit(os.path.dirname(manifest_path))
                        all_findings.extend(npm_result.findings)
                        total_deps += npm_result.total_dependencies
                    
                    elif manifest_type in ["requirements.txt", "Pipfile", "pyproject.toml"]:
                        # Fall back to OSV API
                        osv_result = await self.run_osv_scan(manifest_path, "pypi")
                        all_findings.extend(osv_result.findings)
                    
                    elif manifest_type in ["package.json", "package-lock.json"]:
                        osv_result = await self.run_osv_scan(manifest_path, "npm")
                        all_findings.extend(osv_result.findings)
                
                # Check licenses
                if scan.check_licenses:
                    licenses = await self._scan_licenses(manifest_path, manifest_type)
                    license_issues.extend(licenses)
            
            # Save findings
            for finding in all_findings:
                await self._save_vuln_finding(scan, finding)
            
            for issue in license_issues:
                await self._save_license_finding(scan, issue)
            
            # Update scan stats
            scan.status = "completed"
            scan.completed_at = datetime.utcnow()
            scan.total_dependencies = total_deps
            scan.vulnerable_dependencies = len(set(f.package_name for f in all_findings))
            scan.license_issues = len(license_issues)
            
            # Count by severity
            severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
            for f in all_findings:
                sev = f.severity.value if isinstance(f.severity, FindingSeverity) else f.severity
                if sev in severity_counts:
                    severity_counts[sev] += 1
            
            scan.critical_vulns = severity_counts["critical"]
            scan.high_vulns = severity_counts["high"]
            scan.medium_vulns = severity_counts["medium"]
            scan.low_vulns = severity_counts["low"]
            
            if scan.started_at:
                scan.duration_ms = int((datetime.utcnow() - scan.started_at).total_seconds() * 1000)
            
            await self.db.commit()
            
        except Exception as e:
            logger.error(f"SCA scan failed: {e}")
            scan.status = "failed"
            scan.error_message = str(e)
            scan.completed_at = datetime.utcnow()
            await self.db.commit()
            raise
        
        return scan

    # ========================================================================
    # pip-audit Scanner (Python)
    # ========================================================================

    async def run_pip_audit(self, requirements_path: str) -> SCAResult:
        """Run pip-audit on Python requirements"""
        
        if not self.is_pip_audit_available():
            return SCAResult(
                success=False,
                error="pip-audit is not installed. Install with: pip install pip-audit",
                engine="pip_audit"
            )
        
        try:
            cmd = [
                "pip-audit",
                "-r", requirements_path,
                "--format", "json",
                "--progress-spinner=off"
            ]
            
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=300
                )
            )
            
            findings = []
            total_deps = 0
            
            if result.stdout:
                try:
                    output = json.loads(result.stdout)
                    
                    # Count dependencies
                    dependencies = output.get("dependencies", [])
                    total_deps = len(dependencies)
                    
                    # Extract vulnerabilities
                    for dep in dependencies:
                        for vuln in dep.get("vulns", []):
                            severity = self._map_cvss_severity(vuln.get("fix_versions", []))
                            
                            finding = DependencyVuln(
                                package_name=dep.get("name", ""),
                                package_version=dep.get("version", ""),
                                ecosystem="pypi",
                                manifest_file=requirements_path,
                                cve_id=vuln.get("aliases", [None])[0] if vuln.get("aliases") else None,
                                ghsa_id=vuln.get("id", ""),
                                severity=severity,
                                cvss_score=None,
                                cvss_vector=None,
                                title=vuln.get("id", "Vulnerability"),
                                description=vuln.get("description"),
                                fixed_version=vuln.get("fix_versions", [None])[0] if vuln.get("fix_versions") else None,
                                is_direct=True,
                                references=[vuln.get("link")] if vuln.get("link") else []
                            )
                            findings.append(finding)
                            
                except json.JSONDecodeError:
                    pass
            
            return SCAResult(
                success=True,
                findings=findings,
                total_dependencies=total_deps,
                vulnerable_dependencies=len(set(f.package_name for f in findings)),
                engine="pip_audit"
            )
            
        except subprocess.TimeoutExpired:
            return SCAResult(success=False, error="pip-audit timed out", engine="pip_audit")
        except Exception as e:
            logger.error(f"pip-audit failed: {e}")
            return SCAResult(success=False, error=str(e), engine="pip_audit")

    # ========================================================================
    # npm audit Scanner (Node.js)
    # ========================================================================

    async def run_npm_audit(self, package_dir: str) -> SCAResult:
        """Run npm audit on Node.js project"""
        
        if not self.is_npm_available():
            return SCAResult(
                success=False,
                error="npm is not installed",
                engine="npm_audit"
            )
        
        try:
            cmd = ["npm", "audit", "--json"]
            
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    cwd=package_dir,
                    timeout=300
                )
            )
            
            findings = []
            total_deps = 0
            
            # npm audit returns non-zero if vulnerabilities found
            if result.stdout:
                try:
                    output = json.loads(result.stdout)
                    
                    # Get metadata
                    metadata = output.get("metadata", {})
                    total_deps = metadata.get("totalDependencies", 0)
                    
                    # NPM v7+ format
                    vulnerabilities = output.get("vulnerabilities", {})
                    for pkg_name, vuln_data in vulnerabilities.items():
                        severity = self._map_npm_severity(vuln_data.get("severity", "moderate"))
                        
                        for via in vuln_data.get("via", []):
                            if isinstance(via, dict):
                                finding = DependencyVuln(
                                    package_name=pkg_name,
                                    package_version=vuln_data.get("range", ""),
                                    ecosystem="npm",
                                    manifest_file=os.path.join(package_dir, "package.json"),
                                    cve_id=via.get("cve"),
                                    ghsa_id=via.get("url", "").split("/")[-1] if via.get("url") else None,
                                    severity=severity,
                                    cvss_score=via.get("cvss", {}).get("score") if isinstance(via.get("cvss"), dict) else None,
                                    cvss_vector=via.get("cvss", {}).get("vector") if isinstance(via.get("cvss"), dict) else None,
                                    title=via.get("title", "Vulnerability"),
                                    description=via.get("title"),
                                    fixed_version=vuln_data.get("fixAvailable", {}).get("version") if isinstance(vuln_data.get("fixAvailable"), dict) else None,
                                    is_direct=vuln_data.get("isDirect", False),
                                    references=[via.get("url")] if via.get("url") else []
                                )
                                findings.append(finding)
                                
                except json.JSONDecodeError:
                    pass
            
            return SCAResult(
                success=True,
                findings=findings,
                total_dependencies=total_deps,
                vulnerable_dependencies=len(set(f.package_name for f in findings)),
                engine="npm_audit"
            )
            
        except subprocess.TimeoutExpired:
            return SCAResult(success=False, error="npm audit timed out", engine="npm_audit")
        except Exception as e:
            logger.error(f"npm audit failed: {e}")
            return SCAResult(success=False, error=str(e), engine="npm_audit")

    # ========================================================================
    # OSV API Scanner
    # ========================================================================

    async def run_osv_scan(self, manifest_path: str, ecosystem: str) -> SCAResult:
        """Query OSV database for vulnerabilities"""
        
        try:
            # Parse dependencies from manifest
            dependencies = await self._parse_manifest(manifest_path, ecosystem)
            
            findings = []
            
            async with aiohttp.ClientSession() as session:
                for dep in dependencies:
                    vulns = await self._query_osv(session, dep["name"], dep["version"], ecosystem)
                    findings.extend(vulns)
            
            return SCAResult(
                success=True,
                findings=findings,
                total_dependencies=len(dependencies),
                vulnerable_dependencies=len(set(f.package_name for f in findings)),
                engine="osv"
            )
            
        except Exception as e:
            logger.error(f"OSV scan failed: {e}")
            return SCAResult(success=False, error=str(e), engine="osv")

    async def _query_osv(
        self,
        session: aiohttp.ClientSession,
        package: str,
        version: str,
        ecosystem: str
    ) -> List[DependencyVuln]:
        """Query OSV API for a specific package"""
        
        findings = []
        
        try:
            payload = {
                "package": {
                    "name": package,
                    "ecosystem": ecosystem.capitalize()  # PyPI, npm, etc.
                },
                "version": version
            }
            
            async with session.post(self.osv_api_url, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    for vuln in data.get("vulns", []):
                        # Get severity from CVSS or severity field
                        severity = FindingSeverity.MEDIUM
                        cvss_score = None
                        
                        for severity_data in vuln.get("severity", []):
                            if severity_data.get("type") == "CVSS_V3":
                                cvss_score = severity_data.get("score")
                                severity = self._map_cvss_severity(cvss_score)
                                break
                        
                        # Get fixed version
                        fixed_version = None
                        for affected in vuln.get("affected", []):
                            for range_data in affected.get("ranges", []):
                                for event in range_data.get("events", []):
                                    if "fixed" in event:
                                        fixed_version = event["fixed"]
                                        break
                        
                        # Get CVE ID
                        cve_id = None
                        for alias in vuln.get("aliases", []):
                            if alias.startswith("CVE-"):
                                cve_id = alias
                                break
                        
                        finding = DependencyVuln(
                            package_name=package,
                            package_version=version,
                            ecosystem=ecosystem,
                            manifest_file=None,
                            cve_id=cve_id,
                            ghsa_id=vuln.get("id"),
                            severity=severity,
                            cvss_score=cvss_score,
                            cvss_vector=None,
                            title=vuln.get("summary", vuln.get("id", "Vulnerability")),
                            description=vuln.get("details"),
                            fixed_version=fixed_version,
                            is_direct=True,
                            references=[ref.get("url") for ref in vuln.get("references", []) if ref.get("url")]
                        )
                        findings.append(finding)
                        
        except Exception as e:
            logger.warning(f"OSV query failed for {package}@{version}: {e}")
        
        return findings

    # ========================================================================
    # License Scanning
    # ========================================================================

    async def _scan_licenses(self, manifest_path: str, manifest_type: str) -> List[LicenseIssue]:
        """Scan for license compliance issues"""
        
        issues = []
        
        try:
            if manifest_type == "package.json":
                issues = await self._scan_npm_licenses(manifest_path)
            elif manifest_type == "requirements.txt":
                issues = await self._scan_pip_licenses(manifest_path)
        except Exception as e:
            logger.warning(f"License scan failed: {e}")
        
        return issues

    async def _scan_npm_licenses(self, package_json_path: str) -> List[LicenseIssue]:
        """Scan npm package licenses"""
        
        issues = []
        package_dir = os.path.dirname(package_json_path)
        
        try:
            # Use npm ls to get all dependencies with licenses
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: subprocess.run(
                    ["npm", "ls", "--json", "--all"],
                    capture_output=True,
                    text=True,
                    cwd=package_dir,
                    timeout=120
                )
            )
            
            if result.stdout:
                data = json.loads(result.stdout)
                issues = self._extract_license_issues(data.get("dependencies", {}), "npm")
                
        except Exception as e:
            logger.warning(f"npm license scan failed: {e}")
        
        return issues

    async def _scan_pip_licenses(self, requirements_path: str) -> List[LicenseIssue]:
        """Scan Python package licenses using pip-licenses"""
        
        issues = []
        
        try:
            # Try pip-licenses if available
            import shutil
            if shutil.which("pip-licenses"):
                result = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: subprocess.run(
                        ["pip-licenses", "--format=json"],
                        capture_output=True,
                        text=True,
                        timeout=120
                    )
                )
                
                if result.stdout:
                    packages = json.loads(result.stdout)
                    
                    for pkg in packages:
                        license_name = pkg.get("License", "UNKNOWN")
                        risk = self._assess_license_risk(license_name)
                        
                        if risk in [LicenseRisk.HIGH, LicenseRisk.MEDIUM]:
                            issue = LicenseIssue(
                                package_name=pkg.get("Name", ""),
                                package_version=pkg.get("Version", ""),
                                ecosystem="pypi",
                                license_name=license_name,
                                license_risk=risk,
                                reason=f"License '{license_name}' has {risk.value} compliance risk"
                            )
                            issues.append(issue)
                            
        except Exception as e:
            logger.warning(f"pip license scan failed: {e}")
        
        return issues

    def _extract_license_issues(self, deps: dict, ecosystem: str) -> List[LicenseIssue]:
        """Extract license issues from dependency tree"""
        
        issues = []
        
        for name, data in deps.items():
            if isinstance(data, dict):
                license_name = data.get("license", "UNKNOWN")
                if isinstance(license_name, dict):
                    license_name = license_name.get("type", "UNKNOWN")
                
                risk = self._assess_license_risk(str(license_name))
                
                if risk in [LicenseRisk.HIGH, LicenseRisk.MEDIUM]:
                    issue = LicenseIssue(
                        package_name=name,
                        package_version=data.get("version", ""),
                        ecosystem=ecosystem,
                        license_name=str(license_name),
                        license_risk=risk,
                        reason=f"License '{license_name}' has {risk.value} compliance risk"
                    )
                    issues.append(issue)
                
                # Recurse into nested dependencies
                if "dependencies" in data:
                    issues.extend(self._extract_license_issues(data["dependencies"], ecosystem))
        
        return issues

    def _assess_license_risk(self, license_name: str) -> LicenseRisk:
        """Assess risk level of a license"""
        
        license_upper = license_name.upper()
        
        for high_risk in HIGH_RISK_LICENSES:
            if high_risk.upper() in license_upper:
                return LicenseRisk.HIGH
        
        for medium_risk in MEDIUM_RISK_LICENSES:
            if medium_risk.upper() in license_upper:
                return LicenseRisk.MEDIUM
        
        for low_risk in LOW_RISK_LICENSES:
            if low_risk.upper() in license_upper:
                return LicenseRisk.LOW
        
        return LicenseRisk.UNKNOWN

    # ========================================================================
    # Helper Methods
    # ========================================================================

    async def _find_manifest_files(self, project_path: str) -> List[Dict[str, str]]:
        """Find dependency manifest files in project"""
        
        manifests = []
        manifest_patterns = {
            "requirements.txt": "requirements.txt",
            "package.json": "package.json",
            "Pipfile": "Pipfile",
            "pyproject.toml": "pyproject.toml",
            "go.mod": "go.mod",
            "Gemfile": "Gemfile",
            "pom.xml": "pom.xml",
            "build.gradle": "build.gradle",
        }
        
        for root, dirs, files in os.walk(project_path):
            # Skip common non-project directories
            dirs[:] = [d for d in dirs if d not in ['node_modules', 'venv', '.venv', '.git', '__pycache__']]
            
            for filename in files:
                if filename in manifest_patterns:
                    manifests.append({
                        "path": os.path.join(root, filename),
                        "type": filename
                    })
        
        return manifests

    async def _parse_manifest(self, manifest_path: str, ecosystem: str) -> List[Dict[str, str]]:
        """Parse dependencies from manifest file"""
        
        dependencies = []
        
        try:
            with open(manifest_path, 'r') as f:
                content = f.read()
            
            if ecosystem == "pypi":
                # Parse requirements.txt
                for line in content.split('\n'):
                    line = line.strip()
                    if line and not line.startswith('#') and not line.startswith('-'):
                        # Handle various formats: pkg==1.0, pkg>=1.0, pkg
                        match = re.match(r'^([a-zA-Z0-9._-]+)([=<>!~]+)?(.+)?$', line)
                        if match:
                            name = match.group(1)
                            version = match.group(3) or ""
                            dependencies.append({"name": name, "version": version})
            
            elif ecosystem == "npm":
                # Parse package.json
                data = json.loads(content)
                for name, version in data.get("dependencies", {}).items():
                    # Remove version prefixes like ^, ~
                    clean_version = re.sub(r'^[\^~>=<]+', '', version)
                    dependencies.append({"name": name, "version": clean_version})
                for name, version in data.get("devDependencies", {}).items():
                    clean_version = re.sub(r'^[\^~>=<]+', '', version)
                    dependencies.append({"name": name, "version": clean_version})
                    
        except Exception as e:
            logger.warning(f"Failed to parse manifest {manifest_path}: {e}")
        
        return dependencies

    async def _generate_human_id(self) -> str:
        """Generate human-readable ID for SCA scan"""
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count()).select_from(SCAScan)
        )
        count = result.scalar() or 0
        return f"SCA-{count + 1:05d}"

    async def _save_vuln_finding(self, scan: SCAScan, finding: DependencyVuln) -> SCAFinding:
        """Save vulnerability finding to database"""
        
        db_finding = SCAFinding(
            scan_id=scan.id,
            package_name=finding.package_name,
            package_version=finding.package_version,
            package_ecosystem=finding.ecosystem,
            manifest_file=finding.manifest_file,
            is_vulnerability=True,
            cve_id=finding.cve_id,
            ghsa_id=finding.ghsa_id,
            severity=finding.severity,
            cvss_score=finding.cvss_score,
            cvss_vector=finding.cvss_vector,
            title=finding.title,
            description=finding.description,
            fixed_version=finding.fixed_version,
            is_direct=finding.is_direct,
            references=finding.references,
            status=FindingStatus.OPEN
        )
        
        self.db.add(db_finding)
        await self.db.commit()
        
        return db_finding

    async def _save_license_finding(self, scan: SCAScan, issue: LicenseIssue) -> SCAFinding:
        """Save license issue to database"""
        
        db_finding = SCAFinding(
            scan_id=scan.id,
            package_name=issue.package_name,
            package_version=issue.package_version,
            package_ecosystem=issue.ecosystem,
            is_vulnerability=False,
            is_license_issue=True,
            severity=FindingSeverity.MEDIUM if issue.license_risk == LicenseRisk.MEDIUM else FindingSeverity.HIGH,
            license_name=issue.license_name,
            license_risk=issue.license_risk,
            title=f"License Compliance: {issue.license_name}",
            description=issue.reason,
            status=FindingStatus.OPEN
        )
        
        self.db.add(db_finding)
        await self.db.commit()
        
        return db_finding

    def _map_cvss_severity(self, cvss_score) -> FindingSeverity:
        """Map CVSS score to severity level"""
        if cvss_score is None:
            return FindingSeverity.MEDIUM
        
        try:
            score = float(cvss_score)
            if score >= 9.0:
                return FindingSeverity.CRITICAL
            elif score >= 7.0:
                return FindingSeverity.HIGH
            elif score >= 4.0:
                return FindingSeverity.MEDIUM
            else:
                return FindingSeverity.LOW
        except (ValueError, TypeError):
            return FindingSeverity.MEDIUM

    def _map_npm_severity(self, severity: str) -> FindingSeverity:
        """Map npm audit severity to internal severity"""
        mapping = {
            "critical": FindingSeverity.CRITICAL,
            "high": FindingSeverity.HIGH,
            "moderate": FindingSeverity.MEDIUM,
            "low": FindingSeverity.LOW,
            "info": FindingSeverity.INFO,
        }
        return mapping.get(severity.lower(), FindingSeverity.MEDIUM)

    # ========================================================================
    # Query Methods
    # ========================================================================

    async def get_scan(self, scan_id: UUID) -> Optional[SCAScan]:
        """Get SCA scan by ID"""
        result = await self.db.execute(
            select(SCAScan).where(SCAScan.id == scan_id)
        )
        return result.scalar_one_or_none()

    async def get_findings(
        self,
        scan_id: UUID,
        severity: Optional[FindingSeverity] = None,
        include_licenses: bool = True,
        limit: int = 100,
        offset: int = 0
    ) -> List[SCAFinding]:
        """Get findings for a scan"""
        query = select(SCAFinding).where(SCAFinding.scan_id == scan_id)
        
        if severity:
            query = query.where(SCAFinding.severity == severity)
        if not include_licenses:
            query = query.where(SCAFinding.is_license_issue == False)
        
        query = query.offset(offset).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_vulnerable_packages(self, project_id: UUID) -> List[Dict[str, Any]]:
        """Get all vulnerable packages across all scans for a project"""
        
        query = """
            SELECT DISTINCT sf.package_name, sf.package_version, sf.package_ecosystem,
                   sf.cve_id, sf.severity, sf.fixed_version
            FROM sca_findings sf
            JOIN sca_scans ss ON sf.scan_id = ss.id
            WHERE ss.project_id = :project_id
            AND sf.is_vulnerability = true
            AND sf.status = 'open'
        """
        
        result = await self.db.execute(query, {"project_id": str(project_id)})
        return [dict(row) for row in result.fetchall()]
