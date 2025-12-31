"""
Native IAST Service
Interactive Application Security Testing with runtime instrumentation
"""
import asyncio
import secrets
import re
import json
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
from datetime import datetime
from dataclasses import dataclass, field
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.security_advanced_models import (
    IASTSession, IASTFinding, FindingSeverity, FindingStatus
)

logger = logging.getLogger(__name__)


# ============================================================================
# Attack Patterns for Runtime Detection
# ============================================================================

SQL_INJECTION_PATTERNS = [
    r"(?i)(\b(select|insert|update|delete|drop|union|exec|execute)\b.*\b(from|into|where|set)\b)",
    r"(?i)(--|#|/\*|\*/|;)",
    r"(?i)(\bor\b\s+\d+\s*=\s*\d+)",
    r"(?i)(\band\b\s+\d+\s*=\s*\d+)",
    r"(?i)(\'|\")(\s*)(or|and)(\s*)(\1)",
    r"(?i)(sleep\s*\(|benchmark\s*\(|waitfor\s+delay)",
]

XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"on(error|load|click|mouse|key|focus|blur|change|submit)\s*=",
    r"<img[^>]+onerror\s*=",
    r"<svg[^>]+onload\s*=",
    r"<iframe[^>]*>",
    r"document\.(cookie|location|write)",
    r"(eval|alert|confirm|prompt)\s*\(",
]

PATH_TRAVERSAL_PATTERNS = [
    r"\.\.\/",
    r"\.\.\\",
    r"%2e%2e%2f",
    r"%2e%2e/",
    r"..%2f",
    r"%2e%2e%5c",
    r"\.\.%5c",
]

COMMAND_INJECTION_PATTERNS = [
    r"[;&|`$]",
    r"\$\([^)]+\)",
    r"`[^`]+`",
    r"\|\s*\w+",
    r";\s*(ls|cat|rm|wget|curl|nc|bash|sh|python|perl|ruby)",
]

SSRF_PATTERNS = [
    r"(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)",
    r"(10\.\d{1,3}\.\d{1,3}\.\d{1,3})",
    r"(172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})",
    r"(192\.168\.\d{1,3}\.\d{1,3})",
    r"file://",
    r"gopher://",
    r"dict://",
]


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class RuntimeFinding:
    """Runtime vulnerability finding"""
    vulnerability_type: str
    severity: FindingSeverity
    http_method: str
    request_url: str
    request_headers: Optional[Dict] = None
    request_body: Optional[str] = None
    response_status: Optional[int] = None
    tainted_input: Optional[str] = None
    sink_location: Optional[str] = None
    data_flow: Optional[List[str]] = None
    title: str = ""
    description: Optional[str] = None
    remediation: Optional[str] = None
    stack_trace: Optional[str] = None


# ============================================================================
# Native IAST Service
# ============================================================================

class NativeIASTService:
    """
    Native IAST engine for runtime vulnerability detection.
    Instruments HTTP requests during test execution to detect vulnerabilities.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.active_sessions: Dict[str, Dict] = {}  # session_token -> session_data
        
        # Compile regex patterns
        self.sql_patterns = [re.compile(p, re.IGNORECASE) for p in SQL_INJECTION_PATTERNS]
        self.xss_patterns = [re.compile(p, re.IGNORECASE) for p in XSS_PATTERNS]
        self.path_patterns = [re.compile(p, re.IGNORECASE) for p in PATH_TRAVERSAL_PATTERNS]
        self.cmd_patterns = [re.compile(p, re.IGNORECASE) for p in COMMAND_INJECTION_PATTERNS]
        self.ssrf_patterns = [re.compile(p, re.IGNORECASE) for p in SSRF_PATTERNS]

    # ========================================================================
    # Session Management
    # ========================================================================

    async def start_session(
        self,
        project_id: UUID,
        organisation_id: UUID,
        name: str,
        app_url: str,
        config: Dict[str, Any] = None,
        created_by: UUID = None
    ) -> IASTSession:
        """Start a new IAST monitoring session"""
        
        # Generate human ID and session token
        human_id = await self._generate_human_id()
        session_token = secrets.token_urlsafe(32)
        
        session = IASTSession(
            project_id=project_id,
            organisation_id=organisation_id,
            human_id=human_id,
            name=name,
            app_url=app_url,
            session_token=session_token,
            config=config or {},
            detect_sql_injection=config.get("detect_sql_injection", True) if config else True,
            detect_xss=config.get("detect_xss", True) if config else True,
            detect_path_traversal=config.get("detect_path_traversal", True) if config else True,
            detect_command_injection=config.get("detect_command_injection", True) if config else True,
            status="active",
            started_at=datetime.utcnow(),
            created_by=created_by
        )
        
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        
        # Store in active sessions
        self.active_sessions[session_token] = {
            "id": session.id,
            "project_id": project_id,
            "config": config or {},
            "requests_analyzed": 0,
            "vulnerabilities_found": 0
        }
        
        return session

    async def stop_session(self, session_id: UUID) -> IASTSession:
        """Stop an IAST session"""
        
        result = await self.db.execute(
            select(IASTSession).where(IASTSession.id == session_id)
        )
        session = result.scalar_one_or_none()
        
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Update session
        session.status = "completed"
        session.ended_at = datetime.utcnow()
        
        # Get stats from active sessions
        if session.session_token in self.active_sessions:
            data = self.active_sessions[session.session_token]
            session.requests_analyzed = data.get("requests_analyzed", 0)
            session.vulnerabilities_found = data.get("vulnerabilities_found", 0)
            del self.active_sessions[session.session_token]
        
        await self.db.commit()
        return session

    async def get_session(self, session_id: UUID) -> Optional[IASTSession]:
        """Get session by ID"""
        result = await self.db.execute(
            select(IASTSession).where(IASTSession.id == session_id)
        )
        return result.scalar_one_or_none()

    async def get_active_sessions(self, project_id: UUID) -> List[IASTSession]:
        """Get all active sessions for a project"""
        result = await self.db.execute(
            select(IASTSession).where(
                IASTSession.project_id == project_id,
                IASTSession.status == "active"
            )
        )
        return result.scalars().all()

    # ========================================================================
    # Request Analysis
    # ========================================================================

    async def analyze_request(
        self,
        session_token: str,
        method: str,
        url: str,
        headers: Dict[str, str] = None,
        body: str = None,
        response_status: int = None,
        response_body: str = None
    ) -> List[RuntimeFinding]:
        """Analyze an HTTP request/response for vulnerabilities"""
        
        if session_token not in self.active_sessions:
            logger.warning(f"Unknown session token: {session_token[:10]}...")
            return []
        
        session_data = self.active_sessions[session_token]
        session_data["requests_analyzed"] += 1
        
        findings = []
        
        # Combine all inputs for analysis
        all_inputs = []
        if body:
            all_inputs.append(("body", body))
        if headers:
            for key, value in headers.items():
                all_inputs.append((f"header:{key}", value))
        
        # Parse query parameters from URL
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        for key, values in query_params.items():
            for value in values:
                all_inputs.append((f"query:{key}", value))
        
        # Check each input
        for input_location, input_value in all_inputs:
            # SQL Injection
            sqli = self._detect_sql_injection(input_value)
            if sqli:
                findings.append(RuntimeFinding(
                    vulnerability_type="SQL Injection",
                    severity=FindingSeverity.CRITICAL,
                    http_method=method,
                    request_url=url,
                    request_headers=headers,
                    request_body=body,
                    response_status=response_status,
                    tainted_input=input_value[:500],
                    sink_location=input_location,
                    title=f"SQL Injection detected in {input_location}",
                    description=f"Potentially malicious SQL pattern detected: {sqli[:100]}",
                    remediation="Use parameterized queries or prepared statements"
                ))
            
            # XSS
            xss = self._detect_xss(input_value, response_body)
            if xss:
                findings.append(RuntimeFinding(
                    vulnerability_type="Cross-Site Scripting (XSS)",
                    severity=FindingSeverity.HIGH,
                    http_method=method,
                    request_url=url,
                    request_headers=headers,
                    request_body=body,
                    response_status=response_status,
                    tainted_input=input_value[:500],
                    sink_location=input_location,
                    title=f"XSS detected - input reflected in response",
                    description=f"Potentially malicious script pattern: {xss[:100]}",
                    remediation="Encode output and implement Content-Security-Policy"
                ))
            
            # Path Traversal
            path_trav = self._detect_path_traversal(input_value)
            if path_trav:
                findings.append(RuntimeFinding(
                    vulnerability_type="Path Traversal",
                    severity=FindingSeverity.HIGH,
                    http_method=method,
                    request_url=url,
                    request_headers=headers,
                    request_body=body,
                    response_status=response_status,
                    tainted_input=input_value[:500],
                    sink_location=input_location,
                    title=f"Path traversal attempt in {input_location}",
                    description="Directory traversal sequence detected",
                    remediation="Validate and sanitize file paths, use allowlists"
                ))
            
            # Command Injection
            cmd_inj = self._detect_command_injection(input_value)
            if cmd_inj:
                findings.append(RuntimeFinding(
                    vulnerability_type="Command Injection",
                    severity=FindingSeverity.CRITICAL,
                    http_method=method,
                    request_url=url,
                    request_headers=headers,
                    request_body=body,
                    response_status=response_status,
                    tainted_input=input_value[:500],
                    sink_location=input_location,
                    title=f"Command injection pattern in {input_location}",
                    description="Shell command characters or patterns detected",
                    remediation="Avoid shell commands, use safe APIs, validate input"
                ))
            
            # SSRF
            ssrf = self._detect_ssrf(input_value)
            if ssrf:
                findings.append(RuntimeFinding(
                    vulnerability_type="Server-Side Request Forgery (SSRF)",
                    severity=FindingSeverity.HIGH,
                    http_method=method,
                    request_url=url,
                    request_headers=headers,
                    request_body=body,
                    response_status=response_status,
                    tainted_input=input_value[:500],
                    sink_location=input_location,
                    title=f"SSRF pattern detected in {input_location}",
                    description="Internal IP or dangerous protocol detected",
                    remediation="Validate URLs, use allowlists, block internal IPs"
                ))
        
        # Save findings to database
        for finding in findings:
            await self._save_finding(session_data["id"], finding)
            session_data["vulnerabilities_found"] += 1
        
        return findings

    # ========================================================================
    # Detection Methods
    # ========================================================================

    def _detect_sql_injection(self, input_value: str) -> Optional[str]:
        """Detect SQL injection patterns"""
        if not input_value:
            return None
        
        for pattern in self.sql_patterns:
            match = pattern.search(input_value)
            if match:
                return match.group(0)
        return None

    def _detect_xss(self, input_value: str, response_body: str = None) -> Optional[str]:
        """Detect XSS patterns"""
        if not input_value:
            return None
        
        for pattern in self.xss_patterns:
            match = pattern.search(input_value)
            if match:
                # If we have response body, check if input is reflected
                if response_body and input_value in response_body:
                    return match.group(0)
                elif not response_body:
                    return match.group(0)
        return None

    def _detect_path_traversal(self, input_value: str) -> Optional[str]:
        """Detect path traversal patterns"""
        if not input_value:
            return None
        
        for pattern in self.path_patterns:
            match = pattern.search(input_value)
            if match:
                return match.group(0)
        return None

    def _detect_command_injection(self, input_value: str) -> Optional[str]:
        """Detect command injection patterns"""
        if not input_value:
            return None
        
        for pattern in self.cmd_patterns:
            match = pattern.search(input_value)
            if match:
                return match.group(0)
        return None

    def _detect_ssrf(self, input_value: str) -> Optional[str]:
        """Detect SSRF patterns"""
        if not input_value:
            return None
        
        for pattern in self.ssrf_patterns:
            match = pattern.search(input_value)
            if match:
                return match.group(0)
        return None

    # ========================================================================
    # Helper Methods
    # ========================================================================

    async def _generate_human_id(self) -> str:
        """Generate human-readable ID for IAST session"""
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count()).select_from(IASTSession)
        )
        count = result.scalar() or 0
        return f"IAST-{count + 1:05d}"

    async def _save_finding(self, session_id: UUID, finding: RuntimeFinding) -> IASTFinding:
        """Save runtime finding to database"""
        
        db_finding = IASTFinding(
            session_id=session_id,
            vulnerability_type=finding.vulnerability_type,
            severity=finding.severity,
            http_method=finding.http_method,
            request_url=finding.request_url,
            request_headers=finding.request_headers,
            request_body=finding.request_body[:10000] if finding.request_body else None,
            response_status=finding.response_status,
            tainted_input=finding.tainted_input,
            sink_location=finding.sink_location,
            data_flow=finding.data_flow,
            title=finding.title,
            description=finding.description,
            remediation=finding.remediation,
            stack_trace=finding.stack_trace,
            status=FindingStatus.OPEN
        )
        
        self.db.add(db_finding)
        await self.db.commit()
        
        return db_finding

    async def get_session_findings(
        self,
        session_id: UUID,
        severity: Optional[FindingSeverity] = None,
        limit: int = 100
    ) -> List[IASTFinding]:
        """Get findings for an IAST session"""
        query = select(IASTFinding).where(IASTFinding.session_id == session_id)
        
        if severity:
            query = query.where(IASTFinding.severity == severity)
        
        query = query.limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()
