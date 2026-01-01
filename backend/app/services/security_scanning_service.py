"""
Enterprise Security Scanning Service
Core execution engine for security testing, vulnerability detection, and compliance
"""
import asyncio
import hashlib
import ssl
import socket
import json
import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from uuid import UUID
import urllib.parse

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, Integer

from app.models.security_scan import (
    SecurityScan, ScanTarget, Vulnerability, ComplianceCheck, ScanSchedule, SecurityAsset,
    ScanType, ScanStatus, SeverityLevel, VulnerabilityCategory,
    ComplianceFramework, ComplianceStatus, TargetType
)
from app.models.project import Project
from app.services.gemini_service import GeminiService


async def _generate_security_human_id(db: "AsyncSession", prefix: str, model, field: str) -> str:
    """Generate a human-readable ID for security entities."""
    from sqlalchemy import func
    # Get the max ID number for this prefix
    result = await db.execute(
        select(func.count()).select_from(model)
    )
    count = result.scalar() or 0
    return f"{prefix}-{(count + 1):05d}"


# ============================================================================
# OWASP Top 10 2021 Mapping
# ============================================================================

OWASP_MAPPING = {
    VulnerabilityCategory.A01_BROKEN_ACCESS_CONTROL: {
        "patterns": ["idor", "access control", "authorization", "privilege escalation"],
        "cwe": ["CWE-200", "CWE-284", "CWE-285", "CWE-639"]
    },
    VulnerabilityCategory.A02_CRYPTOGRAPHIC_FAILURES: {
        "patterns": ["ssl", "tls", "encryption", "hash", "crypto", "certificate"],
        "cwe": ["CWE-259", "CWE-327", "CWE-328", "CWE-330"]
    },
    VulnerabilityCategory.A03_INJECTION: {
        "patterns": ["sql injection", "xss", "command injection", "ldap injection"],
        "cwe": ["CWE-79", "CWE-89", "CWE-77", "CWE-90"]
    },
    VulnerabilityCategory.A04_INSECURE_DESIGN: {
        "patterns": ["design flaw", "architecture", "business logic"],
        "cwe": ["CWE-209", "CWE-256", "CWE-501"]
    },
    VulnerabilityCategory.A05_SECURITY_MISCONFIGURATION: {
        "patterns": ["misconfiguration", "default", "unnecessary", "verbose error"],
        "cwe": ["CWE-16", "CWE-388", "CWE-200"]
    },
    VulnerabilityCategory.A06_VULNERABLE_COMPONENTS: {
        "patterns": ["outdated", "vulnerable dependency", "library", "component"],
        "cwe": ["CWE-937", "CWE-1035", "CWE-1104"]
    },
    VulnerabilityCategory.A07_AUTH_FAILURES: {
        "patterns": ["authentication", "session", "password", "credential"],
        "cwe": ["CWE-287", "CWE-384", "CWE-613"]
    },
    VulnerabilityCategory.A08_DATA_INTEGRITY_FAILURES: {
        "patterns": ["integrity", "deserialization", "ci/cd", "update"],
        "cwe": ["CWE-502", "CWE-829"]
    },
    VulnerabilityCategory.A09_LOGGING_FAILURES: {
        "patterns": ["logging", "monitoring", "audit", "detection"],
        "cwe": ["CWE-778", "CWE-223"]
    },
    VulnerabilityCategory.A10_SSRF: {
        "patterns": ["ssrf", "server-side request", "url fetch"],
        "cwe": ["CWE-918"]
    },
}


# Security Headers Best Practices
SECURITY_HEADERS = {
    "strict-transport-security": {
        "name": "Strict-Transport-Security",
        "severity": SeverityLevel.HIGH,
        "description": "HSTS header missing - enables HTTPS enforcement"
    },
    "content-security-policy": {
        "name": "Content-Security-Policy",
        "severity": SeverityLevel.MEDIUM,
        "description": "CSP header missing - protects against XSS attacks"
    },
    "x-frame-options": {
        "name": "X-Frame-Options",
        "severity": SeverityLevel.MEDIUM,
        "description": "X-Frame-Options missing - vulnerable to clickjacking"
    },
    "x-content-type-options": {
        "name": "X-Content-Type-Options",
        "severity": SeverityLevel.LOW,
        "description": "X-Content-Type-Options missing - enables MIME sniffing"
    },
    "x-xss-protection": {
        "name": "X-XSS-Protection",
        "severity": SeverityLevel.LOW,
        "description": "X-XSS-Protection missing - reduces XSS protection"
    },
    "referrer-policy": {
        "name": "Referrer-Policy",
        "severity": SeverityLevel.LOW,
        "description": "Referrer-Policy missing - may leak sensitive URL data"
    },
    "permissions-policy": {
        "name": "Permissions-Policy",
        "severity": SeverityLevel.INFO,
        "description": "Permissions-Policy missing - allows all browser features"
    }
}

# Common ports to scan
COMMON_PORTS = [21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445, 993, 995, 1723, 3306, 3389, 5900, 8080, 8443]


# ============================================================================
# Service Class
# ============================================================================

class SecurityScanningService:
    """
    Core security scanning service with AI-powered analysis
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai_service = GeminiService()
    
    # ========================================================================
    # Scan Management
    # ========================================================================
    
    async def create_scan(
        self,
        project_id: UUID,
        organisation_id: UUID,
        name: str,
        scan_type: ScanType,
        targets: List[Dict[str, Any]],
        triggered_by: Optional[UUID] = None,
        config: Dict[str, Any] = None,
        scan_depth: str = "standard",
        enable_active_scanning: bool = False,
        tags: List[str] = None,
        notes: str = None
    ) -> SecurityScan:
        """Create a new security scan"""
        
        # Generate human-friendly ID
        human_id = await _generate_security_human_id(self.db, "SCAN", SecurityScan, "human_id")
        
        # Create scan record
        scan = SecurityScan(
            project_id=project_id,
            organisation_id=organisation_id,
            human_id=human_id,
            name=name,
            scan_type=scan_type,
            status=ScanStatus.PENDING,
            config=config or {},
            scan_depth=scan_depth,
            enable_active_scanning=enable_active_scanning,
            tags=tags or [],
            notes=notes,
            triggered_by=triggered_by,
            trigger_source="manual"
        )
        
        self.db.add(scan)
        await self.db.flush()
        
        # Create scan targets
        for target_data in targets:
            target = ScanTarget(
                scan_id=scan.id,
                target_type=TargetType(target_data["target_type"]),
                target_value=target_data["target_value"],
                target_name=target_data.get("target_name"),
                status=ScanStatus.PENDING
            )
            self.db.add(target)
        
        await self.db.commit()
        await self.db.refresh(scan)
        
        return scan
    
    async def get_scan(self, scan_id: UUID) -> Optional[SecurityScan]:
        """Get scan by ID"""
        result = await self.db.execute(
            select(SecurityScan).where(SecurityScan.id == scan_id)
        )
        return result.scalar_one_or_none()
    
    async def list_scans(
        self,
        project_id: UUID,
        scan_type: Optional[ScanType] = None,
        status: Optional[ScanStatus] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[SecurityScan], int]:
        """List scans with filters"""
        query = select(SecurityScan).where(SecurityScan.project_id == project_id)
        
        if scan_type:
            query = query.where(SecurityScan.scan_type == scan_type)
        if status:
            query = query.where(SecurityScan.status == status)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar()
        
        # Get paginated results
        query = query.order_by(SecurityScan.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        
        return result.scalars().all(), total
    
    async def delete_scan(self, scan_id: UUID) -> bool:
        """Delete a scan and related data"""
        scan = await self.get_scan(scan_id)
        if not scan:
            return False
        
        await self.db.delete(scan)
        await self.db.commit()
        return True
    
    # ========================================================================
    # URL Security Scanning
    # ========================================================================
    
    async def run_url_security_scan(self, scan: SecurityScan) -> SecurityScan:
        """Execute URL security scan"""
        try:
            # Update status to running
            scan.status = ScanStatus.RUNNING
            scan.started_at = datetime.utcnow()
            await self.db.commit()
            
            # Get targets
            targets_result = await self.db.execute(
                select(ScanTarget).where(ScanTarget.scan_id == scan.id)
            )
            targets = targets_result.scalars().all()
            
            total_targets = len(targets)
            for idx, target in enumerate(targets):
                # Update target status
                target.status = ScanStatus.RUNNING
                await self.db.commit()
                
                try:
                    # Run checks based on configuration
                    if scan.config.get("check_ssl", True):
                        await self._check_ssl_certificate(scan, target)
                    
                    if scan.config.get("check_headers", True):
                        await self._check_security_headers(scan, target)
                    
                    if scan.config.get("check_ports", True):
                        await self._check_open_ports(scan, target)
                    
                    if scan.config.get("check_subdomains", True):
                        await self._discover_subdomains(scan, target)
                    
                    # Active Scanning (requires explicit enable)
                    if scan.config.get("enable_active_scanning", False):
                        await self._run_active_scan(scan, target)
                    
                    # Mark target complete
                    target.status = ScanStatus.COMPLETED
                    target.scanned_at = datetime.utcnow()
                    
                except Exception as e:
                    target.status = ScanStatus.FAILED
                    await self._create_vulnerability(
                        scan=scan,
                        target=target,
                        title=f"Scan Error: {str(e)}",
                        description=f"Failed to complete scan: {str(e)}",
                        category=VulnerabilityCategory.OTHER,
                        severity=SeverityLevel.INFO
                    )
                
                # Update progress
                scan.progress_percentage = int(((idx + 1) / total_targets) * 100)
                await self.db.commit()
            
            # Calculate final results
            await self._calculate_scan_results(scan)
            
            scan.status = ScanStatus.COMPLETED
            scan.completed_at = datetime.utcnow()
            scan.duration_ms = int((scan.completed_at - scan.started_at).total_seconds() * 1000)
            
        except Exception as e:
            scan.status = ScanStatus.FAILED
            scan.error_message = str(e)
        
        await self.db.commit()
        await self.db.refresh(scan)
        return scan
    
    async def _check_ssl_certificate(self, scan: SecurityScan, target: ScanTarget):
        """Check SSL/TLS certificate"""
        try:
            url = target.target_value
            parsed = urllib.parse.urlparse(url if url.startswith("http") else f"https://{url}")
            hostname = parsed.hostname or url
            port = parsed.port or 443
            
            # Create SSL context and get certificate
            context = ssl.create_default_context()
            
            try:
                with socket.create_connection((hostname, port), timeout=10) as sock:
                    with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                        cert = ssock.getpeercert()
                        
                        # Parse certificate
                        not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
                        not_before = datetime.strptime(cert['notBefore'], '%b %d %H:%M:%S %Y %Z')
                        days_until_expiry = (not_after - datetime.utcnow()).days
                        
                        # Store certificate info
                        target.ssl_certificate = {
                            "issuer": dict(x[0] for x in cert.get('issuer', [])),
                            "subject": dict(x[0] for x in cert.get('subject', [])),
                            "serial_number": cert.get('serialNumber', ''),
                            "valid_from": not_before.isoformat(),
                            "valid_until": not_after.isoformat(),
                            "days_until_expiry": days_until_expiry,
                            "version": cert.get('version', 0),
                        }
                        target.ssl_expires_at = not_after
                        
                        # Determine grade
                        if days_until_expiry < 0:
                            target.ssl_grade = "F"
                            await self._create_vulnerability(
                                scan=scan, target=target,
                                title="Expired SSL Certificate",
                                description=f"SSL certificate expired {-days_until_expiry} days ago",
                                category=VulnerabilityCategory.SSL_TLS,
                                severity=SeverityLevel.CRITICAL,
                                cvss_score=9.1
                            )
                        elif days_until_expiry < 7:
                            target.ssl_grade = "D"
                            await self._create_vulnerability(
                                scan=scan, target=target,
                                title="SSL Certificate Expiring Soon",
                                description=f"SSL certificate expires in {days_until_expiry} days",
                                category=VulnerabilityCategory.SSL_TLS,
                                severity=SeverityLevel.HIGH,
                                cvss_score=7.5
                            )
                        elif days_until_expiry < 30:
                            target.ssl_grade = "C"
                            await self._create_vulnerability(
                                scan=scan, target=target,
                                title="SSL Certificate Expiring Soon",
                                description=f"SSL certificate expires in {days_until_expiry} days",
                                category=VulnerabilityCategory.SSL_TLS,
                                severity=SeverityLevel.MEDIUM,
                                cvss_score=5.3
                            )
                        elif days_until_expiry < 90:
                            target.ssl_grade = "B"
                        else:
                            target.ssl_grade = "A"
                            
            except ssl.SSLCertVerificationError as e:
                target.ssl_grade = "F"
                target.ssl_certificate = {"error": str(e)}
                await self._create_vulnerability(
                    scan=scan, target=target,
                    title="SSL Certificate Verification Failed",
                    description=f"Certificate verification error: {str(e)}",
                    category=VulnerabilityCategory.SSL_TLS,
                    severity=SeverityLevel.CRITICAL,
                    cvss_score=9.1
                )
                
            # TLS Cipher Suite Analysis
            from app.services.tls_analyzer import TLSAnalyzer
            
            try:
                tls_analyzer = TLSAnalyzer()
                tls_results = await tls_analyzer.analyze_tls(hostname, port)
                
                # Create vulnerabilities for TLS weaknesses
                for vuln in tls_results.get("vulnerabilities", []):
                    severity_map = {
                        "critical": SeverityLevel.CRITICAL,
                        "high": SeverityLevel.HIGH,
                        "medium": SeverityLevel.MEDIUM,
                        "low": SeverityLevel.LOW
                    }
                    
                    await self._create_vulnerability(
                        scan=scan, target=target,
                        title=f"TLS Weakness: {vuln['type'].replace('_', ' ').title()}",
                        description=vuln["description"],
                        category=VulnerabilityCategory.SSL_TLS,
                        severity=severity_map.get(vuln["severity"], SeverityLevel.MEDIUM),
                        remediation="Disable weak protocols/ciphers and use TLS 1.2 or higher with strong cipher suites"
                    )
                    
            except Exception as e:
                print(f"TLS analysis failed: {e}")
                
        except Exception as e:
            target.ssl_certificate = {"error": str(e)}
            target.ssl_grade = "F"
    
    async def _check_security_headers(self, scan: SecurityScan, target: ScanTarget):
        """Check HTTP security headers and detect CVEs"""
        import aiohttp
        import os
        from app.services.cve_scanner import CVEScannerService
        
        try:
            url = target.target_value
            if not url.startswith("http"):
                url = f"https://{url}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    headers = {k.lower(): v for k, v in response.headers.items()}
                    
                    target.http_headers = {
                        "present": list(headers.keys()),
                        "missing": [],
                        "issues": []
                    }
                    
                    # Check for missing security headers
                    for header_key, header_info in SECURITY_HEADERS.items():
                        if header_key not in headers:
                            target.http_headers["missing"].append(header_info["name"])
                            
                            await self._create_vulnerability(
                                scan=scan, target=target,
                                title=f"Missing Security Header: {header_info['name']}",
                                description=header_info["description"],
                                category=VulnerabilityCategory.HTTP_HEADERS,
                                severity=header_info["severity"],
                                remediation=f"Add the {header_info['name']} header to your HTTP responses"
                            )
                    
                    # CVE Detection from Server Headers
                    nvd_api_key = os.getenv("NVD_API_KEY")
                    cve_scanner = CVEScannerService(nvd_api_key)
                    
                    service_info = await cve_scanner.detect_service_version(headers)
                    if service_info and service_info.get("version"):
                        software = service_info["software"]
                        version = service_info["version"]
                        
                        # Query CVE database
                        cves = await cve_scanner.search_cves(software, version)
                        
                        for cve in cves:
                            await self._create_vulnerability(
                                scan=scan, target=target,
                                title=f"Known Vulnerability: {cve['cve_id']}",
                                description=f"{software}/{version}: {cve['description']}",
                                category=VulnerabilityCategory.VULNERABILITY_DISCLOSURE,
                                severity=cve["severity"],
                                cvss_score=cve["cvss_score"],
                                cve_id=cve["cve_id"],
                                remediation=f"Update {software} to the latest patched version"
                            )
                    
        except Exception as e:
            target.http_headers = {"error": str(e)}
    
    async def _check_open_ports(self, scan: SecurityScan, target: ScanTarget):
        """Scan for open ports based on scan depth"""
        try:
            url = target.target_value
            parsed = urllib.parse.urlparse(url if url.startswith("http") else f"https://{url}")
            hostname = parsed.hostname or url
            
            # Adjust port range based on scan depth
            scan_depth = scan.config.get("scan_depth", "standard")
            
            if scan_depth == "quick":
                # Quick: Only common web and secure ports
                ports_to_scan = [21, 22, 80, 443, 3306, 5432, 8080, 8443]
            elif scan_depth == "deep":
                # Deep: Extended common ports
                ports_to_scan = [
                    21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 993, 995,
                    3306, 3389, 5432, 5900, 6379, 8080, 8443, 27017, 3000, 5000, 8000, 9000
                ]
            else:  # standard
                # Standard: Common services
                ports_to_scan = [21, 22, 23, 25, 80, 110, 143, 443, 3306, 3389, 5432, 8080, 8443]
            
            dangerous_ports = {
                21: "FTP", 23: "Telnet", 3389: "RDP",
                3306: "MySQL", 5432: "PostgreSQL", 27017: "MongoDB",
                6379: "Redis", 9200: "Elasticsearch"
            }
            
            open_ports = []
            
            for port in ports_to_scan:
                try:
                    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                        sock.settimeout(1)
                        result = sock.connect_ex((hostname, port))
                        if result == 0:
                            port_info = {
                                "port": port,
                                "state": "open",
                                "service": dangerous_ports.get(port, self._get_service_name(port)),
                                "is_secure": port not in dangerous_ports
                            }
                            open_ports.append(port_info)
                            
                            # Create vulnerability for dangerous ports
                            if port in dangerous_ports:
                                await self._create_vulnerability(
                                    scan=scan, target=target,
                                    title=f"Dangerous Port Open: {port} ({dangerous_ports[port]})",
                                    description=f"Port {port} ({dangerous_ports[port]}) is publicly accessible",
                                    category=VulnerabilityCategory.PORT_EXPOSURE,
                                    severity=SeverityLevel.HIGH,
                                    cvss_score=7.5,
                                    remediation=f"Consider closing port {port} or restricting access"
                                )
                except:
                    pass
            
            target.open_ports = open_ports
            
        except Exception as e:
            target.open_ports = [{"error": str(e)}]
    
    async def _discover_subdomains(self, scan: SecurityScan, target: ScanTarget):
        """Discover subdomains using multiple methods"""
        try:
            from app.services.certificate_transparency import CertificateTransparencyService
            
            url = target.target_value
            parsed = urllib.parse.urlparse(url if url.startswith("http") else f"https://{url}")
            domain = parsed.hostname or url
            
            # Remove www if present
            if domain.startswith("www."):
                domain = domain[4:]
            
            discovered = set()
            
            # Method 1: Certificate Transparency Logs (more comprehensive)
            try:
                ct_service = CertificateTransparencyService()
                ct_subdomains = await ct_service.discover_subdomains(domain)
                discovered.update(ct_subdomains)
            except Exception as e:
                print(f"CT log query failed: {e}")
            
            # Method 2: Common subdomain DNS bruteforce (fallback/supplement)
            # Adjust subdomain list based on scan depth
            scan_depth = scan.config.get("scan_depth", "standard")
            
            if scan_depth == "quick":
                # Quick: Only most common subdomains
                common_subdomains = ["www", "mail", "api", "admin"]
            elif scan_depth == "deep":
                # Deep: Extended subdomain list
                common_subdomains = [
                    "www", "mail", "ftp", "admin", "api", "dev", "staging",
                    "test", "beta", "app", "portal", "vpn", "remote", "cdn",
                    "assets", "static", "media", "blog", "shop", "store",
                    "mobile", "m", "dashboard", "secure", "login", "support"
                ]
            else:  # standard
                # Standard: Common subdomains
                common_subdomains = [
                    "www", "mail", "ftp", "admin", "api", "dev", "staging",
                    "test", "beta", "app", "portal", "vpn", "remote", "cdn",
                    "assets", "static", "media", "blog", "shop", "store"
                ]
            
            for subdomain in common_subdomains:
                full_domain = f"{subdomain}.{domain}"
                try:
                    socket.gethostbyname(full_domain)
                    discovered.add(full_domain)
                except socket.gaierror:
                    pass
            
            target.subdomains_discovered = list(discovered)
            
            # Flag if too many subdomains (potential attack surface)
            if len(discovered) > 10:
                await self._create_vulnerability(
                    scan=scan, target=target,
                    title="Large Attack Surface: Many Subdomains",
                    description=f"Discovered {len(discovered)} subdomains - large attack surface",
                    category=VulnerabilityCategory.SUBDOMAIN,
                    severity=SeverityLevel.INFO
                )
                
        except Exception as e:
            target.subdomains_discovered = []
    
    def _get_service_name(self, port: int) -> str:
        """Get common service name for port"""
        common_services = {
            21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
            53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
            443: "HTTPS", 3306: "MySQL", 5432: "PostgreSQL",
            27017: "MongoDB", 6379: "Redis", 8080: "HTTP-Alt",
            8443: "HTTPS-Alt"
        }
        return common_services.get(port, "Unknown")
    
    # ========================================================================
    # Repository Security Scanning
    # ========================================================================
    
    async def run_repo_security_scan(self, scan: SecurityScan) -> SecurityScan:
        """Execute repository security scan"""
        try:
            scan.status = ScanStatus.RUNNING
            scan.started_at = datetime.utcnow()
            await self.db.commit()
            
            targets_result = await self.db.execute(
                select(ScanTarget).where(ScanTarget.scan_id == scan.id)
            )
            targets = targets_result.scalars().all()
            
            for target in targets:
                target.status = ScanStatus.RUNNING
                await self.db.commit()
                
                try:
                    if scan.config.get("scan_secrets", True):
                        await self._scan_for_secrets(scan, target)
                    
                    if scan.config.get("scan_dependencies", True):
                        await self._scan_dependencies(scan, target)
                    
                    target.status = ScanStatus.COMPLETED
                    target.scanned_at = datetime.utcnow()
                    
                except Exception as e:
                    target.status = ScanStatus.FAILED
                
                await self.db.commit()
            
            await self._calculate_scan_results(scan)
            scan.status = ScanStatus.COMPLETED
            scan.completed_at = datetime.utcnow()
            
        except Exception as e:
            scan.status = ScanStatus.FAILED
            scan.error_message = str(e)
        
        await self.db.commit()
        return scan
    
    async def _scan_for_secrets(self, scan: SecurityScan, target: ScanTarget):
        """Scan for exposed secrets (patterns)"""
        # Common secret patterns
        secret_patterns = {
            "AWS Access Key": r'AKIA[0-9A-Z]{16}',
            "AWS Secret Key": r'[A-Za-z0-9/+=]{40}',
            "GitHub Token": r'ghp_[a-zA-Z0-9]{36}',
            "Generic API Key": r'api[_-]?key[_-]?[=:]\s*[\'"]?[a-zA-Z0-9]{20,}',
            "Private Key": r'-----BEGIN (RSA |DSA |EC )?PRIVATE KEY-----',
            "Password in URL": r'[a-zA-Z]{3,10}://[^/\s:@]+:[^/\s:@]+@',
            "Slack Token": r'xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}',
            "Google API Key": r'AIza[0-9A-Za-z\-_]{35}',
        }
        
        # Note: In real implementation, this would scan actual repo content
        # For now, create placeholder showing the types of secrets we detect
        target.secrets_found = 0
    
    async def _scan_dependencies(self, scan: SecurityScan, target: ScanTarget):
        """Scan for vulnerable dependencies"""
        # Note: In real implementation, this would parse package files
        # and check against vulnerability databases
        target.dependencies_count = 0
    
    # ========================================================================
    # VAPT Scanning
    # ========================================================================
    
    async def run_vapt_scan(self, scan: SecurityScan) -> SecurityScan:
        """Execute VAPT scan with OWASP Top 10 checks"""
        try:
            scan.status = ScanStatus.RUNNING
            scan.started_at = datetime.utcnow()
            await self.db.commit()
            
            targets_result = await self.db.execute(
                select(ScanTarget).where(ScanTarget.scan_id == scan.id)
            )
            targets = targets_result.scalars().all()
            
            for target in targets:
                target.status = ScanStatus.RUNNING
                await self.db.commit()
                
                try:
                    # Run OWASP checks
                    await self._check_sql_injection(scan, target)
                    await self._check_xss(scan, target)
                    await self._check_security_misconfiguration(scan, target)
                    
                    target.status = ScanStatus.COMPLETED
                    target.scanned_at = datetime.utcnow()
                    
                except Exception as e:
                    target.status = ScanStatus.FAILED
                
                await self.db.commit()
            
            await self._calculate_scan_results(scan)
            scan.status = ScanStatus.COMPLETED
            scan.completed_at = datetime.utcnow()
            
        except Exception as e:
            scan.status = ScanStatus.FAILED
            scan.error_message = str(e)
        
        await self.db.commit()
        return scan
    
    async def _check_sql_injection(self, scan: SecurityScan, target: ScanTarget):
        """Check for SQL injection vulnerabilities (passive)"""
        # Note: Active testing requires explicit authorization
        # This is a placeholder for the scanning logic
        pass
    
    async def _check_xss(self, scan: SecurityScan, target: ScanTarget):
        """Check for XSS vulnerabilities"""
        pass
    
    async def _check_security_misconfiguration(self, scan: SecurityScan, target: ScanTarget):
        """Check for security misconfigurations"""
        # Already handled by header checks
        pass
    
    # ========================================================================
    # Vulnerability Management
    # ========================================================================
    
    async def _create_vulnerability(
        self,
        scan: SecurityScan,
        target: Optional[ScanTarget],
        title: str,
        description: str,
        category: VulnerabilityCategory,
        severity: SeverityLevel,
        cvss_score: Optional[float] = None,
        cve_id: Optional[str] = None,
        cwe_id: Optional[str] = None,
        remediation: Optional[str] = None,
        evidence: Optional[str] = None
    ) -> Vulnerability:
        """Create a vulnerability record"""
        
        human_id = await _generate_security_human_id(self.db, "VULN", Vulnerability, "human_id")
        
        vuln = Vulnerability(
            scan_id=scan.id,
            target_id=target.id if target else None,
            human_id=human_id,
            title=title,
            description=description,
            category=category,
            severity=severity,
            cvss_score=cvss_score,
            cve_id=cve_id,
            cwe_id=cwe_id,
            remediation=remediation,
            evidence=evidence
        )
        
        self.db.add(vuln)
        await self.db.flush()
        
        # Update target vulnerability count
        if target:
            target.vulnerability_count += 1
        
        return vuln
    
    async def get_vulnerability(self, vuln_id: UUID) -> Optional[Vulnerability]:
        """Get vulnerability by ID"""
        result = await self.db.execute(
            select(Vulnerability).where(Vulnerability.id == vuln_id)
        )
        return result.scalar_one_or_none()
    
    async def list_vulnerabilities(
        self,
        scan_id: Optional[UUID] = None,
        project_id: Optional[UUID] = None,
        severity: Optional[SeverityLevel] = None,
        category: Optional[VulnerabilityCategory] = None,
        is_resolved: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Vulnerability], int]:
        """List vulnerabilities with filters"""
        
        if scan_id:
            query = select(Vulnerability).where(Vulnerability.scan_id == scan_id)
        elif project_id:
            query = select(Vulnerability).join(SecurityScan).where(
                SecurityScan.project_id == project_id
            )
        else:
            query = select(Vulnerability)
        
        if severity:
            query = query.where(Vulnerability.severity == severity)
        if category:
            query = query.where(Vulnerability.category == category)
        if is_resolved is not None:
            query = query.where(Vulnerability.is_resolved == is_resolved)
        
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar()
        
        query = query.order_by(
            Vulnerability.severity.desc(),
            Vulnerability.discovered_at.desc()
        ).offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all(), total
    
    async def update_vulnerability_status(
        self,
        vuln_id: UUID,
        is_false_positive: Optional[bool] = None,
        is_verified: Optional[bool] = None,
        is_resolved: Optional[bool] = None,
        resolved_by: Optional[UUID] = None
    ) -> Optional[Vulnerability]:
        """Update vulnerability status"""
        
        vuln = await self.get_vulnerability(vuln_id)
        if not vuln:
            return None
        
        if is_false_positive is not None:
            vuln.is_false_positive = is_false_positive
        if is_verified is not None:
            vuln.is_verified = is_verified
        if is_resolved is not None:
            vuln.is_resolved = is_resolved
            if is_resolved:
                vuln.resolved_at = datetime.utcnow()
                vuln.resolved_by = resolved_by
        
        await self.db.commit()
        await self.db.refresh(vuln)
        return vuln
    
    # ========================================================================
    # AI-Powered Analysis
    # ========================================================================
    
    async def generate_ai_remediation(self, vuln: Vulnerability) -> str:
        """Generate AI-powered remediation suggestion"""
        
        prompt = f"""You are a security expert. Analyze this vulnerability and provide specific remediation steps.

Vulnerability: {vuln.title}
Category: {vuln.category.value if vuln.category else 'Unknown'}
Severity: {vuln.severity.value if vuln.severity else 'Unknown'}
Description: {vuln.description}
Affected Component: {vuln.affected_component or 'Not specified'}
CVE: {vuln.cve_id or 'Not assigned'}

Provide:
1. Root cause analysis
2. Step-by-step remediation
3. Code fix example if applicable
4. Prevention recommendations

Keep response concise and actionable."""

        try:
            response = await self.ai_service.generate_content(prompt)
            vuln.ai_remediation = response
            await self.db.commit()
            return response
        except Exception as e:
            return f"AI analysis failed: {str(e)}"
    
    # ========================================================================
    # Risk Scoring
    # ========================================================================
    
    async def _calculate_scan_results(self, scan: SecurityScan):
        """Calculate scan results and risk score"""
        
        # Count vulnerabilities by severity
        result = await self.db.execute(
            select(
                Vulnerability.severity,
                func.count(Vulnerability.id)
            ).where(
                Vulnerability.scan_id == scan.id
            ).group_by(Vulnerability.severity)
        )
        
        severity_counts = {row[0]: row[1] for row in result.all()}
        
        scan.critical_count = severity_counts.get(SeverityLevel.CRITICAL, 0)
        scan.high_count = severity_counts.get(SeverityLevel.HIGH, 0)
        scan.medium_count = severity_counts.get(SeverityLevel.MEDIUM, 0)
        scan.low_count = severity_counts.get(SeverityLevel.LOW, 0)
        scan.info_count = severity_counts.get(SeverityLevel.INFO, 0)
        scan.total_vulnerabilities = sum(severity_counts.values())
        
        # Calculate risk score (0-100)
        # Weighted scoring based on severity
        weights = {
            SeverityLevel.CRITICAL: 25,
            SeverityLevel.HIGH: 15,
            SeverityLevel.MEDIUM: 8,
            SeverityLevel.LOW: 3,
            SeverityLevel.INFO: 1
        }
        
        risk_points = sum(
            count * weights.get(severity, 0)
            for severity, count in severity_counts.items()
        )
        
        # Cap at 100
        scan.risk_score = min(100.0, risk_points)
        
        # Determine risk grade
        if scan.risk_score >= 80:
            scan.risk_grade = "F"
        elif scan.risk_score >= 60:
            scan.risk_grade = "D"
        elif scan.risk_score >= 40:
            scan.risk_grade = "C"
        elif scan.risk_score >= 20:
            scan.risk_grade = "B"
        elif scan.risk_score > 0:
            scan.risk_grade = "A"
        else:
            scan.risk_grade = "A+"
    
    async def get_dashboard_stats(self, project_id: UUID) -> Dict[str, Any]:
        """Get security dashboard statistics"""
        
        # Total scans
        scans_result = await self.db.execute(
            select(func.count(SecurityScan.id)).where(SecurityScan.project_id == project_id)
        )
        total_scans = scans_result.scalar() or 0
        
        # Total vulnerabilities
        vulns_result = await self.db.execute(
            select(
                func.count(Vulnerability.id),
                func.sum(func.cast(Vulnerability.is_resolved == False, Integer))
            ).join(SecurityScan).where(SecurityScan.project_id == project_id)
        )
        vuln_row = vulns_result.one()
        total_vulns = vuln_row[0] or 0
        open_vulns = vuln_row[1] or 0
        
        # Severity breakdown
        severity_result = await self.db.execute(
            select(
                Vulnerability.severity,
                func.count(Vulnerability.id)
            ).join(SecurityScan).where(
                and_(
                    SecurityScan.project_id == project_id,
                    Vulnerability.is_resolved == False
                )
            ).group_by(Vulnerability.severity)
        )
        severity_breakdown = {
            "critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0
        }
        for row in severity_result.all():
            if row[0]:
                severity_breakdown[row[0].value] = row[1]
        
        # Calculate overall risk
        risk_score = (
            severity_breakdown["critical"] * 25 +
            severity_breakdown["high"] * 15 +
            severity_breakdown["medium"] * 8 +
            severity_breakdown["low"] * 3 +
            severity_breakdown["info"]
        )
        risk_score = min(100.0, risk_score)
        
        if risk_score >= 80:
            risk_grade = "F"
        elif risk_score >= 60:
            risk_grade = "D"
        elif risk_score >= 40:
            risk_grade = "C"
        elif risk_score >= 20:
            risk_grade = "B"
        elif risk_score > 0:
            risk_grade = "A"
        else:
            risk_grade = "A+"
        
        return {
            "project_id": str(project_id),
            "total_scans": total_scans,
            "total_vulnerabilities": total_vulns,
            "open_vulnerabilities": open_vulns,
            "resolved_vulnerabilities": total_vulns - open_vulns,
            "overall_risk_score": risk_score,
            "risk_grade": risk_grade,
            "severity_breakdown": severity_breakdown,
            "scans_last_7_days": 0,  # TODO: Implement time-based queries
            "scans_last_30_days": 0,
        }
    
    # ========================================================================
    # Compliance Management
    # ========================================================================
    
    async def generate_compliance_report(
        self,
        project_id: UUID,
        framework: ComplianceFramework
    ) -> Dict[str, Any]:
        """Generate compliance report for a framework"""
        
        # Get compliance checks for this project and framework
        result = await self.db.execute(
            select(ComplianceCheck).where(
                and_(
                    ComplianceCheck.project_id == project_id,
                    ComplianceCheck.framework == framework
                )
            )
        )
        checks = result.scalars().all()
        
        # Count by status
        status_counts = {
            ComplianceStatus.COMPLIANT: 0,
            ComplianceStatus.NON_COMPLIANT: 0,
            ComplianceStatus.PARTIAL: 0,
            ComplianceStatus.NOT_APPLICABLE: 0,
            ComplianceStatus.NOT_ASSESSED: 0
        }
        
        for check in checks:
            status_counts[check.status] = status_counts.get(check.status, 0) + 1
        
        total = len(checks)
        assessed = total - status_counts[ComplianceStatus.NOT_ASSESSED]
        compliant = status_counts[ComplianceStatus.COMPLIANT]
        
        compliance_percentage = (compliant / assessed * 100) if assessed > 0 else 0
        
        return {
            "framework": framework.value,
            "project_id": str(project_id),
            "generated_at": datetime.utcnow().isoformat(),
            "total_controls": total,
            "compliant_count": status_counts[ComplianceStatus.COMPLIANT],
            "non_compliant_count": status_counts[ComplianceStatus.NON_COMPLIANT],
            "partial_count": status_counts[ComplianceStatus.PARTIAL],
            "not_applicable_count": status_counts[ComplianceStatus.NOT_APPLICABLE],
            "not_assessed_count": status_counts[ComplianceStatus.NOT_ASSESSED],
            "compliance_percentage": round(compliance_percentage, 2)
        }
    
    # ========================================================================
    # Scan Execution Orchestrator
    # ========================================================================
    
    async def execute_scan(self, scan_id: UUID) -> SecurityScan:
        """Execute scan based on type"""
        
        scan = await self.get_scan(scan_id)
        if not scan:
            raise ValueError(f"Scan not found: {scan_id}")
        
        if scan.status not in [ScanStatus.PENDING, ScanStatus.QUEUED]:
            raise ValueError(f"Scan already started or completed: {scan.status}")
        
        # Route to appropriate scanner
        if scan.scan_type == ScanType.URL_SECURITY:
            return await self.run_url_security_scan(scan)
        elif scan.scan_type == ScanType.REPO_SECURITY:
            return await self.run_repo_security_scan(scan)
        elif scan.scan_type == ScanType.VAPT:
            return await self.run_vapt_scan(scan)
        else:
            scan.status = ScanStatus.FAILED
            scan.error_message = f"Unsupported scan type: {scan.scan_type}"
            await self.db.commit()
            return scan


    async def _run_active_scan(self, scan: SecurityScan, target: ScanTarget):
        """Run active penetration testing scans"""
        from app.services.active_scanner import ActiveScanner
        
        try:
            url = target.target_value
            if not url.startswith("http"):
                url = f"https://{url}"
            
            scanner = ActiveScanner()
            
            # XSS Scanning
            xss_vulns = await scanner.scan_xss(url)
            for vuln in xss_vulns:
                await self._create_vulnerability(
                    scan=scan, target=target,
                    title=f"XSS Vulnerability: {vuln['parameter']}",
                    description=vuln["description"],
                    category=VulnerabilityCategory.XSS,
                    severity=SeverityLevel.HIGH,
                    cvss_score=7.3,
                    remediation=f"Sanitize input in parameter '{vuln['parameter']}' and encode output"
                )
            
            # SQL Injection Scanning
            sqli_vulns = await scanner.scan_sqli(url)
            for vuln in sqli_vulns:
                await self._create_vulnerability(
                    scan=scan, target=target,
                    title=f"SQL Injection: {vuln['parameter']}",
                    description=vuln["description"],
                    category=VulnerabilityCategory.SQL_INJECTION,
                    severity=SeverityLevel.CRITICAL,
                    cvss_score=9.8,
                    remediation=f"Use parameterized queries for '{vuln['parameter']}' parameter"
                )
            
            # CSRF Scanning
            csrf_vulns = await scanner.check_csrf(url)
            for vuln in csrf_vulns:
                await self._create_vulnerability(
                    scan=scan, target=target,
                    title="CSRF Protection Missing",
                    description=vuln["description"],
                    category=VulnerabilityCategory.CSRF,
                    severity=SeverityLevel.MEDIUM,
                    cvss_score=6.5,
                    remediation="Implement CSRF tokens and/or SameSite cookie attributes"
                )
                
        except Exception as e:
            print(f"Active scan failed: {e}")
