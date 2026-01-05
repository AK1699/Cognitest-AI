import sys
import os
import asyncio
import logging
from uuid import uuid4

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import AsyncSessionLocal
from app.services.performance_testing_service import PerformanceTestingService
from app.models.performance import TestType, PerformanceTest
from sqlalchemy import select

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_500():
    async with AsyncSessionLocal() as db:
        service = PerformanceTestingService(db)
        
        # 1. Check if we can list tests (verifies table existence)
        try:
            print("Checking table existence...")
            await service.list_tests(project_id=uuid4()) # Random UUID
            print("Table exists.")
        except Exception as e:
            print(f"Error listing tests (Table missing?): {e}")
            return

        # 2. Try to create a test
        print("Attempting to create a test...")
        # We need a valid project ID and organisation ID?
        # Actually create_test inserts into DB. FK constraints might fail if IDs don't exist.
        # We need to find an existing project.
        
        from app.models.project import Project
        result = await db.execute(select(Project).limit(1))
        project = result.scalar_one_or_none()
        
        if not project:
            print("No project found to test with.")
            return

        print(f"Using project: {project.id} (Org: {project.organisation_id})")
        
        try:
            test = await service.create_test(
                project_id=project.id,
                organisation_id=project.organisation_id,
                user_id=project.owner_id, # Use owner as user
                name="Debug Test 500",
                test_type=TestType.LIGHTHOUSE,
                target_url="https://example.com"
            )
            print(f"Test created successfully: {test.id}")
            
            # 3. Try to execute test
            print("Attempting to execute test...")
            # We expect this might fail internally but return the test object with FAILED status
            # UNLESS the error is unhandled.
            
            result_test = await service.execute_test(test.id)
            print(f"Execution result status: {result_test.status}")
            print(f"Error message (if any): {result_test.error_message}")
            
            # Clean up
            await service.delete_test(test.id)
            print("Test deleted.")
            
        except Exception as e:
            print(f"CAUGHT EXCEPTION DURING OPERATION: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_500())
