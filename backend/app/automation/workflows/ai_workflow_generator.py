"""
AI Workflow Generator Service
Generates workflow definitions from natural language prompts using Gemini AI.
Implements Opal-style prompt-to-workflow conversion for Cognitest.
"""
import json
import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from uuid import uuid4

from app.services.ai_service import get_ai_service
from app.schemas.workflow import WorkflowNodeSchema, WorkflowEdgeSchema, NodeData, NodePosition

logger = logging.getLogger(__name__)

# Maximum nodes allowed in AI-generated workflow
MAX_AI_GENERATED_NODES = 30

# Supported node types for AI generation
SUPPORTED_NODE_TYPES = {
    "manual-trigger": {
        "description": "Workflow entry point triggered manually",
        "config_schema": {}
    },
    "schedule-trigger": {
        "description": "Workflow triggered on a schedule",
        "config_schema": {"cron": "string (cron expression)"}
    },
    "webhook-trigger": {
        "description": "Workflow triggered by webhook",
        "config_schema": {"path": "string (webhook path)"}
    },
    "http-request": {
        "description": "Make HTTP API request",
        "config_schema": {
            "method": "GET|POST|PUT|DELETE",
            "url": "string (URL with {{variable}} interpolation)",
            "headers": "object (key-value pairs)",
            "body": "string or object (request body)"
        }
    },
    "if-condition": {
        "description": "Conditional branching based on expression",
        "config_schema": {
            "condition": "string (JavaScript-like expression)"
        }
    },
    "wait": {
        "description": "Pause execution for specified duration",
        "config_schema": {
            "duration": "number (seconds to wait)"
        }
    },
    "set-variable": {
        "description": "Set a workflow variable",
        "config_schema": {
            "name": "string (variable name)",
            "value": "string (value with {{}} interpolation)"
        }
    },
    "slack": {
        "description": "Send Slack notification",
        "config_schema": {
            "channel": "string (channel name or ID)",
            "message": "string (message with {{}} interpolation)"
        }
    },
    "email": {
        "description": "Send email notification",
        "config_schema": {
            "to": "string or array (recipient emails)",
            "subject": "string (subject line)",
            "body": "string (HTML body)"
        }
    },
    "run-test": {
        "description": "Execute a test suite/flow",
        "config_schema": {
            "test_flow_id": "string (ID of test to run)",
            "environment": "string (staging, production, etc.)"
        }
    },
    "jira": {
        "description": "Create or update Jira issue",
        "config_schema": {
            "action": "create|update|comment",
            "project": "string (project key)",
            "summary": "string (issue summary)",
            "description": "string (issue description)"
        }
    },
    "github": {
        "description": "Interact with GitHub",
        "config_schema": {
            "action": "create_issue|create_pr|comment",
            "owner": "string (repo owner)",
            "repo": "string (repo name)",
            "title": "string"
        }
    }
}

SYSTEM_PROMPT = """You are a workflow generator for Cognitest, a test automation platform.
Generate a valid workflow JSON based on the user's natural language description.

## Available Node Types:
{node_types}

## Output Format:
Return ONLY valid JSON matching this exact schema:
{{
  "name": "string (workflow name)",
  "description": "string (brief description)",
  "nodes": [
    {{
      "id": "string (unique ID like node_1, node_2)",
      "type": "string (node type from list above)",
      "position": {{"x": number, "y": number}},
      "data": {{
        "label": "string (display name)",
        "type": "string (same as node type)",
        "config": {{...configuration based on node type}}
      }}
    }}
  ],
  "edges": [
    {{
      "id": "string (unique edge ID)",
      "source": "string (source node ID)",
      "target": "string (target node ID)",
      "sourceHandle": "string (optional: 'true' or 'false' for conditions)",
      "label": "string (optional edge label)"
    }}
  ],
  "variables": {{
    "key": "value"
  }}
}}

## Rules:
1. ALWAYS start with exactly ONE trigger node (manual-trigger, schedule-trigger, or webhook-trigger)
2. Use {{{{variable.path}}}} syntax for variable interpolation (e.g., {{{{trigger.data.url}}}})
3. For conditions, use 'true' and 'false' as sourceHandle values
4. Position nodes from left to right, top to bottom (x increases right, y increases down)
5. Keep x positions in increments of 250, y in increments of 100
6. Maximum {max_nodes} nodes per workflow
7. Every node must be connected (no orphans)
8. Return ONLY the JSON, no markdown code blocks or explanations

## Examples of variable interpolation:
- {{{{trigger.data.message}}}} - data from trigger
- {{{{nodes.node_1.response.status}}}} - output from previous node
- {{{{variables.baseUrl}}}} - workflow-level variable
"""


class AIWorkflowGenerator:
    """
    Generates workflow definitions from natural language using AI.
    """

    def __init__(self):
        self.ai_service = get_ai_service()

    async def generate_workflow(
        self,
        prompt: str,
        project_id: str,
        user_context: Optional[Dict[str, Any]] = None
    ) -> Tuple[Dict[str, Any], List[str]]:
        """
        Generate a workflow from natural language description.

        Args:
            prompt: Natural language description of desired workflow
            project_id: Project ID for context
            user_context: Optional additional context (available tests, integrations, etc.)

        Returns:
            Tuple of (workflow_definition, validation_warnings)
        """
        # Build node types documentation
        node_docs = []
        for node_type, info in SUPPORTED_NODE_TYPES.items():
            config_str = json.dumps(info["config_schema"], indent=2) if info["config_schema"] else "{}"
            node_docs.append(f"- **{node_type}**: {info['description']}\n  Config: {config_str}")

        node_types_doc = "\n".join(node_docs)

        # Format system prompt
        system_prompt = SYSTEM_PROMPT.format(
            node_types=node_types_doc,
            max_nodes=MAX_AI_GENERATED_NODES
        )

        # Generate with Gemini
        messages = [
            {"role": "user", "content": f"{system_prompt}\n\n## User Request:\n{prompt}"}
        ]

        try:
            response = await self.ai_service.generate_completion(
                messages=messages,
                temperature=0.3,  # Lower temperature for more consistent JSON
                max_tokens=4000,
                json_mode=True
            )

            # Parse JSON response
            workflow_json = self._parse_json_response(response)

            # Validate and sanitize
            validated_workflow, warnings = self._validate_workflow(workflow_json)

            logger.info(f"Generated workflow '{validated_workflow.get('name', 'Unnamed')}' with {len(validated_workflow.get('nodes', []))} nodes")

            return validated_workflow, warnings

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            raise ValueError(f"AI generated invalid JSON: {str(e)}")
        except Exception as e:
            logger.error(f"Workflow generation failed: {e}")
            raise

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON from AI response, handling markdown code blocks."""
        # Remove markdown code blocks if present
        cleaned = response.strip()
        
        # Handle ```json ... ``` blocks
        if cleaned.startswith("```"):
            # Find the end of the code block
            match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', cleaned, re.DOTALL)
            if match:
                cleaned = match.group(1).strip()
        
        return json.loads(cleaned)

    def _validate_workflow(
        self,
        workflow: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], List[str]]:
        """
        Validate and sanitize generated workflow.

        Returns:
            Tuple of (validated_workflow, warnings)
        """
        warnings = []
        nodes = workflow.get("nodes", [])
        edges = workflow.get("edges", [])

        # Check node count
        if len(nodes) > MAX_AI_GENERATED_NODES:
            warnings.append(f"Workflow truncated to {MAX_AI_GENERATED_NODES} nodes")
            nodes = nodes[:MAX_AI_GENERATED_NODES]
            workflow["nodes"] = nodes

        # Validate trigger node
        trigger_nodes = [
            n for n in nodes
            if n.get("type", "").endswith("-trigger") or n.get("data", {}).get("type", "").endswith("-trigger")
        ]
        
        if not trigger_nodes:
            # Add default manual trigger
            warnings.append("Added missing trigger node")
            trigger_node = {
                "id": "trigger_1",
                "type": "trigger",
                "position": {"x": 100, "y": 200},
                "data": {
                    "label": "Start",
                    "type": "manual-trigger",
                    "config": {}
                }
            }
            nodes.insert(0, trigger_node)
            
            # Connect to first non-trigger node
            if len(nodes) > 1:
                edges.insert(0, {
                    "id": f"edge_{uuid4().hex[:8]}",
                    "source": "trigger_1",
                    "target": nodes[1]["id"]
                })

        elif len(trigger_nodes) > 1:
            warnings.append("Multiple trigger nodes found, only first will be used")

        # Validate node types
        node_ids = set()
        for node in nodes:
            node_id = node.get("id", f"node_{uuid4().hex[:8]}")
            node_ids.add(node_id)
            
            node_type = node.get("data", {}).get("type") or node.get("type")
            if node_type and not node_type.endswith("-trigger") and node_type not in SUPPORTED_NODE_TYPES:
                warnings.append(f"Unknown node type: {node_type}")

        # Validate edges reference existing nodes
        valid_edges = []
        for edge in edges:
            source = edge.get("source")
            target = edge.get("target")
            if source in node_ids and target in node_ids:
                valid_edges.append(edge)
            else:
                warnings.append(f"Removed invalid edge from {source} to {target}")

        workflow["edges"] = valid_edges

        # Check for orphaned nodes
        connected_nodes = set()
        for edge in valid_edges:
            connected_nodes.add(edge.get("source"))
            connected_nodes.add(edge.get("target"))

        orphaned = node_ids - connected_nodes - {"trigger_1"}  # Trigger is source, not target
        if orphaned and len(nodes) > 1:
            warnings.append(f"Orphaned nodes detected: {', '.join(orphaned)}")

        # Ensure each node has required fields
        for node in nodes:
            if "id" not in node:
                node["id"] = f"node_{uuid4().hex[:8]}"
            if "position" not in node:
                node["position"] = {"x": 100, "y": 100}
            if "data" not in node:
                node["data"] = {"label": "Unnamed", "type": "action", "config": {}}

        return workflow, warnings

    def get_supported_node_types(self) -> Dict[str, Any]:
        """Return supported node types for UI display."""
        return SUPPORTED_NODE_TYPES


# Pre-defined workflow templates
WORKFLOW_TEMPLATES = {
    "smoke_test_notify": {
        "id": "template_smoke_notify",
        "name": "Smoke Test with Notification",
        "description": "Run smoke tests and notify Slack on failure",
        "category": "testing",
        "nodes": [
            {
                "id": "trigger_1",
                "type": "trigger",
                "position": {"x": 100, "y": 200},
                "data": {"label": "Start", "type": "manual-trigger", "config": {}}
            },
            {
                "id": "node_1",
                "type": "action",
                "position": {"x": 350, "y": 200},
                "data": {
                    "label": "Run Smoke Tests",
                    "type": "run-test",
                    "config": {"test_flow_id": "", "environment": "staging"}
                }
            },
            {
                "id": "node_2",
                "type": "condition",
                "position": {"x": 600, "y": 200},
                "data": {
                    "label": "Check Results",
                    "type": "if-condition",
                    "config": {"condition": "nodes.node_1.status === 'failed'"}
                }
            },
            {
                "id": "node_3",
                "type": "integration",
                "position": {"x": 850, "y": 150},
                "data": {
                    "label": "Notify Slack",
                    "type": "slack",
                    "config": {
                        "channel": "#qa-alerts",
                        "message": "🚨 Smoke tests failed! Check results."
                    }
                }
            }
        ],
        "edges": [
            {"id": "e1", "source": "trigger_1", "target": "node_1"},
            {"id": "e2", "source": "node_1", "target": "node_2"},
            {"id": "e3", "source": "node_2", "target": "node_3", "sourceHandle": "true", "label": "Failed"}
        ],
        "variables": {}
    },
    "api_health_check": {
        "id": "template_api_health",
        "name": "API Health Check",
        "description": "Check API health endpoint and notify on failure",
        "category": "monitoring",
        "nodes": [
            {
                "id": "trigger_1",
                "type": "trigger",
                "position": {"x": 100, "y": 200},
                "data": {"label": "Schedule", "type": "schedule-trigger", "config": {"cron": "*/5 * * * *"}}
            },
            {
                "id": "node_1",
                "type": "integration",
                "position": {"x": 350, "y": 200},
                "data": {
                    "label": "Health Check",
                    "type": "http-request",
                    "config": {
                        "method": "GET",
                        "url": "{{variables.baseUrl}}/health",
                        "headers": {}
                    }
                }
            },
            {
                "id": "node_2",
                "type": "condition",
                "position": {"x": 600, "y": 200},
                "data": {
                    "label": "Check Status",
                    "type": "if-condition",
                    "config": {"condition": "nodes.node_1.response.statusCode !== 200"}
                }
            },
            {
                "id": "node_3",
                "type": "integration",
                "position": {"x": 850, "y": 150},
                "data": {
                    "label": "Alert",
                    "type": "email",
                    "config": {
                        "to": "team@example.com",
                        "subject": "API Health Check Failed",
                        "body": "The health endpoint returned non-200 status"
                    }
                }
            }
        ],
        "edges": [
            {"id": "e1", "source": "trigger_1", "target": "node_1"},
            {"id": "e2", "source": "node_1", "target": "node_2"},
            {"id": "e3", "source": "node_2", "target": "node_3", "sourceHandle": "true", "label": "Unhealthy"}
        ],
        "variables": {"baseUrl": "https://api.example.com"}
    },
    "regression_pipeline": {
        "id": "template_regression",
        "name": "Nightly Regression Pipeline",
        "description": "Full regression suite with Jira issue creation on failure",
        "category": "testing",
        "nodes": [
            {
                "id": "trigger_1",
                "type": "trigger",
                "position": {"x": 100, "y": 200},
                "data": {"label": "Nightly", "type": "schedule-trigger", "config": {"cron": "0 2 * * *"}}
            },
            {
                "id": "node_1",
                "type": "action",
                "position": {"x": 350, "y": 200},
                "data": {
                    "label": "Run Regression",
                    "type": "run-test",
                    "config": {"test_flow_id": "", "environment": "staging"}
                }
            },
            {
                "id": "node_2",
                "type": "condition",
                "position": {"x": 600, "y": 200},
                "data": {
                    "label": "Check Results",
                    "type": "if-condition",
                    "config": {"condition": "nodes.node_1.failed_count > 0"}
                }
            },
            {
                "id": "node_3",
                "type": "integration",
                "position": {"x": 850, "y": 100},
                "data": {
                    "label": "Create Jira",
                    "type": "jira",
                    "config": {
                        "action": "create",
                        "project": "QA",
                        "summary": "Regression failures: {{nodes.node_1.failed_count}} tests",
                        "description": "Automated regression found failures"
                    }
                }
            },
            {
                "id": "node_4",
                "type": "integration",
                "position": {"x": 850, "y": 250},
                "data": {
                    "label": "Notify Team",
                    "type": "slack",
                    "config": {
                        "channel": "#qa-team",
                        "message": "Regression complete: {{nodes.node_1.passed_count}} passed, {{nodes.node_1.failed_count}} failed"
                    }
                }
            }
        ],
        "edges": [
            {"id": "e1", "source": "trigger_1", "target": "node_1"},
            {"id": "e2", "source": "node_1", "target": "node_2"},
            {"id": "e3", "source": "node_2", "target": "node_3", "sourceHandle": "true", "label": "Has Failures"},
            {"id": "e4", "source": "node_2", "target": "node_4"}
        ],
        "variables": {}
    }
}


def get_workflow_templates(category: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Get available workflow templates.
    
    Args:
        category: Optional filter by category
        
    Returns:
        List of template summaries
    """
    templates = []
    for key, template in WORKFLOW_TEMPLATES.items():
        if category and template.get("category") != category:
            continue
        templates.append({
            "id": template["id"],
            "name": template["name"],
            "description": template["description"],
            "category": template.get("category", "general"),
            "node_count": len(template.get("nodes", []))
        })
    return templates


def get_workflow_template(template_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a specific workflow template by ID.
    
    Args:
        template_id: Template identifier
        
    Returns:
        Full template definition or None
    """
    for template in WORKFLOW_TEMPLATES.values():
        if template["id"] == template_id:
            return template.copy()
    return None


# Singleton instance
_ai_generator: Optional[AIWorkflowGenerator] = None


def get_ai_workflow_generator() -> AIWorkflowGenerator:
    """Get singleton AI workflow generator instance."""
    global _ai_generator
    if _ai_generator is None:
        _ai_generator = AIWorkflowGenerator()
    return _ai_generator
