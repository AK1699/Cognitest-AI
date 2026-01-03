"""
Jira Integration
Create and update Jira issues
"""
import aiohttp
from typing import Dict, Any, Optional
from .base import (
    BaseIntegration,
    IntegrationConfig,
    IntegrationCategory,
    IntegrationResult,
    IntegrationRegistry
)


@IntegrationRegistry.register("jira")
class JiraIntegration(BaseIntegration):
    """
    Jira integration for issue tracking.
    Supports creating, updating, and transitioning issues.
    """
    
    @property
    def config(self) -> IntegrationConfig:
        return IntegrationConfig(
            type="jira",
            name="Jira",
            description="Create and manage Jira issues",
            category=IntegrationCategory.PROJECT_MANAGEMENT,
            icon="file-text",
            color="#0052CC",
            auth_type="api_key",
            config_schema={
                "type": "object",
                "required": ["action"],
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["create_issue", "update_issue", "add_comment", "transition_issue", "get_issue"],
                        "default": "create_issue",
                        "title": "Action"
                    },
                    "project_key": {
                        "type": "string",
                        "title": "Project Key",
                        "description": "Jira project key (e.g., TEST, PROJ)"
                    },
                    "issue_type": {
                        "type": "string",
                        "enum": ["Bug", "Task", "Story", "Epic", "Sub-task"],
                        "default": "Bug",
                        "title": "Issue Type"
                    },
                    "issue_key": {
                        "type": "string",
                        "title": "Issue Key",
                        "description": "Existing issue key for update/transition (e.g., TEST-123)"
                    },
                    "summary": {
                        "type": "string",
                        "title": "Summary"
                    },
                    "description": {
                        "type": "string",
                        "title": "Description"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["Highest", "High", "Medium", "Low", "Lowest"],
                        "title": "Priority"
                    },
                    "assignee": {
                        "type": "string",
                        "title": "Assignee",
                        "description": "Account ID or email of assignee"
                    },
                    "labels": {
                        "type": "string",
                        "title": "Labels",
                        "description": "Comma-separated labels"
                    },
                    "transition_name": {
                        "type": "string",
                        "title": "Transition Name",
                        "description": "Name of transition (e.g., Done, In Progress)"
                    },
                    "comment": {
                        "type": "string",
                        "title": "Comment",
                        "description": "Comment text to add"
                    },
                    "custom_fields": {
                        "type": "string",
                        "title": "Custom Fields (JSON)",
                        "description": "Additional fields as JSON object"
                    }
                }
            },
            credential_fields=[
                {"name": "domain", "type": "text", "required": True, "title": "Jira Domain (e.g., company.atlassian.net)"},
                {"name": "email", "type": "text", "required": True, "title": "Email"},
                {"name": "api_token", "type": "password", "required": True, "title": "API Token"},
            ]
        )
    
    def _get_auth(self, credentials: Dict[str, Any]) -> aiohttp.BasicAuth:
        """Get basic auth from credentials"""
        return aiohttp.BasicAuth(
            credentials.get("email", ""),
            credentials.get("api_token", "")
        )
    
    def _get_base_url(self, credentials: Dict[str, Any]) -> str:
        """Get Jira base URL"""
        domain = credentials.get("domain", "").rstrip("/")
        if not domain.startswith("http"):
            domain = f"https://{domain}"
        return domain
    
    async def execute(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> IntegrationResult:
        result = IntegrationResult(success=False)
        result.add_log("info", "Starting Jira integration")
        
        if not credentials:
            result.error = "Jira credentials are required"
            result.error_type = "missing_credentials"
            return result
        
        action = node_config.get("action", "create_issue")
        
        if action == "create_issue":
            return await self._create_issue(node_config, input_data, credentials, result)
        elif action == "update_issue":
            return await self._update_issue(node_config, input_data, credentials, result)
        elif action == "add_comment":
            return await self._add_comment(node_config, input_data, credentials, result)
        elif action == "transition_issue":
            return await self._transition_issue(node_config, input_data, credentials, result)
        elif action == "get_issue":
            return await self._get_issue(node_config, input_data, credentials, result)
        else:
            result.error = f"Unknown action: {action}"
            result.error_type = "invalid_action"
            return result
    
    async def _create_issue(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        project_key = node_config.get("project_key")
        if not project_key:
            result.error = "Project key is required"
            result.error_type = "missing_config"
            return result
        
        summary = self.interpolate_variables(node_config.get("summary", ""), input_data)
        description = self.interpolate_variables(node_config.get("description", ""), input_data)
        
        # Build issue fields
        fields: Dict[str, Any] = {
            "project": {"key": project_key},
            "summary": summary,
            "issuetype": {"name": node_config.get("issue_type", "Bug")}
        }
        
        if description:
            fields["description"] = {
                "type": "doc",
                "version": 1,
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": description}]}]
            }
        
        if node_config.get("priority"):
            fields["priority"] = {"name": node_config["priority"]}
        
        if node_config.get("assignee"):
            fields["assignee"] = {"accountId": node_config["assignee"]}
        
        if node_config.get("labels"):
            fields["labels"] = [l.strip() for l in node_config["labels"].split(",")]
        
        # Parse custom fields
        if node_config.get("custom_fields"):
            try:
                import json
                custom = json.loads(self.interpolate_variables(node_config["custom_fields"], input_data))
                fields.update(custom)
            except Exception as e:
                result.add_log("warn", f"Failed to parse custom fields: {e}")
        
        base_url = self._get_base_url(credentials)
        auth = self._get_auth(credentials)
        
        result.add_log("info", f"Creating issue in project {project_key}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{base_url}/rest/api/3/issue",
                    auth=auth,
                    json={"fields": fields},
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_data = await response.json()
                    
                    if response.status == 201:
                        result.success = True
                        result.data = {
                            "id": response_data.get("id"),
                            "key": response_data.get("key"),
                            "self": response_data.get("self"),
                            "url": f"{base_url}/browse/{response_data.get('key')}"
                        }
                        result.add_log("info", f"Issue created: {response_data.get('key')}")
                    else:
                        errors = response_data.get("errors", {})
                        error_messages = response_data.get("errorMessages", [])
                        result.error = str(errors or error_messages or f"HTTP {response.status}")
                        result.error_type = "jira_api_error"
                        result.add_log("error", f"Jira API error: {result.error}")
        
        except Exception as e:
            result.error = f"Failed to create issue: {str(e)}"
            result.error_type = "connection_error"
            result.add_log("error", result.error)
        
        return result
    
    async def _update_issue(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        issue_key = self.interpolate_variables(node_config.get("issue_key", ""), input_data)
        if not issue_key:
            result.error = "Issue key is required"
            result.error_type = "missing_config"
            return result
        
        fields: Dict[str, Any] = {}
        
        if node_config.get("summary"):
            fields["summary"] = self.interpolate_variables(node_config["summary"], input_data)
        
        if node_config.get("description"):
            desc = self.interpolate_variables(node_config["description"], input_data)
            fields["description"] = {
                "type": "doc",
                "version": 1,
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": desc}]}]
            }
        
        if node_config.get("priority"):
            fields["priority"] = {"name": node_config["priority"]}
        
        if node_config.get("assignee"):
            fields["assignee"] = {"accountId": node_config["assignee"]}
        
        if not fields:
            result.error = "No fields to update"
            result.error_type = "missing_config"
            return result
        
        base_url = self._get_base_url(credentials)
        auth = self._get_auth(credentials)
        
        result.add_log("info", f"Updating issue {issue_key}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.put(
                    f"{base_url}/rest/api/3/issue/{issue_key}",
                    auth=auth,
                    json={"fields": fields},
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 204:
                        result.success = True
                        result.data = {"key": issue_key, "updated": True}
                        result.add_log("info", f"Issue {issue_key} updated")
                    else:
                        response_data = await response.json()
                        result.error = str(response_data.get("errors", f"HTTP {response.status}"))
                        result.error_type = "jira_api_error"
        
        except Exception as e:
            result.error = f"Failed to update issue: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def _add_comment(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        issue_key = self.interpolate_variables(node_config.get("issue_key", ""), input_data)
        comment = self.interpolate_variables(node_config.get("comment", ""), input_data)
        
        if not issue_key or not comment:
            result.error = "Issue key and comment are required"
            result.error_type = "missing_config"
            return result
        
        base_url = self._get_base_url(credentials)
        auth = self._get_auth(credentials)
        
        body = {
            "body": {
                "type": "doc",
                "version": 1,
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": comment}]}]
            }
        }
        
        result.add_log("info", f"Adding comment to {issue_key}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{base_url}/rest/api/3/issue/{issue_key}/comment",
                    auth=auth,
                    json=body,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 201:
                        response_data = await response.json()
                        result.success = True
                        result.data = {"id": response_data.get("id"), "key": issue_key}
                        result.add_log("info", "Comment added successfully")
                    else:
                        result.error = f"HTTP {response.status}"
                        result.error_type = "jira_api_error"
        
        except Exception as e:
            result.error = f"Failed to add comment: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def _transition_issue(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        issue_key = self.interpolate_variables(node_config.get("issue_key", ""), input_data)
        transition_name = node_config.get("transition_name", "")
        
        if not issue_key or not transition_name:
            result.error = "Issue key and transition name are required"
            result.error_type = "missing_config"
            return result
        
        base_url = self._get_base_url(credentials)
        auth = self._get_auth(credentials)
        
        result.add_log("info", f"Getting transitions for {issue_key}")
        
        try:
            async with aiohttp.ClientSession() as session:
                # Get available transitions
                async with session.get(
                    f"{base_url}/rest/api/3/issue/{issue_key}/transitions",
                    auth=auth
                ) as response:
                    data = await response.json()
                    transitions = data.get("transitions", [])
                    
                    transition_id = None
                    for t in transitions:
                        if t.get("name", "").lower() == transition_name.lower():
                            transition_id = t.get("id")
                            break
                    
                    if not transition_id:
                        result.error = f"Transition '{transition_name}' not found"
                        result.error_type = "invalid_transition"
                        return result
                
                # Execute transition
                async with session.post(
                    f"{base_url}/rest/api/3/issue/{issue_key}/transitions",
                    auth=auth,
                    json={"transition": {"id": transition_id}},
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 204:
                        result.success = True
                        result.data = {"key": issue_key, "transition": transition_name}
                        result.add_log("info", f"Issue transitioned to {transition_name}")
                    else:
                        result.error = f"HTTP {response.status}"
                        result.error_type = "jira_api_error"
        
        except Exception as e:
            result.error = f"Failed to transition issue: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def _get_issue(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        issue_key = self.interpolate_variables(node_config.get("issue_key", ""), input_data)
        
        if not issue_key:
            result.error = "Issue key is required"
            result.error_type = "missing_config"
            return result
        
        base_url = self._get_base_url(credentials)
        auth = self._get_auth(credentials)
        
        result.add_log("info", f"Fetching issue {issue_key}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{base_url}/rest/api/3/issue/{issue_key}",
                    auth=auth
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        result.success = True
                        result.data = {
                            "id": data.get("id"),
                            "key": data.get("key"),
                            "summary": data.get("fields", {}).get("summary"),
                            "status": data.get("fields", {}).get("status", {}).get("name"),
                            "priority": data.get("fields", {}).get("priority", {}).get("name"),
                            "assignee": data.get("fields", {}).get("assignee", {}).get("displayName") if data.get("fields", {}).get("assignee") else None,
                            "reporter": data.get("fields", {}).get("reporter", {}).get("displayName") if data.get("fields", {}).get("reporter") else None,
                            "created": data.get("fields", {}).get("created"),
                            "updated": data.get("fields", {}).get("updated"),
                            "url": f"{base_url}/browse/{issue_key}",
                            "fields": data.get("fields")
                        }
                        result.add_log("info", f"Issue {issue_key} fetched")
                    else:
                        result.error = f"HTTP {response.status}"
                        result.error_type = "jira_api_error"
        
        except Exception as e:
            result.error = f"Failed to get issue: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def test_connection(self, credentials: Dict[str, Any]) -> IntegrationResult:
        result = IntegrationResult(success=False)
        
        base_url = self._get_base_url(credentials)
        auth = self._get_auth(credentials)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{base_url}/rest/api/3/myself",
                    auth=auth
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        result.success = True
                        result.data = {
                            "accountId": data.get("accountId"),
                            "displayName": data.get("displayName"),
                            "emailAddress": data.get("emailAddress")
                        }
                    else:
                        result.error = f"HTTP {response.status}"
        
        except Exception as e:
            result.error = f"Connection test failed: {str(e)}"
        
        return result
