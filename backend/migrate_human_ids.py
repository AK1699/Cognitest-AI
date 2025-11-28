"""
Migration script to add human_id to existing test cases, test suites, and test plans
Run this script once to populate human_id for existing records
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.test_plan import TestPlan
from app.models.test_suite import TestSuite
from app.models.test_case import TestCase
from app.services.human_id_service import HumanIdAllocator, format_plan, format_suite, format_case
from app.core.config import settings


async def migrate_human_ids():
    """Add human_id to existing test plans, suites, and cases"""
    
    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        print("Starting human_id migration...")
        
        # Migrate Test Plans
        print("\n1. Migrating Test Plans...")
        result = await db.execute(select(TestPlan).where(TestPlan.human_id == None))
        test_plans = result.scalars().all()
        
        allocator = HumanIdAllocator(db)
        
        for plan in test_plans:
            if not plan.numeric_id:
                plan_n = await db.run_sync(lambda sync_sess: allocator.allocate_plan())
                plan.numeric_id = plan_n
            plan.human_id = format_plan(plan.numeric_id)
            print(f"  Updated Plan: {plan.name} -> {plan.human_id}")
        
        await db.commit()
        print(f"  ✓ Migrated {len(test_plans)} test plans")
        
        # Migrate Test Suites
        print("\n2. Migrating Test Suites...")
        result = await db.execute(select(TestSuite).where(TestSuite.human_id == None))
        test_suites = result.scalars().all()
        
        for suite in test_suites:
            # Get parent plan numeric_id
            plan_numeric = 1  # Default
            if suite.test_plan_id:
                plan_result = await db.execute(select(TestPlan).where(TestPlan.id == suite.test_plan_id))
                parent_plan = plan_result.scalar_one_or_none()
                if parent_plan and parent_plan.numeric_id:
                    plan_numeric = parent_plan.numeric_id
            
            # Allocate suite number
            if not suite.numeric_id:
                suite_n = await db.run_sync(
                    lambda sync_sess: allocator.allocate_suite(
                        str(suite.test_plan_id) if suite.test_plan_id else "global"
                    )
                )
                suite.numeric_id = suite_n
            
            suite.human_id = format_suite(plan_numeric, suite.numeric_id)
            print(f"  Updated Suite: {suite.name} -> {suite.human_id}")
        
        await db.commit()
        print(f"  ✓ Migrated {len(test_suites)} test suites")
        
        # Migrate Test Cases
        print("\n3. Migrating Test Cases...")
        result = await db.execute(select(TestCase).where(TestCase.human_id == None))
        test_cases = result.scalars().all()
        
        for case in test_cases:
            # Get parent suite and plan numeric_ids
            plan_numeric = 1  # Default
            suite_numeric = 1  # Default
            
            if case.test_suite_id:
                suite_result = await db.execute(select(TestSuite).where(TestSuite.id == case.test_suite_id))
                parent_suite = suite_result.scalar_one_or_none()
                
                if parent_suite:
                    if parent_suite.numeric_id:
                        suite_numeric = parent_suite.numeric_id
                    
                    # Get parent plan
                    if parent_suite.test_plan_id:
                        plan_result = await db.execute(select(TestPlan).where(TestPlan.id == parent_suite.test_plan_id))
                        parent_plan = plan_result.scalar_one_or_none()
                        if parent_plan and parent_plan.numeric_id:
                            plan_numeric = parent_plan.numeric_id
            
            # Allocate case number
            if not case.numeric_id:
                case_n = await db.run_sync(
                    lambda sync_sess: allocator.allocate_case(
                        str(case.test_suite_id) if case.test_suite_id else "global"
                    )
                )
                case.numeric_id = case_n
            
            case.human_id = format_case(plan_numeric, suite_numeric, case.numeric_id)
            print(f"  Updated Case: {case.title} -> {case.human_id}")
        
        await db.commit()
        print(f"  ✓ Migrated {len(test_cases)} test cases")
        
        print("\n✅ Migration completed successfully!")
        print(f"   Test Plans: {len(test_plans)}")
        print(f"   Test Suites: {len(test_suites)}")
        print(f"   Test Cases: {len(test_cases)}")
    
    await engine.dispose()


if __name__ == "__main__":
    print("=" * 60)
    print("Human ID Migration Script")
    print("=" * 60)
    print("\nThis script will add human_id to all existing records")
    print("that don't have one yet.\n")
    
    response = input("Do you want to proceed? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        asyncio.run(migrate_human_ids())
    else:
        print("Migration cancelled.")
