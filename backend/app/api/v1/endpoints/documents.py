"""
Document Management API endpoints for AI self-learning
Users can upload/input any information which is automatically learned
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional, Dict, Any
import uuid
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.document_knowledge import DocumentKnowledge, DocumentChunk, DocumentUsageLog, DocumentSource, DocumentType
from app.schemas.document import (
    DocumentUploadResponse,
    DocumentListResponse,
    DocumentDetailResponse,
)
from app.services.document_ingestion_service import get_document_ingestion_service
from app.services.document_knowledge_service import get_document_knowledge_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload-text", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_text_input(
    project_id: uuid.UUID,
    content: str = Form(...),
    document_type: str = Form(default="description"),
    document_name: Optional[str] = Form(None),
    tags: Optional[List[str]] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentUploadResponse:
    """
    Upload text input (description, requirement, specification, etc.)
    This text will be stored and used for AI self-learning

    Args:
        project_id: Project ID
        content: Text content
        document_type: Type of document (description, requirement, specification, etc.)
        document_name: Optional name for the document
        tags: Optional tags for categorization
        current_user: Current user
        db: Database session

    Returns:
        Upload result
    """
    try:
        # Ingest the text
        ingestion_service = await get_document_ingestion_service()
        ingest_result = await ingestion_service.ingest_text_input(
            text=content,
            input_type=document_type,
            metadata={"tags": tags or [], "name": document_name},
            project_id=str(project_id),
        )

        # Store in database
        doc_id = ingest_result["document_id"]
        document = DocumentKnowledge(
            id=uuid.UUID(doc_id),
            project_id=project_id,
            created_by=current_user.id,
            document_name=document_name or f"Text Input - {doc_id[:8]}",
            document_type=DocumentType[document_type.upper()] if document_type.upper() in DocumentType.__members__ else DocumentType.DESCRIPTION,
            source=DocumentSource.TEXT_INPUT,
            content=content,
            content_preview=content[:1000],
            content_length=len(content),
            total_chunks=len(ingest_result["chunks"]),
            metadata=ingest_result["metadata"],
            tags=tags or [],
        )

        db.add(document)
        await db.commit()
        await db.refresh(document)

        # Store chunks in vector DB
        knowledge_service = await get_document_knowledge_service()
        point_ids = await knowledge_service.store_document_chunks(
            project_id=str(project_id),
            document_id=doc_id,
            chunks=ingest_result["chunks"],
            document_metadata={
                "source": "text_input",
                "document_type": document_type,
                "document_name": document_name,
            },
        )

        # Mark as indexed
        document.is_indexed = 1
        document.qdrant_point_ids = point_ids
        document.qdrant_collection = f"project_{project_id}_documents"
        await db.commit()

        logger.info(f"User {current_user.id} uploaded text document: {doc_id}")

        return DocumentUploadResponse(
            document_id=doc_id,
            document_name=document.document_name,
            source="text_input",
            total_chunks=len(ingest_result["chunks"]),
            content_length=len(content),
            message="Document uploaded and indexed for AI learning",
        )

    except Exception as e:
        logger.error(f"Error uploading text: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to upload document: {str(e)}",
        )


@router.post("/upload-file", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    document_type: str = Form(default="document"),
    document_name: Optional[str] = Form(None),
    tags: Optional[List[str]] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentUploadResponse:
    """
    Upload a file (PDF, DOCX, CSV, JSON, etc.)
    File content will be extracted and used for AI learning

    Args:
        project_id: Project ID
        file: File to upload
        document_type: Type of document
        tags: Optional tags
        current_user: Current user
        db: Database session

    Returns:
        Upload result
    """
    try:
        # Save file temporarily
        import tempfile
        import os

        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp.flush()
            temp_path = tmp.name

        try:
            # Ingest the file
            ingestion_service = await get_document_ingestion_service()
            ingest_result = await ingestion_service.ingest_file(
                file_path=temp_path,
                project_id=str(project_id),
                metadata={"tags": tags or []},
            )

            # Store in database
            doc_id = ingest_result["document_id"]
            document = DocumentKnowledge(
                id=uuid.UUID(doc_id),
                project_id=project_id,
                created_by=current_user.id,
                document_name=document_name or file.filename,
                document_type=DocumentType[document_type.upper()] if document_type.upper() in DocumentType.__members__ else DocumentType.DOCUMENT,
                source=DocumentSource.FILE_UPLOAD,
                file_type=ingest_result.get("file_type"),
                content=ingest_result.get("content", ""),
                content_preview=ingest_result.get("content", "")[:1000],
                content_length=ingest_result.get("content_length", 0),
                total_chunks=len(ingest_result["chunks"]),
                meta_data=ingest_result["metadata"],
                tags=tags or [],
            )

            db.add(document)
            await db.commit()
            await db.refresh(document)

            # Store chunks in vector DB
            knowledge_service = await get_document_knowledge_service()
            point_ids = await knowledge_service.store_document_chunks(
                project_id=str(project_id),
                document_id=doc_id,
                chunks=ingest_result["chunks"],
                document_metadata={
                    "source": "file_upload",
                    "filename": file.filename,
                    "file_type": ingest_result.get("file_type"),
                },
            )

            # Mark as indexed
            document.is_indexed = 1
            document.qdrant_point_ids = point_ids
            document.qdrant_collection = f"project_{project_id}_documents"
            await db.commit()

            logger.info(f"User {current_user.id} uploaded file: {file.filename} ({doc_id})")

            return DocumentUploadResponse(
                document_id=doc_id,
                document_name=file.filename,
                source="file_upload",
                file_type=ingest_result.get("file_type"),
                total_chunks=len(ingest_result["chunks"]),
                content_length=ingest_result.get("content_length", 0),
                message="File uploaded and indexed for AI learning",
            )

        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to upload file: {str(e)}",
        )


@router.post("/upload-structured", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_structured_data(
    project_id: uuid.UUID,
    data: Dict[str, Any],
    data_type: str = "metadata",
    document_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentUploadResponse:
    """
    Upload structured data (JSON, test specifications, metadata, etc.)
    Data will be converted to text and used for learning

    Args:
        project_id: Project ID
        data: Structured data as JSON
        data_type: Type of data
        document_name: Optional name
        current_user: Current user
        db: Database session

    Returns:
        Upload result
    """
    try:
        # Ingest structured data
        ingestion_service = await get_document_ingestion_service()
        ingest_result = await ingestion_service.ingest_structured_data(
            data=data,
            data_type=data_type,
            project_id=str(project_id),
        )

        # Store in database
        doc_id = ingest_result["document_id"]
        document = DocumentKnowledge(
            id=uuid.UUID(doc_id),
            project_id=project_id,
            created_by=current_user.id,
            document_name=document_name or f"{data_type} - {doc_id[:8]}",
            document_type=DocumentType.DATA,
            source=DocumentSource.STRUCTURED_DATA,
            content="\n".join([chunk["text"] for chunk in ingest_result["chunks"]]),
            content_preview=ingest_result["chunks"][0]["text"][:1000] if ingest_result["chunks"] else "",
            content_length=sum(len(chunk["text"]) for chunk in ingest_result["chunks"]),
            total_chunks=len(ingest_result["chunks"]),
            metadata={**ingest_result["metadata"], "original_data_type": data_type},
        )

        db.add(document)
        await db.commit()
        await db.refresh(document)

        # Store chunks in vector DB
        knowledge_service = await get_document_knowledge_service()
        point_ids = await knowledge_service.store_document_chunks(
            project_id=str(project_id),
            document_id=doc_id,
            chunks=ingest_result["chunks"],
            document_metadata={
                "source": "structured_data",
                "data_type": data_type,
            },
        )

        # Mark as indexed
        document.is_indexed = 1
        document.qdrant_point_ids = point_ids
        document.qdrant_collection = f"project_{project_id}_documents"
        await db.commit()

        logger.info(f"User {current_user.id} uploaded structured data: {doc_id}")

        return DocumentUploadResponse(
            document_id=doc_id,
            document_name=document.document_name,
            source="structured_data",
            total_chunks=len(ingest_result["chunks"]),
            message="Data indexed for AI learning",
        )

    except Exception as e:
        logger.error(f"Error uploading structured data: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to upload data: {str(e)}",
        )


@router.get("/project/{project_id}", response_model=List[DocumentListResponse])
async def list_project_documents(
    project_id: uuid.UUID,
    document_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[DocumentListResponse]:
    """
    List all documents in a project

    Args:
        project_id: Project ID
        document_type: Optional filter by type
        current_user: Current user
        db: Database session

    Returns:
        List of documents
    """
    try:
        query = select(DocumentKnowledge).where(
            and_(
                DocumentKnowledge.project_id == project_id,
                DocumentKnowledge.is_active == 1,
            )
        )

        if document_type:
            query = query.where(DocumentKnowledge.document_type == document_type)

        result = await db.execute(query.order_by(DocumentKnowledge.created_at.desc()))
        documents = result.scalars().all()

        return [
            DocumentListResponse(
                document_id=str(doc.id),
                document_name=doc.document_name,
                document_type=doc.document_type.value,
                source=doc.source.value,
                total_chunks=doc.total_chunks,
                content_length=doc.content_length,
                times_used=doc.times_used_in_generation,
                created_at=doc.created_at.isoformat(),
            )
            for doc in documents
        ]

    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to list documents",
        )


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document_detail(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentDetailResponse:
    """
    Get detailed information about a document

    Args:
        document_id: Document ID
        current_user: Current user
        db: Database session

    Returns:
        Document details
    """
    try:
        result = await db.execute(
            select(DocumentKnowledge).where(DocumentKnowledge.id == document_id)
        )
        document = result.scalar_one_or_none()

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        return DocumentDetailResponse(
            document_id=str(document.id),
            document_name=document.document_name,
            document_type=document.document_type.value,
            source=document.source.value,
            content_preview=document.content_preview,
            total_chunks=document.total_chunks,
            content_length=document.content_length,
            times_used=document.times_used_in_generation,
            relevance_score=document.relevance_score,
            learning_contribution=document.learning_contribution,
            tags=document.tags,
            created_at=document.created_at.isoformat(),
            last_used_at=document.last_used_at.isoformat() if document.last_used_at else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get document",
        )


@router.delete("/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, str]:
    """
    Delete a document (mark as inactive)

    Args:
        document_id: Document ID
        current_user: Current user
        db: Database session

    Returns:
        Deletion result
    """
    try:
        result = await db.execute(
            select(DocumentKnowledge).where(DocumentKnowledge.id == document_id)
        )
        document = result.scalar_one_or_none()

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        # Mark as inactive instead of deleting
        document.is_active = 0
        await db.commit()

        logger.info(f"User {current_user.id} deleted document: {document_id}")

        return {"message": "Document deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete document",
        )


@router.get("/project/{project_id}/summary")
async def get_documents_summary(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get summary of all documents in a project

    Args:
        project_id: Project ID
        current_user: Current user
        db: Database session

    Returns:
        Document summary
    """
    try:
        result = await db.execute(
            select(DocumentKnowledge).where(
                and_(
                    DocumentKnowledge.project_id == project_id,
                    DocumentKnowledge.is_active == 1,
                )
            )
        )
        documents = result.scalars().all()

        summary = {
            "project_id": str(project_id),
            "total_documents": len(documents),
            "total_chunks": sum(doc.total_chunks for doc in documents),
            "total_content_length": sum(doc.content_length for doc in documents),
            "by_type": {},
            "by_source": {},
            "total_usage_count": sum(doc.times_used_in_generation for doc in documents),
        }

        # Count by type
        for doc in documents:
            doc_type = doc.document_type.value
            summary["by_type"][doc_type] = summary["by_type"].get(doc_type, 0) + 1

        # Count by source
        for doc in documents:
            source = doc.source.value
            summary["by_source"][source] = summary["by_source"].get(source, 0) + 1

        return summary

    except Exception as e:
        logger.error(f"Error getting summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get summary",
        )


from pathlib import Path
