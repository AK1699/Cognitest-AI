"""merge web automation

Revision ID: bee3420f9f3a
Revises: abcd1234, web_automation_v1, c22c105dde5c
Create Date: 2025-12-05 16:29:01.887495

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bee3420f9f3a'
down_revision: Union[str, Sequence[str], None] = ('abcd1234', 'web_automation_v1', 'c22c105dde5c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
