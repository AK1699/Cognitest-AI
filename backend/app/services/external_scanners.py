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

logger = logging.getLogger(__name__)


class ScannerType(str, Enum):
    """External scanner types"""
    OWASP_ZAP = "owasp_zap"
    TRIVY = "trivy"
    TRUFFLEHOG = "trufflehog"
    NMAP = "nmap"


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
        
        return cls._scanners[scanner_type]
    
    @classmethod
    def get_available_scanners(cls) -> Dict[ScannerType, bool]:
        """Get availability status of all scanners"""
        return {
            ScannerType.OWASP_ZAP: cls.get_scanner(ScannerType.OWASP_ZAP).is_available(),
            ScannerType.TRIVY: cls.get_scanner(ScannerType.TRIVY).is_available(),
            ScannerType.TRUFFLEHOG: cls.get_scanner(ScannerType.TRUFFLEHOG).is_available(),
            ScannerType.NMAP: cls.get_scanner(ScannerType.NMAP).is_available(),
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
    "ExternalScannerFactory"
]
