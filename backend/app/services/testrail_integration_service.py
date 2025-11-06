"""
TestRail Integration Service for syncing test cases and test runs
"""
from typing import Optional, List, Dict, Any
import logging
import httpx
from datetime import datetime
import json
import base64

logger = logging.getLogger(__name__)


class TestRailIntegrationService:
    """
    Service for integrating with TestRail to sync test cases, test plans, and test runs
    """

    def __init__(self, testrail_url: str, username: str, api_key: str):
        """
        Initialize TestRail service

        Args:
            testrail_url: TestRail instance URL (e.g., https://company.testrail.io)
            username: TestRail username (email)
            api_key: TestRail API key
        """
        self.testrail_url = testrail_url.rstrip('/')
        self.username = username
        self.api_key = api_key
        self.base_url = f"{self.testrail_url}/index.php?/api/v2"

        # Create basic auth
        auth_string = f"{username}:{api_key}"
        auth_bytes = auth_string.encode('ascii')
        auth_base64 = base64.b64encode(auth_bytes).decode('ascii')

        self.headers = {
            "Authorization": f"Basic {auth_base64}",
            "Content-Type": "application/json",
        }

    async def fetch_projects(self) -> List[Dict[str, Any]]:
        """
        Fetch all projects from TestRail

        Returns:
            List of projects
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/get_projects",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"TestRail API error: {response.status_code} - {response.text}")
                    return []

                data = response.json()
                projects = data.get("projects", [])

                logger.info(f"Fetched {len(projects)} projects from TestRail")
                return projects

        except Exception as e:
            logger.error(f"Error fetching TestRail projects: {e}")
            return []

    async def fetch_test_cases(
        self,
        project_id: int,
        suite_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch test cases from TestRail project

        Args:
            project_id: TestRail project ID
            suite_id: Optional test suite ID

        Returns:
            List of test cases
        """
        try:
            url = f"{self.base_url}/get_cases/{project_id}"
            if suite_id:
                url += f"&suite_id={suite_id}"

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"TestRail API error: {response.status_code} - {response.text}")
                    return []

                data = response.json()
                cases = data.get("cases", [])

                formatted_cases = []
                for case in cases:
                    formatted_cases.append({
                        "id": case.get("id"),
                        "title": case.get("title"),
                        "section_id": case.get("section_id"),
                        "template_id": case.get("template_id"),
                        "type_id": case.get("type_id"),
                        "priority_id": case.get("priority_id"),
                        "estimate": case.get("estimate"),
                        "milestone_id": case.get("milestone_id"),
                        "refs": case.get("refs"),
                        "created_by": case.get("created_by"),
                        "created_on": case.get("created_on"),
                        "updated_by": case.get("updated_by"),
                        "updated_on": case.get("updated_on"),
                        "custom_preconds": case.get("custom_preconds"),
                        "custom_steps": case.get("custom_steps"),
                        "custom_expected": case.get("custom_expected"),
                    })

                logger.info(f"Fetched {len(formatted_cases)} test cases from TestRail")
                return formatted_cases

        except Exception as e:
            logger.error(f"Error fetching TestRail test cases: {e}")
            return []

    async def fetch_test_case(
        self,
        case_id: int,
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch a specific test case

        Args:
            case_id: TestRail test case ID

        Returns:
            Test case details or None
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/get_case/{case_id}",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"TestRail API error: {response.status_code}")
                    return None

                case = response.json()

                return {
                    "id": case.get("id"),
                    "title": case.get("title"),
                    "section_id": case.get("section_id"),
                    "template_id": case.get("template_id"),
                    "type_id": case.get("type_id"),
                    "priority_id": case.get("priority_id"),
                    "estimate": case.get("estimate"),
                    "milestone_id": case.get("milestone_id"),
                    "refs": case.get("refs"),
                    "custom_preconds": case.get("custom_preconds"),
                    "custom_steps": case.get("custom_steps"),
                    "custom_expected": case.get("custom_expected"),
                    "custom_automation_type": case.get("custom_automation_type"),
                }

        except Exception as e:
            logger.error(f"Error fetching TestRail test case: {e}")
            return None

    async def create_test_case(
        self,
        section_id: int,
        title: str,
        template_id: Optional[int] = None,
        type_id: Optional[int] = None,
        priority_id: Optional[int] = None,
        estimate: Optional[str] = None,
        milestone_id: Optional[int] = None,
        refs: Optional[str] = None,
        custom_steps: Optional[str] = None,
        custom_expected: Optional[str] = None,
        custom_preconds: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new test case in TestRail

        Args:
            section_id: Section ID where to create the test case
            title: Test case title
            template_id: Template ID
            type_id: Test case type ID
            priority_id: Priority ID
            estimate: Time estimate
            milestone_id: Milestone ID
            refs: References (e.g., user story IDs)
            custom_steps: Test steps
            custom_expected: Expected result
            custom_preconds: Preconditions

        Returns:
            Created test case data or None
        """
        try:
            data = {
                "title": title,
            }

            if template_id:
                data["template_id"] = template_id
            if type_id:
                data["type_id"] = type_id
            if priority_id:
                data["priority_id"] = priority_id
            if estimate:
                data["estimate"] = estimate
            if milestone_id:
                data["milestone_id"] = milestone_id
            if refs:
                data["refs"] = refs
            if custom_steps:
                data["custom_steps"] = custom_steps
            if custom_expected:
                data["custom_expected"] = custom_expected
            if custom_preconds:
                data["custom_preconds"] = custom_preconds

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/add_case/{section_id}",
                    headers=self.headers,
                    json=data,
                    timeout=30.0,
                )

                if response.status_code not in [200, 201]:
                    logger.error(f"Failed to create TestRail test case: {response.status_code} - {response.text}")
                    return None

                case = response.json()

                logger.info(f"Created TestRail test case: {case.get('id')}")
                return {
                    "id": case.get("id"),
                    "title": case.get("title"),
                    "section_id": case.get("section_id"),
                }

        except Exception as e:
            logger.error(f"Error creating TestRail test case: {e}")
            return None

    async def update_test_case(
        self,
        case_id: int,
        title: Optional[str] = None,
        type_id: Optional[int] = None,
        priority_id: Optional[int] = None,
        estimate: Optional[str] = None,
        milestone_id: Optional[int] = None,
        refs: Optional[str] = None,
        custom_steps: Optional[str] = None,
        custom_expected: Optional[str] = None,
    ) -> bool:
        """
        Update an existing test case

        Args:
            case_id: Test case ID to update
            title: New title
            type_id: New type ID
            priority_id: New priority ID
            estimate: New estimate
            milestone_id: New milestone ID
            refs: New references
            custom_steps: New steps
            custom_expected: New expected result

        Returns:
            Success status
        """
        try:
            data = {}

            if title:
                data["title"] = title
            if type_id:
                data["type_id"] = type_id
            if priority_id:
                data["priority_id"] = priority_id
            if estimate:
                data["estimate"] = estimate
            if milestone_id:
                data["milestone_id"] = milestone_id
            if refs:
                data["refs"] = refs
            if custom_steps:
                data["custom_steps"] = custom_steps
            if custom_expected:
                data["custom_expected"] = custom_expected

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/update_case/{case_id}",
                    headers=self.headers,
                    json=data,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"Failed to update TestRail test case: {response.status_code}")
                    return False

                logger.info(f"Updated TestRail test case: {case_id}")
                return True

        except Exception as e:
            logger.error(f"Error updating TestRail test case: {e}")
            return False

    async def fetch_test_plans(
        self,
        project_id: int,
    ) -> List[Dict[str, Any]]:
        """
        Fetch test plans from TestRail

        Args:
            project_id: TestRail project ID

        Returns:
            List of test plans
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/get_plans/{project_id}",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"TestRail API error: {response.status_code}")
                    return []

                data = response.json()
                plans = data.get("plans", [])

                logger.info(f"Fetched {len(plans)} test plans from TestRail")
                return plans

        except Exception as e:
            logger.error(f"Error fetching TestRail test plans: {e}")
            return []

    async def create_test_run(
        self,
        project_id: int,
        suite_id: int,
        name: str,
        description: Optional[str] = None,
        milestone_id: Optional[int] = None,
        assignedto_id: Optional[int] = None,
        case_ids: Optional[List[int]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new test run

        Args:
            project_id: Project ID
            suite_id: Suite ID
            name: Test run name
            description: Test run description
            milestone_id: Milestone ID
            assignedto_id: Assigned user ID
            case_ids: List of test case IDs to include

        Returns:
            Created test run data or None
        """
        try:
            data = {
                "suite_id": suite_id,
                "name": name,
            }

            if description:
                data["description"] = description
            if milestone_id:
                data["milestone_id"] = milestone_id
            if assignedto_id:
                data["assignedto_id"] = assignedto_id
            if case_ids:
                data["case_ids"] = case_ids

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/add_run/{project_id}",
                    headers=self.headers,
                    json=data,
                    timeout=30.0,
                )

                if response.status_code not in [200, 201]:
                    logger.error(f"Failed to create test run: {response.status_code} - {response.text}")
                    return None

                run = response.json()

                logger.info(f"Created TestRail test run: {run.get('id')}")
                return {
                    "id": run.get("id"),
                    "name": run.get("name"),
                    "url": run.get("url"),
                }

        except Exception as e:
            logger.error(f"Error creating test run: {e}")
            return None

    async def add_test_result(
        self,
        run_id: int,
        case_id: int,
        status_id: int,
        comment: Optional[str] = None,
        elapsed: Optional[str] = None,
        defects: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Add a test result to a test run

        Args:
            run_id: Test run ID
            case_id: Test case ID
            status_id: Status ID (1=Passed, 2=Blocked, 3=Untested, 4=Retest, 5=Failed)
            comment: Result comment
            elapsed: Time elapsed (e.g., "5m", "1h 30m")
            defects: Related defect IDs

        Returns:
            Created test result or None
        """
        try:
            data = {
                "status_id": status_id,
            }

            if comment:
                data["comment"] = comment
            if elapsed:
                data["elapsed"] = elapsed
            if defects:
                data["defects"] = defects

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/add_result_for_case/{run_id}/{case_id}",
                    headers=self.headers,
                    json=data,
                    timeout=30.0,
                )

                if response.status_code not in [200, 201]:
                    logger.error(f"Failed to add test result: {response.status_code}")
                    return None

                result = response.json()

                logger.info(f"Added test result for case {case_id} in run {run_id}")
                return {
                    "id": result.get("id"),
                    "status_id": result.get("status_id"),
                }

        except Exception as e:
            logger.error(f"Error adding test result: {e}")
            return None

    async def fetch_test_results(
        self,
        run_id: int,
    ) -> List[Dict[str, Any]]:
        """
        Fetch test results for a test run

        Args:
            run_id: Test run ID

        Returns:
            List of test results
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/get_results_for_run/{run_id}",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    logger.error(f"TestRail API error: {response.status_code}")
                    return []

                data = response.json()
                results = data.get("results", [])

                logger.info(f"Fetched {len(results)} test results from TestRail")
                return results

        except Exception as e:
            logger.error(f"Error fetching test results: {e}")
            return []

    async def test_connection(self) -> Dict[str, Any]:
        """
        Test TestRail connection

        Returns:
            Connection test result
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/get_projects",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    data = response.json()
                    projects = data.get("projects", [])
                    return {
                        "success": True,
                        "message": "Connection successful",
                        "details": {
                            "projects_count": len(projects),
                        },
                    }
                elif response.status_code == 401:
                    return {
                        "success": False,
                        "message": "Authentication failed. Please check credentials.",
                        "details": {},
                    }
                else:
                    return {
                        "success": False,
                        "message": f"Connection failed: {response.status_code}",
                        "details": {},
                    }

        except Exception as e:
            logger.error(f"Error testing TestRail connection: {e}")
            return {
                "success": False,
                "message": f"Connection error: {str(e)}",
                "details": {},
            }


async def get_testrail_service(
    testrail_url: str,
    username: str,
    api_key: str,
) -> TestRailIntegrationService:
    """
    Get TestRail integration service instance

    Args:
        testrail_url: TestRail instance URL
        username: TestRail username (email)
        api_key: TestRail API key

    Returns:
        TestRailIntegrationService instance
    """
    return TestRailIntegrationService(testrail_url, username, api_key)
