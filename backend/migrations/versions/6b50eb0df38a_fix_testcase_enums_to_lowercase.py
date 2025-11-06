"""fix_testcase_enums_to_lowercase

Revision ID: 6b50eb0df38a
Revises: 5e60464315bd
Create Date: 2025-11-06 21:26:18.924748

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b50eb0df38a'
down_revision: Union[str, Sequence[str], None] = '5e60464315bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Convert testcasestatus and testcasepriority enums from UPPERCASE to lowercase."""

    # ========== FIX testcasestatus enum ==========
    # Step 1: Change status column to VARCHAR temporarily
    op.execute("ALTER TABLE test_cases ALTER COLUMN status TYPE VARCHAR(50)")

    # Step 2: Update all existing values to lowercase
    op.execute("UPDATE test_cases SET status = LOWER(status)")

    # Step 3: Drop the old enum type
    op.execute("DROP TYPE IF EXISTS testcasestatus")

    # Step 4: Create new enum with lowercase values
    op.execute("CREATE TYPE testcasestatus AS ENUM ('draft', 'ready', 'in_progress', 'passed', 'failed', 'blocked', 'skipped')")

    # Step 5: Change column back to enum type
    op.execute("ALTER TABLE test_cases ALTER COLUMN status TYPE testcasestatus USING status::testcasestatus")

    # Step 6: Set default
    op.execute("ALTER TABLE test_cases ALTER COLUMN status SET DEFAULT 'draft'")

    # ========== FIX testcasepriority enum ==========
    # Step 1: Change priority column to VARCHAR temporarily
    op.execute("ALTER TABLE test_cases ALTER COLUMN priority TYPE VARCHAR(50)")

    # Step 2: Update all existing values to lowercase
    op.execute("UPDATE test_cases SET priority = LOWER(priority)")

    # Step 3: Drop the old enum type
    op.execute("DROP TYPE IF EXISTS testcasepriority")

    # Step 4: Create new enum with lowercase values
    op.execute("CREATE TYPE testcasepriority AS ENUM ('low', 'medium', 'high', 'critical')")

    # Step 5: Change column back to enum type
    op.execute("ALTER TABLE test_cases ALTER COLUMN priority TYPE testcasepriority USING priority::testcasepriority")

    # Step 6: Set default
    op.execute("ALTER TABLE test_cases ALTER COLUMN priority SET DEFAULT 'medium'")


def downgrade() -> None:
    """Revert testcasestatus and testcasepriority enums back to UPPERCASE."""

    # ========== REVERT testcasestatus enum ==========
    op.execute("ALTER TABLE test_cases ALTER COLUMN status TYPE VARCHAR(50)")
    op.execute("UPDATE test_cases SET status = UPPER(status)")
    op.execute("DROP TYPE IF EXISTS testcasestatus")
    op.execute("CREATE TYPE testcasestatus AS ENUM ('DRAFT', 'READY', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED')")
    op.execute("ALTER TABLE test_cases ALTER COLUMN status TYPE testcasestatus USING status::testcasestatus")
    op.execute("ALTER TABLE test_cases ALTER COLUMN status SET DEFAULT 'DRAFT'")

    # ========== REVERT testcasepriority enum ==========
    op.execute("ALTER TABLE test_cases ALTER COLUMN priority TYPE VARCHAR(50)")
    op.execute("UPDATE test_cases SET priority = UPPER(priority)")
    op.execute("DROP TYPE IF EXISTS testcasepriority")
    op.execute("CREATE TYPE testcasepriority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')")
    op.execute("ALTER TABLE test_cases ALTER COLUMN priority TYPE testcasepriority USING priority::testcasepriority")
    op.execute("ALTER TABLE test_cases ALTER COLUMN priority SET DEFAULT 'MEDIUM'")
