"""
Native SAST Service
Built-in Static Application Security Testing using Semgrep, Bandit, and custom rules
"""
import asyncio
import subprocess
import json
import tempfile
import shutil
import os
import re
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.security_advanced_models import (
    SASTScan, SASTFinding, SASTEngine, FindingSeverity, FindingStatus
)
from app.services.ai_service import get_ai_service

logger = logging.getLogger(__name__)


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class SASTResult:
    """Result from a SAST scan"""
    success: bool
    findings: List[Dict[str, Any]] = field(default_factory=list)
    files_scanned: int = 0
    lines_scanned: int = 0
    duration_ms: int = 0
    error: Optional[str] = None
    engine: str = ""


@dataclass
class CodeFinding:
    """Individual code finding"""
    rule_id: str
    rule_name: str
    engine: SASTEngine
    severity: FindingSeverity
    confidence: str
    file_path: str
    start_line: int
    end_line: Optional[int]
    start_column: Optional[int]
    end_column: Optional[int]
    code_snippet: Optional[str]
    title: str
    description: Optional[str]
    remediation: Optional[str]
    cwe_id: Optional[str]
    owasp_id: Optional[str]
    references: List[str] = field(default_factory=list)


# ============================================================================
# Semgrep Rules
# ============================================================================

SEMGREP_RULESETS = {
    "default": ["p/security-audit", "p/owasp-top-ten"],
    "owasp": ["p/owasp-top-ten"],
    "strict": ["p/security-audit", "p/owasp-top-ten", "p/secrets", "p/ci"],
    "python": ["p/python", "p/flask", "p/django", "p/security-audit"],
    "javascript": ["p/javascript", "p/react", "p/nodejs", "p/security-audit"],
    "typescript": ["p/typescript", "p/react", "p/nodejs", "p/security-audit"],
}


# ============================================================================
# Bandit Severity Mapping
# ============================================================================

BANDIT_SEVERITY_MAP = {
    "HIGH": FindingSeverity.HIGH,
    "MEDIUM": FindingSeverity.MEDIUM,
    "LOW": FindingSeverity.LOW,
}


# ============================================================================
# ESLint Security Rules
# ============================================================================

ESLINT_SECURITY_CONFIG = {
    "plugins": ["security", "no-unsanitized"],
    "extends": ["plugin:security/recommended"],
    "rules": {
        "security/detect-eval-with-expression": "error",
        "security/detect-non-literal-fs-filename": "warn",
        "security/detect-object-injection": "warn",
        "security/detect-possible-timing-attacks": "warn",
        "security/detect-unsafe-regex": "error",
        "no-unsanitized/method": "error",
        "no-unsanitized/property": "error",
    }
}


# ============================================================================
# Native SAST Service
# ============================================================================

class NativeSASTService:
    """
    Native SAST engine using Semgrep, Bandit, and custom rules.
    Provides static code analysis for security vulnerabilities.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai_service = get_ai_service()
        self._semgrep_available = None
        self._bandit_available = None
        self._eslint_available = None

    # ========================================================================
    # Availability Checks
    # ========================================================================

    def is_semgrep_available(self) -> bool:
        """Check if Semgrep is installed"""
        if self._semgrep_available is None:
            self._semgrep_available = shutil.which("semgrep") is not None
        return self._semgrep_available

    def is_bandit_available(self) -> bool:
        """Check if Bandit is installed"""
        if self._bandit_available is None:
            self._bandit_available = shutil.which("bandit") is not None
        return self._bandit_available

    def is_eslint_available(self) -> bool:
        """Check if ESLint is installed"""
        if self._eslint_available is None:
            self._eslint_available = shutil.which("eslint") is not None or shutil.which("npx") is not None
        return self._eslint_available

    def get_available_engines(self) -> List[str]:
        """Get list of available scanning engines"""
        engines = []
        if self.is_semgrep_available():
            engines.append("semgrep")
        if self.is_bandit_available():
            engines.append("bandit")
        if self.is_eslint_available():
            engines.append("eslint")
        engines.append("custom")  # Custom regex patterns always available
        return engines

    # ========================================================================
    # Main Scan Methods
    # ========================================================================

    async def create_scan(
        self,
        project_id: UUID,
        organisation_id: UUID,
        name: str,
        repo_path: str,
        engines: List[str] = None,
        languages: List[str] = None,
        ruleset: str = "default",
        exclude_patterns: List[str] = None,
        created_by: UUID = None
    ) -> SASTScan:
        """Create a new SAST scan record"""
        
        # Generate human ID
        human_id = await self._generate_human_id()
        
        scan = SASTScan(
            project_id=project_id,
            organisation_id=organisation_id,
            human_id=human_id,
            name=name,
            local_path=repo_path,
            engines=engines or self.get_available_engines(),
            languages=languages or [],
            ruleset=ruleset,
            exclude_patterns=exclude_patterns or [],
            status="pending",
            created_by=created_by
        )
        
        self.db.add(scan)
        await self.db.commit()
        await self.db.refresh(scan)
        
        return scan

    async def run_scan(self, scan_id: UUID) -> SASTScan:
        """Execute SAST scan with all configured engines"""
        
        # Get scan
        result = await self.db.execute(
            select(SASTScan).where(SASTScan.id == scan_id)
        )
        scan = result.scalar_one_or_none()
        
        if not scan:
            raise ValueError(f"Scan {scan_id} not found")
        
        # Update status
        scan.status = "running"
        scan.started_at = datetime.utcnow()
        await self.db.commit()
        
        all_findings: List[CodeFinding] = []
        total_files = 0
        total_lines = 0
        
        try:
            path = scan.local_path or scan.repo_url
            
            # Run each engine
            if "semgrep" in scan.engines and self.is_semgrep_available():
                semgrep_result = await self.run_semgrep(
                    path, 
                    scan.ruleset, 
                    scan.exclude_patterns
                )
                all_findings.extend(semgrep_result.findings)
                total_files += semgrep_result.files_scanned
                total_lines += semgrep_result.lines_scanned
            
            if "bandit" in scan.engines and self.is_bandit_available():
                # Only run Bandit for Python
                if not scan.languages or "python" in [l.lower() for l in scan.languages]:
                    bandit_result = await self.run_bandit(path, scan.exclude_patterns)
                    all_findings.extend(bandit_result.findings)
            
            if "eslint" in scan.engines and self.is_eslint_available():
                # Only run ESLint for JavaScript/TypeScript
                js_langs = ["javascript", "typescript", "js", "ts"]
                if not scan.languages or any(l.lower() in js_langs for l in scan.languages):
                    eslint_result = await self.run_eslint_security(path, scan.exclude_patterns)
                    all_findings.extend(eslint_result.findings)
            
            if "custom" in scan.engines:
                custom_result = await self.run_custom_rules(path, scan.exclude_patterns)
                all_findings.extend(custom_result.findings)
            
            # Deduplicate findings
            all_findings = self._deduplicate_findings(all_findings)
            
            # Save findings to database
            for finding_data in all_findings:
                await self._save_finding(scan, finding_data)
            
            # Update scan stats
            scan.status = "completed"
            scan.completed_at = datetime.utcnow()
            scan.total_findings = len(all_findings)
            scan.files_scanned = total_files
            scan.lines_scanned = total_lines
            
            # Count by severity
            severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
            for f in all_findings:
                sev = f.severity.value if isinstance(f.severity, FindingSeverity) else f.severity
                if sev in severity_counts:
                    severity_counts[sev] += 1
            
            scan.critical_count = severity_counts["critical"]
            scan.high_count = severity_counts["high"]
            scan.medium_count = severity_counts["medium"]
            scan.low_count = severity_counts["low"]
            scan.info_count = severity_counts["info"]
            
            if scan.started_at:
                scan.duration_ms = int((datetime.utcnow() - scan.started_at).total_seconds() * 1000)
            
            await self.db.commit()
            
        except Exception as e:
            logger.error(f"SAST scan failed: {e}")
            scan.status = "failed"
            scan.error_message = str(e)
            scan.completed_at = datetime.utcnow()
            await self.db.commit()
            raise
        
        return scan

    # ========================================================================
    # Semgrep Scanner
    # ========================================================================

    async def run_semgrep(
        self,
        path: str,
        ruleset: str = "default",
        exclude_patterns: List[str] = None
    ) -> SASTResult:
        """Run Semgrep scan on the specified path"""
        
        if not self.is_semgrep_available():
            return SASTResult(
                success=False,
                error="Semgrep is not installed. Install with: pip install semgrep",
                engine="semgrep"
            )
        
        try:
            # Build command
            cmd = ["semgrep", "--json", "--metrics=off"]
            
            # Add rulesets
            rulesets = SEMGREP_RULESETS.get(ruleset, SEMGREP_RULESETS["default"])
            for rs in rulesets:
                cmd.extend(["--config", rs])
            
            # Add exclusions
            if exclude_patterns:
                for pattern in exclude_patterns:
                    cmd.extend(["--exclude", pattern])
            
            # Default exclusions
            cmd.extend(["--exclude", "node_modules", "--exclude", "venv", "--exclude", ".git"])
            
            cmd.append(path)
            
            # Run semgrep
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=600  # 10 minute timeout
                )
            )
            
            # Parse output
            if result.stdout:
                output = json.loads(result.stdout)
                findings = []
                
                for match in output.get("results", []):
                    severity = self._map_semgrep_severity(match.get("extra", {}).get("severity", "WARNING"))
                    
                    finding = CodeFinding(
                        rule_id=match.get("check_id", "unknown"),
                        rule_name=match.get("extra", {}).get("message", match.get("check_id", "")),
                        engine=SASTEngine.SEMGREP,
                        severity=severity,
                        confidence=match.get("extra", {}).get("metadata", {}).get("confidence", "medium"),
                        file_path=match.get("path", ""),
                        start_line=match.get("start", {}).get("line", 1),
                        end_line=match.get("end", {}).get("line"),
                        start_column=match.get("start", {}).get("col"),
                        end_column=match.get("end", {}).get("col"),
                        code_snippet=match.get("extra", {}).get("lines", ""),
                        title=match.get("extra", {}).get("message", "Security Issue"),
                        description=match.get("extra", {}).get("metadata", {}).get("description"),
                        remediation=match.get("extra", {}).get("fix"),
                        cwe_id=self._extract_cwe(match.get("extra", {}).get("metadata", {})),
                        owasp_id=self._extract_owasp(match.get("extra", {}).get("metadata", {})),
                        references=match.get("extra", {}).get("metadata", {}).get("references", [])
                    )
                    findings.append(finding)
                
                # Get stats
                stats = output.get("stats", {})
                
                return SASTResult(
                    success=True,
                    findings=findings,
                    files_scanned=stats.get("total_files", 0),
                    lines_scanned=stats.get("total_lines", 0),
                    engine="semgrep"
                )
            
            return SASTResult(success=True, findings=[], engine="semgrep")
            
        except subprocess.TimeoutExpired:
            return SASTResult(success=False, error="Semgrep scan timed out", engine="semgrep")
        except Exception as e:
            logger.error(f"Semgrep scan failed: {e}")
            return SASTResult(success=False, error=str(e), engine="semgrep")

    def _map_semgrep_severity(self, severity: str) -> FindingSeverity:
        """Map Semgrep severity to internal severity"""
        mapping = {
            "ERROR": FindingSeverity.HIGH,
            "WARNING": FindingSeverity.MEDIUM,
            "INFO": FindingSeverity.LOW,
        }
        return mapping.get(severity.upper(), FindingSeverity.MEDIUM)

    # ========================================================================
    # Bandit Scanner (Python)
    # ========================================================================

    async def run_bandit(
        self,
        path: str,
        exclude_patterns: List[str] = None
    ) -> SASTResult:
        """Run Bandit scan on Python code"""
        
        if not self.is_bandit_available():
            return SASTResult(
                success=False,
                error="Bandit is not installed. Install with: pip install bandit",
                engine="bandit"
            )
        
        try:
            # Build command
            cmd = ["bandit", "-r", "-f", "json"]
            
            # Add exclusions
            if exclude_patterns:
                cmd.extend(["-x", ",".join(exclude_patterns)])
            
            # Default exclusions
            cmd.extend(["-x", ".venv,venv,tests,test"])
            
            cmd.append(path)
            
            # Run bandit
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=300
                )
            )
            
            # Parse output (Bandit returns non-zero if issues found)
            if result.stdout:
                output = json.loads(result.stdout)
                findings = []
                
                for issue in output.get("results", []):
                    severity = BANDIT_SEVERITY_MAP.get(
                        issue.get("issue_severity", "MEDIUM"),
                        FindingSeverity.MEDIUM
                    )
                    
                    finding = CodeFinding(
                        rule_id=issue.get("test_id", ""),
                        rule_name=issue.get("test_name", ""),
                        engine=SASTEngine.BANDIT,
                        severity=severity,
                        confidence=issue.get("issue_confidence", "medium").lower(),
                        file_path=issue.get("filename", ""),
                        start_line=issue.get("line_number", 1),
                        end_line=issue.get("line_range", [issue.get("line_number", 1)])[-1] if issue.get("line_range") else None,
                        start_column=issue.get("col_offset"),
                        end_column=issue.get("end_col_offset"),
                        code_snippet=issue.get("code", ""),
                        title=issue.get("issue_text", "Security Issue"),
                        description=issue.get("issue_text"),
                        remediation=None,
                        cwe_id=issue.get("issue_cwe", {}).get("id") if isinstance(issue.get("issue_cwe"), dict) else None,
                        owasp_id=None,
                        references=issue.get("more_info", "").split() if issue.get("more_info") else []
                    )
                    findings.append(finding)
                
                metrics = output.get("metrics", {})
                total_lines = sum(m.get("loc", 0) for m in metrics.values() if isinstance(m, dict))
                
                return SASTResult(
                    success=True,
                    findings=findings,
                    lines_scanned=total_lines,
                    engine="bandit"
                )
            
            return SASTResult(success=True, findings=[], engine="bandit")
            
        except subprocess.TimeoutExpired:
            return SASTResult(success=False, error="Bandit scan timed out", engine="bandit")
        except Exception as e:
            logger.error(f"Bandit scan failed: {e}")
            return SASTResult(success=False, error=str(e), engine="bandit")

    # ========================================================================
    # ESLint Security Scanner (JavaScript/TypeScript)
    # ========================================================================

    async def run_eslint_security(
        self,
        path: str,
        exclude_patterns: List[str] = None
    ) -> SASTResult:
        """Run ESLint with security plugins on JavaScript/TypeScript code"""
        
        if not self.is_eslint_available():
            return SASTResult(
                success=False,
                error="ESLint is not installed",
                engine="eslint"
            )
        
        try:
            # Create temp eslint config
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(ESLINT_SECURITY_CONFIG, f)
                config_path = f.name
            
            try:
                # Build command
                cmd = [
                    "npx", "eslint",
                    "--format", "json",
                    "--config", config_path,
                    "--ext", ".js,.jsx,.ts,.tsx",
                    "--no-error-on-unmatched-pattern"
                ]
                
                if exclude_patterns:
                    for pattern in exclude_patterns:
                        cmd.extend(["--ignore-pattern", pattern])
                
                cmd.extend(["--ignore-pattern", "node_modules/**"])
                cmd.append(path)
                
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
                if result.stdout:
                    try:
                        output = json.loads(result.stdout)
                        
                        for file_result in output:
                            for msg in file_result.get("messages", []):
                                # Only include security-related rules
                                if "security" in msg.get("ruleId", "") or "unsanitized" in msg.get("ruleId", ""):
                                    severity = FindingSeverity.HIGH if msg.get("severity") == 2 else FindingSeverity.MEDIUM
                                    
                                    finding = CodeFinding(
                                        rule_id=msg.get("ruleId", "unknown"),
                                        rule_name=msg.get("ruleId", "ESLint Security"),
                                        engine=SASTEngine.ESLINT,
                                        severity=severity,
                                        confidence="high",
                                        file_path=file_result.get("filePath", ""),
                                        start_line=msg.get("line", 1),
                                        end_line=msg.get("endLine"),
                                        start_column=msg.get("column"),
                                        end_column=msg.get("endColumn"),
                                        code_snippet=None,
                                        title=msg.get("message", "Security Issue"),
                                        description=msg.get("message"),
                                        remediation=msg.get("fix", {}).get("text") if msg.get("fix") else None,
                                        cwe_id=None,
                                        owasp_id=None,
                                        references=[]
                                    )
                                    findings.append(finding)
                    except json.JSONDecodeError:
                        pass
                
                return SASTResult(success=True, findings=findings, engine="eslint")
                
            finally:
                os.unlink(config_path)
                
        except subprocess.TimeoutExpired:
            return SASTResult(success=False, error="ESLint scan timed out", engine="eslint")
        except Exception as e:
            logger.error(f"ESLint scan failed: {e}")
            return SASTResult(success=False, error=str(e), engine="eslint")

    # ========================================================================
    # Custom Pattern Scanner
    # ========================================================================

    # Security patterns to detect
    SECURITY_PATTERNS = [
        # SQL Injection
        {
            "id": "custom.sql-injection",
            "name": "Potential SQL Injection",
            "pattern": r'(execute|query|cursor\.execute)\s*\(\s*["\'].*%s.*["\']|f["\'].*SELECT.*{',
            "severity": FindingSeverity.CRITICAL,
            "cwe": "CWE-89",
            "description": "SQL query appears to use string formatting which may be vulnerable to SQL injection",
        },
        # Command Injection
        {
            "id": "custom.command-injection",
            "name": "Potential Command Injection",
            "pattern": r'(os\.system|subprocess\.call|subprocess\.run|subprocess\.Popen)\s*\([^)]*\+|shell=True',
            "severity": FindingSeverity.CRITICAL,
            "cwe": "CWE-78",
            "description": "Command execution with user-controlled input may lead to command injection",
        },
        # Hardcoded Secrets
        {
            "id": "custom.hardcoded-secret",
            "name": "Hardcoded Secret",
            "pattern": r'(password|secret|api_key|apikey|access_token|auth_token)\s*=\s*["\'][^"\']{8,}["\']',
            "severity": FindingSeverity.HIGH,
            "cwe": "CWE-798",
            "description": "Hardcoded credential or secret detected",
        },
        # Insecure Random
        {
            "id": "custom.insecure-random",
            "name": "Insecure Random Number Generator",
            "pattern": r'random\.(random|randint|choice|shuffle)\s*\(',
            "severity": FindingSeverity.MEDIUM,
            "cwe": "CWE-330",
            "description": "Use of predictable random number generator for security-sensitive operation",
        },
        # Eval Usage
        {
            "id": "custom.eval-usage",
            "name": "Use of eval()",
            "pattern": r'\beval\s*\(',
            "severity": FindingSeverity.HIGH,
            "cwe": "CWE-95",
            "description": "Use of eval() can lead to code injection vulnerabilities",
        },
        # Pickle Usage
        {
            "id": "custom.pickle-usage",
            "name": "Unsafe Pickle Deserialization",
            "pattern": r'pickle\.(load|loads)\s*\(',
            "severity": FindingSeverity.HIGH,
            "cwe": "CWE-502",
            "description": "Pickle deserialization of untrusted data can lead to code execution",
        },
        # Weak Crypto
        {
            "id": "custom.weak-crypto",
            "name": "Weak Cryptographic Algorithm",
            "pattern": r'(md5|sha1)\s*\(|hashlib\.(md5|sha1)\s*\(',
            "severity": FindingSeverity.MEDIUM,
            "cwe": "CWE-327",
            "description": "Use of weak cryptographic algorithm (MD5 or SHA1)",
        },
        # SSRF Patterns
        {
            "id": "custom.ssrf",
            "name": "Potential SSRF",
            "pattern": r'(requests\.(get|post|put|delete)|urllib\.request\.urlopen|http\.client)\s*\([^)]*\+',
            "severity": FindingSeverity.HIGH,
            "cwe": "CWE-918",
            "description": "HTTP request with potentially user-controlled URL",
        },
        # Debug Mode
        {
            "id": "custom.debug-enabled",
            "name": "Debug Mode Enabled",
            "pattern": r'DEBUG\s*=\s*True|app\.run\([^)]*debug\s*=\s*True',
            "severity": FindingSeverity.MEDIUM,
            "cwe": "CWE-489",
            "description": "Debug mode should be disabled in production",
        },
    ]

    async def run_custom_rules(
        self,
        path: str,
        exclude_patterns: List[str] = None
    ) -> SASTResult:
        """Run custom regex-based security patterns"""
        
        findings = []
        files_scanned = 0
        
        try:
            # Walk the directory
            for root, dirs, files in os.walk(path):
                # Exclude patterns
                dirs[:] = [d for d in dirs if not self._should_exclude(d, exclude_patterns)]
                
                for filename in files:
                    # Only scan code files
                    if not self._is_code_file(filename):
                        continue
                    
                    filepath = os.path.join(root, filename)
                    
                    if self._should_exclude(filepath, exclude_patterns):
                        continue
                    
                    try:
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            lines = content.split('\n')
                            files_scanned += 1
                            
                            for pattern_def in self.SECURITY_PATTERNS:
                                pattern = re.compile(pattern_def["pattern"], re.IGNORECASE)
                                
                                for line_num, line in enumerate(lines, 1):
                                    if pattern.search(line):
                                        finding = CodeFinding(
                                            rule_id=pattern_def["id"],
                                            rule_name=pattern_def["name"],
                                            engine=SASTEngine.CUSTOM,
                                            severity=pattern_def["severity"],
                                            confidence="medium",
                                            file_path=os.path.relpath(filepath, path),
                                            start_line=line_num,
                                            end_line=line_num,
                                            start_column=None,
                                            end_column=None,
                                            code_snippet=line.strip()[:200],
                                            title=pattern_def["name"],
                                            description=pattern_def["description"],
                                            remediation=None,
                                            cwe_id=pattern_def.get("cwe"),
                                            owasp_id=None,
                                            references=[]
                                        )
                                        findings.append(finding)
                    except Exception as e:
                        logger.warning(f"Error scanning {filepath}: {e}")
                        continue
            
            return SASTResult(
                success=True,
                findings=findings,
                files_scanned=files_scanned,
                engine="custom"
            )
            
        except Exception as e:
            logger.error(f"Custom pattern scan failed: {e}")
            return SASTResult(success=False, error=str(e), engine="custom")

    def _is_code_file(self, filename: str) -> bool:
        """Check if file is a code file to scan"""
        code_extensions = {
            '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.go', '.rb', '.php',
            '.c', '.cpp', '.h', '.hpp', '.cs', '.scala', '.kt', '.swift',
            '.rs', '.vue', '.svelte'
        }
        return any(filename.endswith(ext) for ext in code_extensions)

    def _should_exclude(self, path: str, patterns: List[str] = None) -> bool:
        """Check if path should be excluded"""
        default_excludes = [
            'node_modules', 'venv', '.venv', '__pycache__', '.git',
            'dist', 'build', '.next', 'coverage', '.pytest_cache'
        ]
        
        for exclude in default_excludes:
            if exclude in path:
                return True
        
        if patterns:
            for pattern in patterns:
                if re.match(pattern, path):
                    return True
        
        return False

    # ========================================================================
    # AI-Powered Fix Suggestions
    # ========================================================================

    async def generate_ai_fix(self, finding: SASTFinding) -> Tuple[str, str]:
        """Generate AI-powered fix suggestion for a finding"""
        
        prompt = f"""You are a security expert. Analyze this security vulnerability and provide:
1. A clear explanation of why this is a security issue
2. A fixed code snippet that resolves the vulnerability

Vulnerability: {finding.title}
Rule: {finding.rule_id}
Severity: {finding.severity.value}
CWE: {finding.cwe_id or 'N/A'}

Code with issue:
```
{finding.code_snippet}
```

File: {finding.file_path}
Line: {finding.start_line}

Provide your response in this format:
EXPLANATION:
<your explanation>

FIXED CODE:
```
<fixed code>
```
"""
        
        try:
            response = await self.ai_service.generate_text(prompt)
            
            # Parse response
            explanation = ""
            fix = ""
            
            if "EXPLANATION:" in response:
                parts = response.split("FIXED CODE:")
                explanation = parts[0].replace("EXPLANATION:", "").strip()
                if len(parts) > 1:
                    fix = parts[1].strip()
                    # Clean up code blocks
                    fix = re.sub(r'^```\w*\n?', '', fix)
                    fix = re.sub(r'\n?```$', '', fix)
            
            return explanation, fix
            
        except Exception as e:
            logger.error(f"AI fix generation failed: {e}")
            return "", ""

    # ========================================================================
    # Helper Methods
    # ========================================================================

    async def _generate_human_id(self) -> str:
        """Generate human-readable ID for SAST scan"""
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count()).select_from(SASTScan)
        )
        count = result.scalar() or 0
        return f"SAST-{count + 1:05d}"

    async def _save_finding(self, scan: SASTScan, finding: CodeFinding) -> SASTFinding:
        """Save a finding to the database"""
        
        # Generate fingerprint for deduplication
        fingerprint = self._generate_fingerprint(finding)
        
        # Generate human ID
        result = await self.db.execute(
            select(SASTFinding).where(SASTFinding.scan_id == scan.id)
        )
        existing = result.scalars().all()
        
        db_finding = SASTFinding(
            scan_id=scan.id,
            human_id=f"SAST-F-{len(existing) + 1:05d}",
            rule_id=finding.rule_id,
            rule_name=finding.rule_name,
            engine=finding.engine,
            severity=finding.severity,
            confidence=finding.confidence,
            file_path=finding.file_path,
            start_line=finding.start_line,
            end_line=finding.end_line,
            start_column=finding.start_column,
            end_column=finding.end_column,
            code_snippet=finding.code_snippet,
            fingerprint=fingerprint,
            title=finding.title,
            description=finding.description,
            remediation=finding.remediation,
            cwe_id=finding.cwe_id,
            owasp_id=finding.owasp_id,
            references=finding.references,
            status=FindingStatus.OPEN
        )
        
        self.db.add(db_finding)
        await self.db.commit()
        
        return db_finding

    def _generate_fingerprint(self, finding: CodeFinding) -> str:
        """Generate unique fingerprint for finding deduplication"""
        content = f"{finding.rule_id}:{finding.file_path}:{finding.start_line}:{finding.code_snippet or ''}"
        return hashlib.sha256(content.encode()).hexdigest()[:32]

    def _deduplicate_findings(self, findings: List[CodeFinding]) -> List[CodeFinding]:
        """Remove duplicate findings based on fingerprint"""
        seen = set()
        unique = []
        
        for finding in findings:
            fp = self._generate_fingerprint(finding)
            if fp not in seen:
                seen.add(fp)
                unique.append(finding)
        
        return unique

    def _extract_cwe(self, metadata: dict) -> Optional[str]:
        """Extract CWE ID from metadata"""
        cwe = metadata.get("cwe")
        if isinstance(cwe, list) and cwe:
            return cwe[0]
        elif isinstance(cwe, str):
            return cwe
        return None

    def _extract_owasp(self, metadata: dict) -> Optional[str]:
        """Extract OWASP ID from metadata"""
        owasp = metadata.get("owasp")
        if isinstance(owasp, list) and owasp:
            return owasp[0]
        elif isinstance(owasp, str):
            return owasp
        return None

    # ========================================================================
    # Query Methods
    # ========================================================================

    async def get_scan(self, scan_id: UUID) -> Optional[SASTScan]:
        """Get SAST scan by ID"""
        result = await self.db.execute(
            select(SASTScan).where(SASTScan.id == scan_id)
        )
        return result.scalar_one_or_none()

    async def get_findings(
        self,
        scan_id: UUID,
        severity: Optional[FindingSeverity] = None,
        status: Optional[FindingStatus] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[SASTFinding]:
        """Get findings for a scan with optional filters"""
        query = select(SASTFinding).where(SASTFinding.scan_id == scan_id)
        
        if severity:
            query = query.where(SASTFinding.severity == severity)
        if status:
            query = query.where(SASTFinding.status == status)
        
        query = query.offset(offset).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def update_finding_status(
        self,
        finding_id: UUID,
        status: FindingStatus,
        suppression_reason: Optional[str] = None
    ) -> SASTFinding:
        """Update finding status"""
        result = await self.db.execute(
            select(SASTFinding).where(SASTFinding.id == finding_id)
        )
        finding = result.scalar_one_or_none()
        
        if not finding:
            raise ValueError(f"Finding {finding_id} not found")
        
        finding.status = status
        if suppression_reason:
            finding.suppression_reason = suppression_reason
        
        await self.db.commit()
        return finding
