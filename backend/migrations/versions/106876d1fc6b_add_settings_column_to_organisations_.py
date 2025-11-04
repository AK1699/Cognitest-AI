"""Add settings column to organisations table

Revision ID: 106876d1fc6b
Revises: 43906e3bafdf
Create Date: 2025-11-04 12:10:48.098854

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '106876d1fc6b'
down_revision: Union[str, Sequence[str], None] = '43906e3bafdf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add settings column to organisations table
    op.add_column('organisations', sa.Column('settings', sa.JSON(), nullable=True, server_default='{}'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove settings column from organisations table
    op.drop_column('organisations', 'settings')
