"""add missing user_organisations columns

Revision ID: b8f9a0c1d2e3
Revises: a7e8f9c0d1b2
Create Date: 2024-12-14 17:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b8f9a0c1d2e3'
down_revision: Union[str, None] = 'a7e8f9c0d1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing columns to user_organisations table
    op.add_column(
        'user_organisations',
        sa.Column('is_active', sa.Boolean, nullable=True, server_default='true')
    )
    op.add_column(
        'user_organisations',
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now())
    )
    op.add_column(
        'user_organisations',
        sa.Column('invited_by', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.add_column(
        'user_organisations',
        sa.Column('invited_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        'user_organisations',
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        'user_organisations',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True)
    )
    
    # Update existing rows to set default values
    op.execute("UPDATE user_organisations SET is_active = true WHERE is_active IS NULL")
    op.execute("UPDATE user_organisations SET joined_at = created_at WHERE joined_at IS NULL")
    op.execute("UPDATE user_organisations SET id = gen_random_uuid() WHERE id IS NULL")


def downgrade() -> None:
    op.drop_column('user_organisations', 'is_active')
    op.drop_column('user_organisations', 'joined_at')
    op.drop_column('user_organisations', 'invited_by')
    op.drop_column('user_organisations', 'invited_at')
    op.drop_column('user_organisations', 'updated_at')
    op.drop_column('user_organisations', 'id')
