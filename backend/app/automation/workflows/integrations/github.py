"""
GitHub Integration
Interact with GitHub repositories, issues, and pull requests
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


@IntegrationRegistry.register("github")
class GitHubIntegration(BaseIntegration):
    """
    GitHub integration for repository management.
    Supports issues, pull requests, and repository actions.
    """
    
    API_BASE = "https://api.github.com"
    
    @property
    def config(self) -> IntegrationConfig:
        return IntegrationConfig(
            type="github",
            name="GitHub",
            description="Create issues, PRs, and interact with GitHub repositories",
            category=IntegrationCategory.DEVELOPMENT,
            icon="git-branch",
            color="#24292e",
            auth_type="bearer_token",
            config_schema={
                "type": "object",
                "required": ["action", "owner", "repo"],
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": [
                            "create_issue", "update_issue", "close_issue",
                            "add_issue_comment", "create_pr", "merge_pr",
                            "get_repo", "list_issues", "get_issue"
                        ],
                        "default": "create_issue",
                        "title": "Action"
                    },
                    "owner": {
                        "type": "string",
                        "title": "Repository Owner",
                        "description": "GitHub username or organization"
                    },
                    "repo": {
                        "type": "string",
                        "title": "Repository Name"
                    },
                    "issue_number": {
                        "type": "integer",
                        "title": "Issue/PR Number"
                    },
                    "title": {
                        "type": "string",
                        "title": "Title",
                        "description": "Issue or PR title"
                    },
                    "body": {
                        "type": "string",
                        "title": "Body",
                        "description": "Issue or PR body content"
                    },
                    "labels": {
                        "type": "string",
                        "title": "Labels",
                        "description": "Comma-separated labels"
                    },
                    "assignees": {
                        "type": "string",
                        "title": "Assignees",
                        "description": "Comma-separated usernames"
                    },
                    "head": {
                        "type": "string",
                        "title": "Head Branch",
                        "description": "PR source branch"
                    },
                    "base": {
                        "type": "string",
                        "title": "Base Branch",
                        "description": "PR target branch"
                    },
                    "state": {
                        "type": "string",
                        "enum": ["open", "closed", "all"],
                        "title": "State Filter"
                    },
                    "comment": {
                        "type": "string",
                        "title": "Comment"
                    }
                }
            },
            credential_fields=[
                {"name": "personal_access_token", "type": "password", "required": True, "title": "Personal Access Token"},
            ]
        )
    
    def _get_headers(self, credentials: Dict[str, Any]) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {credentials.get('personal_access_token', '')}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
    
    async def execute(
        self,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> IntegrationResult:
        result = IntegrationResult(success=False)
        result.add_log("info", "Starting GitHub integration")
        
        if not credentials or not credentials.get("personal_access_token"):
            result.error = "GitHub personal access token is required"
            result.error_type = "missing_credentials"
            return result
        
        action = node_config.get("action", "create_issue")
        owner = self.interpolate_variables(node_config.get("owner", ""), input_data)
        repo = self.interpolate_variables(node_config.get("repo", ""), input_data)
        
        if not owner or not repo:
            result.error = "Repository owner and name are required"
            result.error_type = "missing_config"
            return result
        
        actions = {
            "create_issue": self._create_issue,
            "update_issue": self._update_issue,
            "close_issue": self._close_issue,
            "add_issue_comment": self._add_comment,
            "create_pr": self._create_pr,
            "merge_pr": self._merge_pr,
            "get_repo": self._get_repo,
            "list_issues": self._list_issues,
            "get_issue": self._get_issue,
        }
        
        handler = actions.get(action)
        if not handler:
            result.error = f"Unknown action: {action}"
            result.error_type = "invalid_action"
            return result
        
        return await handler(owner, repo, node_config, input_data, credentials, result)
    
    async def _create_issue(
        self, owner: str, repo: str,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        title = self.interpolate_variables(node_config.get("title", ""), input_data)
        body = self.interpolate_variables(node_config.get("body", ""), input_data)
        
        if not title:
            result.error = "Issue title is required"
            result.error_type = "missing_config"
            return result
        
        payload: Dict[str, Any] = {"title": title}
        if body:
            payload["body"] = body
        
        if node_config.get("labels"):
            payload["labels"] = [l.strip() for l in node_config["labels"].split(",")]
        
        if node_config.get("assignees"):
            payload["assignees"] = [a.strip() for a in node_config["assignees"].split(",")]
        
        result.add_log("info", f"Creating issue in {owner}/{repo}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.API_BASE}/repos/{owner}/{repo}/issues",
                    headers=self._get_headers(credentials),
                    json=payload
                ) as response:
                    data = await response.json()
                    
                    if response.status == 201:
                        result.success = True
                        result.data = {
                            "number": data.get("number"),
                            "id": data.get("id"),
                            "title": data.get("title"),
                            "url": data.get("html_url"),
                            "state": data.get("state")
                        }
                        result.add_log("info", f"Issue #{data.get('number')} created")
                    else:
                        result.error = data.get("message", f"HTTP {response.status}")
                        result.error_type = "github_api_error"
        
        except Exception as e:
            result.error = f"Failed to create issue: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def _update_issue(
        self, owner: str, repo: str,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        issue_number = node_config.get("issue_number")
        if not issue_number:
            result.error = "Issue number is required"
            result.error_type = "missing_config"
            return result
        
        payload: Dict[str, Any] = {}
        
        if node_config.get("title"):
            payload["title"] = self.interpolate_variables(node_config["title"], input_data)
        if node_config.get("body"):
            payload["body"] = self.interpolate_variables(node_config["body"], input_data)
        if node_config.get("labels"):
            payload["labels"] = [l.strip() for l in node_config["labels"].split(",")]
        if node_config.get("assignees"):
            payload["assignees"] = [a.strip() for a in node_config["assignees"].split(",")]
        
        if not payload:
            result.error = "No fields to update"
            result.error_type = "missing_config"
            return result
        
        result.add_log("info", f"Updating issue #{issue_number} in {owner}/{repo}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.patch(
                    f"{self.API_BASE}/repos/{owner}/{repo}/issues/{issue_number}",
                    headers=self._get_headers(credentials),
                    json=payload
                ) as response:
                    data = await response.json()
                    
                    if response.status == 200:
                        result.success = True
                        result.data = {
                            "number": data.get("number"),
                            "title": data.get("title"),
                            "url": data.get("html_url"),
                            "updated": True
                        }
                        result.add_log("info", f"Issue #{issue_number} updated")
                    else:
                        result.error = data.get("message", f"HTTP {response.status}")
                        result.error_type = "github_api_error"
        
        except Exception as e:
            result.error = f"Failed to update issue: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def _close_issue(
        self, owner: str, repo: str,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        issue_number = node_config.get("issue_number")
        if not issue_number:
            result.error = "Issue number is required"
            result.error_type = "missing_config"
            return result
        
        result.add_log("info", f"Closing issue #{issue_number} in {owner}/{repo}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.patch(
                    f"{self.API_BASE}/repos/{owner}/{repo}/issues/{issue_number}",
                    headers=self._get_headers(credentials),
                    json={"state": "closed"}
                ) as response:
                    if response.status == 200:
                        result.success = True
                        result.data = {"number": issue_number, "closed": True}
                        result.add_log("info", f"Issue #{issue_number} closed")
                    else:
                        data = await response.json()
                        result.error = data.get("message", f"HTTP {response.status}")
                        result.error_type = "github_api_error"
        
        except Exception as e:
            result.error = f"Failed to close issue: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def _add_comment(
        self, owner: str, repo: str,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        issue_number = node_config.get("issue_number")
        comment = self.interpolate_variables(node_config.get("comment", ""), input_data)
        
        if not issue_number or not comment:
            result.error = "Issue number and comment are required"
            result.error_type = "missing_config"
            return result
        
        result.add_log("info", f"Adding comment to issue #{issue_number}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.API_BASE}/repos/{owner}/{repo}/issues/{issue_number}/comments",
                    headers=self._get_headers(credentials),
                    json={"body": comment}
                ) as response:
                    data = await response.json()
                    
                    if response.status == 201:
                        result.success = True
                        result.data = {
                            "id": data.get("id"),
                            "url": data.get("html_url")
                        }
                        result.add_log("info", "Comment added")
                    else:
                        result.error = data.get("message", f"HTTP {response.status}")
                        result.error_type = "github_api_error"
        
        except Exception as e:
            result.error = f"Failed to add comment: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def _create_pr(
        self, owner: str, repo: str,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        title = self.interpolate_variables(node_config.get("title", ""), input_data)
        head = node_config.get("head")
        base = node_config.get("base", "main")
        
        if not title or not head:
            result.error = "Title and head branch are required"
            result.error_type = "missing_config"
            return result
        
        payload: Dict[str, Any] = {
            "title": title,
            "head": head,
            "base": base
        }
        
        if node_config.get("body"):
            payload["body"] = self.interpolate_variables(node_config["body"], input_data)
        
        result.add_log("info", f"Creating PR: {head} -> {base}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.API_BASE}/repos/{owner}/{repo}/pulls",
                    headers=self._get_headers(credentials),
                    json=payload
                ) as response:
                    data = await response.json()
                    
                    if response.status == 201:
                        result.success = True
                        result.data = {
                            "number": data.get("number"),
                            "id": data.get("id"),
                            "title": data.get("title"),
                            "url": data.get("html_url"),
                            "state": data.get("state")
                        }
                        result.add_log("info", f"PR #{data.get('number')} created")
                    else:
                        result.error = data.get("message", f"HTTP {response.status}")
                        result.error_type = "github_api_error"
        
        except Exception as e:
            result.error = f"Failed to create PR: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def _merge_pr(
        self, owner: str, repo: str,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        pr_number = node_config.get("issue_number")  # Using issue_number for PR number
        if not pr_number:
            result.error = "PR number is required"
            result.error_type = "missing_config"
            return result
        
        result.add_log("info", f"Merging PR #{pr_number}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.put(
                    f"{self.API_BASE}/repos/{owner}/{repo}/pulls/{pr_number}/merge",
                    headers=self._get_headers(credentials),
                    json={}
                ) as response:
                    data = await response.json()
                    
                    if response.status == 200:
                        result.success = True
                        result.data = {
                            "merged": data.get("merged"),
                            "message": data.get("message"),
                            "sha": data.get("sha")
                        }
                        result.add_log("info", f"PR #{pr_number} merged")
                    else:
                        result.error = data.get("message", f"HTTP {response.status}")
                        result.error_type = "github_api_error"
        
        except Exception as e:
            result.error = f"Failed to merge PR: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def _get_repo(
        self, owner: str, repo: str,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        result.add_log("info", f"Getting repository {owner}/{repo}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.API_BASE}/repos/{owner}/{repo}",
                    headers=self._get_headers(credentials)
                ) as response:
                    data = await response.json()
                    
                    if response.status == 200:
                        result.success = True
                        result.data = {
                            "id": data.get("id"),
                            "name": data.get("name"),
                            "full_name": data.get("full_name"),
                            "description": data.get("description"),
                            "url": data.get("html_url"),
                            "default_branch": data.get("default_branch"),
                            "stars": data.get("stargazers_count"),
                            "forks": data.get("forks_count"),
                            "open_issues": data.get("open_issues_count"),
                            "private": data.get("private")
                        }
                    else:
                        result.error = data.get("message", f"HTTP {response.status}")
                        result.error_type = "github_api_error"
        
        except Exception as e:
            result.error = f"Failed to get repository: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def _list_issues(
        self, owner: str, repo: str,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        state = node_config.get("state", "open")
        
        result.add_log("info", f"Listing {state} issues in {owner}/{repo}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.API_BASE}/repos/{owner}/{repo}/issues",
                    headers=self._get_headers(credentials),
                    params={"state": state, "per_page": 30}
                ) as response:
                    data = await response.json()
                    
                    if response.status == 200:
                        result.success = True
                        result.data = {
                            "count": len(data),
                            "issues": [
                                {
                                    "number": issue.get("number"),
                                    "title": issue.get("title"),
                                    "state": issue.get("state"),
                                    "url": issue.get("html_url")
                                }
                                for issue in data
                            ]
                        }
                    else:
                        result.error = data.get("message", f"HTTP {response.status}")
                        result.error_type = "github_api_error"
        
        except Exception as e:
            result.error = f"Failed to list issues: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def _get_issue(
        self, owner: str, repo: str,
        node_config: Dict[str, Any],
        input_data: Dict[str, Any],
        credentials: Dict[str, Any],
        result: IntegrationResult
    ) -> IntegrationResult:
        issue_number = node_config.get("issue_number")
        if not issue_number:
            result.error = "Issue number is required"
            result.error_type = "missing_config"
            return result
        
        result.add_log("info", f"Getting issue #{issue_number}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.API_BASE}/repos/{owner}/{repo}/issues/{issue_number}",
                    headers=self._get_headers(credentials)
                ) as response:
                    data = await response.json()
                    
                    if response.status == 200:
                        result.success = True
                        result.data = {
                            "number": data.get("number"),
                            "title": data.get("title"),
                            "body": data.get("body"),
                            "state": data.get("state"),
                            "url": data.get("html_url"),
                            "labels": [l.get("name") for l in data.get("labels", [])],
                            "assignees": [a.get("login") for a in data.get("assignees", [])],
                            "created_at": data.get("created_at"),
                            "updated_at": data.get("updated_at")
                        }
                    else:
                        result.error = data.get("message", f"HTTP {response.status}")
                        result.error_type = "github_api_error"
        
        except Exception as e:
            result.error = f"Failed to get issue: {str(e)}"
            result.error_type = "connection_error"
        
        return result
    
    async def test_connection(self, credentials: Dict[str, Any]) -> IntegrationResult:
        result = IntegrationResult(success=False)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.API_BASE}/user",
                    headers=self._get_headers(credentials)
                ) as response:
                    data = await response.json()
                    
                    if response.status == 200:
                        result.success = True
                        result.data = {
                            "login": data.get("login"),
                            "name": data.get("name"),
                            "email": data.get("email"),
                            "url": data.get("html_url")
                        }
                    else:
                        result.error = data.get("message", f"HTTP {response.status}")
        
        except Exception as e:
            result.error = f"Connection test failed: {str(e)}"
        
        return result
