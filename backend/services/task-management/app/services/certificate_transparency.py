"""
Certificate Transparency Log Service
Discovers subdomains by querying public CT logs for SSL certificates
"""
import aiohttp
import re
from typing import List, Set
from urllib.parse import urlparse


class CertificateTransparencyService:
    """Service for querying Certificate Transparency logs"""
    
    def __init__(self):
        self.ct_api_url = "https://crt.sh"
    
    async def discover_subdomains(self, domain: str) -> List[str]:
        """
        Query crt.sh for all certificates issued for a domain
        Returns a list of unique subdomains
        """
        # Remove www prefix if present
        if domain.startswith("www."):
            domain = domain[4:]
        
        # Remove protocol if present
        parsed = urlparse(domain)
        if parsed.netloc:
            domain = parsed.netloc
        
        subdomains: Set[str] = set()
        
        try:
            # Query crt.sh API
            params = {
                "q": f"%.{domain}",
                "output": "json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    self.ct_api_url,
                    params=params,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        certificates = await response.json()
                        
                        # Extract unique subdomains from certificates
                        for cert in certificates:
                            name_value = cert.get("name_value", "")
                            
                            # Split by newline (crt.sh returns multiple names)
                            for name in name_value.split("\n"):
                                name = name.strip().lower()
                                
                                # Remove wildcard prefix
                                if name.startswith("*."):
                                    name = name[2:]
                                
                                # Only include if it's actually a subdomain of our domain
                                if name.endswith(domain) and name != domain:
                                    # Validate domain format
                                    if self._is_valid_domain(name):
                                        subdomains.add(name)
        
        except Exception as e:
            print(f"Error querying Certificate Transparency logs: {e}")
        
        return sorted(list(subdomains))
    
    def _is_valid_domain(self, domain: str) -> bool:
        """Validate domain format"""
        # Basic domain validation
        domain_pattern = re.compile(
            r'^(?:[a-zA-Z0-9]'  # First character
            r'(?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)'  # Subdomains
            r'+[a-zA-Z]{2,}$'  # TLD
        )
        return bool(domain_pattern.match(domain))
