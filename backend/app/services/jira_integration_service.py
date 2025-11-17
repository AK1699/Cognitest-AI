"""
JIRA Integration Service for AI Self-Learning
Fetches user stories and issues for continuous learning
"""
from typing import Optional, List, Dict, Any
import logging
import httpx
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class JiraIntegrationService:
    """
    Service for integrating with JIRA to fetch and learn from user stories
    """

    def __init__(self, jira_url: str, jira_username: str, jira_api_token: str):
        """
        Initialize JIRA service

        Args:
            jira_url: JIRA instance URL (e.g., https://company.atlassian.net)
            jira_username: JIRA username
            jira_api_token: JIRA API token
        """
        self.jira_url = jira_url.rstrip('/')
        self.jira_username = jira_username
        self.jira_api_token = jira_api_token
        self.base_url = f"{self.jira_url}/rest/api/3"
        self.auth = (jira_username, jira_api_token)

    async def fetch_user_stories(
        self,
        project_key: str,
        max_results: int = 50,
        jql_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch user stories from JIRA project

        Args:
            project_key: JIRA project key (e.g., 'PROJ')
            max_results: Maximum stories to fetch
            jql_filter: Optional JQL filter (e.g., 'status = "Done"')

        Returns:
            List of user stories with details
        """
        try:
            # Build JQL query
            jql = f'project = {project_key} AND type = "Story"'
            if jql_filter:
                jql += f' AND {jql_filter}'

            # Fetch from JIRA
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/search",
                    params={
                        "jql": jql,
                        "maxResults": max_results,
                        "fields": "key,summary,description,status,assignee,labels,customfield_10000",
                    },
                    auth=self.auth,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"JIRA API error: {response.status_code}")
                    return []

                data = response.json()
                issues = data.get("issues", [])

                stories = []
                for issue in issues:
                    fields = issue.get("fields", {})
                    stories.append({
                        "key": issue.get("key"),
                        "id": issue.get("id"),
                        "summary": fields.get("summary"),
                        "description": fields.get("description"),
                        "status": fields.get("status", {}).get("name"),
                        "assignee": fields.get("assignee", {}).get("displayName"),
                        "labels": fields.get("labels", []),
                        "acceptance_criteria": self._extract_acceptance_criteria(
                            fields.get("description")
                        ),
                    })

                logger.info(f"Fetched {len(stories)} user stories from JIRA")
                return stories

        except Exception as e:
            logger.error(f"Error fetching user stories: {e}")
            return []

    async def fetch_issue_by_key(self, issue_key: str) -> Optional[Dict[str, Any]]:
        """
        Fetch raw JIRA issue by key (returns raw JIRA API response)

        Args:
            issue_key: JIRA issue key (e.g., 'PROJ-123')

        Returns:
            Raw JIRA issue data or None
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/issue/{issue_key}",
                    auth=self.auth,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"JIRA API error for {issue_key}: {response.status_code}")
                    return None

                return response.json()

        except Exception as e:
            logger.error(f"Error fetching issue {issue_key}: {e}")
            return None

    async def fetch_issue_details(self, issue_key: str) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed information about a specific issue (formatted)

        Args:
            issue_key: JIRA issue key (e.g., 'PROJ-123')

        Returns:
            Issue details or None
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/issue/{issue_key}",
                    auth=self.auth,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"JIRA API error: {response.status_code}")
                    return None

                issue = response.json()
                fields = issue.get("fields", {})

                return {
                    "key": issue.get("key"),
                    "id": issue.get("id"),
                    "summary": fields.get("summary"),
                    "description": fields.get("description"),
                    "status": fields.get("status", {}).get("name"),
                    "assignee": fields.get("assignee", {}).get("displayName"),
                    "reporter": fields.get("reporter", {}).get("displayName"),
                    "priority": fields.get("priority", {}).get("name"),
                    "labels": fields.get("labels", []),
                    "components": [c.get("name") for c in fields.get("components", [])],
                    "due_date": fields.get("duedate"),
                    "created": fields.get("created"),
                    "updated": fields.get("updated"),
                    "acceptance_criteria": self._extract_acceptance_criteria(
                        fields.get("description")
                    ),
                }

        except Exception as e:
            logger.error(f"Error fetching issue details: {e}")
            return None

    async def fetch_epic_details(self, epic_key: str) -> Optional[Dict[str, Any]]:
        """
        Fetch epic and its linked stories

        Args:
            epic_key: JIRA epic key

        Returns:
            Epic with linked stories
        """
        try:
            async with httpx.AsyncClient() as client:
                # Get epic details
                response = await client.get(
                    f"{self.base_url}/issue/{epic_key}",
                    auth=self.auth,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return None

                epic = response.json()
                fields = epic.get("fields", {})

                # Get linked stories
                jql = f'parent = {epic_key}'
                stories_response = await client.get(
                    f"{self.base_url}/search",
                    params={
                        "jql": jql,
                        "maxResults": 100,
                        "fields": "key,summary,status",
                    },
                    auth=self.auth,
                    timeout=30.0,
                )

                stories = []
                if stories_response.status_code == 200:
                    for issue in stories_response.json().get("issues", []):
                        stories.append({
                            "key": issue.get("key"),
                            "summary": issue.get("fields", {}).get("summary"),
                            "status": issue.get("fields", {}).get("status", {}).get("name"),
                        })

                return {
                    "key": epic.get("key"),
                    "summary": fields.get("summary"),
                    "description": fields.get("description"),
                    "status": fields.get("status", {}).get("name"),
                    "linked_stories": stories,
                }

        except Exception as e:
            logger.error(f"Error fetching epic: {e}")
            return None

    async def create_test_cases_from_story(
        self,
        issue_key: str,
        test_cases: List[Dict[str, Any]],
    ) -> bool:
        """
        Create test cases linked to a user story

        Args:
            issue_key: JIRA issue key
            test_cases: List of test cases to create

        Returns:
            Success status
        """
        try:
            async with httpx.AsyncClient() as client:
                # Create child issues for each test case
                for test_case in test_cases:
                    issue_data = {
                        "fields": {
                            "project": {"key": issue_key.split("-")[0]},
                            "summary": test_case.get("title"),
                            "description": test_case.get("description"),
                            "issuetype": {"name": "Test"},
                            "parent": {"key": issue_key},
                            "labels": ["auto-generated", "ai-created"],
                        }
                    }

                    response = await client.post(
                        f"{self.base_url}/issue",
                        json=issue_data,
                        auth=self.auth,
                        timeout=30.0,
                    )

                    if response.status_code not in [200, 201]:
                        logger.warning(f"Failed to create test case: {response.status_code}")

                logger.info(f"Created {len(test_cases)} test cases for {issue_key}")
                return True

        except Exception as e:
            logger.error(f"Error creating test cases: {e}")
            return False

    async def update_issue_with_test_link(
        self,
        issue_key: str,
        test_plan_id: str,
    ) -> bool:
        """
        Link a test plan to a user story

        Args:
            issue_key: JIRA issue key
            test_plan_id: Test plan ID

        Returns:
            Success status
        """
        try:
            async with httpx.AsyncClient() as client:
                # Update issue description to include test plan link
                response = await client.get(
                    f"{self.base_url}/issue/{issue_key}",
                    auth=self.auth,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return False

                issue = response.json()
                current_desc = issue.get("fields", {}).get("description", "") or ""

                updated_desc = f"{current_desc}\n\n[Test Plan: {test_plan_id}]"

                update_response = await client.put(
                    f"{self.base_url}/issue/{issue_key}",
                    json={
                        "fields": {
                            "description": updated_desc,
                        }
                    },
                    auth=self.auth,
                    timeout=30.0,
                )

                return update_response.status_code in [200, 204]

        except Exception as e:
            logger.error(f"Error updating issue: {e}")
            return False

    def _extract_acceptance_criteria(self, description: Optional[str]) -> List[str]:
        """
        Extract acceptance criteria from description

        Args:
            description: Issue description

        Returns:
            List of acceptance criteria
        """
        if not description:
            return []

        criteria = []
        lines = description.split("\n")

        in_criteria_section = False
        for line in lines:
            line = line.strip()

            # Look for acceptance criteria section
            if "acceptance criteria" in line.lower():
                in_criteria_section = True
                continue

            if in_criteria_section:
                # Stop at next section
                if line.startswith("#") or line.startswith("##"):
                    break

                # Extract criteria (usually as bullet points)
                if line.startswith("-") or line.startswith("*"):
                    criteria.append(line.lstrip("-*").strip())

        return criteria

    def _convert_to_text(self, issue: Dict[str, Any]) -> str:
        """
        Convert JIRA issue to text for embedding

        Args:
            issue: JIRA issue data

        Returns:
            Text representation
        """
        parts = [
            f"Title: {issue.get('summary')}",
            f"Description: {issue.get('description', '')}",
            f"Status: {issue.get('status')}",
            f"Priority: {issue.get('priority', 'Normal')}",
        ]

        if issue.get("acceptance_criteria"):
            parts.append("Acceptance Criteria:")
            for criterion in issue["acceptance_criteria"]:
                parts.append(f"  - {criterion}")

        if issue.get("components"):
            parts.append(f"Components: {', '.join(issue['components'])}")

        if issue.get("labels"):
            parts.append(f"Labels: {', '.join(issue['labels'])}")

        return "\n".join(parts)


async def get_jira_service(
    jira_url: str,
    jira_username: str,
    jira_api_token: str,
) -> JiraIntegrationService:
    """
    Get JIRA integration service instance

    Args:
        jira_url: JIRA instance URL
        jira_username: JIRA username
        jira_api_token: JIRA API token

    Returns:
        JiraIntegrationService instance
    """
    return JiraIntegrationService(jira_url, jira_username, jira_api_token)
