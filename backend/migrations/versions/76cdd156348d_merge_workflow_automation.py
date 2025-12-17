"""merge_workflow_automation

Revision ID: 76cdd156348d
Revises: b8f9a0c1d2e3, add_workflow_automation_tables
Create Date: 2025-12-17 22:46:24.607586

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '76cdd156348d'
down_revision: Union[str, Sequence[str], None] = ('b8f9a0c1d2e3', 'add_workflow_automation_tables')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
