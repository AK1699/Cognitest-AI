from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from typing import List, Dict, Any, Optional
from uuid import UUID
import httpx
import time

from app.core.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.api_collection import ApiCollection
from app.models.api_request import APIRequest as APIRequestModel
from app.models.api_environment import ApiEnvironment
from app.schemas.api_testing import (
    ProxyRequest, ProxyResponse, 
    APICollectionTree, APICollectionCreate, APICollectionUpdate,
    APIRequestCreate, APIRequestUpdate, APIRequest as APIRequestSchema,
    EnvironmentCreate, EnvironmentUpdate, Environment as EnvironmentSchema
)

router = APIRouter()

@router.post("/proxy", response_model=ProxyResponse)
async def proxy_request(request_data: ProxyRequest):
    """
    Proxy an API request to bypass CORS and handle requests from the server side.
    """
    start_time = time.time()
    
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            # Prepare request arguments
            kwargs = {
                "method": request_data.method,
                "url": request_data.url,
                "headers": request_data.headers,
            }
            
            if request_data.body:
                if isinstance(request_data.body, (dict, list)):
                    kwargs["json"] = request_data.body
                else:
                    kwargs["content"] = str(request_data.body)

            # Execute request
            response = await client.request(**kwargs)
            
            elapsed_time = (time.time() - start_time) * 1000  # in ms
            
            # Prepare response body
            try:
                # Try to parse as JSON first
                body = response.json()
            except Exception:
                # Fallback to text
                body = response.text

            return ProxyResponse(
                status=response.status_code,
                statusText=response.reason_phrase,
                time=round(elapsed_time, 2),
                size=len(response.content),
                headers=dict(response.headers),
                body=body,
                cookies=dict(response.cookies)
            )

    except httpx.RequestError as exc:
        raise HTTPException(status_code=500, detail=f"An error occurred while requesting {exc.request.url!r}.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- API Collections CRUD ---

@router.get("/collections/{project_id}", response_model=List[APICollectionTree])
async def list_collections(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all root collections and their nested structure for a project."""
    # Get all collections for the project
    result = await db.execute(
        select(ApiCollection).where(ApiCollection.project_id == project_id)
    )
    all_collections = result.scalars().all()
    
    # Get all requests for the project (to avoid N+1 queries)
    req_result = await db.execute(
        select(APIRequestModel).join(ApiCollection).where(ApiCollection.project_id == project_id)
    )
    all_requests = req_result.scalars().all()
    
    # Build collection map with all data
    collection_map = {
        c.id: {
            "id": c.id, 
            "name": c.name, 
            "parent_id": c.parent_id, 
            "requests": [], 
            "folders": []
        } for c in all_collections
    }
    
    # Add requests to their collections
    for req in all_requests:
        if req.collection_id in collection_map:
            collection_map[req.collection_id]["requests"].append(req)
    
    # Build recursive tree structure
    def build_tree(parent_id):
        children = []
        for c_id, c_data in collection_map.items():
            if c_data["parent_id"] == parent_id:
                # Recursively build children
                c_data["folders"] = build_tree(c_id)
                children.append(c_data)
        return children
    
    # Get root collections (those without a parent)
    root_collections = build_tree(None)
                
    return root_collections

@router.post("/collections", response_model=APICollectionTree)
async def create_collection(
    collection_data: APICollectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new collection or folder."""
    collection = ApiCollection(
        **collection_data.model_dump(),
        created_by=current_user.id
    )
    db.add(collection)
    await db.commit()
    await db.refresh(collection)
    
    return {
        "id": collection.id,
        "name": collection.name,
        "parent_id": collection.parent_id,
        "requests": [],
        "folders": []
    }

@router.patch("/collections/{collection_id}")
async def update_collection(
    collection_id: UUID,
    collection_data: APICollectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update collection details (e.g., rename)."""
    await db.execute(
        update(ApiCollection)
        .where(ApiCollection.id == collection_id)
        .values(**collection_data.model_dump(exclude_unset=True))
    )
    await db.commit()
    return {"status": "success"}

@router.delete("/collections/{collection_id}")
async def delete_collection(
    collection_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a collection or folder and all its contents."""
    await db.execute(delete(ApiCollection).where(ApiCollection.id == collection_id))
    await db.commit()
    return {"status": "success"}

# --- API Requests CRUD ---

@router.post("/requests", response_model=APIRequestSchema)
async def create_request(
    request_data: APIRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new API request within a collection."""
    request = APIRequestModel(**request_data.model_dump())
    db.add(request)
    await db.commit()
    await db.refresh(request)
    return request

@router.patch("/requests/{request_id}", response_model=APIRequestSchema)
async def update_request(
    request_id: UUID,
    request_data: APIRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update API request details."""
    result = await db.execute(
        select(APIRequestModel).where(APIRequestModel.id == request_id)
    )
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    for key, value in request_data.model_dump(exclude_unset=True).items():
        setattr(request, key, value)
        
    await db.commit()
    await db.refresh(request)
    return request

@router.delete("/requests/{request_id}")
async def delete_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an API request."""
    await db.execute(delete(APIRequestModel).where(APIRequestModel.id == request_id))
    await db.commit()
    return {"status": "success"}

# --- Move operations for drag-and-drop ---

@router.patch("/requests/{request_id}/move")
async def move_request(
    request_id: UUID,
    target_collection_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Move a request to a different collection/folder."""
    await db.execute(
        update(APIRequestModel)
        .where(APIRequestModel.id == request_id)
        .values(collection_id=target_collection_id)
    )
    await db.commit()
    return {"status": "success"}

@router.patch("/collections/{collection_id}/move")
async def move_folder(
    collection_id: UUID,
    target_parent_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Move a folder to a different parent (collection or folder). Set target_parent_id to null to make it a root collection."""
    # Prevent moving a folder into itself or its descendants
    if target_parent_id:
        # Check if target is a descendant of the folder being moved
        result = await db.execute(
            select(ApiCollection).where(ApiCollection.id == target_parent_id)
        )
        target = result.scalar_one_or_none()
        if target and target.parent_id == collection_id:
            raise HTTPException(status_code=400, detail="Cannot move folder into its own descendant")
    
    await db.execute(
        update(ApiCollection)
        .where(ApiCollection.id == collection_id)
        .values(parent_id=target_parent_id)
    )
    await db.commit()
    return {"status": "success"}

# --- Environments CRUD ---

@router.get("/environments/{project_id}", response_model=List[EnvironmentSchema])
async def list_environments(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all environments for a project."""
    result = await db.execute(
        select(ApiEnvironment).where(ApiEnvironment.project_id == project_id)
    )
    environments = result.scalars().all()
    return environments

@router.post("/environments", response_model=EnvironmentSchema)
async def create_environment(
    env_data: EnvironmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new environment for a project."""
    # If this is the first environment or is_default is True, ensure only one default
    if env_data.is_default:
        await db.execute(
            update(ApiEnvironment)
            .where(ApiEnvironment.project_id == env_data.project_id)
            .values(is_default=False)
        )
    
    # Convert variables to dict format for storage
    variables_data = [v.model_dump() for v in env_data.variables] if env_data.variables else []
    
    environment = ApiEnvironment(
        project_id=env_data.project_id,
        name=env_data.name,
        variables=variables_data,
        is_default=env_data.is_default,
        created_by=current_user.id
    )
    db.add(environment)
    await db.commit()
    await db.refresh(environment)
    return environment

@router.patch("/environments/{environment_id}", response_model=EnvironmentSchema)
async def update_environment(
    environment_id: UUID,
    env_data: EnvironmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an environment."""
    result = await db.execute(
        select(ApiEnvironment).where(ApiEnvironment.id == environment_id)
    )
    environment = result.scalar_one_or_none()
    if not environment:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    # If setting as default, unset other defaults
    if env_data.is_default:
        await db.execute(
            update(ApiEnvironment)
            .where(ApiEnvironment.project_id == environment.project_id)
            .where(ApiEnvironment.id != environment_id)
            .values(is_default=False)
        )
    
    update_data = env_data.model_dump(exclude_unset=True)
    
    # Convert variables to dict format if present
    if 'variables' in update_data and update_data['variables']:
        update_data['variables'] = [v.model_dump() if hasattr(v, 'model_dump') else v for v in update_data['variables']]
    
    for key, value in update_data.items():
        setattr(environment, key, value)
    
    await db.commit()
    await db.refresh(environment)
    return environment

@router.delete("/environments/{environment_id}")
async def delete_environment(
    environment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an environment."""
    await db.execute(delete(ApiEnvironment).where(ApiEnvironment.id == environment_id))
    await db.commit()
    return {"status": "success"}
