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
