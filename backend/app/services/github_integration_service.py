"""
GitHub Integration Service for syncing issues and test cases
"""
from typing import Optional, List, Dict, Any
import logging
import httpx
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class GitHubIntegrationService:
    """
    Service for integrating with GitHub to sync issues and discussions
    """

    def __init__(self, github_token: str, owner: str, repo: str):
        """
        Initialize GitHub service

        Args:
            github_token: GitHub personal access token
            owner: Repository owner (user or organization)
            repo: Repository name
        """
        self.github_token = github_token
        self.owner = owner
        self.repo = repo
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"Bearer {github_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    async def fetch_issues(
        self,
        state: str = "open",
        labels: Optional[List[str]] = None,
        max_results: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Fetch issues from GitHub repository

        Args:
            state: Issue state (open, closed, all)
            labels: Filter by labels
            max_results: Maximum issues to fetch

        Returns:
            List of GitHub issues
        """
        try:
            params = {
                "state": state,
                "per_page": min(max_results, 100),
            }

            if labels:
                params["labels"] = ",".join(labels)

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/repos/{self.owner}/{self.repo}/issues",
                    headers=self.headers,
                    params=params,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"GitHub API error: {response.status_code} - {response.text}")
                    return []

                issues = response.json()

                formatted_issues = []
                for issue in issues:
                    # Skip pull requests (they also appear as issues in GitHub API)
                    if "pull_request" in issue:
                        continue

                    formatted_issues.append({
                        "id": issue.get("id"),
                        "number": issue.get("number"),
                        "title": issue.get("title"),
                        "description": issue.get("body"),
                        "state": issue.get("state"),
                        "labels": [label.get("name") for label in issue.get("labels", [])],
                        "assignee": issue.get("assignee", {}).get("login") if issue.get("assignee") else None,
                        "created_at": issue.get("created_at"),
                        "updated_at": issue.get("updated_at"),
                        "closed_at": issue.get("closed_at"),
                        "html_url": issue.get("html_url"),
                        "comments_count": issue.get("comments"),
                    })

                logger.info(f"Fetched {len(formatted_issues)} issues from GitHub")
                return formatted_issues

        except Exception as e:
            logger.error(f"Error fetching GitHub issues: {e}")
            return []

    async def fetch_issue_details(self, issue_number: int) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed information about a specific issue

        Args:
            issue_number: GitHub issue number

        Returns:
            Issue details or None
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/repos/{self.owner}/{self.repo}/issues/{issue_number}",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"GitHub API error: {response.status_code}")
                    return None

                issue = response.json()

                # Skip pull requests
                if "pull_request" in issue:
                    return None

                return {
                    "id": issue.get("id"),
                    "number": issue.get("number"),
                    "title": issue.get("title"),
                    "description": issue.get("body"),
                    "state": issue.get("state"),
                    "labels": [label.get("name") for label in issue.get("labels", [])],
                    "assignee": issue.get("assignee", {}).get("login") if issue.get("assignee") else None,
                    "assignees": [a.get("login") for a in issue.get("assignees", [])],
                    "milestone": issue.get("milestone", {}).get("title") if issue.get("milestone") else None,
                    "created_at": issue.get("created_at"),
                    "updated_at": issue.get("updated_at"),
                    "closed_at": issue.get("closed_at"),
                    "html_url": issue.get("html_url"),
                    "comments_count": issue.get("comments"),
                    "reactions": issue.get("reactions"),
                }

        except Exception as e:
            logger.error(f"Error fetching GitHub issue details: {e}")
            return None

    async def create_issue(
        self,
        title: str,
        body: str,
        labels: Optional[List[str]] = None,
        assignees: Optional[List[str]] = None,
        milestone: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new issue in GitHub

        Args:
            title: Issue title
            body: Issue description
            labels: List of label names
            assignees: List of usernames to assign
            milestone: Milestone number

        Returns:
            Created issue data or None
        """
        try:
            data = {
                "title": title,
                "body": body,
            }

            if labels:
                data["labels"] = labels

            if assignees:
                data["assignees"] = assignees

            if milestone:
                data["milestone"] = milestone

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/repos/{self.owner}/{self.repo}/issues",
                    headers=self.headers,
                    json=data,
                    timeout=30.0,
                )

                if response.status_code not in [200, 201]:
                    logger.error(f"Failed to create GitHub issue: {response.status_code} - {response.text}")
                    return None

                issue = response.json()

                logger.info(f"Created GitHub issue #{issue.get('number')}")
                return {
                    "id": issue.get("id"),
                    "number": issue.get("number"),
                    "html_url": issue.get("html_url"),
                    "title": issue.get("title"),
                }

        except Exception as e:
            logger.error(f"Error creating GitHub issue: {e}")
            return None

    async def update_issue(
        self,
        issue_number: int,
        title: Optional[str] = None,
        body: Optional[str] = None,
        state: Optional[str] = None,
        labels: Optional[List[str]] = None,
        assignees: Optional[List[str]] = None,
    ) -> bool:
        """
        Update an existing issue

        Args:
            issue_number: Issue number to update
            title: New title
            body: New body
            state: New state (open, closed)
            labels: New labels
            assignees: New assignees

        Returns:
            Success status
        """
        try:
            data = {}

            if title:
                data["title"] = title
            if body is not None:
                data["body"] = body
            if state:
                data["state"] = state
            if labels is not None:
                data["labels"] = labels
            if assignees is not None:
                data["assignees"] = assignees

            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.base_url}/repos/{self.owner}/{self.repo}/issues/{issue_number}",
                    headers=self.headers,
                    json=data,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"Failed to update GitHub issue: {response.status_code}")
                    return False

                logger.info(f"Updated GitHub issue #{issue_number}")
                return True

        except Exception as e:
            logger.error(f"Error updating GitHub issue: {e}")
            return False

    async def add_comment(self, issue_number: int, comment: str) -> bool:
        """
        Add a comment to an issue

        Args:
            issue_number: Issue number
            comment: Comment text

        Returns:
            Success status
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/repos/{self.owner}/{self.repo}/issues/{issue_number}/comments",
                    headers=self.headers,
                    json={"body": comment},
                    timeout=30.0,
                )

                if response.status_code not in [200, 201]:
                    logger.error(f"Failed to add comment: {response.status_code}")
                    return False

                logger.info(f"Added comment to GitHub issue #{issue_number}")
                return True

        except Exception as e:
            logger.error(f"Error adding comment: {e}")
            return False

    async def fetch_comments(self, issue_number: int) -> List[Dict[str, Any]]:
        """
        Fetch comments for an issue

        Args:
            issue_number: Issue number

        Returns:
            List of comments
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/repos/{self.owner}/{self.repo}/issues/{issue_number}/comments",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"Failed to fetch comments: {response.status_code}")
                    return []

                comments = response.json()

                return [
                    {
                        "id": comment.get("id"),
                        "user": comment.get("user", {}).get("login"),
                        "body": comment.get("body"),
                        "created_at": comment.get("created_at"),
                        "updated_at": comment.get("updated_at"),
                    }
                    for comment in comments
                ]

        except Exception as e:
            logger.error(f"Error fetching comments: {e}")
            return []

    async def fetch_labels(self) -> List[str]:
        """
        Fetch all labels in the repository

        Returns:
            List of label names
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/repos/{self.owner}/{self.repo}/labels",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"Failed to fetch labels: {response.status_code}")
                    return []

                labels = response.json()
                return [label.get("name") for label in labels]

        except Exception as e:
            logger.error(f"Error fetching labels: {e}")
            return []

    async def create_label(
        self,
        name: str,
        color: str,
        description: Optional[str] = None,
    ) -> bool:
        """
        Create a new label

        Args:
            name: Label name
            color: Label color (hex without #)
            description: Label description

        Returns:
            Success status
        """
        try:
            data = {
                "name": name,
                "color": color,
            }

            if description:
                data["description"] = description

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/repos/{self.owner}/{self.repo}/labels",
                    headers=self.headers,
                    json=data,
                    timeout=30.0,
                )

                if response.status_code not in [200, 201]:
                    logger.error(f"Failed to create label: {response.status_code}")
                    return False

                logger.info(f"Created GitHub label: {name}")
                return True

        except Exception as e:
            logger.error(f"Error creating label: {e}")
            return False

    async def test_connection(self) -> Dict[str, Any]:
        """
        Test GitHub connection

        Returns:
            Connection test result
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/repos/{self.owner}/{self.repo}",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    repo = response.json()
                    return {
                        "success": True,
                        "message": "Connection successful",
                        "details": {
                            "repo_name": repo.get("full_name"),
                            "private": repo.get("private"),
                            "open_issues": repo.get("open_issues_count"),
                        },
                    }
                else:
                    return {
                        "success": False,
                        "message": f"Connection failed: {response.status_code}",
                        "details": {},
                    }

        except Exception as e:
            logger.error(f"Error testing GitHub connection: {e}")
            return {
                "success": False,
                "message": f"Connection error: {str(e)}",
                "details": {},
            }


async def get_github_service(
    github_token: str,
    owner: str,
    repo: str,
) -> GitHubIntegrationService:
    """
    Get GitHub integration service instance

    Args:
        github_token: GitHub personal access token
        owner: Repository owner
        repo: Repository name

    Returns:
        GitHubIntegrationService instance
    """
    return GitHubIntegrationService(github_token, owner, repo)
