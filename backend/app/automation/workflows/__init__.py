"""
Workflow Automation Package
n8n-style visual workflow builder for Cognitest
"""
from .engine import WorkflowEngine, ExecutionContext, NodeResult
from .scheduler import WorkflowScheduler, start_scheduler, stop_scheduler
from .security import (
    CredentialEncryption,
    encrypt_credentials,
    decrypt_credentials
)
from .integrations import (
    BaseIntegration,
    IntegrationConfig,
    IntegrationCategory,
    IntegrationResult,
    IntegrationRegistry,
    get_integration,
    get_all_integrations,
    get_integration_configs
)

__all__ = [
    # Engine
    "WorkflowEngine",
    "ExecutionContext",
    "NodeResult",
    
    # Scheduler
    "WorkflowScheduler",
    "start_scheduler",
    "stop_scheduler",
    
    # Security
    "CredentialEncryption",
    "encrypt_credentials",
    "decrypt_credentials",
    
    # Integrations
    "BaseIntegration",
    "IntegrationConfig",
    "IntegrationCategory",
    "IntegrationResult",
    "IntegrationRegistry",
    "get_integration",
    "get_all_integrations",
    "get_integration_configs",
]
