"""
Workflow Execution Engine
Handles the execution of workflow nodes and orchestration
"""
import asyncio
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List, Set
from dataclasses import dataclass, field
from enum import Enum
from collections import deque

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from ..models.workflow import (
    WorkflowDefinition,
    WorkflowExecution,
    WorkflowExecutionStep,
    WorkflowCredential,
    ExecutionStatus,
    StepStatus,
)
from .integrations import IntegrationRegistry, IntegrationResult

logger = logging.getLogger(__name__)


class NodeType(str, Enum):
    """Types of workflow nodes"""
    TRIGGER = "trigger"
    ACTION = "action"
    CONDITION = "condition"
    LOOP = "loop"
    WAIT = "wait"
    INTEGRATION = "integration"


@dataclass
class ExecutionContext:
    """Context for workflow execution"""
    execution_id: str
    workflow_id: str
    project_id: str
    organisation_id: str
    user_id: Optional[str] = None
    trigger_data: Dict[str, Any] = field(default_factory=dict)
    variables: Dict[str, Any] = field(default_factory=dict)
    node_outputs: Dict[str, Any] = field(default_factory=dict)
    credentials: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    current_node_id: Optional[str] = None
    execution_path: List[str] = field(default_factory=list)
    start_time: datetime = field(default_factory=datetime.utcnow)
    timeout_seconds: int = 3600
    stop_requested: bool = False
    
    def get_data(self) -> Dict[str, Any]:
        """Get all available data for variable interpolation"""
        return {
            "trigger": self.trigger_data,
            "variables": self.variables,
            "nodes": self.node_outputs,
            "context": {
                "execution_id": self.execution_id,
                "workflow_id": self.workflow_id,
                "timestamp": datetime.utcnow().isoformat(),
            }
        }


@dataclass
class NodeResult:
    """Result from executing a node"""
    success: bool
    output_data: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    error_type: Optional[str] = None
    next_node_ids: List[str] = field(default_factory=list)
    duration_ms: int = 0
    logs: List[Dict[str, Any]] = field(default_factory=list)


class WorkflowEngine:
    """
    Workflow execution engine.
    Handles node traversal, execution, and state management.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self._stop_signals: Dict[str, bool] = {}
        self._callbacks: Dict[str, List[callable]] = {}
    
    async def execute_workflow(
        self,
        workflow: WorkflowDefinition,
        execution: WorkflowExecution,
        trigger_data: Optional[Dict[str, Any]] = None,
        credentials: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> ExecutionStatus:
        """
        Execute a workflow from start to finish.
        
        Args:
            workflow: The workflow definition to execute
            execution: The execution record
            trigger_data: Data from the trigger (webhook payload, schedule context, etc.)
            credentials: Decrypted credentials keyed by credential ID
            
        Returns:
            Final execution status
        """
        execution_id = str(execution.id)
        
        # Initialize context
        context = ExecutionContext(
            execution_id=execution_id,
            workflow_id=str(workflow.id),
            project_id=str(workflow.project_id),
            organisation_id=str(workflow.organisation_id),
            user_id=str(execution.triggered_by_id) if execution.triggered_by_id else None,
            trigger_data=trigger_data or {},
            variables=dict(workflow.global_variables or {}),
            credentials=credentials or {},
            timeout_seconds=workflow.timeout_seconds or 3600,
        )
        
        # Parse workflow structure
        nodes = {n["id"]: n for n in (workflow.nodes_json or [])}
        edges = workflow.edges_json or []
        
        # Build adjacency map
        adjacency: Dict[str, List[Dict[str, Any]]] = {}
        for edge in edges:
            source = edge.get("source")
            if source not in adjacency:
                adjacency[source] = []
            adjacency[source].append(edge)
        
        logger.info(f"Starting workflow execution {execution_id} with {len(nodes)} nodes")
        
        # Update execution status to running
        await self._update_execution_status(execution, ExecutionStatus.RUNNING)
        await self._notify("status_change", execution_id, {"status": "running"})
        
        try:
            # Find trigger node (entry point)
            trigger_nodes = [
                n for n in nodes.values()
                if n.get("data", {}).get("type", "").endswith("-trigger") or n.get("type") == "trigger"
            ]
            
            if not trigger_nodes:
                raise Exception("No trigger node found in workflow")
            
            # Start execution from trigger node
            start_node_id = trigger_nodes[0]["id"]
            
            # Execute using BFS traversal
            final_status = await self._execute_graph(
                nodes, adjacency, start_node_id, context, execution
            )
            
            # Update final execution status
            await self._update_execution_status(
                execution,
                final_status,
                completed_at=datetime.utcnow()
            )
            
            logger.info(f"Workflow execution {execution_id} completed with status: {final_status}")
            await self._notify("status_change", execution_id, {"status": final_status.value})
            
            return final_status
        
        except asyncio.CancelledError:
            await self._update_execution_status(
                execution,
                ExecutionStatus.STOPPED,
                error_message="Execution was cancelled",
                completed_at=datetime.utcnow()
            )
            await self._notify("status_change", execution_id, {"status": "stopped"})
            return ExecutionStatus.STOPPED
        
        except Exception as e:
            logger.exception(f"Workflow execution {execution_id} failed: {e}")
            await self._update_execution_status(
                execution,
                ExecutionStatus.FAILED,
                error_message=str(e),
                completed_at=datetime.utcnow()
            )
            await self._notify("status_change", execution_id, {"status": "failed", "error": str(e)})
            return ExecutionStatus.FAILED
    
    async def _execute_graph(
        self,
        nodes: Dict[str, Dict[str, Any]],
        adjacency: Dict[str, List[Dict[str, Any]]],
        start_node_id: str,
        context: ExecutionContext,
        execution: WorkflowExecution
    ) -> ExecutionStatus:
        """Execute workflow graph using BFS traversal"""
        
        # Initialize execution queue
        queue: deque = deque([start_node_id])
        visited: Set[str] = set()
        step_order = 0
        has_failures = False
        
        while queue and not context.stop_requested:
            node_id = queue.popleft()
            
            if node_id in visited:
                continue
            
            visited.add(node_id)
            
            node = nodes.get(node_id)
            if not node:
                logger.warning(f"Node {node_id} not found in workflow")
                continue
            
            context.current_node_id = node_id
            context.execution_path.append(node_id)
            step_order += 1
            
            # Check for stop signal
            if self._stop_signals.get(context.execution_id, False):
                context.stop_requested = True
                break
            
            # Check timeout
            if (datetime.utcnow() - context.start_time).total_seconds() > context.timeout_seconds:
                raise Exception(f"Workflow execution timed out after {context.timeout_seconds} seconds")
            
            # Execute node
            try:
                node_result = await self._execute_node(node, context, step_order, execution)
                
                # Store output
                context.node_outputs[node_id] = node_result.output_data
                
                if not node_result.success:
                    has_failures = True
                    
                    # Check error handling policy
                    error_handling = execution.workflow.error_handling_json or {}
                    on_error = error_handling.get("on_error", "stop")
                    
                    if on_error == "stop":
                        await self._update_execution_status(
                            execution,
                            ExecutionStatus.FAILED,
                            error_message=node_result.error,
                            error_node_id=node_id
                        )
                        return ExecutionStatus.FAILED
                    elif on_error == "continue":
                        # Continue to next nodes
                        pass
                
                # Determine next nodes
                next_node_ids = node_result.next_node_ids
                
                if not next_node_ids:
                    # Get from adjacency map
                    for edge in adjacency.get(node_id, []):
                        target = edge.get("target")
                        if target and target not in visited:
                            next_node_ids.append(target)
                
                # Add to queue
                for next_id in next_node_ids:
                    if next_id not in visited:
                        queue.append(next_id)
            
            except Exception as e:
                logger.exception(f"Error executing node {node_id}: {e}")
                
                # Record step failure
                await self._create_step_record(
                    execution,
                    node,
                    step_order,
                    StepStatus.FAILED,
                    error_message=str(e)
                )
                
                # Check error handling
                error_handling = execution.workflow.error_handling_json or {}
                if error_handling.get("on_error", "stop") == "stop":
                    return ExecutionStatus.FAILED
                
                has_failures = True
        
        if context.stop_requested:
            return ExecutionStatus.STOPPED
        
        return ExecutionStatus.COMPLETED_WITH_ERRORS if has_failures else ExecutionStatus.COMPLETED
    
    async def _execute_node(
        self,
        node: Dict[str, Any],
        context: ExecutionContext,
        step_order: int,
        execution: WorkflowExecution
    ) -> NodeResult:
        """Execute a single workflow node"""
        
        node_id = node.get("id", "unknown")
        node_data = node.get("data", {})
        node_type = node_data.get("type", "action")
        node_config = node_data.get("config", {})
        
        start_time = datetime.utcnow()
        
        logger.info(f"Executing node {node_id} ({node_type})")
        await self._notify("step_started", context.execution_id, {
            "node_id": node_id,
            "node_type": node_type,
            "node_name": node_data.get("label", node_type)
        })
        
        result = NodeResult(success=True)
        
        try:
            # Handle different node types
            if node_type.endswith("-trigger"):
                # Trigger nodes pass through trigger data
                result.output_data = context.trigger_data
            
            elif node_type == "if-condition":
                result = await self._execute_condition_node(node, context)
            
            elif node_type == "wait":
                wait_seconds = node_config.get("duration", 0)
                await asyncio.sleep(wait_seconds)
                result.output_data = {"waited": wait_seconds}
            
            elif node_type == "set-variable":
                var_name = node_config.get("name", "")
                var_value = self._interpolate(node_config.get("value", ""), context.get_data())
                context.variables[var_name] = var_value
                result.output_data = {"name": var_name, "value": var_value}
            
            elif node_type == "loop":
                result = await self._execute_loop_node(node, context)
            
            elif node_type == "http-request" or node_type in IntegrationRegistry.list_types():
                # Execute integration
                integration = IntegrationRegistry.get(node_type.replace("-", "_"))
                if integration:
                    # Get credentials if specified
                    creds = None
                    cred_id = node_data.get("credentials_id")
                    if cred_id and cred_id in context.credentials:
                        creds = context.credentials[cred_id]
                    
                    int_result = await integration.execute(
                        node_config,
                        context.get_data(),
                        creds,
                        {"execution_id": context.execution_id}
                    )
                    
                    result.success = int_result.success
                    result.output_data = int_result.data
                    result.error = int_result.error
                    result.error_type = int_result.error_type
                    result.logs = int_result.logs
                else:
                    logger.warning(f"Unknown integration type: {node_type}")
                    result.output_data = {"warning": f"Unknown node type: {node_type}"}
            
            elif node_type == "run-test":
                # Execute test flow
                result = await self._execute_test_node(node, context)
            
            else:
                # Unknown node type - pass through
                result.output_data = {"type": node_type, "config": node_config}
        
        except Exception as e:
            result.success = False
            result.error = str(e)
            result.error_type = "execution_error"
        
        # Calculate duration
        result.duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Record step
        step_status = StepStatus.COMPLETED if result.success else StepStatus.FAILED
        await self._create_step_record(
            execution,
            node,
            step_order,
            step_status,
            input_data=context.get_data(),
            output_data=result.output_data,
            duration_ms=result.duration_ms,
            error_message=result.error,
            logs=result.logs
        )
        
        # Notify step completion
        await self._notify(
            "step_completed" if result.success else "step_failed",
            context.execution_id,
            {
                "node_id": node_id,
                "status": step_status.value,
                "duration_ms": result.duration_ms,
                "error": result.error
            }
        )
        
        return result
    
    async def _execute_condition_node(
        self,
        node: Dict[str, Any],
        context: ExecutionContext
    ) -> NodeResult:
        """Execute an IF condition node"""
        result = NodeResult(success=True)
        node_config = node.get("data", {}).get("config", {})
        
        condition_expr = node_config.get("condition", "")
        condition_expr = self._interpolate(condition_expr, context.get_data())
        
        try:
            # Safely evaluate condition
            # In production, use a proper expression evaluator
            data = context.get_data()
            condition_result = eval(condition_expr, {"__builtins__": {}}, data)
            
            result.output_data = {"condition": condition_expr, "result": bool(condition_result)}
            
            # Determine which output to use
            # Assuming edges have sourceHandle "true" or "false"
            if condition_result:
                result.next_node_ids = []  # Will be filled by adjacency with "true" handle
            else:
                result.next_node_ids = []  # Will be filled by adjacency with "false" handle
        
        except Exception as e:
            result.success = False
            result.error = f"Condition evaluation failed: {e}"
        
        return result
    
    async def _execute_loop_node(
        self,
        node: Dict[str, Any],
        context: ExecutionContext
    ) -> NodeResult:
        """Execute a loop node"""
        result = NodeResult(success=True)
        node_config = node.get("data", {}).get("config", {})
        
        items = node_config.get("items", [])
        if isinstance(items, str):
            items_expr = self._interpolate(items, context.get_data())
            try:
                items = eval(items_expr, {"__builtins__": {}}, context.get_data())
            except Exception:
                items = []
        
        result.output_data = {
            "items": items,
            "count": len(items) if isinstance(items, list) else 0
        }
        
        return result
    
    async def _execute_test_node(
        self,
        node: Dict[str, Any],
        context: ExecutionContext
    ) -> NodeResult:
        """Execute a test flow node"""
        result = NodeResult(success=True)
        node_config = node.get("data", {}).get("config", {})
        
        test_flow_id = node_config.get("test_flow_id")
        
        if not test_flow_id:
            result.success = False
            result.error = "Test flow ID is required"
            return result
        
        # TODO: Integrate with test execution engine
        # For now, return placeholder
        result.output_data = {
            "test_flow_id": test_flow_id,
            "status": "pending",
            "message": "Test execution integration pending"
        }
        
        return result
    
    def _interpolate(self, template: str, data: Dict[str, Any]) -> str:
        """Interpolate variables in a string template"""
        import re
        
        def replace_var(match):
            path = match.group(1).strip()
            parts = path.split('.')
            value = data
            try:
                for part in parts:
                    if isinstance(value, dict):
                        value = value.get(part, match.group(0))
                    elif isinstance(value, list) and part.isdigit():
                        value = value[int(part)]
                    else:
                        return match.group(0)
                return str(value) if value is not None else ""
            except (KeyError, IndexError, TypeError):
                return match.group(0)
        
        return re.sub(r'\{\{(.+?)\}\}', replace_var, str(template))
    
    async def _update_execution_status(
        self,
        execution: WorkflowExecution,
        status: ExecutionStatus,
        error_message: Optional[str] = None,
        error_node_id: Optional[str] = None,
        completed_at: Optional[datetime] = None
    ):
        """Update execution status in database"""
        execution.status = status
        if error_message:
            execution.error_message = error_message
        if error_node_id:
            execution.error_node_id = error_node_id
        if completed_at:
            execution.completed_at = completed_at
            if execution.started_at:
                execution.duration_ms = int(
                    (completed_at - execution.started_at).total_seconds() * 1000
                )
        
        await self.db.commit()
    
    async def _create_step_record(
        self,
        execution: WorkflowExecution,
        node: Dict[str, Any],
        step_order: int,
        status: StepStatus,
        input_data: Optional[Dict] = None,
        output_data: Optional[Dict] = None,
        duration_ms: int = 0,
        error_message: Optional[str] = None,
        logs: Optional[List[Dict]] = None
    ):
        """Create an execution step record"""
        node_data = node.get("data", {})
        
        step = WorkflowExecutionStep(
            execution_id=execution.id,
            node_id=node.get("id", ""),
            node_type=node_data.get("type", "unknown"),
            node_name=node_data.get("label"),
            step_order=step_order,
            status=status,
            input_data=input_data,
            output_data=output_data,
            duration_ms=duration_ms,
            error_message=error_message,
            logs=logs,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow() if status != StepStatus.RUNNING else None
        )
        
        self.db.add(step)
        
        # Update execution counters
        if status == StepStatus.COMPLETED:
            execution.completed_nodes = (execution.completed_nodes or 0) + 1
        elif status == StepStatus.FAILED:
            execution.failed_nodes = (execution.failed_nodes or 0) + 1
        elif status == StepStatus.SKIPPED:
            execution.skipped_nodes = (execution.skipped_nodes or 0) + 1
        
        await self.db.commit()
    
    async def _notify(self, event_type: str, execution_id: str, data: Dict[str, Any]):
        """Notify registered callbacks of events"""
        callbacks = self._callbacks.get(execution_id, [])
        for callback in callbacks:
            try:
                await callback(event_type, data)
            except Exception as e:
                logger.warning(f"Callback error: {e}")
    
    def register_callback(self, execution_id: str, callback: callable):
        """Register a callback for execution events"""
        if execution_id not in self._callbacks:
            self._callbacks[execution_id] = []
        self._callbacks[execution_id].append(callback)
    
    def unregister_callbacks(self, execution_id: str):
        """Remove all callbacks for an execution"""
        self._callbacks.pop(execution_id, None)
    
    def request_stop(self, execution_id: str):
        """Request stop for an execution"""
        self._stop_signals[execution_id] = True
    
    def clear_stop_signal(self, execution_id: str):
        """Clear stop signal"""
        self._stop_signals.pop(execution_id, None)
