"""
Document Upload and Analysis API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from uuid import UUID
import logging
import os
from pathlib import Path
import uuid as uuid_lib
from datetime import datetime
import mimetypes

from app.core.deps import get_db, get_current_active_user
from app.models.document_knowledge import DocumentKnowledge
from app.models.project import Project
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

# Configure upload settings
UPLOAD_DIR = Path("uploads/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".md"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


async def verify_project_access(
    project_id: UUID,
    current_user: User,
    db: AsyncSession,
) -> Project:
    """Verify that the current user has access to the project."""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Verify user has access to the organisation
    from sqlalchemy import text
    access_check = await db.execute(
        text("""
            SELECT 1 FROM organisations o
            LEFT JOIN user_organisations uo ON o.id = uo.organisation_id
            WHERE o.id = :org_id
            AND (o.owner_id = :user_id OR uo.user_id = :user_id)
            LIMIT 1
        """),
        {"org_id": str(project.organisation_id), "user_id": str(current_user.id)}
    )

    if not access_check.fetchone():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this project"
        )

    return project


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    project_id: UUID = Form(...),
    document_type: str = Form("requirement"),
    source: str = Form("upload"),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a document (BRD, requirements, etc.) for analysis.
    Supports PDF, DOC, DOCX, TXT, MD formats.
    """
    # Verify project access
    await verify_project_access(project_id, current_user, db)

    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content
    try:
        content = await file.read()
        file_size = len(content)

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )

        # Generate unique filename
        unique_id = str(uuid_lib.uuid4())
        safe_filename = f"{unique_id}_{file.filename}"
        file_path = UPLOAD_DIR / safe_filename

        # Save file
        with open(file_path, "wb") as f:
            f.write(content)

        # Create document record
        document = DocumentKnowledge(
            project_id=project_id,
            title=file.filename,
            content="",  # Will be extracted by ingestion service
            document_type=document_type,
            source=source,
            file_path=str(file_path),
            file_size=str(file_size),
            file_type=file_ext,
            uploaded_by=current_user.email,
            description=description,
            meta_data={
                "original_filename": file.filename,
                "upload_timestamp": datetime.utcnow().isoformat(),
            }
        )

        db.add(document)
        await db.commit()
        await db.refresh(document)

        # TODO: Trigger async document processing
        # This would:
        # 1. Extract text from the document
        # 2. Chunk the text
        # 3. Create embeddings
        # 4. Store in vector database
        # For now, we'll just store the document record

        logger.info(f"Document uploaded: {document.id} for project {project_id}")

        return {
            "success": True,
            "message": "Document uploaded successfully",
            "document": {
                "id": str(document.id),
                "title": document.title,
                "file_type": document.file_type,
                "file_size": document.file_size,
                "uploaded_at": document.created_at.isoformat(),
                "status": "processing",
            }
        }

    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/")
async def list_documents(
    project_id: UUID,
    document_type: Optional[str] = None,
    source: Optional[str] = None,
    is_active: bool = True,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all documents for a project with optional filtering.
    """
    # Verify project access
    await verify_project_access(project_id, current_user, db)

    # Build query
    query = select(DocumentKnowledge).where(DocumentKnowledge.project_id == project_id)

    if document_type:
        query = query.where(DocumentKnowledge.document_type == document_type)
    if source:
        query = query.where(DocumentKnowledge.source == source)
    if is_active is not None:
        query = query.where(DocumentKnowledge.is_active == is_active)

    query = query.order_by(desc(DocumentKnowledge.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    documents = result.scalars().all()

    return {
        "documents": [
            {
                "id": str(doc.id),
                "title": doc.title,
                "document_type": doc.document_type,
                "source": doc.source,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "uploaded_by": doc.uploaded_by,
                "created_at": doc.created_at.isoformat(),
                "chunk_count": doc.chunk_count,
                "is_active": doc.is_active,
            }
            for doc in documents
        ],
        "total": len(documents),
    }


@router.get("/{document_id}")
async def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get document details."""
    result = await db.execute(
        select(DocumentKnowledge).where(DocumentKnowledge.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Verify project access
    await verify_project_access(document.project_id, current_user, db)

    return {
        "id": str(document.id),
        "title": document.title,
        "description": document.description,
        "document_type": document.document_type,
        "source": document.source,
        "file_path": document.file_path,
        "file_type": document.file_type,
        "file_size": document.file_size,
        "uploaded_by": document.uploaded_by,
        "created_at": document.created_at.isoformat(),
        "updated_at": document.updated_at.isoformat() if document.updated_at else None,
        "chunk_count": document.chunk_count,
        "embedding_model": document.embedding_model,
        "is_active": document.is_active,
        "meta_data": document.meta_data,
    }


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a document.
    This will also delete the associated file and vector embeddings.
    """
    result = await db.execute(
        select(DocumentKnowledge).where(DocumentKnowledge.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Verify project access
    await verify_project_access(document.project_id, current_user, db)

    # Delete file if exists
    if document.file_path and os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except Exception as e:
            logger.warning(f"Failed to delete file: {e}")

    # TODO: Delete vector embeddings from Qdrant

    # Delete database record
    await db.delete(document)
    await db.commit()

    logger.info(f"Document deleted: {document_id}")
    return None


@router.post("/{document_id}/analyze")
async def analyze_document(
    document_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger analysis of a document.
    This will extract requirements, acceptance criteria, and testable scenarios.
    """
    result = await db.execute(
        select(DocumentKnowledge).where(DocumentKnowledge.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Verify project access
    await verify_project_access(document.project_id, current_user, db)

    # TODO: Implement actual document analysis
    # This would:
    # 1. Read the document file
    # 2. Extract text content
    # 3. Use AI to analyze and extract:
    #    - Requirements
    #    - Acceptance criteria
    #    - Testable scenarios
    #    - Features
    # 4. Store extracted data in meta_data
    # 5. Create embeddings and store in vector DB

    logger.info(f"Document analysis triggered: {document_id}")

    return {
        "success": True,
        "message": "Document analysis initiated",
        "document_id": str(document_id),
        "status": "processing",
    }


@router.post("/{document_id}/generate-test-plan")
async def generate_test_plan_from_document(
    document_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a test plan from a document.
    This uses the document analysis results to create a comprehensive test plan.
    """
    result = await db.execute(
        select(DocumentKnowledge).where(DocumentKnowledge.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Verify project access
    project = await verify_project_access(document.project_id, current_user, db)

    # TODO: Implement test plan generation from document
    # This would:
    # 1. Retrieve document analysis results
    # 2. Use comprehensive_test_plan_service to generate test plan
    # 3. Create test plan, suites, and cases in database
    # 4. Return the generated test plan

    logger.info(f"Test plan generation from document: {document_id}")

    return {
        "success": True,
        "message": "Test plan generation initiated",
        "document_id": str(document_id),
        "status": "generating",
    }
