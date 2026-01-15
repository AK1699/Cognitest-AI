"""add_api_testing_v2

Revision ID: add_api_testing_v2
Revises: 721756dbd280
Create Date: 2026-01-15 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision = 'add_api_testing_v2'
down_revision = '721756dbd280'
branch_labels = None
depends_on = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # 1. Handle api_history (dependent on api_requests)
    if 'api_history' in tables:
        op.drop_table('api_history')

    # 2. Handle api_requests table
    if 'api_requests' in tables:
        # Check if it has collection_id
        columns = [c['name'] for c in inspector.get_columns('api_requests')]
        if 'collection_id' not in columns:
            # It's the old incompatible table, drop it
            op.drop_table('api_requests')
    
    # 3. Update api_collections table
    if 'api_collections' in tables:
        columns = [c['name'] for c in inspector.get_columns('api_collections')]
        
        if 'requests' in columns:
            op.drop_column('api_collections', 'requests')
            
        if 'parent_id' not in columns:
            op.add_column('api_collections', sa.Column('parent_id', sa.UUID(as_uuid=True), nullable=True))
            op.create_foreign_key('fk_api_collections_parent_id', 'api_collections', 'api_collections', ['parent_id'], ['id'], ondelete='CASCADE')

    # 4. Create api_requests table if it doesn't exist
    # Re-check tables as we might have dropped it
    # Note: caching in 'tables' var might be stale if we dropped it, so we rely on re-check or just try/except
    # But since we explicitly dropped it if incompatible, we can just check if we dropped it or if it wasn't there
    
    # Refresh table list check
    inspector = Inspector.from_engine(conn) # Get fresh inspector
    tables = inspector.get_table_names()

    if 'api_requests' not in tables:
        op.create_table('api_requests',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('collection_id', sa.UUID(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('method', sa.String(length=10), nullable=False),
            sa.Column('url', sa.Text(), nullable=False),
            sa.Column('params', sa.JSON(), nullable=True),
            sa.Column('headers', sa.JSON(), nullable=True),
            sa.Column('body', sa.JSON(), nullable=True),
            sa.Column('auth', sa.JSON(), nullable=True),
            sa.Column('pre_request_script', sa.Text(), nullable=True),
            sa.Column('test_script', sa.Text(), nullable=True),
            sa.Column('order', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['collection_id'], ['api_collections.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )

def downgrade() -> None:
    # Attempt to restore roughly to previous state, but we destroyed data
    op.drop_table('api_requests')
    op.drop_constraint('fk_api_collections_parent_id', 'api_collections', type_='foreignkey')
    op.drop_column('api_collections', 'parent_id')
    op.add_column('api_collections', sa.Column('requests', sa.JSON(), nullable=True))
