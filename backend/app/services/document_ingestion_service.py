"""
Document Ingestion Service for AI Self-Learning
Handles all types of user input: documents, files, text descriptions, structured data
"""
from typing import Optional, List, Dict, Any
import logging
import mimetypes
from datetime import datetime
import uuid
import json
from pathlib import Path

logger = logging.getLogger(__name__)


class DocumentIngestionService:
    """
    Service for ingesting and processing all types of user input.
    Converts any input into learnable knowledge for AI self-evolution.
    """

    def __init__(self):
        """Initialize document ingestion service"""
        self.supported_formats = {
            'text': ['.txt', '.md', '.rst'],
            'document': ['.pdf', '.docx', '.doc'],
            'data': ['.json', '.csv', '.xlsx', '.xls'],
            'code': ['.py', '.js', '.java', '.cpp', '.sql'],
            'markup': ['.html', '.xml', '.yaml', '.yml'],
        }

    async def ingest_text_input(
        self,
        text: str,
        input_type: str = "description",  # description, requirement, specification, etc.
        metadata: Optional[Dict[str, Any]] = None,
        project_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Ingest plain text input (descriptions, requirements, etc.)

        Args:
            text: Text input from user
            input_type: Type of input (description, requirement, specification, etc.)
            metadata: Additional metadata
            project_id: Project context

        Returns:
            Ingestion result with document ID and chunks
        """
        try:
            if not text or not text.strip():
                raise ValueError("Input text cannot be empty")

            doc_id = str(uuid.uuid4())

            # Chunk the text for better learning
            chunks = await self._chunk_text(text, chunk_size=500, overlap=50)

            result = {
                "document_id": doc_id,
                "input_type": input_type,
                "source": "text_input",
                "total_chunks": len(chunks),
                "total_characters": len(text),
                "chunks": chunks,
                "metadata": {
                    **(metadata or {}),
                    "ingested_at": datetime.utcnow().isoformat(),
                    "input_type": input_type,
                    "project_id": project_id,
                },
            }

            logger.info(f"Ingested text input: {doc_id} ({len(chunks)} chunks)")
            return result

        except Exception as e:
            logger.error(f"Error ingesting text input: {e}")
            raise

    async def ingest_file(
        self,
        file_path: str,
        project_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Ingest a file (PDF, DOCX, JSON, CSV, etc.)

        Args:
            file_path: Path to the file
            project_id: Project context
            metadata: Additional metadata

        Returns:
            Ingestion result with extracted content
        """
        try:
            path = Path(file_path)
            if not path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")

            doc_id = str(uuid.uuid4())
            file_extension = path.suffix.lower()
            file_name = path.name

            # Extract content based on file type
            content = await self._extract_file_content(file_path, file_extension)

            # Chunk the content
            chunks = await self._chunk_text(content, chunk_size=500, overlap=50)

            result = {
                "document_id": doc_id,
                "filename": file_name,
                "file_type": file_extension,
                "source": "file_upload",
                "total_chunks": len(chunks),
                "content_length": len(content),
                "chunks": chunks,
                "metadata": {
                    **(metadata or {}),
                    "ingested_at": datetime.utcnow().isoformat(),
                    "filename": file_name,
                    "file_type": file_extension,
                    "project_id": project_id,
                },
            }

            logger.info(f"Ingested file: {file_name} -> {doc_id} ({len(chunks)} chunks)")
            return result

        except Exception as e:
            logger.error(f"Error ingesting file: {e}")
            raise

    async def ingest_structured_data(
        self,
        data: Dict[str, Any],
        data_type: str = "metadata",  # metadata, test_specification, requirement, etc.
        project_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Ingest structured data (JSON, dictionaries, etc.)

        Args:
            data: Structured data as dictionary
            data_type: Type of data (metadata, specification, etc.)
            project_id: Project context

        Returns:
            Ingestion result
        """
        try:
            doc_id = str(uuid.uuid4())

            # Convert to readable text format
            text_representation = self._dict_to_text(data)

            # Chunk the content
            chunks = await self._chunk_text(text_representation, chunk_size=500, overlap=50)

            result = {
                "document_id": doc_id,
                "data_type": data_type,
                "source": "structured_data",
                "total_chunks": len(chunks),
                "chunks": chunks,
                "original_data": data,
                "metadata": {
                    "ingested_at": datetime.utcnow().isoformat(),
                    "data_type": data_type,
                    "project_id": project_id,
                },
            }

            logger.info(f"Ingested structured data: {doc_id} ({len(chunks)} chunks)")
            return result

        except Exception as e:
            logger.error(f"Error ingesting structured data: {e}")
            raise

    async def ingest_batch_inputs(
        self,
        inputs: List[Dict[str, Any]],
        project_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Ingest multiple inputs at once (batch processing)

        Args:
            inputs: List of input dictionaries
                   Each should have 'type' and 'content' or 'path'
            project_id: Project context

        Returns:
            List of ingestion results
        """
        results = []

        for input_item in inputs:
            try:
                input_type = input_item.get("type", "text")
                metadata = input_item.get("metadata", {})

                if input_type == "text":
                    result = await self.ingest_text_input(
                        text=input_item["content"],
                        input_type=input_item.get("input_type", "description"),
                        metadata=metadata,
                        project_id=project_id,
                    )
                elif input_type == "file":
                    result = await self.ingest_file(
                        file_path=input_item["path"],
                        project_id=project_id,
                        metadata=metadata,
                    )
                elif input_type == "data":
                    result = await self.ingest_structured_data(
                        data=input_item["content"],
                        data_type=input_item.get("data_type", "metadata"),
                        project_id=project_id,
                    )
                else:
                    raise ValueError(f"Unknown input type: {input_type}")

                results.append(result)

            except Exception as e:
                logger.error(f"Error ingesting batch item: {e}")
                results.append({"error": str(e)})

        return results

    async def _chunk_text(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Split text into overlapping chunks for better learning

        Args:
            text: Text to chunk
            chunk_size: Size of each chunk in characters
            overlap: Number of overlapping characters between chunks

        Returns:
            List of chunks with metadata
        """
        chunks = []
        start = 0

        while start < len(text):
            end = min(start + chunk_size, len(text))
            chunk = text[start:end]

            chunks.append({
                "text": chunk.strip(),
                "start": start,
                "end": end,
                "length": len(chunk),
            })

            start = end - overlap

        return chunks

    async def _extract_file_content(
        self,
        file_path: str,
        file_extension: str,
    ) -> str:
        """
        Extract content from various file types

        Args:
            file_path: Path to file
            file_extension: File extension

        Returns:
            Extracted text content
        """
        try:
            # Text files
            if file_extension in ['.txt', '.md', '.rst']:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()

            # JSON files
            elif file_extension == '.json':
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return self._dict_to_text(data)

            # CSV files
            elif file_extension == '.csv':
                import csv
                content = []
                with open(file_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        content.append(json.dumps(row))
                return '\n'.join(content)

            # YAML files
            elif file_extension in ['.yaml', '.yml']:
                try:
                    import yaml
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = yaml.safe_load(f)
                        return self._dict_to_text(data)
                except ImportError:
                    # Fallback to reading as text
                    with open(file_path, 'r', encoding='utf-8') as f:
                        return f.read()

            # PDF files
            elif file_extension == '.pdf':
                try:
                    import PyPDF2
                    content = []
                    with open(file_path, 'rb') as f:
                        reader = PyPDF2.PdfReader(f)
                        for page in reader.pages:
                            content.append(page.extract_text())
                    return '\n'.join(content)
                except ImportError:
                    logger.warning("PyPDF2 not installed, returning filename as fallback")
                    return f"PDF: {Path(file_path).name}"

            # DOCX files
            elif file_extension == '.docx':
                try:
                    from docx import Document
                    doc = Document(file_path)
                    return '\n'.join([para.text for para in doc.paragraphs])
                except ImportError:
                    logger.warning("python-docx not installed, returning filename as fallback")
                    return f"DOCX: {Path(file_path).name}"

            # Default: return filename
            else:
                logger.warning(f"Unsupported file type: {file_extension}")
                return f"File: {Path(file_path).name}"

        except Exception as e:
            logger.error(f"Error extracting file content: {e}")
            raise

    def _dict_to_text(self, data: Dict[str, Any], indent: int = 0) -> str:
        """
        Convert dictionary to readable text format

        Args:
            data: Dictionary to convert
            indent: Indentation level

        Returns:
            Text representation
        """
        lines = []

        for key, value in data.items():
            prefix = "  " * indent

            if isinstance(value, dict):
                lines.append(f"{prefix}{key}:")
                lines.append(self._dict_to_text(value, indent + 1))
            elif isinstance(value, list):
                lines.append(f"{prefix}{key}:")
                for item in value:
                    if isinstance(item, dict):
                        lines.append(self._dict_to_text(item, indent + 1))
                    else:
                        lines.append(f"{prefix}  - {item}")
            else:
                lines.append(f"{prefix}{key}: {value}")

        return '\n'.join(lines)

    def get_supported_formats(self) -> Dict[str, List[str]]:
        """Get list of supported file formats"""
        return self.supported_formats


# Singleton instance
_document_service: Optional[DocumentIngestionService] = None


async def get_document_ingestion_service() -> DocumentIngestionService:
    """
    Get singleton document ingestion service instance

    Returns:
        DocumentIngestionService instance
    """
    global _document_service
    if _document_service is None:
        _document_service = DocumentIngestionService()
    return _document_service
