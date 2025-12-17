"""
GitLab Integration
Interact with GitLab repositories, issues, and merge requests
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


@IntegrationRegistry.register("gitlab")
class GitLabIntegration(BaseIntegration):
    """
    GitLab integration for repository and issue management.
    Supports issues, merge requests, and pipelines.
    """
    
    @property
    def config(self) -> IntegrationConfig:
        return IntegrationConfig(
            type="gitlab",
            name="GitLab",
            description="Create issues, MRs, and interact with GitLab projects",
            category=IntegrationCategory.DEVELOPMENT,
            icon="git-merge",
            color="#FC6D26",
            auth_type="bearer_token",
            config_schema={
                "type": "object",
                "required": ["action", "project_id"],
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": [
                            "create_issue", "update_issue", "close_issue",
                            "add_issue_note", "create_mr", "get_project",
                            "list_issues", "get_issue", "trigger_pipeline"
                        ],
                        "default": "create_issue",
                        "title": "Action"
                    },
                    "project_id": {
                        "type": "string",
                        "title": "Project ID or Path",
                        "description": "Numeric ID or URL-encoded path (e.g., group%2Fproject)"
                    },
                    "issue_iid": {
                        "type": "integer",
                        "title": "Issue IID"
                    },
                    "title": {
                        "type": "string",
                        "title": "Title"
                    },
                    "description": {
                        "type": "string",
                        "title": "Description"
                    },
                    "labels": {
                        "type": "string",
                        "title": "Labels",
                        "description": "Comma-separated labels"
                    },
                    "assignee_ids": {
                        "type": "string",
                        "title": "Assignee IDs",
                        "description": "Comma-separated user IDs"
                    },
                    "source_branch": {
                        "type": "string",
                        "title": "Source Branch"
                    },
                    "target_branch": {
                        "type": "string",
                        "title": "Target Branch"
                    },
                    "note": {
                        "type": "string",
                        "title": "Comment/Note"
                    },
                    "ref": {
                        "type": "string",
                        "title": "Pipeline Ref (branch/tag)"
                    }
                }
            },
            credential_fields=[
                {"name": "gitlab_url", "type": "text", "required": True, "title": "GitLab URL (e.g., https://gitlab.com)"},
                {"name": "access_token", "type": "password", "required": True, "title": "Personal Access Token"},
            ]
        )
    
    def _get_headers(self, credentials: Dict[str, Any]) -> Dict[str, str]:
        return {
            "PRIVATE-TOKEN": credentials.get("access_token", ""),
            "Content-Type": "application/json"
        }
    
    def _get_base_url(self, credentials: Dict[str, Any]) -> str:
        url = credentials.get("gitlab_url", "https://gitlab.com").rstrip("/")
        return f"{url}/api/v4"
    
    async def execute(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> IntegrationResult:
        result = IntegrationResult(success=False)
        result.add_log("info", "Starting GitLab integration")
        
        if not credentials or not credentials.get("access_token"):
            result.error = "GitLab access token is required"
            result.error_type = "missing_credentials"
            return result
        
        action = node_config.get("action", "create_issue")
        project_id = self.interpolate_variables(
            node_config.get("project_id", ""), input_data
        )
        
        if not project_id:
            result.error = "Project ID is required"
            result.error_type = "missing_config"
            return result
        
        # URL encode project path if it contains /
        import urllib.parse
        project_id = urllib.parse.quote(project_id, safe='')
        
        base_url = self._get_base_url(credentials)
        headers = self._get_headers(credentials)
        
        try:
            if action == "create_issue":
                result = await self._create_issue(base_url, project_id, node_config, input_data, headers, result)
            elif action == "update_issue":
                result = await self._update_issue(base_url, project_id, node_config, input_data, headers, result)
            elif action == "close_issue":
                result = await self._close_issue(base_url, project_id, node_config, headers, result)
            elif action == "add_issue_note":
                result = await self._add_note(base_url, project_id, node_config, input_data, headers, result)
            elif action == "create_mr":
                result = await self._create_mr(base_url, project_id, node_config, input_data, headers, result)
            elif action == "get_project":
                result = await self._get_project(base_url, project_id, headers, result)
            elif action == "list_issues":
                result = await self._list_issues(base_url, project_id, headers, result)
            elif action == "get_issue":
                result = await self._get_issue(base_url, project_id, node_config, headers, result)
            elif action == "trigger_pipeline":
                result = await self._trigger_pipeline(base_url, project_id, node_config, headers, result)
            else:
                result.error = f"Unknown action: {action}"
                result.error_type = "invalid_action"
        
        except Exception as e:
            result.error = f"GitLab API error: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def _create_issue(
        self, base_url: str, project_id: str,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        headers: Dict[str, str],
        result: IntegrationResult
    ) -> IntegrationResult:
        title = self.interpolate_variables(node_config.get("title", ""), input_data)
        if not title:
            result.error = "Issue title is required"
            result.error_type = "missing_config"
            return result
        
        payload: Dict[str, Any] = {"title": title}
        
        if node_config.get("description"):
            payload["description"] = self.interpolate_variables(node_config["description"], input_data)
        if node_config.get("labels"):
            payload["labels"] = node_config["labels"]
        if node_config.get("assignee_ids"):
            payload["assignee_ids"] = [int(i) for i in node_config["assignee_ids"].split(",")]
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{base_url}/projects/{project_id}/issues",
                headers=headers,
                json=payload
            ) as response:
                data = await response.json()
                
                if response.status == 201:
                    result.success = True
                    result.data = {
                        "iid": data.get("iid"),
                        "id": data.get("id"),
                        "title": data.get("title"),
                        "web_url": data.get("web_url")
                    }
                else:
                    result.error = str(data.get("message", f"HTTP {response.status}"))
                    result.error_type = "gitlab_api_error"
        
        return result
    
    async def _update_issue(
        self, base_url: str, project_id: str,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        headers: Dict[str, str],
        result: IntegrationResult
    ) -> IntegrationResult:
        issue_iid = node_config.get("issue_iid")
        if not issue_iid:
            result.error = "Issue IID is required"
            result.error_type = "missing_config"
            return result
        
        payload: Dict[str, Any] = {}
        if node_config.get("title"):
            payload["title"] = self.interpolate_variables(node_config["title"], input_data)
        if node_config.get("description"):
            payload["description"] = self.interpolate_variables(node_config["description"], input_data)
        if node_config.get("labels"):
            payload["labels"] = node_config["labels"]
        
        async with aiohttp.ClientSession() as session:
            async with session.put(
                f"{base_url}/projects/{project_id}/issues/{issue_iid}",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 200:
                    result.success = True
                    result.data = {"iid": issue_iid, "updated": True}
                else:
                    data = await response.json()
                    result.error = str(data.get("message", f"HTTP {response.status}"))
                    result.error_type = "gitlab_api_error"
        
        return result
    
    async def _close_issue(
        self, base_url: str, project_id: str,
        node_config: Dict[str, Any],
        headers: Dict[str, str],
        result: IntegrationResult
    ) -> IntegrationResult:
        issue_iid = node_config.get("issue_iid")
        if not issue_iid:
            result.error = "Issue IID is required"
            result.error_type = "missing_config"
            return result
        
        async with aiohttp.ClientSession() as session:
            async with session.put(
                f"{base_url}/projects/{project_id}/issues/{issue_iid}",
                headers=headers,
                json={"state_event": "close"}
            ) as response:
                if response.status == 200:
                    result.success = True
                    result.data = {"iid": issue_iid, "closed": True}
                else:
                    result.error = f"HTTP {response.status}"
                    result.error_type = "gitlab_api_error"
        
        return result
    
    async def _add_note(
        self, base_url: str, project_id: str,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        headers: Dict[str, str],
        result: IntegrationResult
    ) -> IntegrationResult:
        issue_iid = node_config.get("issue_iid")
        note = self.interpolate_variables(node_config.get("note", ""), input_data)
        
        if not issue_iid or not note:
            result.error = "Issue IID and note are required"
            result.error_type = "missing_config"
            return result
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{base_url}/projects/{project_id}/issues/{issue_iid}/notes",
                headers=headers,
                json={"body": note}
            ) as response:
                if response.status == 201:
                    data = await response.json()
                    result.success = True
                    result.data = {"id": data.get("id")}
                else:
                    result.error = f"HTTP {response.status}"
                    result.error_type = "gitlab_api_error"
        
        return result
    
    async def _create_mr(
        self, base_url: str, project_id: str,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        headers: Dict[str, str],
        result: IntegrationResult
    ) -> IntegrationResult:
        title = self.interpolate_variables(node_config.get("title", ""), input_data)
        source = node_config.get("source_branch")
        target = node_config.get("target_branch", "main")
        
        if not title or not source:
            result.error = "Title and source branch are required"
            result.error_type = "missing_config"
            return result
        
        payload = {
            "title": title,
            "source_branch": source,
            "target_branch": target
        }
        
        if node_config.get("description"):
            payload["description"] = self.interpolate_variables(node_config["description"], input_data)
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{base_url}/projects/{project_id}/merge_requests",
                headers=headers,
                json=payload
            ) as response:
                data = await response.json()
                
                if response.status == 201:
                    result.success = True
                    result.data = {
                        "iid": data.get("iid"),
                        "title": data.get("title"),
                        "web_url": data.get("web_url")
                    }
                else:
                    result.error = str(data.get("message", f"HTTP {response.status}"))
                    result.error_type = "gitlab_api_error"
        
        return result
    
    async def _get_project(
        self, base_url: str, project_id: str,
        headers: Dict[str, str],
        result: IntegrationResult
    ) -> IntegrationResult:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{base_url}/projects/{project_id}",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    result.success = True
                    result.data = {
                        "id": data.get("id"),
                        "name": data.get("name"),
                        "path_with_namespace": data.get("path_with_namespace"),
                        "web_url": data.get("web_url"),
                        "default_branch": data.get("default_branch")
                    }
                else:
                    result.error = f"HTTP {response.status}"
                    result.error_type = "gitlab_api_error"
        
        return result
    
    async def _list_issues(
        self, base_url: str, project_id: str,
        headers: Dict[str, str],
        result: IntegrationResult
    ) -> IntegrationResult:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{base_url}/projects/{project_id}/issues",
                headers=headers,
                params={"state": "opened", "per_page": 30}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    result.success = True
                    result.data = {
                        "count": len(data),
                        "issues": [
                            {"iid": i.get("iid"), "title": i.get("title"), "state": i.get("state")}
                            for i in data
                        ]
                    }
                else:
                    result.error = f"HTTP {response.status}"
                    result.error_type = "gitlab_api_error"
        
        return result
    
    async def _get_issue(
        self, base_url: str, project_id: str,
        node_config: Dict[str, Any],
        headers: Dict[str, str],
        result: IntegrationResult
    ) -> IntegrationResult:
        issue_iid = node_config.get("issue_iid")
        if not issue_iid:
            result.error = "Issue IID is required"
            result.error_type = "missing_config"
            return result
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{base_url}/projects/{project_id}/issues/{issue_iid}",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    result.success = True
                    result.data = {
                        "iid": data.get("iid"),
                        "title": data.get("title"),
                        "description": data.get("description"),
                        "state": data.get("state"),
                        "web_url": data.get("web_url")
                    }
                else:
                    result.error = f"HTTP {response.status}"
                    result.error_type = "gitlab_api_error"
        
        return result
    
    async def _trigger_pipeline(
        self, base_url: str, project_id: str,
        node_config: Dict[str, Any],
        headers: Dict[str, str],
        result: IntegrationResult
    ) -> IntegrationResult:
        ref = node_config.get("ref", "main")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{base_url}/projects/{project_id}/pipeline",
                headers=headers,
                json={"ref": ref}
            ) as response:
                if response.status == 201:
                    data = await response.json()
                    result.success = True
                    result.data = {
                        "id": data.get("id"),
                        "ref": data.get("ref"),
                        "status": data.get("status"),
                        "web_url": data.get("web_url")
                    }
                else:
                    data = await response.json()
                    result.error = str(data.get("message", f"HTTP {response.status}"))
                    result.error_type = "gitlab_api_error"
        
        return result
    
    async def test_connection(self, credentials: Dict[str, Any]) -> IntegrationResult:
        result = IntegrationResult(success=False)
        
        base_url = self._get_base_url(credentials)
        headers = self._get_headers(credentials)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{base_url}/user",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        result.success = True
                        result.data = {
                            "username": data.get("username"),
                            "name": data.get("name"),
                            "email": data.get("email")
                        }
                    else:
                        result.error = f"HTTP {response.status}"
        
        except Exception as e:
            result.error = f"Connection test failed: {str(e)}"
        
        return result
