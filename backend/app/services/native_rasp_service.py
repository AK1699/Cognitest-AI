"""
Native RASP Service
Runtime Application Self-Protection with attack detection and blocking
"""
import re
import time
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
from datetime import datetime, timedelta
from collections import defaultdict
from dataclasses import dataclass
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.security_advanced_models import (
    RASPConfig, RASPEvent, AttackType, FindingSeverity
)

logger = logging.getLogger(__name__)


# Attack patterns
ATTACK_PATTERNS = {
    AttackType.SQL_INJECTION: [
        re.compile(r"(?i)(\b(select|insert|update|delete|drop|union)\b.*\b(from|into|where)\b)"),
        re.compile(r"(?i)(--|#|/\*)"),
        re.compile(r"(?i)(\bor\b\s+\d+\s*=\s*\d+)"),
    ],
    AttackType.XSS: [
        re.compile(r"<script[^>]*>", re.IGNORECASE),
        re.compile(r"javascript:", re.IGNORECASE),
        re.compile(r"on(error|load|click)\s*=", re.IGNORECASE),
    ],
    AttackType.COMMAND_INJECTION: [
        re.compile(r"[;&|`$]"),
        re.compile(r";\s*(ls|cat|rm|wget|curl|bash)", re.IGNORECASE),
    ],
    AttackType.PATH_TRAVERSAL: [
        re.compile(r"\.\.\/"),
        re.compile(r"\.\.\\"),
    ],
    AttackType.SSRF: [
        re.compile(r"(localhost|127\.0\.0\.1|0\.0\.0\.0)", re.IGNORECASE),
        re.compile(r"(file|gopher)://", re.IGNORECASE),
    ],
}


@dataclass
class RASPAnalysisResult:
    is_attack: bool
    should_block: bool
    attack_type: Optional[AttackType] = None
    severity: Optional[FindingSeverity] = None
    matched_pattern: Optional[str] = None
    description: Optional[str] = None


class NativeRASPService:
    """Native RASP engine for runtime attack detection and blocking."""

    def __init__(self, db: AsyncSession = None):
        self.db = db
        self.configs: Dict[UUID, RASPConfig] = {}
        self.rate_limits: Dict[str, Dict] = defaultdict(lambda: {"count": 0, "start": time.time()})

    async def create_config(self, project_id: UUID, organisation_id: UUID, name: str, **settings) -> RASPConfig:
        """Create RASP configuration"""
        config = RASPConfig(
            project_id=project_id,
            organisation_id=organisation_id,
            name=name,
            is_enabled=settings.get("is_enabled", True),
            block_sql_injection=settings.get("block_sql_injection", True),
            block_xss=settings.get("block_xss", True),
            block_command_injection=settings.get("block_command_injection", True),
            block_path_traversal=settings.get("block_path_traversal", True),
            block_ssrf=settings.get("block_ssrf", True),
            enable_rate_limiting=settings.get("enable_rate_limiting", True),
            rate_limit_requests=settings.get("rate_limit_requests", 100),
            rate_limit_window=settings.get("rate_limit_window", 60),
        )
        self.db.add(config)
        await self.db.commit()
        await self.db.refresh(config)
        self.configs[project_id] = config
        return config

    async def get_config(self, project_id: UUID) -> Optional[RASPConfig]:
        if project_id in self.configs:
            return self.configs[project_id]
        result = await self.db.execute(
            select(RASPConfig).where(RASPConfig.project_id == project_id, RASPConfig.is_enabled == True)
        )
        config = result.scalar_one_or_none()
        if config:
            self.configs[project_id] = config
        return config

    def analyze_request(self, config: RASPConfig, source_ip: str, method: str, path: str,
                       headers: Dict = None, body: str = None) -> RASPAnalysisResult:
        """Analyze request for attacks"""
        if source_ip in (config.whitelist_ips or []):
            return RASPAnalysisResult(is_attack=False, should_block=False)

        all_inputs = [body or ""]
        if headers:
            all_inputs.extend(headers.values())
        combined = " ".join(str(i) for i in all_inputs)

        checks = [
            (AttackType.SQL_INJECTION, config.block_sql_injection),
            (AttackType.XSS, config.block_xss),
            (AttackType.COMMAND_INJECTION, config.block_command_injection),
            (AttackType.PATH_TRAVERSAL, config.block_path_traversal),
            (AttackType.SSRF, config.block_ssrf),
        ]

        for attack_type, should_check in checks:
            if should_check:
                for pattern in ATTACK_PATTERNS.get(attack_type, []):
                    match = pattern.search(combined)
                    if match:
                        severity = FindingSeverity.CRITICAL if attack_type in [AttackType.SQL_INJECTION, AttackType.COMMAND_INJECTION] else FindingSeverity.HIGH
                        return RASPAnalysisResult(
                            is_attack=True, should_block=True, attack_type=attack_type,
                            severity=severity, matched_pattern=match.group(0)[:200]
                        )
        return RASPAnalysisResult(is_attack=False, should_block=False)

    def check_rate_limit(self, config: RASPConfig, source_ip: str) -> Tuple[bool, Optional[str]]:
        if not config.enable_rate_limiting:
            return False, None
        now = time.time()
        limit = self.rate_limits[source_ip]
        if now - limit["start"] > config.rate_limit_window:
            limit["count"], limit["start"] = 1, now
            return False, None
        limit["count"] += 1
        if limit["count"] > config.rate_limit_requests:
            return True, "Rate limit exceeded"
        return False, None

    async def log_event(self, project_id: UUID, config_id: UUID, analysis: RASPAnalysisResult,
                       source_ip: str, method: str, path: str, headers: Dict = None) -> RASPEvent:
        event = RASPEvent(
            project_id=project_id, config_id=config_id, attack_type=analysis.attack_type,
            severity=analysis.severity, was_blocked=analysis.should_block, source_ip=source_ip,
            http_method=method, request_path=path, attack_payload=analysis.matched_pattern
        )
        self.db.add(event)
        await self.db.commit()
        return event

    async def get_events(self, project_id: UUID, since: datetime = None, limit: int = 100) -> List[RASPEvent]:
        query = select(RASPEvent).where(RASPEvent.project_id == project_id)
        if since:
            query = query.where(RASPEvent.occurred_at >= since)
        query = query.order_by(RASPEvent.occurred_at.desc()).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_event_stats(self, project_id: UUID, hours: int = 24) -> Dict[str, Any]:
        since = datetime.utcnow() - timedelta(hours=hours)
        events = await self.get_events(project_id, since=since, limit=10000)
        stats = {"total": len(events), "blocked": sum(1 for e in events if e.was_blocked)}
        return stats
