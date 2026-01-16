"""add_api_environments

Revision ID: add_api_environments
Revises: add_api_testing_v2
Create Date: 2026-01-16 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_api_environments'
down_revision = 'add_api_testing_v2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('api_environments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('variables', sa.JSON(), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_api_environments_project_id'), 'api_environments', ['project_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_api_environments_project_id'), table_name='api_environments')
    op.drop_table('api_environments')
