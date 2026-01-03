"""
Snippet API Endpoints
CRUD operations for reusable parameterized test step snippets
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_, and_
from typing import List, Optional
from uuid import UUID
import re

from ...core.deps import get_db, get_current_active_user
from ...models.snippet import TestSnippet
from ...models.project import Project
from ...models.user import User
from ...schemas.snippet import (
    SnippetCreate,
    SnippetUpdate,
    SnippetResponse,
    SnippetBulkUpdateRequest,
    SnippetFromStepsRequest,
)

router = APIRouter()


@router.get("/", response_model=List[SnippetResponse])
async def list_snippets(
    project_id: UUID,
    organisation_id: Optional[UUID] = None,
    include_global: bool = Query(True, description="Include org-level snippets"),
    tag: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all snippets for a project, optionally including org-level global snippets"""
    
    # Get project to verify access and get org_id
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    org_id = organisation_id or project.organisation_id
    
    # Build query - properly handle include_global condition
    if include_global:
        query = select(TestSnippet).where(
            or_(
                TestSnippet.project_id == project_id,
                and_(TestSnippet.is_global == True, TestSnippet.organisation_id == org_id)
            )
        )
    else:
        query = select(TestSnippet).where(TestSnippet.project_id == project_id)
    
    if tag:
        query = query.where(TestSnippet.tags.contains([tag]))
    
    if search:
        query = query.where(TestSnippet.name.ilike(f"%{search}%"))
    
    query = query.order_by(desc(TestSnippet.usage_count), TestSnippet.name)
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    snippets = result.scalars().all()
    
    return snippets


@router.post("/", response_model=SnippetResponse, status_code=201)
async def create_snippet(
    project_id: UUID,
    snippet_data: SnippetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new snippet"""
    
    # Get project
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Validate parameters have unique names
    param_names = [p.name for p in snippet_data.parameters]
    if len(param_names) != len(set(param_names)):
        raise HTTPException(status_code=400, detail="Parameter names must be unique")
    
    # Create snippet
    snippet = TestSnippet(
        project_id=project_id,
        organisation_id=project.organisation_id,
        name=snippet_data.name,
        description=snippet_data.description,
        parameters=[p.model_dump() for p in snippet_data.parameters],
        steps=snippet_data.steps,
        tags=snippet_data.tags,
        is_global=snippet_data.is_global,
        version=snippet_data.version,
        created_by=current_user.id
    )
    
    db.add(snippet)
    await db.commit()
    await db.refresh(snippet)
    
    return snippet


@router.get("/{snippet_id}", response_model=SnippetResponse)
async def get_snippet(
    snippet_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific snippet by ID"""
    
    result = await db.execute(select(TestSnippet).where(TestSnippet.id == snippet_id))
    snippet = result.scalar_one_or_none()
    
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    
    return snippet


@router.put("/{snippet_id}", response_model=SnippetResponse)
async def update_snippet(
    snippet_id: UUID,
    snippet_data: SnippetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a snippet"""
    
    result = await db.execute(select(TestSnippet).where(TestSnippet.id == snippet_id))
    snippet = result.scalar_one_or_none()
    
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    
    # Update fields
    update_data = snippet_data.model_dump(exclude_unset=True)
    
    # Debug: Log the received update data
    print(f"[SNIPPET UPDATE DEBUG] snippet_id: {snippet_id}")
    print(f"[SNIPPET UPDATE DEBUG] update_data: {update_data}")
    if "steps" in update_data:
        for i, step in enumerate(update_data["steps"]):
            print(f"[SNIPPET UPDATE DEBUG] Step {i}: action={step.get('action')}, amount={step.get('amount')}, timeout={step.get('timeout')}")
    
    # Convert parameters if provided
    if "parameters" in update_data and update_data["parameters"]:
        update_data["parameters"] = [p.model_dump() if hasattr(p, 'model_dump') else p for p in update_data["parameters"]]
    
    for field, value in update_data.items():
        setattr(snippet, field, value)
    
    await db.commit()
    await db.refresh(snippet)
    
    return snippet


@router.delete("/{snippet_id}", status_code=204)
async def delete_snippet(
    snippet_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a snippet"""
    
    result = await db.execute(select(TestSnippet).where(TestSnippet.id == snippet_id))
    snippet = result.scalar_one_or_none()
    
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    
    await db.delete(snippet)
    await db.commit()
    
    return None


@router.post("/from-steps", response_model=SnippetResponse, status_code=201)
async def create_snippet_from_steps(
    project_id: UUID,
    request: SnippetFromStepsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a snippet from selected steps in a test flow"""
    
    # Get project
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Auto-detect parameters from step values (look for {{param}} patterns)
    detected_params = set()
    for step in request.steps:
        for key, value in step.items():
            if isinstance(value, str):
                # Find {{param_name}} patterns
                matches = re.findall(r'\{\{(\w+)\}\}', value)
                detected_params.update(matches)
    
    # Merge detected params with provided params
    existing_param_names = {p.name for p in request.parameters}
    from app.schemas.snippet import SnippetParameter
    all_parameters = list(request.parameters)
    for param_name in detected_params:
        if param_name not in existing_param_names:
            all_parameters.append(SnippetParameter(name=param_name, type="string"))
    
    # Create snippet
    snippet = TestSnippet(
        project_id=project_id,
        organisation_id=project.organisation_id,
        name=request.name,
        description=request.description,
        parameters=[p.model_dump() for p in all_parameters],
        steps=request.steps,
        tags=request.tags,
        is_global=False,
        created_by=current_user.id
    )
    
    db.add(snippet)
    await db.commit()
    await db.refresh(snippet)
    
    return snippet


def substitute_parameters(steps: List[dict], parameters: dict) -> List[dict]:
    """
    Substitute {{param_name}} placeholders in step values with actual parameter values.
    This is used during snippet execution.
    """
    import copy
    expanded_steps = copy.deepcopy(steps)
    
    for step in expanded_steps:
        for key, value in step.items():
            if isinstance(value, str):
                for param_name, param_value in parameters.items():
                    placeholder = f"{{{{{param_name}}}}}"
                    if placeholder in value:
                        value = value.replace(placeholder, str(param_value))
                step[key] = value
    
    return expanded_steps
