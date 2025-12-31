"""
External Security Scanner Integration
Provides integration with external security tools like OWASP ZAP, Trivy, and TruffleHog
"""
import asyncio
import subprocess
import json
import shutil
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
import logging
import os

logger = logging.getLogger(__name__)


class ScannerType(str, Enum):
    """External scanner types"""
    OWASP_ZAP = "owasp_zap"
    TRIVY = "trivy"
    TRUFFLEHOG = "trufflehog"
    NMAP = "nmap"
    SSL_LABS = "ssl_labs"
    SECURITY_HEADERS = "security_headers"
    GOOGLE_SAFE_BROWSING = "google_safe_browsing"
    SUBDOMAIN_TAKEOVER = "subdomain_takeover"
    BUSINESS_LOGIC_FUZZER = "business_logic_fuzzer"


@dataclass
class ScanResult:
    """Standardized scan result from external scanners"""
    scanner: ScannerType
    success: bool
    vulnerabilities: List[Dict[str, Any]]
    raw_output: Optional[str] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ScannerInterface(ABC):
    """Abstract base class for external security scanners"""
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if the scanner is installed and available"""
        pass
    
    @abstractmethod
    async def scan(self, target: str, config: Dict[str, Any] = None) -> ScanResult:
        """Execute a scan against the target"""
        pass


# ============================================================================
# OWASP ZAP Scanner
# ============================================================================

class OWASPZAPScanner(ScannerInterface):
    """
    OWASP ZAP (Zed Attack Proxy) integration for web vulnerability scanning
    Requires ZAP to be running in daemon mode with API enabled
    """
    
    def __init__(self, api_url: str = "http://localhost:8080", api_key: str = None):
        self.api_url = api_url
        self.api_key = api_key
    
    def is_available(self) -> bool:
        """Check if ZAP API is accessible"""
        try:
            import httpx
            response = httpx.get(f"{self.api_url}/JSON/core/view/version/", timeout=5)
            return response.status_code == 200
        except Exception:
            return False
    
    async def scan(self, target: str, config: Dict[str, Any] = None) -> ScanResult:
        """Execute ZAP scan against target URL"""
        if not self.is_available():
            return ScanResult(
                scanner=ScannerType.OWASP_ZAP,
                success=False,
                vulnerabilities=[],
                error="OWASP ZAP is not available. Ensure ZAP is running with the API enabled."
            )
        
        try:
            import httpx
            config = config or {}
            scan_type = config.get("scan_type", "passive")  # passive or active
            
            async with httpx.AsyncClient() as client:
                # Add target to ZAP context
                params = {"url": target}
                if self.api_key:
                    params["apikey"] = self.api_key
                
                # Spider the target
                await client.get(f"{self.api_url}/JSON/spider/action/scan/", params=params)
                
                # Wait for spider to complete
                while True:
                    status = await client.get(f"{self.api_url}/JSON/spider/view/status/", params=params)
                    if status.json().get("status", "100") == "100":
                        break
                    await asyncio.sleep(2)
                
                # Run passive scan or active scan based on config
                if scan_type == "active":
                    await client.get(f"{self.api_url}/JSON/ascan/action/scan/", params=params)
                    
                    while True:
                        status = await client.get(f"{self.api_url}/JSON/ascan/view/status/", params=params)
                        if status.json().get("status", "100") == "100":
                            break
                        await asyncio.sleep(2)
                
                # Get alerts
                alerts_response = await client.get(
                    f"{self.api_url}/JSON/alert/view/alerts/",
                    params={"baseurl": target, **({"apikey": self.api_key} if self.api_key else {})}
                )
                
                alerts = alerts_response.json().get("alerts", [])
                
                vulnerabilities = []
                for alert in alerts:
                    vulnerabilities.append({
                        "title": alert.get("alert", "Unknown"),
                        "description": alert.get("description", ""),
                        "severity": self._map_risk(alert.get("risk", "Informational")),
                        "confidence": alert.get("confidence", ""),
                        "url": alert.get("url", target),
                        "solution": alert.get("solution", ""),
                        "reference": alert.get("reference", ""),
                        "cwe_id": alert.get("cweid", ""),
                        "evidence": alert.get("evidence", ""),
                        "source": "owasp_zap"
                    })
                
                return ScanResult(
                    scanner=ScannerType.OWASP_ZAP,
                    success=True,
                    vulnerabilities=vulnerabilities,
                    metadata={"alerts_count": len(alerts)}
                )
                
        except Exception as e:
            logger.error(f"OWASP ZAP scan failed: {e}")
            return ScanResult(
                scanner=ScannerType.OWASP_ZAP,
                success=False,
                vulnerabilities=[],
                error=str(e)
            )
    
    def _map_risk(self, risk: str) -> str:
        """Map ZAP risk levels to standard severity"""
        mapping = {
            "High": "high",
            "Medium": "medium",
            "Low": "low",
            "Informational": "info"
        }
        return mapping.get(risk, "info")


# ============================================================================
# Trivy Scanner
# ============================================================================

class TrivyScanner(ScannerInterface):
    """
    Trivy integration for container and filesystem vulnerability scanning
    Requires Trivy to be installed: brew install trivy
    """
    
    def __init__(self, trivy_path: str = None):
        self.trivy_path = trivy_path or shutil.which("trivy")
    
    def is_available(self) -> bool:
        """Check if Trivy is installed"""
        return self.trivy_path is not None and shutil.which(self.trivy_path or "trivy") is not None
    
    async def scan(self, target: str, config: Dict[str, Any] = None) -> ScanResult:
        """Execute Trivy scan against target (container image, filesystem, or repo)"""
        if not self.is_available():
            return ScanResult(
                scanner=ScannerType.TRIVY,
                success=False,
                vulnerabilities=[],
                error="Trivy is not installed. Install with: brew install trivy"
            )
        
        try:
            config = config or {}
            scan_type = config.get("scan_type", "fs")  # fs, image, repo
            
            # Build command
            cmd = [
                self.trivy_path or "trivy",
                scan_type,
                "--format", "json",
                "--quiet",
                target
            ]
            
            # Add severity filter if specified
            if "severity" in config:
                cmd.extend(["--severity", config["severity"]])
            
            # Execute scan
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=300)
            
            if process.returncode != 0:
                return ScanResult(
                    scanner=ScannerType.TRIVY,
                    success=False,
                    vulnerabilities=[],
                    error=stderr.decode() if stderr else "Scan failed"
                )
            
            # Parse JSON output
            try:
                results = json.loads(stdout.decode())
            except json.JSONDecodeError:
                return ScanResult(
                    scanner=ScannerType.TRIVY,
                    success=True,
                    vulnerabilities=[],
                    raw_output=stdout.decode()
                )
            
            vulnerabilities = []
            
            # Process results (structure varies by scan type)
            if isinstance(results, dict) and "Results" in results:
                for result in results.get("Results", []):
                    for vuln in result.get("Vulnerabilities", []):
                        vulnerabilities.append({
                            "title": vuln.get("Title", vuln.get("VulnerabilityID", "Unknown")),
                            "description": vuln.get("Description", ""),
                            "severity": vuln.get("Severity", "UNKNOWN").lower(),
                            "cve_id": vuln.get("VulnerabilityID", ""),
                            "package_name": vuln.get("PkgName", ""),
                            "installed_version": vuln.get("InstalledVersion", ""),
                            "fixed_version": vuln.get("FixedVersion", ""),
                            "references": vuln.get("References", []),
                            "source": "trivy"
                        })
            
            return ScanResult(
                scanner=ScannerType.TRIVY,
                success=True,
                vulnerabilities=vulnerabilities,
                metadata={"target": target, "scan_type": scan_type}
            )
            
        except asyncio.TimeoutError:
            return ScanResult(
                scanner=ScannerType.TRIVY,
                success=False,
                vulnerabilities=[],
                error="Scan timed out after 5 minutes"
            )
        except Exception as e:
            logger.error(f"Trivy scan failed: {e}")
            return ScanResult(
                scanner=ScannerType.TRIVY,
                success=False,
                vulnerabilities=[],
                error=str(e)
            )


# ============================================================================
# TruffleHog Scanner
# ============================================================================

class TruffleHogScanner(ScannerInterface):
    """
    TruffleHog integration for secret detection in git repositories
    Requires TruffleHog to be installed: pip install trufflehog
    """
    
    def __init__(self, trufflehog_path: str = None):
        self.trufflehog_path = trufflehog_path or shutil.which("trufflehog")
    
    def is_available(self) -> bool:
        """Check if TruffleHog is installed"""
        return shutil.which(self.trufflehog_path or "trufflehog") is not None
    
    async def scan(self, target: str, config: Dict[str, Any] = None) -> ScanResult:
        """Execute TruffleHog scan against git repository"""
        if not self.is_available():
            return ScanResult(
                scanner=ScannerType.TRUFFLEHOG,
                success=False,
                vulnerabilities=[],
                error="TruffleHog is not installed. Install with: pip install trufflehog"
            )
        
        try:
            config = config or {}
            
            # Build command for TruffleHog v3
            cmd = [
                self.trufflehog_path or "trufflehog",
                "git",
                target,
                "--json",
                "--no-update"
            ]
            
            # Add options
            if config.get("only_verified", False):
                cmd.append("--only-verified")
            
            if config.get("branch"):
                cmd.extend(["--branch", config["branch"]])
            
            # Execute scan
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=600)
            
            vulnerabilities = []
            raw_output = stdout.decode()
            
            # Parse JSON lines output
            for line in raw_output.strip().split("\n"):
                if not line:
                    continue
                try:
                    finding = json.loads(line)
                    vulnerabilities.append({
                        "title": f"Secret Found: {finding.get('DetectorName', 'Unknown')}",
                        "description": f"Exposed secret detected by {finding.get('DetectorType', 'unknown')} detector",
                        "severity": "critical" if finding.get("Verified", False) else "high",
                        "secret_type": finding.get("DetectorName", ""),
                        "file_path": finding.get("SourceMetadata", {}).get("Data", {}).get("Filesystem", {}).get("file", ""),
                        "commit": finding.get("SourceMetadata", {}).get("Data", {}).get("Git", {}).get("commit", ""),
                        "is_verified": finding.get("Verified", False),
                        "raw_value_masked": finding.get("Raw", "")[:20] + "..." if finding.get("Raw") else "",
                        "source": "trufflehog"
                    })
                except json.JSONDecodeError:
                    continue
            
            return ScanResult(
                scanner=ScannerType.TRUFFLEHOG,
                success=True,
                vulnerabilities=vulnerabilities,
                metadata={"secrets_found": len(vulnerabilities)}
            )
            
        except asyncio.TimeoutError:
            return ScanResult(
                scanner=ScannerType.TRUFFLEHOG,
                success=False,
                vulnerabilities=[],
                error="Scan timed out after 10 minutes"
            )
        except Exception as e:
            logger.error(f"TruffleHog scan failed: {e}")
            return ScanResult(
                scanner=ScannerType.TRUFFLEHOG,
                success=False,
                vulnerabilities=[],
                error=str(e)
            )


# ============================================================================
# Nmap Scanner
# ============================================================================

class NmapScanner(ScannerInterface):
    """
    Nmap integration for network port scanning with service detection
    Requires Nmap to be installed: brew install nmap
    """
    
    def __init__(self, nmap_path: str = None):
        self.nmap_path = nmap_path or shutil.which("nmap")
    
    def is_available(self) -> bool:
        """Check if Nmap is installed"""
        return shutil.which(self.nmap_path or "nmap") is not None
    
    async def scan(self, target: str, config: Dict[str, Any] = None) -> ScanResult:
        """Execute Nmap scan against target host"""
        if not self.is_available():
            return ScanResult(
                scanner=ScannerType.NMAP,
                success=False,
                vulnerabilities=[],
                error="Nmap is not installed. Install with: brew install nmap"
            )
        
        try:
            config = config or {}
            
            # Extract hostname from URL if needed
            import urllib.parse
            if target.startswith(("http://", "https://")):
                parsed = urllib.parse.urlparse(target)
                target = parsed.hostname
            
            # Build command
            cmd = [
                self.nmap_path or "nmap",
                "-sV",  # Service version detection
                "-T4",  # Timing template (faster)
                "-oX", "-",  # XML output to stdout
                "--open"  # Only show open ports
            ]
            
            # Add port range
            if config.get("ports"):
                cmd.extend(["-p", config["ports"]])
            elif config.get("port_range") == "common":
                cmd.extend(["-p", "21,22,23,25,53,80,110,135,139,143,443,445,993,995,3306,3389,5432,8080,8443"])
            elif config.get("port_range") == "full":
                cmd.extend(["-p", "1-65535"])
            else:
                cmd.extend(["--top-ports", "1000"])
            
            cmd.append(target)
            
            # Execute scan
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=300)
            
            # Parse XML output
            import xml.etree.ElementTree as ET
            
            vulnerabilities = []
            open_ports = []
            
            try:
                root = ET.fromstring(stdout.decode())
                
                for host in root.findall(".//host"):
                    for port_elem in host.findall(".//port"):
                        state = port_elem.find("state")
                        if state is not None and state.get("state") == "open":
                            port = port_elem.get("portid")
                            protocol = port_elem.get("protocol", "tcp")
                            
                            service = port_elem.find("service")
                            service_name = service.get("name", "unknown") if service is not None else "unknown"
                            service_version = service.get("version", "") if service is not None else ""
                            product = service.get("product", "") if service is not None else ""
                            
                            open_ports.append({
                                "port": int(port),
                                "protocol": protocol,
                                "state": "open",
                                "service": service_name,
                                "version": f"{product} {service_version}".strip(),
                            })
                            
                            # Flag potentially risky services
                            risky_ports = {21: "FTP", 23: "Telnet", 3389: "RDP", 445: "SMB"}
                            if int(port) in risky_ports:
                                vulnerabilities.append({
                                    "title": f"Risky Service Exposed: {risky_ports[int(port)]} on port {port}",
                                    "description": f"Port {port} is open running {service_name}. This service may pose security risks.",
                                    "severity": "medium",
                                    "port": int(port),
                                    "service": service_name,
                                    "source": "nmap"
                                })
                
            except ET.ParseError:
                pass  # XML parsing failed, return empty results
            
            return ScanResult(
                scanner=ScannerType.NMAP,
                success=True,
                vulnerabilities=vulnerabilities,
                metadata={
                    "open_ports": open_ports,
                    "total_open_ports": len(open_ports)
                }
            )
            
        except asyncio.TimeoutError:
            return ScanResult(
                scanner=ScannerType.NMAP,
                success=False,
                vulnerabilities=[],
                error="Scan timed out after 5 minutes"
            )
        except Exception as e:
            logger.error(f"Nmap scan failed: {e}")
            return ScanResult(
                scanner=ScannerType.NMAP,
                success=False,
                vulnerabilities=[],
                error=str(e)
            )


# ============================================================================
# SSL Labs Scanner (Free API)
# ============================================================================

class SSLLabsScanner(ScannerInterface):
    """
    SSL Labs API integration for comprehensive SSL/TLS certificate analysis
    Free API: https://www.ssllabs.com/ssltest/
    """
    
    API_URL = "https://api.ssllabs.com/api/v3"
    
    def is_available(self) -> bool:
        """SSL Labs API is always available (free, no key needed)"""
        return True
    
    async def scan(self, target: str, config: Dict[str, Any] = None) -> ScanResult:
        """Execute SSL Labs scan against target URL"""
        try:
            import httpx
            import urllib.parse
            
            # Extract hostname from URL
            if target.startswith(("http://", "https://")):
                parsed = urllib.parse.urlparse(target)
                hostname = parsed.hostname
            else:
                hostname = target
            
            config = config or {}
            
            async with httpx.AsyncClient(timeout=60) as client:
                # Start new assessment
                params = {
                    "host": hostname,
                    "startNew": "on" if config.get("fresh_scan", False) else "off",
                    "all": "done"
                }
                
                # Poll for results (SSL Labs scans can take 1-2 minutes)
                max_attempts = 30
                for attempt in range(max_attempts):
                    response = await client.get(f"{self.API_URL}/analyze", params=params)
                    
                    if response.status_code != 200:
                        return ScanResult(
                            scanner=ScannerType.SSL_LABS,
                            success=False,
                            vulnerabilities=[],
                            error=f"API error: {response.status_code}"
                        )
                    
                    data = response.json()
                    status = data.get("status")
                    
                    if status == "READY":
                        break
                    elif status == "ERROR":
                        return ScanResult(
                            scanner=ScannerType.SSL_LABS,
                            success=False,
                            vulnerabilities=[],
                            error=data.get("statusMessage", "Analysis failed")
                        )
                    elif status in ["DNS", "IN_PROGRESS"]:
                        params["startNew"] = "off"
                        await asyncio.sleep(10)
                    else:
                        await asyncio.sleep(5)
                else:
                    return ScanResult(
                        scanner=ScannerType.SSL_LABS,
                        success=False,
                        vulnerabilities=[],
                        error="Scan timed out"
                    )
                
                # Parse results
                vulnerabilities = []
                endpoints = data.get("endpoints", [])
                
                for endpoint in endpoints:
                    grade = endpoint.get("grade", "?")
                    ip_address = endpoint.get("ipAddress", "")
                    
                    # Get detailed endpoint info
                    detail_response = await client.get(
                        f"{self.API_URL}/getEndpointData",
                        params={"host": hostname, "s": ip_address}
                    )
                    
                    if detail_response.status_code == 200:
                        details = detail_response.json()
                        
                        # Check for vulnerabilities
                        if details.get("details", {}).get("heartbleed"):
                            vulnerabilities.append({
                                "title": "Heartbleed Vulnerability (CVE-2014-0160)",
                                "description": "Server is vulnerable to the Heartbleed bug",
                                "severity": "critical",
                                "cve_id": "CVE-2014-0160",
                                "source": "ssl_labs"
                            })
                        
                        if details.get("details", {}).get("poodle"):
                            vulnerabilities.append({
                                "title": "POODLE Vulnerability (CVE-2014-3566)",
                                "description": "Server is vulnerable to POODLE attack via SSLv3",
                                "severity": "high",
                                "cve_id": "CVE-2014-3566",
                                "source": "ssl_labs"
                            })
                        
                        if details.get("details", {}).get("freak"):
                            vulnerabilities.append({
                                "title": "FREAK Vulnerability (CVE-2015-0204)",
                                "description": "Server supports export cipher suites",
                                "severity": "high",
                                "cve_id": "CVE-2015-0204",
                                "source": "ssl_labs"
                            })
                        
                        # Check certificate issues
                        cert = details.get("details", {}).get("cert", {})
                        if cert.get("issues", 0) > 0:
                            vulnerabilities.append({
                                "title": "SSL Certificate Issues Detected",
                                "description": f"Certificate has {cert.get('issues', 0)} issues",
                                "severity": "medium",
                                "source": "ssl_labs"
                            })
                        
                        # Check for weak protocols
                        protocols = details.get("details", {}).get("protocols", [])
                        weak_protocols = [p for p in protocols if p.get("name") in ["SSL 2.0", "SSL 3.0", "TLS 1.0"]]
                        if weak_protocols:
                            vulnerabilities.append({
                                "title": "Weak TLS/SSL Protocols Enabled",
                                "description": f"Outdated protocols: {', '.join([p['name'] for p in weak_protocols])}",
                                "severity": "medium",
                                "recommendation": "Disable SSL 2.0, SSL 3.0, and TLS 1.0",
                                "source": "ssl_labs"
                            })
                        
                        # Grade-based warnings
                        if grade in ["F", "T"]:
                            vulnerabilities.append({
                                "title": f"Poor SSL Grade: {grade}",
                                "description": "Server received a failing SSL grade",
                                "severity": "high",
                                "source": "ssl_labs"
                            })
                        elif grade in ["C", "D", "E"]:
                            vulnerabilities.append({
                                "title": f"Suboptimal SSL Grade: {grade}",
                                "description": "Server SSL configuration needs improvement",
                                "severity": "medium",
                                "source": "ssl_labs"
                            })
                
                return ScanResult(
                    scanner=ScannerType.SSL_LABS,
                    success=True,
                    vulnerabilities=vulnerabilities,
                    metadata={
                        "host": hostname,
                        "grade": endpoints[0].get("grade", "?") if endpoints else "?",
                        "endpoints_count": len(endpoints)
                    }
                )
                
        except Exception as e:
            logger.error(f"SSL Labs scan failed: {e}")
            return ScanResult(
                scanner=ScannerType.SSL_LABS,
                success=False,
                vulnerabilities=[],
                error=str(e)
            )


# ============================================================================
# Security Headers Scanner (Free API)
# ============================================================================

class SecurityHeadersScanner(ScannerInterface):
    """
    SecurityHeaders.com API integration for HTTP security headers analysis
    Checks for missing security headers like CSP, HSTS, X-Frame-Options, etc.
    """
    
    API_URL = "https://securityheaders.com"
    
    def is_available(self) -> bool:
        """Security Headers API is always available"""
        return True
    
    async def scan(self, target: str, config: Dict[str, Any] = None) -> ScanResult:
        """Execute Security Headers scan against target URL"""
        try:
            import httpx
            
            # Ensure URL has scheme
            if not target.startswith(("http://", "https://")):
                target = f"https://{target}"
            
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                # Make request with JSON response
                response = await client.get(
                    self.API_URL,
                    params={"q": target, "followRedirects": "on"},
                    headers={"Accept": "application/json"}
                )
                
                vulnerabilities = []
                
                # Parse the response headers that securityheaders.com returns
                grade = response.headers.get("x-grade", "?")
                
                # Check for missing security headers directly
                target_response = await client.get(target, follow_redirects=True)
                headers = target_response.headers
                
                security_headers = {
                    "Strict-Transport-Security": {
                        "severity": "high",
                        "description": "HSTS header missing. Site is vulnerable to protocol downgrade attacks.",
                        "recommendation": "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains'"
                    },
                    "Content-Security-Policy": {
                        "severity": "medium",
                        "description": "CSP header missing. Site is more vulnerable to XSS attacks.",
                        "recommendation": "Implement a Content-Security-Policy header"
                    },
                    "X-Frame-Options": {
                        "severity": "medium",
                        "description": "X-Frame-Options header missing. Site may be vulnerable to clickjacking.",
                        "recommendation": "Add 'X-Frame-Options: DENY' or 'SAMEORIGIN'"
                    },
                    "X-Content-Type-Options": {
                        "severity": "low",
                        "description": "X-Content-Type-Options header missing. Browser may MIME-sniff content.",
                        "recommendation": "Add 'X-Content-Type-Options: nosniff'"
                    },
                    "X-XSS-Protection": {
                        "severity": "low",
                        "description": "X-XSS-Protection header missing (legacy browsers).",
                        "recommendation": "Add 'X-XSS-Protection: 1; mode=block'"
                    },
                    "Referrer-Policy": {
                        "severity": "low",
                        "description": "Referrer-Policy header missing. Referrer information may leak.",
                        "recommendation": "Add 'Referrer-Policy: strict-origin-when-cross-origin'"
                    },
                    "Permissions-Policy": {
                        "severity": "low",
                        "description": "Permissions-Policy header missing. Browser features not restricted.",
                        "recommendation": "Implement Permissions-Policy to control feature access"
                    }
                }
                
                present_headers = []
                missing_headers = []
                
                for header_name, info in security_headers.items():
                    if header_name.lower() not in [h.lower() for h in headers.keys()]:
                        missing_headers.append(header_name)
                        vulnerabilities.append({
                            "title": f"Missing Security Header: {header_name}",
                            "description": info["description"],
                            "severity": info["severity"],
                            "recommendation": info["recommendation"],
                            "source": "security_headers"
                        })
                    else:
                        present_headers.append(header_name)
                
                # Calculate grade based on missing headers
                if len(missing_headers) == 0:
                    calculated_grade = "A+"
                elif len(missing_headers) <= 1:
                    calculated_grade = "A"
                elif len(missing_headers) <= 2:
                    calculated_grade = "B"
                elif len(missing_headers) <= 3:
                    calculated_grade = "C"
                elif len(missing_headers) <= 4:
                    calculated_grade = "D"
                else:
                    calculated_grade = "F"
                
                return ScanResult(
                    scanner=ScannerType.SECURITY_HEADERS,
                    success=True,
                    vulnerabilities=vulnerabilities,
                    metadata={
                        "url": target,
                        "grade": calculated_grade,
                        "present_headers": present_headers,
                        "missing_headers": missing_headers
                    }
                )
                
        except Exception as e:
            logger.error(f"Security Headers scan failed: {e}")
            return ScanResult(
                scanner=ScannerType.SECURITY_HEADERS,
                success=False,
                vulnerabilities=[],
                error=str(e)
            )


# ============================================================================
# Google Safe Browsing Scanner
# ============================================================================

class GoogleSafeBrowsingScanner(ScannerInterface):
    """
    Google Safe Browsing API integration for URL reputation checking
    Detects malware, phishing, and unwanted software
    Requires API key from Google Cloud Console
    """
    
    API_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GOOGLE_SAFE_BROWSING_API_KEY")
    
    def is_available(self) -> bool:
        """Check if API key is configured"""
        return bool(self.api_key)
    
    async def scan(self, target: str, config: Dict[str, Any] = None) -> ScanResult:
        """Check URL against Google Safe Browsing database"""
        if not self.is_available():
            # Return empty result with info about missing API key
            return ScanResult(
                scanner=ScannerType.GOOGLE_SAFE_BROWSING,
                success=True,
                vulnerabilities=[],
                metadata={"note": "Google Safe Browsing API key not configured. Skipping reputation check."}
            )
        
        try:
            import httpx
            
            # Ensure URL has scheme
            if not target.startswith(("http://", "https://")):
                target = f"https://{target}"
            
            async with httpx.AsyncClient(timeout=15) as client:
                payload = {
                    "client": {
                        "clientId": "cognitest",
                        "clientVersion": "1.0.0"
                    },
                    "threatInfo": {
                        "threatTypes": [
                            "MALWARE",
                            "SOCIAL_ENGINEERING",
                            "UNWANTED_SOFTWARE",
                            "POTENTIALLY_HARMFUL_APPLICATION"
                        ],
                        "platformTypes": ["ANY_PLATFORM"],
                        "threatEntryTypes": ["URL"],
                        "threatEntries": [{"url": target}]
                    }
                }
                
                response = await client.post(
                    f"{self.API_URL}?key={self.api_key}",
                    json=payload
                )
                
                if response.status_code != 200:
                    return ScanResult(
                        scanner=ScannerType.GOOGLE_SAFE_BROWSING,
                        success=False,
                        vulnerabilities=[],
                        error=f"API error: {response.status_code}"
                    )
                
                data = response.json()
                vulnerabilities = []
                
                # Check if matches found
                matches = data.get("matches", [])
                for match in matches:
                    threat_type = match.get("threatType", "UNKNOWN")
                    threat_descriptions = {
                        "MALWARE": "This URL is flagged for distributing malware",
                        "SOCIAL_ENGINEERING": "This URL is flagged as a phishing/social engineering site",
                        "UNWANTED_SOFTWARE": "This URL distributes unwanted software",
                        "POTENTIALLY_HARMFUL_APPLICATION": "This URL hosts potentially harmful applications"
                    }
                    
                    vulnerabilities.append({
                        "title": f"URL Flagged: {threat_type.replace('_', ' ').title()}",
                        "description": threat_descriptions.get(threat_type, "URL is flagged in Safe Browsing database"),
                        "severity": "critical",
                        "threat_type": threat_type,
                        "source": "google_safe_browsing"
                    })
                
                return ScanResult(
                    scanner=ScannerType.GOOGLE_SAFE_BROWSING,
                    success=True,
                    vulnerabilities=vulnerabilities,
                    metadata={
                        "url": target,
                        "is_safe": len(matches) == 0,
                        "threats_found": len(matches)
                    }
                )
                
        except Exception as e:
            logger.error(f"Google Safe Browsing scan failed: {e}")
            return ScanResult(
                scanner=ScannerType.GOOGLE_SAFE_BROWSING,
                success=False,
                vulnerabilities=[],
                error=str(e)
            )


# ============================================================================
# Subdomain Takeover Scanner
# ============================================================================

class SubdomainTakeoverScanner(ScannerInterface):
    """
    Subdomain takeover detection using crt.sh for subdomain discovery
    and fingerprint matching for vulnerable services
    """
    
    # crt.sh API for Certificate Transparency logs
    CRT_SH_API = "https://crt.sh/?q={domain}&output=json"
    
    # Takeover fingerprints from can-i-take-over-xyz
    TAKEOVER_FINGERPRINTS = {
        "github": {
            "cname": ["github.io", "github.com"],
            "response": "There isn't a GitHub Pages site here",
            "nxdomain": False
        },
        "heroku": {
            "cname": ["herokuapp.com", "herokussl.com"],
            "response": "No such app",
            "nxdomain": False
        },
        "aws_s3": {
            "cname": ["s3.amazonaws.com", "s3-website"],
            "response": "NoSuchBucket",
            "nxdomain": False
        },
        "azure": {
            "cname": ["azurewebsites.net", "cloudapp.azure.com", "blob.core.windows.net"],
            "response": "404 Web Site not found",
            "nxdomain": False
        },
        "shopify": {
            "cname": ["myshopify.com"],
            "response": "Sorry, this shop is currently unavailable",
            "nxdomain": False
        },
        "tumblr": {
            "cname": ["tumblr.com"],
            "response": "There's nothing here",
            "nxdomain": False
        },
        "wordpress": {
            "cname": ["wordpress.com"],
            "response": "Do you want to register",
            "nxdomain": False
        },
        "ghost": {
            "cname": ["ghost.io"],
            "response": "The thing you were looking for is no longer here",
            "nxdomain": False
        },
        "surge": {
            "cname": ["surge.sh"],
            "response": "project not found",
            "nxdomain": False
        },
        "bitbucket": {
            "cname": ["bitbucket.io"],
            "response": "Repository not found",
            "nxdomain": False
        },
        "netlify": {
            "cname": ["netlify.app", "netlify.com"],
            "response": "Not Found - Request ID",
            "nxdomain": False
        },
        "vercel": {
            "cname": ["vercel.app", "now.sh"],
            "response": "The deployment could not be found",
            "nxdomain": False
        }
    }
    
    def is_available(self) -> bool:
        """Always available (uses free API)"""
        return True
    
    async def scan(self, target: str, config: Dict[str, Any] = None) -> ScanResult:
        """Scan for subdomain takeover vulnerabilities"""
        try:
            import httpx
            import urllib.parse
            import socket
            
            # Extract domain from URL
            if target.startswith(("http://", "https://")):
                parsed = urllib.parse.urlparse(target)
                domain = parsed.hostname
            else:
                domain = target
            
            # Remove www prefix if present
            if domain.startswith("www."):
                domain = domain[4:]
            
            config = config or {}
            
            async with httpx.AsyncClient(timeout=30) as client:
                # Step 1: Discover subdomains via crt.sh (Certificate Transparency)
                subdomains = set()
                
                try:
                    crt_response = await client.get(
                        self.CRT_SH_API.format(domain=domain),
                        follow_redirects=True
                    )
                    
                    if crt_response.status_code == 200:
                        try:
                            certs = crt_response.json()
                            for cert in certs:
                                name = cert.get("name_value", "")
                                # Handle wildcard and multi-domain certs
                                for subdomain in name.split("\n"):
                                    subdomain = subdomain.strip().lower()
                                    if subdomain.startswith("*."):
                                        subdomain = subdomain[2:]
                                    if subdomain and subdomain.endswith(domain):
                                        subdomains.add(subdomain)
                        except:
                            pass
                except Exception as e:
                    logger.warning(f"crt.sh lookup failed: {e}")
                
                # Add base domain and common subdomains
                subdomains.add(domain)
                common_subs = ["www", "mail", "ftp", "cpanel", "webmail", "admin", 
                              "blog", "dev", "staging", "test", "api", "app", 
                              "cdn", "static", "shop", "store", "support"]
                for sub in common_subs:
                    subdomains.add(f"{sub}.{domain}")
                
                # Limit to prevent excessive scanning
                subdomains = list(subdomains)[:50]
                
                vulnerabilities = []
                checked_subdomains = []
                takeover_vulnerable = []
                
                # Step 2: Check each subdomain for takeover
                for subdomain in subdomains:
                    try:
                        # Get CNAME record
                        cname = None
                        try:
                            cname = socket.gethostbyname(subdomain)
                        except socket.gaierror:
                            # NXDOMAIN - check if pointing to service that requires claim
                            pass
                        
                        # Check fingerprints
                        for service, fingerprint in self.TAKEOVER_FINGERPRINTS.items():
                            is_vulnerable = False
                            
                            # Try to fetch the subdomain
                            try:
                                response = await client.get(
                                    f"https://{subdomain}",
                                    timeout=5,
                                    follow_redirects=True
                                )
                                
                                # Check if response contains takeover fingerprint
                                if fingerprint["response"].lower() in response.text.lower():
                                    is_vulnerable = True
                                    
                            except httpx.ConnectError:
                                # Connection failed - could be NXDOMAIN with dangling CNAME
                                try:
                                    response = await client.get(
                                        f"http://{subdomain}",
                                        timeout=5,
                                        follow_redirects=True
                                    )
                                    if fingerprint["response"].lower() in response.text.lower():
                                        is_vulnerable = True
                                except:
                                    pass
                            except:
                                pass
                            
                            if is_vulnerable:
                                vulnerabilities.append({
                                    "title": f"Subdomain Takeover: {subdomain}",
                                    "description": f"Subdomain {subdomain} appears vulnerable to takeover via {service}. The DNS points to {service} but the resource is unclaimed.",
                                    "severity": "high",
                                    "subdomain": subdomain,
                                    "service": service,
                                    "recommendation": f"Either remove the DNS record for {subdomain} or claim the {service} resource",
                                    "source": "subdomain_takeover"
                                })
                                takeover_vulnerable.append(subdomain)
                                break
                        
                        checked_subdomains.append(subdomain)
                        
                    except Exception as e:
                        logger.debug(f"Error checking {subdomain}: {e}")
                        continue
                
                return ScanResult(
                    scanner=ScannerType.SUBDOMAIN_TAKEOVER,
                    success=True,
                    vulnerabilities=vulnerabilities,
                    metadata={
                        "domain": domain,
                        "subdomains_discovered": len(subdomains),
                        "subdomains_checked": len(checked_subdomains),
                        "takeover_vulnerable": takeover_vulnerable
                    }
                )
                
        except Exception as e:
            logger.error(f"Subdomain takeover scan failed: {e}")
            return ScanResult(
                scanner=ScannerType.SUBDOMAIN_TAKEOVER,
                success=False,
                vulnerabilities=[],
                error=str(e)
            )


# ============================================================================
# Business Logic Fuzzer
# ============================================================================

class BusinessLogicFuzzer(ScannerInterface):
    """
    Business logic vulnerability detection through intelligent fuzzing
    Detects IDOR, parameter tampering, numeric manipulation, and privilege escalation patterns
    """
    
    def is_available(self) -> bool:
        """Always available"""
        return True
    
    async def scan(self, target: str, config: Dict[str, Any] = None) -> ScanResult:
        """Scan for business logic vulnerabilities"""
        try:
            import httpx
            import re
            from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
            
            config = config or {}
            
            # Ensure URL has scheme
            if not target.startswith(("http://", "https://")):
                target = f"https://{target}"
            
            vulnerabilities = []
            tests_performed = []
            
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                # Get base response for comparison
                try:
                    base_response = await client.get(target)
                    base_status = base_response.status_code
                    base_length = len(base_response.text)
                except Exception as e:
                    return ScanResult(
                        scanner=ScannerType.BUSINESS_LOGIC_FUZZER,
                        success=False,
                        vulnerabilities=[],
                        error=f"Cannot reach target: {e}"
                    )
                
                parsed = urlparse(target)
                params = parse_qs(parsed.query)
                
                # =========================================================
                # Test 1: IDOR - Insecure Direct Object Reference
                # =========================================================
                id_params = ["id", "user_id", "userId", "uid", "account", "order", 
                            "orderId", "order_id", "item", "itemId", "item_id",
                            "doc", "docId", "file", "fileId", "project", "projectId"]
                
                for param in id_params:
                    if param in params or param.lower() in [p.lower() for p in params]:
                        tests_performed.append(f"IDOR test on {param}")
                        
                        # Try sequential IDs
                        original_value = params.get(param, ["1"])[0]
                        test_values = []
                        
                        # If numeric, try adjacent values
                        if original_value.isdigit():
                            original_int = int(original_value)
                            test_values = [
                                str(original_int - 1),
                                str(original_int + 1),
                                str(original_int + 100),
                                "0",
                                "-1"
                            ]
                        else:
                            # Try UUID-like modifications
                            test_values = ["1", "0", "admin", "test"]
                        
                        for test_val in test_values:
                            try:
                                test_params = dict(params)
                                test_params[param] = [test_val]
                                test_query = urlencode(test_params, doseq=True)
                                test_url = urlunparse(parsed._replace(query=test_query))
                                
                                response = await client.get(test_url)
                                
                                # If we get a 200 with different content, potential IDOR
                                if response.status_code == 200 and len(response.text) != base_length:
                                    if len(response.text) > 100:  # Not an error page
                                        vulnerabilities.append({
                                            "title": f"Potential IDOR Vulnerability: {param}",
                                            "description": f"Changing {param} from '{original_value}' to '{test_val}' returned different data (200 OK). This may allow unauthorized access to other users' resources.",
                                            "severity": "high",
                                            "parameter": param,
                                            "test_value": test_val,
                                            "recommendation": "Implement proper authorization checks server-side. Verify the requesting user has access to the requested resource.",
                                            "source": "business_logic_fuzzer"
                                        })
                                        break
                            except:
                                pass
                
                # =========================================================
                # Test 2: Numeric Manipulation (Price, Quantity, Amount)
                # =========================================================
                numeric_params = ["price", "amount", "quantity", "qty", "total", 
                                 "discount", "coupon", "credit", "points", "balance"]
                
                for param in params:
                    if any(n in param.lower() for n in numeric_params):
                        tests_performed.append(f"Numeric manipulation test on {param}")
                        
                        original_value = params[param][0]
                        # Try negative and zero values
                        test_values = ["-1", "0", "-100", "0.01", "99999999"]
                        
                        for test_val in test_values:
                            try:
                                test_params = dict(params)
                                test_params[param] = [test_val]
                                test_query = urlencode(test_params, doseq=True)
                                test_url = urlunparse(parsed._replace(query=test_query))
                                
                                response = await client.get(test_url)
                                
                                # If server accepts negative/zero values
                                if response.status_code == 200:
                                    # Check for success indicators
                                    success_indicators = ["success", "added", "confirmed", "complete"]
                                    if any(ind in response.text.lower() for ind in success_indicators):
                                        vulnerabilities.append({
                                            "title": f"Numeric Manipulation Accepted: {param}",
                                            "description": f"Server accepted {param}={test_val}. This may allow price manipulation or free items.",
                                            "severity": "critical" if test_val.startswith("-") else "high",
                                            "parameter": param,
                                            "test_value": test_val,
                                            "recommendation": "Validate all numeric inputs server-side. Reject negative values for quantities and prices.",
                                            "source": "business_logic_fuzzer"
                                        })
                                        break
                            except:
                                pass
                
                # =========================================================
                # Test 3: Role/Privilege Escalation Parameters
                # =========================================================
                role_params = ["role", "admin", "isAdmin", "is_admin", "privilege",
                              "access", "level", "type", "userType", "user_type",
                              "permissions", "group"]
                
                # Also check for these in POST bodies if endpoint accepts POST
                for param in role_params:
                    test_url = f"{target}{'&' if '?' in target else '?'}{param}=admin"
                    tests_performed.append(f"Privilege escalation test with {param}")
                    
                    try:
                        response = await client.get(test_url)
                        
                        # Check for admin indicators in response
                        admin_indicators = ["admin panel", "dashboard", "management", 
                                           "delete user", "all users", "settings"]
                        if response.status_code == 200:
                            if any(ind in response.text.lower() for ind in admin_indicators):
                                vulnerabilities.append({
                                    "title": "Potential Privilege Escalation",
                                    "description": f"Adding {param}=admin parameter returned admin-like content. Verify this is not granting unauthorized access.",
                                    "severity": "critical",
                                    "parameter": param,
                                    "recommendation": "Never trust client-side role parameters. Derive user roles from authenticated session only.",
                                    "source": "business_logic_fuzzer"
                                })
                    except:
                        pass
                
                # =========================================================
                # Test 4: Hidden/Debug Parameters
                # =========================================================
                debug_params = ["debug", "test", "dev", "verbose", "trace", 
                               "internal", "staging", "preview", "bypass"]
                
                for param in debug_params:
                    for value in ["true", "1", "yes"]:
                        test_url = f"{target}{'&' if '?' in target else '?'}{param}={value}"
                        tests_performed.append(f"Debug parameter test: {param}={value}")
                        
                        try:
                            response = await client.get(test_url)
                            
                            # Check if response reveals more info
                            if response.status_code == 200:
                                debug_indicators = ["stack trace", "debug", "exception", 
                                                   "sql", "query", "secret", "internal"]
                                if any(ind in response.text.lower() for ind in debug_indicators):
                                    if len(response.text) > base_length + 500:  # Significantly more content
                                        vulnerabilities.append({
                                            "title": f"Debug Mode Accessible: {param}",
                                            "description": f"Parameter {param}={value} appears to enable debug mode, potentially exposing sensitive information.",
                                            "severity": "medium",
                                            "parameter": param,
                                            "recommendation": "Disable debug parameters in production. Use environment-based configuration.",
                                            "source": "business_logic_fuzzer"
                                        })
                        except:
                            pass
                
                # =========================================================
                # Test 5: HTTP Method Tampering
                # =========================================================
                tests_performed.append("HTTP method tampering test")
                methods_to_try = ["PUT", "DELETE", "PATCH", "OPTIONS"]
                
                for method in methods_to_try:
                    try:
                        response = await client.request(method, target)
                        
                        # If unexpected success
                        if response.status_code in [200, 201, 204]:
                            vulnerabilities.append({
                                "title": f"Unexpected HTTP Method Allowed: {method}",
                                "description": f"The endpoint accepts {method} requests. Verify this is intentional and properly authorized.",
                                "severity": "medium",
                                "method": method,
                                "recommendation": "Restrict HTTP methods to only those needed. Return 405 for unsupported methods.",
                                "source": "business_logic_fuzzer"
                            })
                    except:
                        pass
                
                return ScanResult(
                    scanner=ScannerType.BUSINESS_LOGIC_FUZZER,
                    success=True,
                    vulnerabilities=vulnerabilities,
                    metadata={
                        "target": target,
                        "tests_performed": tests_performed,
                        "total_tests": len(tests_performed),
                        "vulnerabilities_found": len(vulnerabilities)
                    }
                )
                
        except Exception as e:
            logger.error(f"Business logic fuzzing failed: {e}")
            return ScanResult(
                scanner=ScannerType.BUSINESS_LOGIC_FUZZER,
                success=False,
                vulnerabilities=[],
                error=str(e)
            )


# ============================================================================
# Scanner Factory
# ============================================================================

class ExternalScannerFactory:
    """Factory for creating and managing external scanners"""
    
    _scanners: Dict[ScannerType, ScannerInterface] = {}
    
    @classmethod
    def get_scanner(cls, scanner_type: ScannerType, **kwargs) -> ScannerInterface:
        """Get or create a scanner instance"""
        if scanner_type not in cls._scanners:
            if scanner_type == ScannerType.OWASP_ZAP:
                cls._scanners[scanner_type] = OWASPZAPScanner(**kwargs)
            elif scanner_type == ScannerType.TRIVY:
                cls._scanners[scanner_type] = TrivyScanner(**kwargs)
            elif scanner_type == ScannerType.TRUFFLEHOG:
                cls._scanners[scanner_type] = TruffleHogScanner(**kwargs)
            elif scanner_type == ScannerType.NMAP:
                cls._scanners[scanner_type] = NmapScanner(**kwargs)
            elif scanner_type == ScannerType.SSL_LABS:
                cls._scanners[scanner_type] = SSLLabsScanner(**kwargs)
            elif scanner_type == ScannerType.SECURITY_HEADERS:
                cls._scanners[scanner_type] = SecurityHeadersScanner(**kwargs)
            elif scanner_type == ScannerType.GOOGLE_SAFE_BROWSING:
                cls._scanners[scanner_type] = GoogleSafeBrowsingScanner(**kwargs)
            elif scanner_type == ScannerType.SUBDOMAIN_TAKEOVER:
                cls._scanners[scanner_type] = SubdomainTakeoverScanner(**kwargs)
            elif scanner_type == ScannerType.BUSINESS_LOGIC_FUZZER:
                cls._scanners[scanner_type] = BusinessLogicFuzzer(**kwargs)
        
        return cls._scanners[scanner_type]
    
    @classmethod
    def get_available_scanners(cls) -> Dict[ScannerType, bool]:
        """Get availability status of all scanners"""
        return {
            ScannerType.OWASP_ZAP: cls.get_scanner(ScannerType.OWASP_ZAP).is_available(),
            ScannerType.TRIVY: cls.get_scanner(ScannerType.TRIVY).is_available(),
            ScannerType.TRUFFLEHOG: cls.get_scanner(ScannerType.TRUFFLEHOG).is_available(),
            ScannerType.NMAP: cls.get_scanner(ScannerType.NMAP).is_available(),
            ScannerType.SSL_LABS: cls.get_scanner(ScannerType.SSL_LABS).is_available(),
            ScannerType.SECURITY_HEADERS: cls.get_scanner(ScannerType.SECURITY_HEADERS).is_available(),
            ScannerType.GOOGLE_SAFE_BROWSING: cls.get_scanner(ScannerType.GOOGLE_SAFE_BROWSING).is_available(),
            ScannerType.SUBDOMAIN_TAKEOVER: cls.get_scanner(ScannerType.SUBDOMAIN_TAKEOVER).is_available(),
            ScannerType.BUSINESS_LOGIC_FUZZER: cls.get_scanner(ScannerType.BUSINESS_LOGIC_FUZZER).is_available(),
        }


# Export all
__all__ = [
    "ScannerType",
    "ScanResult",
    "ScannerInterface",
    "OWASPZAPScanner",
    "TrivyScanner",
    "TruffleHogScanner",
    "NmapScanner",
    "SSLLabsScanner",
    "SecurityHeadersScanner",
    "GoogleSafeBrowsingScanner",
    "SubdomainTakeoverScanner",
    "BusinessLogicFuzzer",
    "ExternalScannerFactory"
]
