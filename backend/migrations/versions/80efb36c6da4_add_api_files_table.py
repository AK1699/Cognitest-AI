"""add_api_files_table

Revision ID: 80efb36c6da4
Revises: bd946def97b5
Create Date: 2026-01-17 13:15:45.918424

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '80efb36c6da4'
down_revision: Union[str, Sequence[str], None] = 'bd946def97b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - create api_files table."""
    op.create_table('api_files',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('stored_filename', sa.String(length=255), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=False),
        sa.Column('size_bytes', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_api_files_project_id', 'api_files', ['project_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema - drop api_files table."""
    op.drop_index('ix_api_files_project_id', table_name='api_files')
    op.drop_table('api_files')
