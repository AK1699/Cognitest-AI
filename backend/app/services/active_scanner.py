"""
Active Security Scanner
Performs active penetration testing for common web vulnerabilities
WARNING: Sends potentially malicious payloads - requires explicit user consent
"""
import aiohttp
import re
from typing import List, Dict, Optional
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse


class ActiveScanner:
    """Active penetration testing scanner"""
    
    # XSS Payloads
    XSS_PAYLOADS = [
        "<script>alert(1)</script>",
        "<img src=x onerror=alert(1)>",
        "javascript:alert(1)",
        "<svg/onload=alert(1)>",
        "'\"><script>alert(1)</script>"
    ]
    
    # SQL Injection Payloads
    SQLI_PAYLOADS = [
        "' OR '1'='1",
        "' OR 1=1--",
        "\" OR 1=1--",
        "' UNION SELECT NULL--",
        "1' AND '1'='2"
    ]
    
    # Error patterns indicating SQL injection
    SQL_ERROR_PATTERNS = [
        r"SQL syntax.*MySQL",
        r"Warning.*mysql_",
        r"MySQLSyntaxErrorException",
        r"PostgreSQL.*ERROR",
        r"Warning.*pg_",
        r"valid PostgreSQL result",
        r"Npgsql\.",
        r"Driver.*SQL[\-\_\ ]*Server",
        r"OLE DB.*SQL Server",
        r"SQLServer JDBC Driver",
        r"Microsoft SQL Native Client error",
        r"ODBC SQL Server Driver",
        r"SQLite\/JDBCDriver",
        r"SQLite.Exception",
        r"System.Data.SQLite.SQLiteException",
        r"Oracle error",
        r"Oracle.*Driver",
        r"Warning.*oci_"
    ]
    
    def __init__(self):
        self.vulnerabilities = []
    
    async def scan_xss(self, url: str) -> List[Dict]:
        """Test for Cross-Site Scripting (XSS) vulnerabilities"""
        vulnerabilities = []
        
        try:
            parsed = urlparse(url)
            query_params = parse_qs(parsed.query)
            
            # Only test if there are query parameters
            if not query_params:
                return vulnerabilities
            
            async with aiohttp.ClientSession() as session:
                for param_name in query_params.keys():
                    for payload in self.XSS_PAYLOADS:
                        # Build test URL with payload
                        test_params = query_params.copy()
                        test_params[param_name] = [payload]
                        
                        new_query = urlencode(test_params, doseq=True)
                        test_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))
                        
                        # Send request
                        async with session.get(test_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                            content = await response.text()
                            
                            # Check if payload is reflected in response
                            if payload.lower() in content.lower():
                                vulnerabilities.append({
                                    "type": "xss",
                                    "severity": "high",
                                    "parameter": param_name,
                                    "payload": payload,
                                    "description": f"Reflected XSS vulnerability in parameter '{param_name}'"
                                })
                                break  # Found vuln in this param, move to next
        
        except Exception as e:
            print(f"XSS scan error: {e}")
        
        return vulnerabilities
    
    async def scan_sqli(self, url: str) -> List[Dict]:
        """Test for SQL Injection vulnerabilities"""
        vulnerabilities = []
        
        try:
            parsed = urlparse(url)
            query_params = parse_qs(parsed.query)
            
            if not query_params:
                return vulnerabilities
            
            async with aiohttp.ClientSession() as session:
                for param_name in query_params.keys():
                    for payload in self.SQLI_PAYLOADS:
                        test_params = query_params.copy()
                        test_params[param_name] = [payload]
                        
                        new_query = urlencode(test_params, doseq=True)
                        test_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))
                        
                        async with session.get(test_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                            content = await response.text()
                            
                            # Check for SQL error messages
                            for pattern in self.SQL_ERROR_PATTERNS:
                                if re.search(pattern, content, re.IGNORECASE):
                                    vulnerabilities.append({
                                        "type": "sqli",
                                        "severity": "critical",
                                        "parameter": param_name,
                                        "payload": payload,
                                        "description": f"SQL Injection vulnerability in parameter '{param_name}'"
                                    })
                                    break
                            
                            if vulnerabilities:
                                break
        
        except Exception as e:
            print(f"SQLi scan error: {e}")
        
        return vulnerabilities
    
    async def check_csrf(self, url: str) -> List[Dict]:
        """Check for CSRF vulnerabilities"""
        vulnerabilities = []
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    content = await response.text()
                    headers = response.headers
                    
                    has_csrf_token = False
                    has_samesite_cookie = False
                    
                    # Check for CSRF tokens in content
                    csrf_patterns = [
                        r'name=["\']csrf["\']',
                        r'name=["\']_token["\']',
                        r'name=["\']authenticity_token["\']'
                    ]
                    
                    for pattern in csrf_patterns:
                        if re.search(pattern, content, re.IGNORECASE):
                            has_csrf_token = True
                            break
                    
                    # Check for SameSite cookie attribute
                    set_cookie = headers.get("Set-Cookie", "")
                    if "SameSite" in set_cookie:
                        has_samesite_cookie = True
                    
                    # Vulnerable if no CSRF protection
                    if not has_csrf_token and not has_samesite_cookie:
                        vulnerabilities.append({
                            "type": "csrf",
                            "severity": "medium",
                            "description": "No CSRF protection detected (no tokens or SameSite cookies)"
                        })
        
        except Exception as e:
            print(f"CSRF check error: {e}")
        
        return vulnerabilities
