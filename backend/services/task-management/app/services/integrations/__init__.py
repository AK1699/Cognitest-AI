"""
Workflow Integrations Package
Exports all available integrations
"""
from .base import (
    BaseIntegration,
    IntegrationConfig,
    IntegrationCategory,
    IntegrationResult,
    IntegrationRegistry
)

# Import all integrations to register them
from .http_request import HTTPRequestIntegration
from .slack import SlackIntegration
from .email import EmailIntegration
from .jira import JiraIntegration
from .github import GitHubIntegration
from .postgresql import PostgreSQLIntegration
from .webhook import WebhookIntegration
from .discord import DiscordIntegration
from .gitlab import GitLabIntegration
from .mysql import MySQLIntegration

__all__ = [
    # Base classes
    "BaseIntegration",
    "IntegrationConfig",
    "IntegrationCategory",
    "IntegrationResult",
    "IntegrationRegistry",
    
    # Integrations
    "HTTPRequestIntegration",
    "SlackIntegration",
    "EmailIntegration",
    "JiraIntegration",
    "GitHubIntegration",
    "PostgreSQLIntegration",
    "WebhookIntegration",
    "DiscordIntegration",
    "GitLabIntegration",
    "MySQLIntegration",
]


def get_integration(integration_type: str) -> BaseIntegration | None:
    """Get an integration by type"""
    return IntegrationRegistry.get(integration_type)


def get_all_integrations() -> list[BaseIntegration]:
    """Get all registered integrations"""
    return IntegrationRegistry.get_all()


def get_integration_configs() -> list[IntegrationConfig]:
    """Get configurations for all integrations"""
    return IntegrationRegistry.get_configs()

