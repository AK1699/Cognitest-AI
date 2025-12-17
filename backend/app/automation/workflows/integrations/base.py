"""
Base Integration Module
Abstract base class and registry for workflow integrations
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Type
from dataclasses import dataclass, field
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class IntegrationCategory(str, Enum):
    """Categories of integrations"""
    COMMUNICATION = "communication"
    PROJECT_MANAGEMENT = "project_management"
    DEVELOPMENT = "development"
    DATABASE = "database"
    TESTING = "testing"
    UTILITY = "utility"
    CUSTOM = "custom"


@dataclass
class IntegrationResult:
    """Result from an integration execution"""
    success: bool
    data: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    error_type: Optional[str] = None
    http_status: Optional[int] = None
    response_headers: Optional[Dict[str, str]] = None
    logs: List[Dict[str, Any]] = field(default_factory=list)
    
    def add_log(self, level: str, message: str, data: Optional[Dict] = None):
        """Add a log entry"""
        from datetime import datetime
        self.logs.append({
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "message": message,
            "data": data
        })


@dataclass
class IntegrationConfig:
    """Configuration for an integration node"""
    type: str
    name: str
    description: str
    category: IntegrationCategory
    icon: str
    color: str
    auth_type: str  # none, api_key, oauth2, basic_auth, bearer_token, custom
    
    # JSON Schema for node configuration
    config_schema: Dict[str, Any] = field(default_factory=dict)
    
    # Fields required for credentials
    credential_fields: List[Dict[str, Any]] = field(default_factory=list)
    
    # Default configuration values
    defaults: Dict[str, Any] = field(default_factory=dict)


class BaseIntegration(ABC):
    """
    Abstract base class for workflow integrations.
    All integrations must implement this interface.
    """
    
    @property
    @abstractmethod
    def config(self) -> IntegrationConfig:
        """Return integration configuration"""
        pass
    
    @abstractmethod
    async def execute(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> IntegrationResult:
        """
        Execute the integration action.
        
        Args:
            node_config: Node-specific configuration from the workflow
            input_data: Input data from previous nodes
            credentials: Decrypted credentials for authentication
            context: Execution context (workflow info, user info, etc.)
            
        Returns:
            IntegrationResult with success status and output data
        """
        pass
    
    async def validate_config(self, node_config: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Validate node configuration.
        Override to add custom validation.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        return True, None
    
    async def validate_credentials(self, credentials: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Validate credentials.
        Override to add custom validation.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        return True, None
    
    async def test_connection(self, credentials: Dict[str, Any]) -> IntegrationResult:
        """
        Test the connection with provided credentials.
        Override to provide connection testing.
        """
        return IntegrationResult(
            success=True,
            data={"message": "Connection test not implemented"}
        )
    
    def interpolate_variables(self, template: str, data: Dict[str, Any]) -> str:
        """
        Interpolate variables in a template string.
        Supports {{variable.path}} syntax.
        """
        import re
        
        def replace_var(match):
            path = match.group(1).strip()
            parts = path.split('.')
            value = data
            try:
                for part in parts:
                    if isinstance(value, dict):
                        value = value.get(part, match.group(0))
                    elif isinstance(value, list) and part.isdigit():
                        value = value[int(part)]
                    else:
                        return match.group(0)
                return str(value) if value is not None else ""
            except (KeyError, IndexError, TypeError):
                return match.group(0)
        
        return re.sub(r'\{\{(.+?)\}\}', replace_var, template)


class IntegrationRegistry:
    """Registry for all available integrations"""
    
    _integrations: Dict[str, Type[BaseIntegration]] = {}
    _instances: Dict[str, BaseIntegration] = {}
    
    @classmethod
    def register(cls, integration_type: str):
        """Decorator to register an integration"""
        def decorator(integration_class: Type[BaseIntegration]):
            cls._integrations[integration_type] = integration_class
            return integration_class
        return decorator
    
    @classmethod
    def get(cls, integration_type: str) -> Optional[BaseIntegration]:
        """Get an integration instance by type"""
        if integration_type not in cls._instances:
            if integration_type in cls._integrations:
                cls._instances[integration_type] = cls._integrations[integration_type]()
            else:
                return None
        return cls._instances[integration_type]
    
    @classmethod
    def get_all(cls) -> List[BaseIntegration]:
        """Get all registered integrations"""
        return [cls.get(t) for t in cls._integrations.keys()]
    
    @classmethod
    def get_configs(cls) -> List[IntegrationConfig]:
        """Get configurations for all integrations"""
        return [cls.get(t).config for t in cls._integrations.keys()]
    
    @classmethod
    def list_types(cls) -> List[str]:
        """List all registered integration types"""
        return list(cls._integrations.keys())
