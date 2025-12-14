"""Add test_snippets table

Revision ID: add_snippets_table
Revises: 
Create Date: 2024-12-14

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_snippets_table'
down_revision = 'dcc935297511'
branch_labels = None
depends_on = None


def upgrade():
    # Create test_snippets table
    op.create_table('test_snippets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parameters', postgresql.JSON(astext_type=sa.Text()), nullable=True, default=[]),
        sa.Column('steps', postgresql.JSON(astext_type=sa.Text()), nullable=True, default=[]),
        sa.Column('tags', postgresql.JSON(astext_type=sa.Text()), nullable=True, default=[]),
        sa.Column('is_global', sa.Boolean(), nullable=True, default=False),
        sa.Column('version', sa.String(length=50), nullable=True, default='1.0.0'),
        sa.Column('usage_count', sa.Integer(), nullable=True, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['organisation_id'], ['organisations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_test_snippets_project_id'), 'test_snippets', ['project_id'], unique=False)
    op.create_index(op.f('ix_test_snippets_organisation_id'), 'test_snippets', ['organisation_id'], unique=False)
    op.create_index(op.f('ix_test_snippets_name'), 'test_snippets', ['name'], unique=False)
    op.create_index(op.f('ix_test_snippets_is_global'), 'test_snippets', ['is_global'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_test_snippets_is_global'), table_name='test_snippets')
    op.drop_index(op.f('ix_test_snippets_name'), table_name='test_snippets')
    op.drop_index(op.f('ix_test_snippets_organisation_id'), table_name='test_snippets')
    op.drop_index(op.f('ix_test_snippets_project_id'), table_name='test_snippets')
    op.drop_table('test_snippets')
