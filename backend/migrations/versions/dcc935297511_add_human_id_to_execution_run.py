"""add_human_id_to_execution_run

Revision ID: dcc935297511
Revises: add_test_artifacts_v1
Create Date: 2025-12-14 13:05:47.107540

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'dcc935297511'
down_revision: Union[str, Sequence[str], None] = 'add_test_artifacts_v1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add human_id to execution_runs."""
    op.add_column('execution_runs', sa.Column('human_id', sa.String(length=12), nullable=True))
    op.create_unique_constraint('uq_execution_runs_human_id', 'execution_runs', ['human_id'])


def downgrade() -> None:
    """Downgrade schema - remove human_id from execution_runs."""
    op.drop_constraint('uq_execution_runs_human_id', 'execution_runs', type_='unique')
    op.drop_column('execution_runs', 'human_id')
