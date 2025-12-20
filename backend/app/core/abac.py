"""
Attribute-Based Access Control (ABAC) Rules Module

Provides attribute-based access control for fine-grained permission checks,
including environment-based access controls (prod-access) as specified in role-based.md.

Example Rego rule from spec:
    deny["prod blocked"] {
        input.action == "Execute"
        input.resource.envId == "prod"
        "prod-access" != input.user.attributes[_]
    }
"""

from typing import Dict, List, Optional, Any
from uuid import UUID
from enum import Enum
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User


class Environment(str, Enum):
    """Test execution environments"""
    DEV = "dev"
    STAGING = "staging"
    PROD = "prod"


class ABACAction(str, Enum):
    """Actions that can be controlled via ABAC"""
    EXECUTE = "execute"
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    APPROVE = "approve"


class ABACDecision(str, Enum):
    """ABAC evaluation result"""
    ALLOW = "allow"
    DENY = "deny"


class ABACContext(BaseModel):
    """Context for ABAC evaluation"""
    user_id: UUID
    action: str
    resource_type: str
    resource_id: Optional[UUID] = None
    environment: Optional[str] = None
    project_id: Optional[UUID] = None
    organisation_id: Optional[UUID] = None
    attributes: Dict[str, Any] = {}  # Additional attributes


class ABACResult(BaseModel):
    """Result of ABAC evaluation"""
    decision: ABACDecision
    reason: Optional[str] = None
    required_attributes: List[str] = []


# User attributes that grant special access
class UserAttribute(str, Enum):
    """User attributes for ABAC rules"""
    PROD_ACCESS = "prod-access"         # Can execute in production
    LOAD_TEST_HIGH_VU = "load-test-high-vu"  # Can run load tests > 10k VU
    SECURITY_SCAN_PROD = "security-scan-prod"  # Can run security scans on prod
    SELF_HEAL_ACCEPT = "self-heal-accept"  # Can accept AI self-healing


class ABACRules:
    """
    ABAC Rule Evaluator
    
    Implements attribute-based access control rules from role-based.md spec.
    Rules are evaluated in order and the first matching deny rule stops evaluation.
    """
    
    def __init__(self):
        self.rules = [
            self._rule_prod_execution,
            self._rule_high_vu_load_test,
            self._rule_prod_security_scan,
            self._rule_self_heal_acceptance,
        ]
    
    async def evaluate(
        self,
        context: ABACContext,
        user_attributes: List[str],
        db: Optional[AsyncSession] = None
    ) -> ABACResult:
        """
        Evaluate all ABAC rules for the given context.
        
        Args:
            context: The access context (action, resource, environment, etc.)
            user_attributes: List of attributes assigned to the user
            db: Optional database session for additional lookups
            
        Returns:
            ABACResult with decision (allow/deny) and reason
        """
        for rule in self.rules:
            result = await rule(context, user_attributes)
            if result.decision == ABACDecision.DENY:
                return result
        
        # All rules passed - allow by default
        return ABACResult(
            decision=ABACDecision.ALLOW,
            reason="All ABAC rules passed"
        )
    
    async def _rule_prod_execution(
        self,
        context: ABACContext,
        user_attributes: List[str]
    ) -> ABACResult:
        """
        Rule: Deny production execution without prod-access attribute
        
        From role-based.md:
            deny["prod blocked"] {
                input.action == "Execute"
                input.resource.envId == "prod"
                "prod-access" != input.user.attributes[_]
            }
        """
        if (context.action.lower() == ABACAction.EXECUTE.value and 
            context.environment == Environment.PROD.value):
            
            if UserAttribute.PROD_ACCESS.value not in user_attributes:
                return ABACResult(
                    decision=ABACDecision.DENY,
                    reason="Production execution requires 'prod-access' attribute",
                    required_attributes=[UserAttribute.PROD_ACCESS.value]
                )
        
        return ABACResult(decision=ABACDecision.ALLOW)
    
    async def _rule_high_vu_load_test(
        self,
        context: ABACContext,
        user_attributes: List[str]
    ) -> ABACResult:
        """
        Rule: Deny high VU load tests (>10k VU) without approval attribute
        
        From role-based.md:
            Run load >10k VU: Project Admin ✅, QA Lead 🟡 approve, Auto Eng 🟡 approve
        """
        if (context.resource_type == "load_test" and 
            context.action.lower() == ABACAction.EXECUTE.value):
            
            vu_count = context.attributes.get("virtual_users", 0)
            
            if vu_count > 10000:
                if UserAttribute.LOAD_TEST_HIGH_VU.value not in user_attributes:
                    return ABACResult(
                        decision=ABACDecision.DENY,
                        reason=f"Load test with {vu_count} VUs requires approval",
                        required_attributes=[UserAttribute.LOAD_TEST_HIGH_VU.value]
                    )
        
        return ABACResult(decision=ABACDecision.ALLOW)
    
    async def _rule_prod_security_scan(
        self,
        context: ABACContext,
        user_attributes: List[str]
    ) -> ABACResult:
        """
        Rule: Deny production security scans without appropriate attribute
        
        From role-based.md:
            Start scan staging: Project Admin ✅, QA Lead ✅ (production requires additional approval)
        """
        if (context.resource_type == "security_scan" and 
            context.action.lower() == ABACAction.EXECUTE.value and
            context.environment == Environment.PROD.value):
            
            if UserAttribute.SECURITY_SCAN_PROD.value not in user_attributes:
                return ABACResult(
                    decision=ABACDecision.DENY,
                    reason="Production security scans require 'security-scan-prod' attribute",
                    required_attributes=[UserAttribute.SECURITY_SCAN_PROD.value]
                )
        
        return ABACResult(decision=ABACDecision.ALLOW)
    
    async def _rule_self_heal_acceptance(
        self,
        context: ABACContext,
        user_attributes: List[str]
    ) -> ABACResult:
        """
        Rule: Only specific roles can accept AI self-healing suggestions
        
        From role-based.md:
            Accept self-heal: Project Admin ✅, QA Lead ✅, Auto Eng ✅
        """
        if (context.resource_type == "self_heal" and 
            context.action.lower() == ABACAction.APPROVE.value):
            
            if UserAttribute.SELF_HEAL_ACCEPT.value not in user_attributes:
                return ABACResult(
                    decision=ABACDecision.DENY,
                    reason="Self-heal acceptance requires 'self-heal-accept' attribute",
                    required_attributes=[UserAttribute.SELF_HEAL_ACCEPT.value]
                )
        
        return ABACResult(decision=ABACDecision.ALLOW)


# Singleton instance
abac_rules = ABACRules()


async def check_abac(
    context: ABACContext,
    user_attributes: List[str],
    db: Optional[AsyncSession] = None
) -> ABACResult:
    """
    Convenience function to check ABAC rules.
    
    Usage:
        result = await check_abac(
            context=ABACContext(
                user_id=user.id,
                action="execute",
                resource_type="automation_flow",
                environment="prod",
                project_id=project_id
            ),
            user_attributes=["prod-access", "self-heal-accept"]
        )
        
        if result.decision == ABACDecision.DENY:
            raise PermissionDenied(result.reason)
    """
    return await abac_rules.evaluate(context, user_attributes, db)


def get_required_attributes_for_action(
    action: str,
    resource_type: str,
    environment: Optional[str] = None
) -> List[str]:
    """
    Get the list of attributes required for a given action/resource/environment.
    Useful for UI to show what attributes a user needs.
    """
    required = []
    
    if action.lower() == "execute" and environment == "prod":
        required.append(UserAttribute.PROD_ACCESS.value)
    
    if resource_type == "load_test" and action.lower() == "execute":
        required.append(UserAttribute.LOAD_TEST_HIGH_VU.value)
    
    if resource_type == "security_scan" and environment == "prod":
        required.append(UserAttribute.SECURITY_SCAN_PROD.value)
    
    if resource_type == "self_heal" and action.lower() == "approve":
        required.append(UserAttribute.SELF_HEAL_ACCEPT.value)
    
    return required
