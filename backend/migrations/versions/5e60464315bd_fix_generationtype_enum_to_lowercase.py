"""Fix generationtype enum to lowercase

Revision ID: 5e60464315bd
Revises:
Create Date: 2025-11-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5e60464315bd'
down_revision = '6cfc76b935d3'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Change columns to VARCHAR temporarily for all tables
    op.execute("ALTER TABLE test_plans ALTER COLUMN generated_by TYPE VARCHAR(50)")
    op.execute("ALTER TABLE test_suites ALTER COLUMN generated_by TYPE VARCHAR(50)")
    op.execute("ALTER TABLE test_cases ALTER COLUMN generated_by TYPE VARCHAR(50)")

    # Step 2: Update all existing values to lowercase
    op.execute("UPDATE test_plans SET generated_by = LOWER(generated_by)")
    op.execute("UPDATE test_suites SET generated_by = LOWER(generated_by)")
    op.execute("UPDATE test_cases SET generated_by = LOWER(generated_by)")

    # Step 3: Drop the old enum type
    op.execute("DROP TYPE IF EXISTS generationtype")

    # Step 4: Create new enum with lowercase values
    op.execute("CREATE TYPE generationtype AS ENUM ('ai', 'manual', 'hybrid')")

    # Step 5: Change columns back to enum type with lowercase values
    op.execute("ALTER TABLE test_plans ALTER COLUMN generated_by TYPE generationtype USING generated_by::generationtype")
    op.execute("ALTER TABLE test_suites ALTER COLUMN generated_by TYPE generationtype USING generated_by::generationtype")
    op.execute("ALTER TABLE test_cases ALTER COLUMN generated_by TYPE generationtype USING generated_by::generationtype")

    # Set defaults
    op.execute("ALTER TABLE test_plans ALTER COLUMN generated_by SET DEFAULT 'manual'")
    op.execute("ALTER TABLE test_suites ALTER COLUMN generated_by SET DEFAULT 'manual'")
    op.execute("ALTER TABLE test_cases ALTER COLUMN generated_by SET DEFAULT 'manual'")


def downgrade():
    # Reverse: change to VARCHAR, update to uppercase, recreate uppercase enum
    op.execute("ALTER TABLE test_plans ALTER COLUMN generated_by TYPE VARCHAR(50)")
    op.execute("ALTER TABLE test_suites ALTER COLUMN generated_by TYPE VARCHAR(50)")
    op.execute("ALTER TABLE test_cases ALTER COLUMN generated_by TYPE VARCHAR(50)")

    op.execute("UPDATE test_plans SET generated_by = UPPER(generated_by)")
    op.execute("UPDATE test_suites SET generated_by = UPPER(generated_by)")
    op.execute("UPDATE test_cases SET generated_by = UPPER(generated_by)")

    op.execute("DROP TYPE IF EXISTS generationtype")
    op.execute("CREATE TYPE generationtype AS ENUM ('AI', 'MANUAL', 'HYBRID')")

    op.execute("ALTER TABLE test_plans ALTER COLUMN generated_by TYPE generationtype USING generated_by::generationtype")
    op.execute("ALTER TABLE test_suites ALTER COLUMN generated_by TYPE generationtype USING generated_by::generationtype")
    op.execute("ALTER TABLE test_cases ALTER COLUMN generated_by TYPE generationtype USING generated_by::generationtype")

    op.execute("ALTER TABLE test_plans ALTER COLUMN generated_by SET DEFAULT 'MANUAL'")
    op.execute("ALTER TABLE test_suites ALTER COLUMN generated_by SET DEFAULT 'MANUAL'")
    op.execute("ALTER TABLE test_cases ALTER COLUMN generated_by SET DEFAULT 'MANUAL'")
