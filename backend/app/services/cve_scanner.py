"""
CVE Scanner Service
Detects software versions and matches against known vulnerabilities
"""
import aiohttp
import re
from typing import Dict, List, Optional
from datetime import datetime


class CVEScannerService:
    """Service for detecting CVEs in

 discovered services"""
    
    def __init__(self, nvd_api_key: Optional[str] = None):
        self.nvd_api_url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
        self.api_key = nvd_api_key
    
    async def detect_service_version(self, headers: Dict[str, str], banner: Optional[str] = None) -> Optional[Dict]:
        """
        Extract software name and version from HTTP headers or service banners
        Returns: {"software": str, "version": str} or None
        """
        # Check Server header
        server = headers.get("server", "")
        if server:
            # Parse common server formats
            # Examples: "nginx/1.18.0", "Apache/2.4.41", "Microsoft-IIS/10.0"
            match = re.match(r"([a-zA-Z\-]+)/?([\d\.]+)?", server)
            if match:
                software = match.group(1).lower()
                version = match.group(2) if match.group(2) else None
                return {"software": software, "version": version}
        
        # Check X-Powered-By header
        powered_by = headers.get("x-powered-by", "")
        if powered_by:
            # Examples: "PHP/7.4.3", "Express", "ASP.NET"
            match = re.match(r"([a-zA-Z\-\.]+)/?([\d\.]+)?", powered_by)
            if match:
                software = match.group(1).lower()
                version = match.group(2) if match.group(2) else None
                return {"software": software, "version": version}
        
        return None
    
    async def search_cves(self, software: str, version: Optional[str] = None) -> List[Dict]:
        """
        Query NVD API for CVEs related to software
        Returns list of CVE records
        """
        if not software:
            return []
        
        cves = []
        
        try:
            params = {
                "keywordSearch": f"{software} {version}" if version else software,
                "resultsPerPage": 10
            }
            
            headers = {}
            if self.api_key:
                headers["apiKey"] = self.api_key
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    self.nvd_api_url,
                    params=params,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        vulnerabilities = data.get("vulnerabilities", [])
                        
                        for vuln in vulnerabilities:
                            cve = vuln.get("cve", {})
                            cve_id = cve.get("id", "")
                            description = ""
                            
                            # Extract description
                            descriptions = cve.get("descriptions", [])
                            for desc in descriptions:
                                if desc.get("lang") == "en":
                                    description = desc.get("value", "")
                                    break
                            
                            # Extract CVSS score
                            cvss_score = 0.0
                            metrics = cve.get("metrics", {})
                            if "cvssMetricV31" in metrics:
                                cvss_data = metrics["cvssMetricV31"][0]
                                cvss_score = cvss_data.get("cvssScore", 0.0)
                            elif "cvssMetricV2" in metrics:
                                cvss_data = metrics["cvssMetricV2"][0]
                                cvss_score = cvss_data.get("cvssScore", 0.0)
                            
                            cves.append({
                                "cve_id": cve_id,
                                "description": description,
                                "cvss_score": cvss_score,
                                "severity": self._cvss_to_severity(cvss_score)
                            })
        
        except Exception as e:
            print(f"Error querying NVD API: {e}")
        
        return cves
    
    def _cvss_to_severity(self, cvss_score: float) -> str:
        """Convert CVSS score to severity level"""
        if cvss_score >= 9.0:
            return "critical"
        elif cvss_score >= 7.0:
            return "high"
        elif cvss_score >= 4.0:
            return "medium"
        elif cvss_score > 0.0:
            return "low"
        else:
            return "info"
