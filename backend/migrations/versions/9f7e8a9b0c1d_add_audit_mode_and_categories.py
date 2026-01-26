"""add_audit_mode_and_categories_to_performance_tests

Revision ID: 9f7e8a9b0c1d
Revises: 80efb36c6da4
Create Date: 2026-01-26 10:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9f7e8a9b0c1d'
down_revision: Union[str, Sequence[str], None] = '80efb36c6da4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Add audit_mode and categories columns to performance_tests table."""
    op.add_column('performance_tests', sa.Column('audit_mode', sa.String(length=50), nullable=True, server_default='navigation'))
    op.add_column('performance_tests', sa.Column('categories', sa.JSON(), nullable=True))

def downgrade() -> None:
    """Remove audit_mode and categories columns from performance_tests table."""
    op.drop_column('performance_tests', 'categories')
    op.drop_column('performance_tests', 'audit_mode')
