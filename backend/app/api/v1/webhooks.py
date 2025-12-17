"""
Webhook API Endpoints
Handles incoming webhooks that trigger workflow executions
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any
from uuid import uuid4
import hmac
import hashlib
import json
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.workflow import (
    WorkflowWebhook,
    WorkflowExecution,
    WorkflowDefinition,
    ExecutionStatus,
)

router = APIRouter()


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify webhook signature using HMAC-SHA256"""
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


@router.api_route("/incoming/{path:path}", methods=["GET", "POST", "PUT", "PATCH"])
async def receive_webhook(
    path: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Receive and process incoming webhooks to trigger workflow executions
    """
    # Find webhook by path
    result = await db.execute(
        select(WorkflowWebhook)
        .where(WorkflowWebhook.path == path)
        .where(WorkflowWebhook.enabled == True)
    )
    webhook = result.scalar_one_or_none()
    
    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found or disabled"
        )
    
    # Check method
    if webhook.method.upper() != request.method.upper():
        raise HTTPException(
            status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
            detail=f"Webhook only accepts {webhook.method} requests"
        )
    
    # Check IP allowlist
    client_ip = request.client.host if request.client else None
    if webhook.allowed_ips and len(webhook.allowed_ips) > 0:
        if client_ip not in webhook.allowed_ips:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="IP not allowed"
            )
    
    # Get request body
    try:
        if request.method.upper() == "GET":
            payload_data = dict(request.query_params)
        else:
            body = await request.body()
            try:
                payload_data = json.loads(body) if body else {}
            except json.JSONDecodeError:
                payload_data = {"raw_body": body.decode('utf-8', errors='replace')}
    except Exception as e:
        payload_data = {"error": str(e)}
    
    # Verify signature if secret is set
    if webhook.secret_key:
        signature = request.headers.get("X-Webhook-Signature", "")
        if not signature:
            signature = request.headers.get("X-Hub-Signature-256", "")  # GitHub style
        
        if signature:
            body = await request.body()
            if not verify_webhook_signature(body, signature, webhook.secret_key):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid webhook signature"
                )
    
    # Get workflow
    workflow_result = await db.execute(
        select(WorkflowDefinition).where(WorkflowDefinition.id == webhook.workflow_id)
    )
    workflow = workflow_result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    # Update webhook statistics
    webhook.total_calls = (webhook.total_calls or 0) + 1
    webhook.last_called_at = datetime.now(timezone.utc)
    webhook.last_caller_ip = client_ip
    
    # Create execution record
    from app.api.v1.workflow import generate_human_id
    
    execution = WorkflowExecution(
        id=uuid4(),
        workflow_id=workflow.id,
        project_id=workflow.project_id,
        human_id=generate_human_id("EX"),
        workflow_version=workflow.version,
        workflow_snapshot={
            "nodes": workflow.nodes_json,
            "edges": workflow.edges_json,
            "global_variables": workflow.global_variables,
        },
        status=ExecutionStatus.PENDING,
        trigger_source="webhook",
        trigger_data={
            **payload_data,
            "_webhook": {
                "path": path,
                "method": request.method,
                "headers": dict(request.headers),
                "ip": client_ip,
            }
        },
        total_nodes=len(workflow.nodes_json) if workflow.nodes_json else 0,
        execution_context={
            "webhook_id": str(webhook.id),
            "client_ip": client_ip,
        },
        created_at=datetime.now(timezone.utc),
    )
    
    db.add(execution)
    
    # Update success count
    webhook.successful_calls = (webhook.successful_calls or 0) + 1
    
    await db.commit()
    await db.refresh(execution)
    
    # Queue background execution
    from app.api.v1.workflow import run_workflow_execution
    background_tasks.add_task(
        run_workflow_execution,
        str(execution.id),
        str(workflow.id)
    )
    
    # Determine response based on mode
    if webhook.response_mode == "immediate":
        response_data = webhook.response_data or {"message": "Workflow triggered"}
        return {
            **response_data,
            "execution_id": str(execution.id),
            "status": "pending"
        }
    else:
        # For on_completion mode, we'd need to wait (simplified here)
        return {
            "execution_id": str(execution.id),
            "status": "pending",
            "message": "Workflow execution started"
        }


@router.get("/test/{path:path}")
async def test_webhook(
    path: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Test if a webhook path exists and is configured correctly
    """
    result = await db.execute(
        select(WorkflowWebhook).where(WorkflowWebhook.path == path)
    )
    webhook = result.scalar_one_or_none()
    
    if not webhook:
        return {
            "exists": False,
            "message": "Webhook not found"
        }
    
    return {
        "exists": True,
        "enabled": webhook.enabled,
        "method": webhook.method,
        "require_auth": webhook.require_auth,
        "rate_limit_enabled": webhook.rate_limit_enabled,
    }
