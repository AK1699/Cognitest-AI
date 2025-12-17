"""
HTTP Request Integration
Make HTTP API calls to external services
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


@IntegrationRegistry.register("http_request")
class HTTPRequestIntegration(BaseIntegration):
    """
    HTTP Request integration for making API calls.
    Supports GET, POST, PUT, PATCH, DELETE methods.
    """
    
    @property
    def config(self) -> IntegrationConfig:
        return IntegrationConfig(
            type="http_request",
            name="HTTP Request",
            description="Make HTTP API calls to external services",
            category=IntegrationCategory.UTILITY,
            icon="globe",
            color="#3b82f6",
            auth_type="none",
            config_schema={
                "type": "object",
                "required": ["method", "url"],
                "properties": {
                    "method": {
                        "type": "string",
                        "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"],
                        "default": "GET",
                        "title": "HTTP Method"
                    },
                    "url": {
                        "type": "string",
                        "title": "URL",
                        "description": "The URL to send the request to"
                    },
                    "headers": {
                        "type": "object",
                        "title": "Headers",
                        "description": "Request headers as key-value pairs"
                    },
                    "body": {
                        "type": "string",
                        "title": "Body",
                        "description": "Request body (for POST, PUT, PATCH)"
                    },
                    "body_type": {
                        "type": "string",
                        "enum": ["json", "form", "raw"],
                        "default": "json",
                        "title": "Body Type"
                    },
                    "timeout": {
                        "type": "integer",
                        "default": 30,
                        "title": "Timeout (seconds)"
                    },
                    "follow_redirects": {
                        "type": "boolean",
                        "default": True,
                        "title": "Follow Redirects"
                    },
                    "ignore_ssl": {
                        "type": "boolean",
                        "default": False,
                        "title": "Ignore SSL Errors"
                    }
                }
            },
            credential_fields=[
                {"name": "bearer_token", "type": "password", "required": False, "title": "Bearer Token"},
                {"name": "basic_user", "type": "text", "required": False, "title": "Basic Auth Username"},
                {"name": "basic_password", "type": "password", "required": False, "title": "Basic Auth Password"},
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
        result.add_log("info", "Starting HTTP request")
        
        try:
            # Get configuration
            method = node_config.get("method", "GET").upper()
            url = self.interpolate_variables(node_config.get("url", ""), input_data)
            headers = node_config.get("headers", {})
            body = node_config.get("body")
            body_type = node_config.get("body_type", "json")
            timeout = node_config.get("timeout", 30)
            follow_redirects = node_config.get("follow_redirects", True)
            ignore_ssl = node_config.get("ignore_ssl", False)
            
            # Interpolate headers
            for key, value in headers.items():
                headers[key] = self.interpolate_variables(str(value), input_data)
            
            # Add authentication headers
            if credentials:
                if credentials.get("bearer_token"):
                    headers["Authorization"] = f"Bearer {credentials['bearer_token']}"
                elif credentials.get("basic_user") and credentials.get("basic_password"):
                    import base64
                    auth_str = f"{credentials['basic_user']}:{credentials['basic_password']}"
                    auth_bytes = base64.b64encode(auth_str.encode()).decode()
                    headers["Authorization"] = f"Basic {auth_bytes}"
            
            result.add_log("info", f"Making {method} request to {url}")
            
            # Prepare request body
            data = None
            json_data = None
            
            if body and method in ["POST", "PUT", "PATCH"]:
                body = self.interpolate_variables(body, input_data)
                if body_type == "json":
                    try:
                        json_data = json.loads(body)
                    except json.JSONDecodeError:
                        json_data = body
                elif body_type == "form":
                    data = dict(item.split("=") for item in body.split("&") if "=" in item)
                else:
                    data = body
            
            # Make request
            ssl_context = False if ignore_ssl else None
            timeout_config = aiohttp.ClientTimeout(total=timeout)
            
            async with aiohttp.ClientSession(timeout=timeout_config) as session:
                async with session.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=json_data,
                    data=data if not json_data else None,
                    allow_redirects=follow_redirects,
                    ssl=ssl_context
                ) as response:
                    result.http_status = response.status
                    result.response_headers = dict(response.headers)
                    
                    # Get response body
                    content_type = response.headers.get("Content-Type", "")
                    
                    if "application/json" in content_type:
                        response_data = await response.json()
                    else:
                        response_data = await response.text()
                    
                    result.data = {
                        "status_code": response.status,
                        "headers": dict(response.headers),
                        "body": response_data,
                        "url": str(response.url)
                    }
                    
                    result.success = 200 <= response.status < 300
                    result.add_log(
                        "info" if result.success else "warn",
                        f"Request completed with status {response.status}"
                    )
                    
                    if not result.success:
                        result.error = f"HTTP {response.status}: {response.reason}"
                        result.error_type = "http_error"
        
        except aiohttp.ClientTimeout:
            result.error = f"Request timed out after {timeout} seconds"
            result.error_type = "timeout"
            result.add_log("error", result.error)
        except aiohttp.ClientError as e:
            result.error = f"Connection error: {str(e)}"
            result.error_type = "connection_error"
            result.add_log("error", result.error)
        except Exception as e:
            result.error = f"Unexpected error: {str(e)}"
            result.error_type = "unknown_error"
            result.add_log("error", result.error)
        
        return result
    
    async def validate_config(self, node_config: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        if not node_config.get("url"):
            return False, "URL is required"
        
        method = node_config.get("method", "GET")
        if method not in ["GET", "POST", "PUT", "PATCH", "DELETE"]:
            return False, f"Invalid HTTP method: {method}"
        
        return True, None
