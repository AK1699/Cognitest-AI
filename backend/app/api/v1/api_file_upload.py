"""
File Upload API for API Testing Form-Data

Provides endpoints to upload, download, and delete files for use in form-data requests.
Files are stored on disk with UUID-based filenames and tracked in the database.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
import uuid
import os
import aiofiles

from app.core.database import get_db
from app.models.api_file import APIFile
from pydantic import BaseModel


router = APIRouter(tags=["API Testing Files"])

# File storage directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads", "api-testing")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


class FileUploadResponse(BaseModel):
    id: UUID
    original_filename: str
    content_type: str
    size_bytes: int


class FileListResponse(BaseModel):
    files: List[FileUploadResponse]


@router.post("/files/upload", response_model=FileUploadResponse)
async def upload_file(
    project_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a file for use in form-data requests.
    Returns the file ID which can be used to reference the file in requests.
    """
    # Generate unique filename for storage
    file_id = uuid.uuid4()
    stored_filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, stored_filename)
    
    # Save file to disk in chunks to handle large files efficiently
    file_size = 0
    async with aiofiles.open(file_path, 'wb') as f:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            await f.write(chunk)
            file_size += len(chunk)
    
    # Reset file pointer if needed (though we're done with it)
    await file.seek(0)
    
    # Create database record
    db_file = APIFile(
        id=file_id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=file_size,
        project_id=project_id
    )
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)
    
    return FileUploadResponse(
        id=db_file.id,
        original_filename=db_file.original_filename,
        content_type=db_file.content_type,
        size_bytes=db_file.size_bytes
    )


@router.get("/files/{file_id}")
async def download_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Download a file by ID.
    """
    result = await db.execute(select(APIFile).where(APIFile.id == file_id))
    db_file = result.scalar_one_or_none()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = os.path.join(UPLOAD_DIR, db_file.stored_filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file_path,
        filename=db_file.original_filename,
        media_type=db_file.content_type
    )


@router.get("/files/{file_id}/info", response_model=FileUploadResponse)
async def get_file_info(
    file_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get file metadata without downloading.
    """
    result = await db.execute(select(APIFile).where(APIFile.id == file_id))
    db_file = result.scalar_one_or_none()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileUploadResponse(
        id=db_file.id,
        original_filename=db_file.original_filename,
        content_type=db_file.content_type,
        size_bytes=db_file.size_bytes
    )


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a file by ID.
    """
    result = await db.execute(select(APIFile).where(APIFile.id == file_id))
    db_file = result.scalar_one_or_none()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete from disk
    file_path = os.path.join(UPLOAD_DIR, db_file.stored_filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete from database
    await db.delete(db_file)
    await db.commit()
    
    return {"message": "File deleted successfully"}


@router.get("/files", response_model=FileListResponse)
async def list_files(
    project_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    List all files for a project.
    """
    result = await db.execute(
        select(APIFile).where(APIFile.project_id == project_id).order_by(APIFile.created_at.desc())
    )
    files = result.scalars().all()
    
    return FileListResponse(
        files=[
            FileUploadResponse(
                id=f.id,
                original_filename=f.original_filename,
                content_type=f.content_type,
                size_bytes=f.size_bytes
            )
            for f in files
        ]
    )
