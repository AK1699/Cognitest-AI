"""
Policy Engine Service
Security policy enforcement, custom rules, and quality gates
"""
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.security_advanced_models import (
    SecurityPolicy, PolicyRule, PolicySuppression, 
    FindingSeverity, PolicyAction, SASTScan, SCAScan
)

logger = logging.getLogger(__name__)


class PolicyEvaluationResult:
    def __init__(self):
        self.passed = True
        self.violations = []
        self.warnings = []
        self.details = {}


class PolicyEngineService:
    """Security policy enforcement and quality gates"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_policy(
        self,
        organisation_id: UUID,
        name: str,
        project_id: UUID = None,
        **settings
    ) -> SecurityPolicy:
        """Create security policy"""
        policy = SecurityPolicy(
            organisation_id=organisation_id,
            project_id=project_id,
            name=name,
            description=settings.get("description"),
            is_default=settings.get("is_default", False),
            is_enabled=settings.get("is_enabled", True),
            max_critical=settings.get("max_critical", 0),
            max_high=settings.get("max_high", 5),
            max_medium=settings.get("max_medium", 20),
            max_low=settings.get("max_low"),
            fail_on_threshold_breach=settings.get("fail_on_threshold_breach", True),
            require_sast_scan=settings.get("require_sast_scan", False),
            require_sca_scan=settings.get("require_sca_scan", False),
            require_secret_scan=settings.get("require_secret_scan", True),
            block_high_risk_licenses=settings.get("block_high_risk_licenses", False),
        )
        self.db.add(policy)
        await self.db.commit()
        await self.db.refresh(policy)
        return policy

    async def get_policy(self, policy_id: UUID) -> Optional[SecurityPolicy]:
        result = await self.db.execute(select(SecurityPolicy).where(SecurityPolicy.id == policy_id))
        return result.scalar_one_or_none()

    async def get_project_policy(self, project_id: UUID) -> Optional[SecurityPolicy]:
        """Get effective policy for project (project-specific or org default)"""
        # Try project-specific first
        result = await self.db.execute(
            select(SecurityPolicy).where(
                SecurityPolicy.project_id == project_id,
                SecurityPolicy.is_enabled == True
            )
        )
        policy = result.scalar_one_or_none()
        if policy:
            return policy
        
        # Fall back to org default
        result = await self.db.execute(
            select(SecurityPolicy).where(
                SecurityPolicy.is_default == True,
                SecurityPolicy.is_enabled == True
            )
        )
        return result.scalar_one_or_none()

    async def evaluate_sast_scan(self, scan_id: UUID, policy_id: UUID = None) -> PolicyEvaluationResult:
        """Evaluate SAST scan against policy"""
        result = PolicyEvaluationResult()
        
        # Get scan
        scan_result = await self.db.execute(select(SASTScan).where(SASTScan.id == scan_id))
        scan = scan_result.scalar_one_or_none()
        if not scan:
            result.passed = False
            result.violations.append("Scan not found")
            return result
        
        # Get policy
        if policy_id:
            policy = await self.get_policy(policy_id)
        else:
            policy = await self.get_project_policy(scan.project_id)
        
        if not policy:
            result.warnings.append("No policy configured - using defaults")
            return result
        
        # Get active suppressions
        suppressions = await self._get_active_suppressions(policy.id)
        
        # Check severity thresholds
        critical = scan.critical_count or 0
        high = scan.high_count or 0
        medium = scan.medium_count or 0
        low = scan.low_count or 0
        
        if policy.max_critical is not None and critical > policy.max_critical:
            result.passed = False if policy.fail_on_threshold_breach else True
            result.violations.append(f"Critical findings ({critical}) exceed threshold ({policy.max_critical})")
        
        if policy.max_high is not None and high > policy.max_high:
            result.passed = False if policy.fail_on_threshold_breach else True
            result.violations.append(f"High findings ({high}) exceed threshold ({policy.max_high})")
        
        if policy.max_medium is not None and medium > policy.max_medium:
            result.warnings.append(f"Medium findings ({medium}) exceed threshold ({policy.max_medium})")
        
        result.details = {
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
            "thresholds": {
                "max_critical": policy.max_critical,
                "max_high": policy.max_high,
                "max_medium": policy.max_medium
            },
            "suppressions_applied": len(suppressions)
        }
        
        return result

    async def evaluate_sca_scan(self, scan_id: UUID, policy_id: UUID = None) -> PolicyEvaluationResult:
        """Evaluate SCA scan against policy"""
        result = PolicyEvaluationResult()
        
        scan_result = await self.db.execute(select(SCAScan).where(SCAScan.id == scan_id))
        scan = scan_result.scalar_one_or_none()
        if not scan:
            result.passed = False
            result.violations.append("Scan not found")
            return result
        
        if policy_id:
            policy = await self.get_policy(policy_id)
        else:
            policy = await self.get_project_policy(scan.project_id)
        
        if not policy:
            return result
        
        # Check vulnerability thresholds
        if policy.max_critical is not None and (scan.critical_vulns or 0) > policy.max_critical:
            result.passed = False
            result.violations.append(f"Critical vulnerabilities ({scan.critical_vulns}) exceed threshold")
        
        if policy.max_high is not None and (scan.high_vulns or 0) > policy.max_high:
            result.passed = False
            result.violations.append(f"High vulnerabilities ({scan.high_vulns}) exceed threshold")
        
        # Check license issues
        if policy.block_high_risk_licenses and (scan.license_issues or 0) > 0:
            result.passed = False
            result.violations.append(f"High-risk licenses found ({scan.license_issues})")
        
        result.details = {
            "critical_vulns": scan.critical_vulns,
            "high_vulns": scan.high_vulns,
            "license_issues": scan.license_issues
        }
        
        return result

    async def add_suppression(
        self,
        policy_id: UUID,
        suppression_type: str,
        suppression_value: str,
        reason: str,
        expires_at: datetime = None,
        created_by: UUID = None
    ) -> PolicySuppression:
        """Add false positive or accepted risk suppression"""
        suppression = PolicySuppression(
            policy_id=policy_id,
            suppression_type=suppression_type,
            suppression_value=suppression_value,
            reason=reason,
            expires_at=expires_at,
            is_permanent=expires_at is None,
            created_by=created_by
        )
        self.db.add(suppression)
        await self.db.commit()
        return suppression

    async def add_rule(
        self,
        policy_id: UUID,
        name: str,
        rule_type: str,
        pattern: str = None,
        action: PolicyAction = PolicyAction.BLOCK,
        **config
    ) -> PolicyRule:
        """Add custom rule to policy"""
        rule = PolicyRule(
            policy_id=policy_id,
            name=name,
            rule_type=rule_type,
            pattern=pattern,
            pattern_type=config.get("pattern_type", "regex"),
            applies_to=config.get("applies_to", ["sast", "sca"]),
            action=action,
            is_enabled=config.get("is_enabled", True)
        )
        self.db.add(rule)
        await self.db.commit()
        return rule

    async def _get_active_suppressions(self, policy_id: UUID) -> List[PolicySuppression]:
        """Get active suppressions for policy"""
        now = datetime.utcnow()
        result = await self.db.execute(
            select(PolicySuppression).where(
                PolicySuppression.policy_id == policy_id,
                (PolicySuppression.is_permanent == True) | (PolicySuppression.expires_at > now)
            )
        )
        return result.scalars().all()

    async def list_policies(self, organisation_id: UUID) -> List[SecurityPolicy]:
        result = await self.db.execute(
            select(SecurityPolicy).where(SecurityPolicy.organisation_id == organisation_id)
        )
        return result.scalars().all()
