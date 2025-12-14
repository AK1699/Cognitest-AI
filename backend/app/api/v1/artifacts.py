"""
Artifacts API - Endpoints for managing test execution artifacts
"""
import os
import uuid
import shutil
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.artifact import TestArtifact, ArtifactType
from app.models.project import Project
from app.schemas.artifact import ArtifactCreate, ArtifactResponse, ArtifactListResponse

router = APIRouter()

# Configure artifact storage directory
ARTIFACTS_DIR = Path("./artifacts")
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)


def get_artifact_path(project_id: str, artifact_type: str, filename: str) -> Path:
    """Get the storage path for an artifact"""
    type_dir = ARTIFACTS_DIR / project_id / artifact_type
    type_dir.mkdir(parents=True, exist_ok=True)
    return type_dir / filename


@router.get("/{project_id}/artifacts", response_model=ArtifactListResponse)
async def list_artifacts(
    project_id: str,
    type: Optional[ArtifactType] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all artifacts for a project"""
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Build base query
    base_query = select(TestArtifact).where(TestArtifact.project_id == project_id)
    
    if type:
        base_query = base_query.where(TestArtifact.type == type)
    
    # Get total count
    count_query = select(func.count()).select_from(base_query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    # Apply pagination and ordering
    offset = (page - 1) * page_size
    artifacts_query = base_query.order_by(desc(TestArtifact.created_at)).offset(offset).limit(page_size)
    artifacts_result = await db.execute(artifacts_query)
    artifacts = artifacts_result.scalars().all()
    
    return ArtifactListResponse(
        items=artifacts,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + len(artifacts)) < total
    )


@router.get("/{project_id}/artifacts/{artifact_id}", response_model=ArtifactResponse)
async def get_artifact(
    project_id: str,
    artifact_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single artifact by ID"""
    result = await db.execute(
        select(TestArtifact).where(
            TestArtifact.id == artifact_id,
            TestArtifact.project_id == project_id
        )
    )
    artifact = result.scalar_one_or_none()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    return artifact


@router.post("/{project_id}/artifacts", response_model=ArtifactResponse, status_code=status.HTTP_201_CREATED)
async def upload_artifact(
    project_id: str,
    file: UploadFile = File(...),
    type: ArtifactType = Query(...),
    execution_run_id: Optional[str] = Query(None),
    step_result_id: Optional[str] = Query(None),
    test_name: Optional[str] = Query(None),
    step_name: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a new artifact"""
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix if file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Save file
    file_path = get_artifact_path(project_id, type.value, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file size
        size_bytes = os.path.getsize(file_path)
        
        # Create artifact record
        artifact = TestArtifact(
            project_id=project_id,
            execution_run_id=execution_run_id,
            step_result_id=step_result_id,
            name=file.filename or unique_filename,
            type=type,
            file_path=str(file_path),
            file_url=f"/api/v1/projects/{project_id}/artifacts/{unique_filename}/download",
            size_bytes=size_bytes,
            test_name=test_name,
            step_name=step_name
        )
        
        db.add(artifact)
        await db.commit()
        await db.refresh(artifact)
        
        return artifact
        
    except Exception as e:
        # Clean up file if database save fails
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to save artifact: {str(e)}")


@router.delete("/{project_id}/artifacts/{artifact_id}")
async def delete_artifact(
    project_id: str,
    artifact_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an artifact"""
    result = await db.execute(
        select(TestArtifact).where(
            TestArtifact.id == artifact_id,
            TestArtifact.project_id == project_id
        )
    )
    artifact = result.scalar_one_or_none()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    # Delete file from disk
    try:
        file_path = Path(artifact.file_path)
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        print(f"Warning: Failed to delete file {artifact.file_path}: {e}")
    
    # Delete database record
    await db.delete(artifact)
    await db.commit()
    
    return {"message": "Artifact deleted successfully"}


@router.get("/{project_id}/artifacts/{artifact_id}/download")
async def download_artifact(
    project_id: str,
    artifact_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download an artifact file"""
    result = await db.execute(
        select(TestArtifact).where(
            TestArtifact.id == artifact_id,
            TestArtifact.project_id == project_id
        )
    )
    artifact = result.scalar_one_or_none()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    file_path = Path(artifact.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Artifact file not found on disk")
    
    # Determine media type
    media_type = "image/png" if artifact.type == ArtifactType.SCREENSHOT else "video/webm"
    
    return FileResponse(
        path=file_path,
        filename=artifact.name,
        media_type=media_type
    )
