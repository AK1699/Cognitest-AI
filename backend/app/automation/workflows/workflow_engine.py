"""
Workflow Engine - Visual workflow builder (n8n-style) for test automation.
Connects test execution, API calls, notifications, and integrations.
"""

from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
import asyncio
import json
from uuid import uuid4

class NodeType(str, Enum):
    """Types of workflow nodes"""
    TRIGGER = "trigger"  # Starts the workflow
    ACTION = "action"    # Performs an action
    CONDITION = "condition"  # Conditional branching
    INTEGRATION = "integration"  # Third-party integration

class TriggerType(str, Enum):
    """Types of triggers"""
    MANUAL = "manual"
    SCHEDULE = "schedule"
    WEBHOOK = "webhook"
    TEST_COMPLETION = "test_completion"
    TEST_FAILURE = "test_failure"

class ActionType(str, Enum):
    """Types of actions"""
    RUN_TEST = "run_test"
    API_REQUEST = "api_request"
    SEND_EMAIL = "send_email"
    SEND_SLACK = "send_slack"
    CREATE_ISSUE = "create_issue"
    UPDATE_JIRA = "update_jira"
    WAIT = "wait"
    TRANSFORM_DATA = "transform_data"

@dataclass
class WorkflowNode:
    """Represents a single node in the workflow"""
    id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ""
    type: NodeType = NodeType.ACTION
    action_type: Optional[str] = None
    config: Dict[str, Any] = field(default_factory=dict)
    position: Dict[str, int] = field(default_factory=lambda: {"x": 0, "y": 0})
    next_nodes: List[str] = field(default_factory=list)  # IDs of next nodes
    condition: Optional[str] = None  # For conditional nodes

@dataclass
class WorkflowConnection:
    """Represents a connection between nodes"""
    source_node_id: str
    target_node_id: str
    condition: Optional[str] = None  # For conditional connections

@dataclass
class Workflow:
    """Represents a complete workflow"""
    id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ""
    description: str = ""
    nodes: List[WorkflowNode] = field(default_factory=list)
    connections: List[WorkflowConnection] = field(default_factory=list)
    trigger: Optional[WorkflowNode] = None
    active: bool = True

class WorkflowEngine:
    """
    Executes workflows by traversing nodes and executing actions.
    """

    def __init__(self):
        self.action_handlers: Dict[str, Callable] = {}
        self._register_default_handlers()

    def _register_default_handlers(self):
        """Register default action handlers"""
        self.action_handlers[ActionType.RUN_TEST] = self._handle_run_test
        self.action_handlers[ActionType.API_REQUEST] = self._handle_api_request
        self.action_handlers[ActionType.SEND_SLACK] = self._handle_send_slack
        self.action_handlers[ActionType.CREATE_ISSUE] = self._handle_create_issue
        self.action_handlers[ActionType.WAIT] = self._handle_wait
        self.action_handlers[ActionType.TRANSFORM_DATA] = self._handle_transform_data

    def register_handler(self, action_type: str, handler: Callable):
        """Register a custom action handler"""
        self.action_handlers[action_type] = handler

    async def execute_workflow(
        self,
        workflow: Workflow,
        initial_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Execute a workflow from start to finish.

        Args:
            workflow: The workflow to execute
            initial_data: Initial data to pass to the workflow

        Returns:
            Result data from the workflow execution
        """
        if not workflow.trigger:
            raise ValueError("Workflow must have a trigger node")

        context = {
            "data": initial_data or {},
            "results": {},
            "workflow_id": workflow.id,
        }

        # Start from trigger node
        await self._execute_node(workflow, workflow.trigger, context)

        return context

    async def _execute_node(
        self,
        workflow: Workflow,
        node: WorkflowNode,
        context: Dict[str, Any]
    ):
        """Execute a single node and its subsequent nodes"""
        print(f"Executing node: {node.name} ({node.type})")

        # Execute the node's action
        if node.type == NodeType.ACTION:
            result = await self._execute_action(node, context)
            context["results"][node.id] = result
            context["data"] = {**context["data"], **result}

        elif node.type == NodeType.CONDITION:
            # Evaluate condition
            condition_result = self._evaluate_condition(node.condition, context)
            context["results"][node.id] = {"condition_met": condition_result}

        # Find and execute next nodes
        next_node_ids = node.next_nodes
        for next_node_id in next_node_ids:
            next_node = self._find_node(workflow, next_node_id)
            if next_node:
                # Check connection condition if any
                connection = self._find_connection(workflow, node.id, next_node_id)
                if connection and connection.condition:
                    if not self._evaluate_condition(connection.condition, context):
                        continue  # Skip this branch

                await self._execute_node(workflow, next_node, context)

    async def _execute_action(
        self,
        node: WorkflowNode,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a node's action"""
        action_type = node.action_type

        if action_type in self.action_handlers:
            handler = self.action_handlers[action_type]
            return await handler(node, context)
        else:
            print(f"No handler for action type: {action_type}")
            return {"success": False, "error": f"Unknown action type: {action_type}"}

    def _evaluate_condition(self, condition: str, context: Dict[str, Any]) -> bool:
        """
        Evaluate a condition expression.
        Simple implementation - can be enhanced with a proper expression parser.
        """
        try:
            # Basic condition evaluation (can be enhanced)
            # Example: "data.test_status == 'passed'"
            return eval(condition, {"__builtins__": {}}, context)
        except Exception as e:
            print(f"Error evaluating condition: {e}")
            return False

    def _find_node(self, workflow: Workflow, node_id: str) -> Optional[WorkflowNode]:
        """Find a node by ID"""
        for node in workflow.nodes:
            if node.id == node_id:
                return node
        return None

    def _find_connection(
        self,
        workflow: Workflow,
        source_id: str,
        target_id: str
    ) -> Optional[WorkflowConnection]:
        """Find a connection between two nodes"""
        for conn in workflow.connections:
            if conn.source_node_id == source_id and conn.target_node_id == target_id:
                return conn
        return None

    # Default action handlers

    async def _handle_run_test(
        self,
        node: WorkflowNode,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle test execution"""
        test_id = node.config.get("test_id")
        print(f"Running test: {test_id}")

        # Simulate test execution
        await asyncio.sleep(1)

        return {
            "test_id": test_id,
            "status": "passed",
            "duration": 1.5,
        }

    async def _handle_api_request(
        self,
        node: WorkflowNode,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle API request"""
        method = node.config.get("method", "GET")
        url = node.config.get("url")

        print(f"Making {method} request to {url}")

        # Simulate API request
        await asyncio.sleep(0.5)

        return {
            "status_code": 200,
            "response": {"message": "Success"},
        }

    async def _handle_send_slack(
        self,
        node: WorkflowNode,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle Slack notification"""
        message = node.config.get("message", "")
        channel = node.config.get("channel", "#general")

        print(f"Sending Slack message to {channel}: {message}")

        return {
            "success": True,
            "channel": channel,
        }

    async def _handle_create_issue(
        self,
        node: WorkflowNode,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle issue creation"""
        title = node.config.get("title", "")
        description = node.config.get("description", "")

        print(f"Creating issue: {title}")

        return {
            "issue_id": str(uuid4()),
            "title": title,
            "status": "open",
        }

    async def _handle_wait(
        self,
        node: WorkflowNode,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle wait/delay"""
        duration = node.config.get("duration", 1)
        print(f"Waiting for {duration} seconds")

        await asyncio.sleep(duration)

        return {"waited": duration}

    async def _handle_transform_data(
        self,
        node: WorkflowNode,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle data transformation"""
        transformation = node.config.get("transformation", {})

        print(f"Transforming data: {transformation}")

        # Simple transformation (can be enhanced)
        return transformation

# Example usage
if __name__ == "__main__":
    async def main():
        # Create a workflow
        workflow = Workflow(
            name="Test and Notify",
            description="Run tests and send Slack notification on failure",
        )

        # Create nodes
        trigger = WorkflowNode(
            name="Manual Trigger",
            type=NodeType.TRIGGER,
            action_type=TriggerType.MANUAL,
        )

        run_test = WorkflowNode(
            name="Run E2E Tests",
            type=NodeType.ACTION,
            action_type=ActionType.RUN_TEST,
            config={"test_id": "e2e-suite-1"},
        )

        check_status = WorkflowNode(
            name="Check Test Status",
            type=NodeType.CONDITION,
            condition="data['status'] == 'failed'",
        )

        send_notification = WorkflowNode(
            name="Send Failure Notification",
            type=NodeType.ACTION,
            action_type=ActionType.SEND_SLACK,
            config={
                "channel": "#test-failures",
                "message": "Tests failed! Check details.",
            },
        )

        # Connect nodes
        trigger.next_nodes = [run_test.id]
        run_test.next_nodes = [check_status.id]
        check_status.next_nodes = [send_notification.id]

        # Add to workflow
        workflow.trigger = trigger
        workflow.nodes = [trigger, run_test, check_status, send_notification]
        workflow.connections = [
            WorkflowConnection(trigger.id, run_test.id),
            WorkflowConnection(run_test.id, check_status.id),
            WorkflowConnection(check_status.id, send_notification.id, condition="data['status'] == 'failed'"),
        ]

        # Execute workflow
        engine = WorkflowEngine()
        result = await engine.execute_workflow(workflow)

        print("\nWorkflow completed!")
        print(json.dumps(result, indent=2))

    asyncio.run(main())
