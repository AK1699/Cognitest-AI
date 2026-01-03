"""
Slack Integration
Send messages to Slack channels and users
"""
import aiohttp
from typing import Dict, Any, Optional, List
from .base import (
    BaseIntegration,
    IntegrationConfig,
    IntegrationCategory,
    IntegrationResult,
    IntegrationRegistry
)


@IntegrationRegistry.register("slack")
class SlackIntegration(BaseIntegration):
    """
    Slack integration for sending messages, notifications, and alerts.
    Uses Slack's Web API and webhooks.
    """
    
    @property
    def config(self) -> IntegrationConfig:
        return IntegrationConfig(
            type="slack",
            name="Slack",
            description="Send messages and notifications to Slack",
            category=IntegrationCategory.COMMUNICATION,
            icon="message-square",
            color="#4A154B",
            auth_type="oauth2",
            config_schema={
                "type": "object",
                "required": ["action"],
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["send_message", "send_webhook", "upload_file"],
                        "default": "send_message",
                        "title": "Action"
                    },
                    "channel": {
                        "type": "string",
                        "title": "Channel",
                        "description": "Channel ID or name (e.g., #general, C1234567890)"
                    },
                    "message": {
                        "type": "string",
                        "title": "Message",
                        "description": "Message text (supports Slack markdown)"
                    },
                    "blocks": {
                        "type": "string",
                        "title": "Block Kit JSON",
                        "description": "Optional Block Kit layout as JSON"
                    },
                    "webhook_url": {
                        "type": "string",
                        "title": "Webhook URL",
                        "description": "Slack incoming webhook URL (for webhook action)"
                    },
                    "thread_ts": {
                        "type": "string",
                        "title": "Thread Timestamp",
                        "description": "Reply to a specific message thread"
                    },
                    "username": {
                        "type": "string",
                        "title": "Bot Username",
                        "description": "Custom username for the message"
                    },
                    "icon_emoji": {
                        "type": "string",
                        "title": "Icon Emoji",
                        "description": "Emoji to use as the bot icon (e.g., :robot:)"
                    }
                }
            },
            credential_fields=[
                {"name": "bot_token", "type": "password", "required": True, "title": "Bot Token (xoxb-...)"},
                {"name": "webhook_url", "type": "text", "required": False, "title": "Default Webhook URL"},
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
        result.add_log("info", "Starting Slack integration")
        
        action = node_config.get("action", "send_message")
        
        if action == "send_message":
            return await self._send_message(node_config, input_data, credentials, result)
        elif action == "send_webhook":
            return await self._send_webhook(node_config, input_data, credentials, result)
        elif action == "upload_file":
            return await self._upload_file(node_config, input_data, credentials, result)
        else:
            result.error = f"Unknown action: {action}"
            result.error_type = "invalid_action"
            return result
    
    async def _send_message(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Optional[Dict[str, Any]],
        result: IntegrationResult
    ) -> IntegrationResult:
        if not credentials or not credentials.get("bot_token"):
            result.error = "Bot token is required"
            result.error_type = "missing_credentials"
            return result
        
        channel = node_config.get("channel")
        if not channel:
            result.error = "Channel is required"
            result.error_type = "missing_config"
            return result
        
        message = self.interpolate_variables(node_config.get("message", ""), input_data)
        
        # Build payload
        payload: Dict[str, Any] = {
            "channel": channel,
            "text": message
        }
        
        if node_config.get("blocks"):
            try:
                import json
                blocks = self.interpolate_variables(node_config["blocks"], input_data)
                payload["blocks"] = json.loads(blocks)
            except Exception as e:
                result.add_log("warn", f"Failed to parse blocks JSON: {e}")
        
        if node_config.get("thread_ts"):
            payload["thread_ts"] = node_config["thread_ts"]
        
        if node_config.get("username"):
            payload["username"] = node_config["username"]
        
        if node_config.get("icon_emoji"):
            payload["icon_emoji"] = node_config["icon_emoji"]
        
        result.add_log("info", f"Sending message to channel {channel}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://slack.com/api/chat.postMessage",
                    headers={
                        "Authorization": f"Bearer {credentials['bot_token']}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                ) as response:
                    response_data = await response.json()
                    
                    if response_data.get("ok"):
                        result.success = True
                        result.data = {
                            "ts": response_data.get("ts"),
                            "channel": response_data.get("channel"),
                            "message": message
                        }
                        result.add_log("info", "Message sent successfully")
                    else:
                        result.error = response_data.get("error", "Unknown Slack error")
                        result.error_type = "slack_api_error"
                        result.add_log("error", f"Slack API error: {result.error}")
        
        except Exception as e:
            result.error = f"Failed to send message: {str(e)}"
            result.error_type = "connection_error"
            result.add_log("error", result.error)
        
        return result
    
    async def _send_webhook(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Optional[Dict[str, Any]],
        result: IntegrationResult
    ) -> IntegrationResult:
        webhook_url = node_config.get("webhook_url") or (credentials and credentials.get("webhook_url"))
        
        if not webhook_url:
            result.error = "Webhook URL is required"
            result.error_type = "missing_config"
            return result
        
        message = self.interpolate_variables(node_config.get("message", ""), input_data)
        
        payload: Dict[str, Any] = {"text": message}
        
        if node_config.get("blocks"):
            try:
                import json
                blocks = self.interpolate_variables(node_config["blocks"], input_data)
                payload["blocks"] = json.loads(blocks)
            except Exception:
                pass
        
        result.add_log("info", "Sending webhook message")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_url,
                    json=payload
                ) as response:
                    if response.status == 200:
                        result.success = True
                        result.data = {"message": message}
                        result.add_log("info", "Webhook sent successfully")
                    else:
                        result.error = f"Webhook returned status {response.status}"
                        result.error_type = "webhook_error"
        
        except Exception as e:
            result.error = f"Failed to send webhook: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def _upload_file(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Optional[Dict[str, Any]],
        result: IntegrationResult
    ) -> IntegrationResult:
        # Placeholder for file upload functionality
        result.error = "File upload not yet implemented"
        result.error_type = "not_implemented"
        return result
    
    async def test_connection(self, credentials: Dict[str, Any]) -> IntegrationResult:
        result = IntegrationResult(success=False)
        
        if not credentials.get("bot_token"):
            result.error = "Bot token is required"
            return result
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    "https://slack.com/api/auth.test",
                    headers={"Authorization": f"Bearer {credentials['bot_token']}"}
                ) as response:
                    data = await response.json()
                    
                    if data.get("ok"):
                        result.success = True
                        result.data = {
                            "team": data.get("team"),
                            "user": data.get("user"),
                            "url": data.get("url")
                        }
                    else:
                        result.error = data.get("error", "Auth test failed")
        
        except Exception as e:
            result.error = f"Connection test failed: {str(e)}"
        
        return result
