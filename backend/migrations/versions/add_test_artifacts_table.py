"""add test artifacts table

Revision ID: add_test_artifacts_v1
Revises: add_subscription_tables
Create Date: 2024-12-13 23:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_test_artifacts_v1'
down_revision = 'add_subscription_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Create artifact type enum if it doesn't exist
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE artifacttype AS ENUM ('screenshot', 'video');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create test_artifacts table
    op.execute("""
        CREATE TABLE IF NOT EXISTS test_artifacts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            execution_run_id UUID REFERENCES execution_runs(id) ON DELETE SET NULL,
            step_result_id UUID REFERENCES step_results(id) ON DELETE SET NULL,
            name VARCHAR(500) NOT NULL,
            type artifacttype NOT NULL,
            file_path VARCHAR(1000) NOT NULL,
            file_url VARCHAR(1000),
            size_bytes INTEGER,
            duration_ms INTEGER,
            test_name VARCHAR(500),
            step_name VARCHAR(500),
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """)
    
    # Create indexes if they don't exist
    op.execute("CREATE INDEX IF NOT EXISTS ix_test_artifacts_project_id ON test_artifacts(project_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_test_artifacts_execution_run_id ON test_artifacts(execution_run_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_test_artifacts_type ON test_artifacts(type);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_test_artifacts_created_at ON test_artifacts(created_at);")


def downgrade():
    op.execute("DROP TABLE IF EXISTS test_artifacts;")
    op.execute("DROP TYPE IF EXISTS artifacttype;")

