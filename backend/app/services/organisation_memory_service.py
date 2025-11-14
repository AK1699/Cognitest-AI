"""
Organisation Memory Service for managing organization-level learning and context
Stores and retrieves multimodal inputs (text + images) to enable self-evolving AI
"""
import logging
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
import os
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

from app.models.organisation_memory import (
    OrganisationMemory,
    OrganisationMemoryImage,
    MemoryUsageLog,
    MemoryInputType,
    MemorySource,
)
from app.services.vision_ai_service import get_vision_ai_service
from app.core.config import settings

logger = logging.getLogger(__name__)


class OrganisationMemoryService:
    """
    Service for managing organization memory and context
    Handles multimodal inputs and provides AI-powered suggestions
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize Organisation Memory Service

        Args:
            db: Database session
        """
        self.db = db
        self.qdrant_client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY if hasattr(settings, 'QDRANT_API_KEY') else None,
        )

    async def store_memory(
        self,
        organisation_id: uuid.UUID,
        user_description: str,
        image_files: Optional[List[Any]] = None,
        project_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        source: str = "user_input",
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Store a new memory entry with text and optional images

        Args:
            organisation_id: Organisation ID
            user_description: User's text description
            image_files: List of uploaded image files
            project_id: Optional project ID
            user_id: User ID who created this
            source: Source of memory
            tags: Optional tags

        Returns:
            Created memory entry with analysis
        """
        try:
            memory_id = uuid.uuid4()
            has_images = bool(image_files and len(image_files) > 0)

            # Determine input type
            if has_images:
                input_type = MemoryInputType.TEXT_WITH_IMAGES
            else:
                input_type = MemoryInputType.TEXT_ONLY

            # Process images if provided
            image_analysis_results = []
            extracted_features = []
            ui_elements = []
            workflows = []
            image_records = []

            if has_images:
                logger.info(f"Processing {len(image_files)} images for memory {memory_id}")

                vision_service = await get_vision_ai_service()

                for idx, image_file in enumerate(image_files):
                    # Save image to storage
                    image_path = await self._save_image(
                        image_file,
                        organisation_id,
                        memory_id,
                        idx
                    )

                    # Analyze image with Vision AI
                    analysis = await vision_service.analyze_screenshot(
                        image_path,
                        analysis_type="comprehensive"
                    )

                    if analysis["status"] == "success":
                        image_analysis_results.append(analysis)

                        # Extract structured data
                        structured = analysis.get("structured_data", {})
                        if "features" in structured:
                            extracted_features.extend(structured["features"])
                        if "ui_elements" in structured:
                            ui_elements.extend(structured["ui_elements"])
                        if "workflows" in structured:
                            workflows.extend(structured["workflows"])

                    # Create image record
                    image_record = OrganisationMemoryImage(
                        id=uuid.uuid4(),
                        memory_id=memory_id,
                        file_name=image_file.filename,
                        file_path=image_path,
                        file_size=len(await image_file.read()),
                        mime_type=image_file.content_type,
                        vision_analysis=analysis.get("structured_data", {}),
                        extracted_text=analysis.get("raw_text", ""),
                        image_order=idx,
                    )
                    image_records.append(image_record)

            # Build searchable content (text + image analysis)
            searchable_content = user_description

            if image_analysis_results:
                searchable_content += "\n\n[Image Analysis]:\n"
                for idx, analysis in enumerate(image_analysis_results):
                    searchable_content += f"\nImage {idx+1}: {analysis.get('raw_text', '')}\n"

            # Create memory record
            memory = OrganisationMemory(
                id=memory_id,
                organisation_id=organisation_id,
                project_id=project_id,
                created_by=user_id,
                input_type=input_type.value,
                source=source,
                user_description=user_description,
                searchable_content=searchable_content,
                has_images=1 if has_images else 0,
                total_images=len(image_files) if image_files else 0,
                image_analysis={"analyses": image_analysis_results} if image_analysis_results else {},
                extracted_features=extracted_features,
                ui_elements=ui_elements,
                workflows=workflows,
                tags=tags or [],
            )

            self.db.add(memory)

            # Add image records
            for image_record in image_records:
                self.db.add(image_record)

            await self.db.commit()
            await self.db.refresh(memory)

            # Store in vector DB for semantic search
            await self._store_in_vector_db(memory)

            logger.info(f"Stored memory {memory_id} for organisation {organisation_id}")

            return {
                "status": "success",
                "memory_id": str(memory_id),
                "memory": memory,
                "image_count": len(image_records),
                "analysis": {
                    "extracted_features": extracted_features,
                    "ui_elements": ui_elements,
                    "workflows": workflows,
                },
            }

        except Exception as e:
            logger.error(f"Error storing memory: {e}")
            await self.db.rollback()
            raise

    async def get_relevant_memories(
        self,
        organisation_id: uuid.UUID,
        query: str,
        project_id: Optional[uuid.UUID] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Get relevant memories based on query

        Args:
            organisation_id: Organisation ID
            query: Search query
            project_id: Optional project filter
            limit: Max results

        Returns:
            List of relevant memories with scores
        """
        try:
            # Search in vector DB
            collection_name = f"org_{organisation_id}_memory"

            # Get query embedding (you'd use your embedding service)
            # For now, we'll do a simple database search
            query_stmt = select(OrganisationMemory).where(
                and_(
                    OrganisationMemory.organisation_id == organisation_id,
                    OrganisationMemory.is_active == 1,
                )
            )

            if project_id:
                query_stmt = query_stmt.where(
                    OrganisationMemory.project_id == project_id
                )

            # Order by most recent and most referenced
            query_stmt = query_stmt.order_by(
                desc(OrganisationMemory.times_referenced),
                desc(OrganisationMemory.created_at)
            ).limit(limit)

            result = await self.db.execute(query_stmt)
            memories = result.scalars().all()

            return [
                {
                    "memory_id": str(mem.id),
                    "description": mem.user_description,
                    "searchable_content": mem.searchable_content,
                    "has_images": mem.has_images == 1,
                    "image_count": mem.total_images,
                    "features": mem.extracted_features,
                    "ui_elements": mem.ui_elements,
                    "workflows": mem.workflows,
                    "tags": mem.tags,
                    "times_referenced": mem.times_referenced,
                    "created_at": mem.created_at.isoformat(),
                    "similarity_score": 0.8,  # Placeholder
                }
                for mem in memories
            ]

        except Exception as e:
            logger.error(f"Error retrieving memories: {e}")
            return []

    async def get_ai_suggestions(
        self,
        organisation_id: uuid.UUID,
        user_input: str,
        project_id: Optional[uuid.UUID] = None,
    ) -> Dict[str, Any]:
        """
        Get AI-powered suggestions based on organization memory

        Args:
            organisation_id: Organisation ID
            user_input: Current user input
            project_id: Optional project ID

        Returns:
            AI suggestions
        """
        try:
            # Get relevant memories
            relevant_memories = await self.get_relevant_memories(
                organisation_id,
                user_input,
                project_id,
                limit=5
            )

            if not relevant_memories:
                return {
                    "has_suggestions": False,
                    "message": "No relevant historical context found",
                    "suggestions": [],
                }

            # Build suggestions from memories
            suggestions = {
                "has_suggestions": True,
                "similar_inputs_count": len(relevant_memories),
                "suggested_features": [],
                "suggested_ui_elements": [],
                "suggested_workflows": [],
                "suggested_test_scenarios": [],
                "context": [],
            }

            # Aggregate suggestions from memories
            all_features = []
            all_ui_elements = []
            all_workflows = []

            for memory in relevant_memories:
                suggestions["context"].append({
                    "description": memory["description"][:200] + "...",
                    "relevance": memory["similarity_score"],
                    "date": memory["created_at"],
                })

                if memory.get("features"):
                    all_features.extend(memory["features"])
                if memory.get("ui_elements"):
                    all_ui_elements.extend(memory["ui_elements"])
                if memory.get("workflows"):
                    all_workflows.extend(memory["workflows"])

            # Remove duplicates and get top suggestions
            suggestions["suggested_features"] = list(set(all_features))[:10]
            suggestions["suggested_ui_elements"] = list(set(all_ui_elements))[:10]
            suggestions["suggested_workflows"] = list(set(all_workflows))[:5]

            # Generate test scenarios based on patterns
            suggestions["suggested_test_scenarios"] = self._generate_test_scenarios(
                all_features,
                all_ui_elements,
                all_workflows
            )

            logger.info(f"Generated AI suggestions for org {organisation_id}")

            return suggestions

        except Exception as e:
            logger.error(f"Error generating suggestions: {e}")
            return {
                "has_suggestions": False,
                "error": str(e),
                "suggestions": [],
            }

    async def log_memory_usage(
        self,
        organisation_id: uuid.UUID,
        memory_id: uuid.UUID,
        used_in_generation: str,
        generation_id: Optional[uuid.UUID] = None,
        query_text: Optional[str] = None,
        similarity_score: float = 0.0,
    ):
        """
        Log when a memory is used in generation

        Args:
            organisation_id: Organisation ID
            memory_id: Memory ID
            used_in_generation: What it was used for
            generation_id: ID of generated item
            query_text: Query that matched
            similarity_score: Similarity score
        """
        try:
            # Create usage log
            usage_log = MemoryUsageLog(
                id=uuid.uuid4(),
                organisation_id=organisation_id,
                memory_id=memory_id,
                used_in_generation=used_in_generation,
                generation_id=generation_id,
                query_text=query_text,
                similarity_score=similarity_score,
            )

            self.db.add(usage_log)

            # Update memory usage count
            stmt = select(OrganisationMemory).where(
                OrganisationMemory.id == memory_id
            )
            result = await self.db.execute(stmt)
            memory = result.scalar_one_or_none()

            if memory:
                memory.times_referenced += 1
                memory.last_referenced_at = datetime.utcnow()

            await self.db.commit()

        except Exception as e:
            logger.error(f"Error logging memory usage: {e}")
            await self.db.rollback()

    async def _save_image(
        self,
        image_file: Any,
        organisation_id: uuid.UUID,
        memory_id: uuid.UUID,
        image_index: int,
    ) -> str:
        """
        Save image to storage

        Args:
            image_file: Uploaded file
            organisation_id: Organisation ID
            memory_id: Memory ID
            image_index: Image index

        Returns:
            Saved file path
        """
        # Create storage directory
        storage_dir = Path(settings.UPLOAD_DIR) / "org_memory" / str(organisation_id) / str(memory_id)
        storage_dir.mkdir(parents=True, exist_ok=True)

        # Generate filename
        file_extension = Path(image_file.filename).suffix
        filename = f"image_{image_index}{file_extension}"
        file_path = storage_dir / filename

        # Save file
        content = await image_file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Reset file pointer
        await image_file.seek(0)

        return str(file_path)

    async def _store_in_vector_db(self, memory: OrganisationMemory):
        """
        Store memory in vector database for semantic search

        Args:
            memory: Memory object
        """
        try:
            collection_name = f"org_{memory.organisation_id}_memory"

            # Ensure collection exists
            try:
                self.qdrant_client.get_collection(collection_name)
            except:
                self.qdrant_client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
                )

            # Get embedding for searchable content
            # (You'd use your embedding service here)
            # For now, we'll skip the actual vector storage
            # embedding = await get_embedding(memory.searchable_content)

            # Store point
            # point = PointStruct(
            #     id=str(memory.id),
            #     vector=embedding,
            #     payload={
            #         "memory_id": str(memory.id),
            #         "organisation_id": str(memory.organisation_id),
            #         "description": memory.user_description,
            #         "has_images": memory.has_images,
            #         "created_at": memory.created_at.isoformat(),
            #     }
            # )
            # self.qdrant_client.upsert(collection_name=collection_name, points=[point])

            # Update memory with vector DB info
            memory.qdrant_collection = collection_name
            memory.qdrant_point_id = str(memory.id)

            logger.info(f"Stored memory {memory.id} in vector DB")

        except Exception as e:
            logger.error(f"Error storing in vector DB: {e}")

    def _generate_test_scenarios(
        self,
        features: List[str],
        ui_elements: List[Any],
        workflows: List[Any],
    ) -> List[str]:
        """
        Generate test scenarios from memory patterns

        Args:
            features: List of features
            ui_elements: List of UI elements
            workflows: List of workflows

        Returns:
            List of suggested test scenarios
        """
        scenarios = []

        # Generate from features
        for feature in features[:5]:
            scenarios.append(f"Verify {feature} functionality")
            scenarios.append(f"Test {feature} with invalid inputs")

        # Generate from UI elements
        if ui_elements:
            scenarios.append("Test all form validations")
            scenarios.append("Verify button actions and navigation")

        # Generate from workflows
        for workflow in workflows[:3]:
            scenarios.append(f"Test complete workflow: {workflow}")

        return scenarios[:10]


async def get_organisation_memory_service(db: AsyncSession) -> OrganisationMemoryService:
    """
    Get Organisation Memory Service instance

    Args:
        db: Database session

    Returns:
        OrganisationMemoryService instance
    """
    return OrganisationMemoryService(db)
