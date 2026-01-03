"""
Webhook Integration
Send webhooks to external services
"""
import aiohttp
import json
from typing import Dict, Any, Optional
from .base import (
    BaseIntegration,
    IntegrationConfig,
    IntegrationCategory,
    IntegrationResult,
    IntegrationRegistry
)


@IntegrationRegistry.register("webhook")
class WebhookIntegration(BaseIntegration):
    """
    Webhook integration for sending HTTP POST/PUT requests to external services.
    Simpler than full HTTP request, optimized for webhooks.
    """
    
    @property
    def config(self) -> IntegrationConfig:
        return IntegrationConfig(
            type="webhook",
            name="Webhook",
            description="Send webhooks to external services",
            category=IntegrationCategory.UTILITY,
            icon="globe",
            color="#10b981",
            auth_type="none",
            config_schema={
                "type": "object",
                "required": ["url"],
                "properties": {
                    "url": {
                        "type": "string",
                        "title": "Webhook URL"
                    },
                    "method": {
                        "type": "string",
                        "enum": ["POST", "PUT"],
                        "default": "POST",
                        "title": "Method"
                    },
                    "content_type": {
                        "type": "string",
                        "enum": ["application/json", "application/x-www-form-urlencoded"],
                        "default": "application/json",
                        "title": "Content Type"
                    },
                    "payload": {
                        "type": "string",
                        "title": "Payload (JSON)",
                        "description": "JSON payload to send"
                    },
                    "headers": {
                        "type": "string",
                        "title": "Additional Headers (JSON)"
                    },
                    "timeout": {
                        "type": "integer",
                        "default": 30,
                        "title": "Timeout (seconds)"
                    }
                }
            },
            credential_fields=[
                {"name": "auth_header", "type": "text", "required": False, "title": "Authorization Header"},
            ]
        )
    
    async def execute(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> IntegrationResult:
        result = IntegrationResult(success=False)
        result.add_log("info", "Starting webhook send")
        
        url = self.interpolate_variables(node_config.get("url", ""), input_data)
        if not url:
            result.error = "Webhook URL is required"
            result.error_type = "missing_config"
            return result
        
        method = node_config.get("method", "POST")
        content_type = node_config.get("content_type", "application/json")
        timeout = node_config.get("timeout", 30)
        
        # Build headers
        headers = {"Content-Type": content_type}
        
        if credentials and credentials.get("auth_header"):
            headers["Authorization"] = credentials["auth_header"]
        
        if node_config.get("headers"):
            try:
                extra_headers = json.loads(
                    self.interpolate_variables(node_config["headers"], input_data)
                )
                headers.update(extra_headers)
            except Exception:
                pass
        
        # Build payload
        payload = None
        if node_config.get("payload"):
            payload_str = self.interpolate_variables(node_config["payload"], input_data)
            try:
                payload = json.loads(payload_str)
            except Exception:
                payload = payload_str
        else:
            # Default: send input data
            payload = input_data
        
        result.add_log("info", f"Sending {method} to {url}")
        
        try:
            timeout_config = aiohttp.ClientTimeout(total=timeout)
            
            async with aiohttp.ClientSession(timeout=timeout_config) as session:
                async with session.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=payload if content_type == "application/json" else None,
                    data=payload if content_type != "application/json" else None
                ) as response:
                    result.http_status = response.status
                    
                    # Try to parse response
                    try:
                        response_data = await response.json()
                    except Exception:
                        response_data = await response.text()
                    
                    result.success = 200 <= response.status < 300
                    result.data = {
                        "status_code": response.status,
                        "response": response_data
                    }
                    
                    if result.success:
                        result.add_log("info", f"Webhook sent successfully, status {response.status}")
                    else:
                        result.error = f"Webhook returned {response.status}"
                        result.error_type = "http_error"
        
        except aiohttp.ClientTimeout:
            result.error = f"Webhook timed out after {timeout}s"
            result.error_type = "timeout"
        except Exception as e:
            result.error = f"Webhook failed: {str(e)}"
            result.error_type = "connection_error"
        
        return result
