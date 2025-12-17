"""
Discord Integration
Send messages to Discord channels via webhooks
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


@IntegrationRegistry.register("discord")
class DiscordIntegration(BaseIntegration):
    """
    Discord integration for sending messages via webhooks.
    Supports embeds and mentions.
    """
    
    @property
    def config(self) -> IntegrationConfig:
        return IntegrationConfig(
            type="discord",
            name="Discord",
            description="Send messages to Discord channels",
            category=IntegrationCategory.COMMUNICATION,
            icon="message-circle",
            color="#5865F2",
            auth_type="api_key",
            config_schema={
                "type": "object",
                "required": ["content"],
                "properties": {
                    "content": {
                        "type": "string",
                        "title": "Message Content"
                    },
                    "username": {
                        "type": "string",
                        "title": "Bot Username"
                    },
                    "avatar_url": {
                        "type": "string",
                        "title": "Avatar URL"
                    },
                    "embed_title": {
                        "type": "string",
                        "title": "Embed Title"
                    },
                    "embed_description": {
                        "type": "string",
                        "title": "Embed Description"
                    },
                    "embed_color": {
                        "type": "integer",
                        "title": "Embed Color (decimal)",
                        "description": "Color in decimal format (e.g., 3447003 for blue)"
                    },
                    "embed_url": {
                        "type": "string",
                        "title": "Embed URL"
                    },
                    "tts": {
                        "type": "boolean",
                        "default": False,
                        "title": "Text-to-Speech"
                    }
                }
            },
            credential_fields=[
                {"name": "webhook_url", "type": "text", "required": True, "title": "Discord Webhook URL"},
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
        result.add_log("info", "Starting Discord integration")
        
        if not credentials or not credentials.get("webhook_url"):
            result.error = "Discord webhook URL is required"
            result.error_type = "missing_credentials"
            return result
        
        webhook_url = credentials["webhook_url"]
        content = self.interpolate_variables(node_config.get("content", ""), input_data)
        
        # Build payload
        payload: Dict[str, Any] = {}
        
        if content:
            payload["content"] = content
        
        if node_config.get("username"):
            payload["username"] = node_config["username"]
        
        if node_config.get("avatar_url"):
            payload["avatar_url"] = node_config["avatar_url"]
        
        if node_config.get("tts"):
            payload["tts"] = True
        
        # Build embed if any embed field is set
        if any(node_config.get(f"embed_{field}") for field in ["title", "description", "url"]):
            embed: Dict[str, Any] = {}
            
            if node_config.get("embed_title"):
                embed["title"] = self.interpolate_variables(node_config["embed_title"], input_data)
            
            if node_config.get("embed_description"):
                embed["description"] = self.interpolate_variables(node_config["embed_description"], input_data)
            
            if node_config.get("embed_url"):
                embed["url"] = node_config["embed_url"]
            
            if node_config.get("embed_color"):
                embed["color"] = node_config["embed_color"]
            
            payload["embeds"] = [embed]
        
        if not payload:
            result.error = "Message content or embed is required"
            result.error_type = "missing_config"
            return result
        
        result.add_log("info", "Sending Discord message")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status in [200, 204]:
                        result.success = True
                        result.data = {"sent": True, "content": content[:100]}
                        result.add_log("info", "Discord message sent successfully")
                    else:
                        error_text = await response.text()
                        result.error = f"Discord API error: {response.status} - {error_text}"
                        result.error_type = "discord_api_error"
        
        except Exception as e:
            result.error = f"Failed to send Discord message: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def test_connection(self, credentials: Dict[str, Any]) -> IntegrationResult:
        """Test webhook by getting webhook info"""
        result = IntegrationResult(success=False)
        
        webhook_url = credentials.get("webhook_url")
        if not webhook_url:
            result.error = "Webhook URL is required"
            return result
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(webhook_url) as response:
                    if response.status == 200:
                        data = await response.json()
                        result.success = True
                        result.data = {
                            "name": data.get("name"),
                            "channel_id": data.get("channel_id"),
                            "guild_id": data.get("guild_id")
                        }
                    else:
                        result.error = f"Invalid webhook: {response.status}"
        
        except Exception as e:
            result.error = f"Connection test failed: {str(e)}"
        
        return result
