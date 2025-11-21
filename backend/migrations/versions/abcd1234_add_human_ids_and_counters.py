"""
Add human-friendly IDs and counters with backfill (supports dry-run)

Revision ID: abcd1234
Revises: 87e0c3a06ef3
Create Date: 2025-01-01 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text
import os

# revision identifiers, used by Alembic.
revision = 'abcd1234'
down_revision = '87e0c3a06ef3'
branch_labels = None
depends_on = None


def pad3(n: int) -> str:
    return str(int(n)).zfill(3)


def upgrade() -> None:
    conn = op.get_bind()
    dry_run = os.getenv('HUMAN_ID_BACKFILL_DRY_RUN', '0') == '1'

    # 1) Create counters table
    op.create_table(
        'human_id_counters',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('entity_type', sa.String(length=16), nullable=False),
        sa.Column('plan_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('suite_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('next_number', sa.Integer(), nullable=False),
    )
    # Unique constraints for counters
    op.create_unique_constraint('uq_hid_counter_plan_singleton', 'human_id_counters', ['entity_type'])
    op.create_unique_constraint('uq_hid_counter_suite_per_plan', 'human_id_counters', ['entity_type', 'plan_id'])
    op.create_unique_constraint('uq_hid_counter_case_per_suite', 'human_id_counters', ['entity_type', 'suite_id'])

    # 2) Add columns (initially nullable)
    op.add_column('test_plans', sa.Column('numeric_id', sa.Integer(), nullable=True))
    op.add_column('test_plans', sa.Column('human_id', sa.String(length=32), nullable=True))
    op.create_index('ix_test_plans_human_id', 'test_plans', ['human_id'], unique=False)

    op.add_column('test_suites', sa.Column('numeric_id', sa.Integer(), nullable=True))
    op.add_column('test_suites', sa.Column('human_id', sa.String(length=64), nullable=True))
    op.create_index('ix_test_suites_human_id', 'test_suites', ['human_id'], unique=False)

    op.add_column('test_cases', sa.Column('numeric_id', sa.Integer(), nullable=True))
    op.add_column('test_cases', sa.Column('human_id', sa.String(length=96), nullable=True))
    op.create_index('ix_test_cases_human_id', 'test_cases', ['human_id'], unique=False)

    # 3) Backfill IDs (skip if dry-run)
    if dry_run:
        print('[DRY-RUN] Skipping backfill of human IDs; schema changes applied without data mutation.')
    else:
        # Plans: assign numeric_id sequentially by created_at where missing
        res = conn.execute(text("SELECT id FROM test_plans ORDER BY created_at ASC"))
        rows = res.fetchall()
        plan_num = 0
        for (plan_id,) in rows:
            plan_num += 1
            hid = f"TP-{pad3(plan_num)}"
            conn.execute(text("""
                UPDATE test_plans
                SET numeric_id = :num, human_id = :hid
                WHERE id = :id AND (numeric_id IS NULL OR human_id IS NULL)
            """), {"num": plan_num, "hid": hid, "id": str(plan_id)})
        print(f'[BACKFILL] Plans updated: {len(rows)}; last numeric_id={plan_num}')

        # Seed counters for plans
        if plan_num > 0:
            # Upsert singleton plan counter
            conn.execute(text("""
                INSERT INTO human_id_counters(entity_type, next_number)
                VALUES ('plan', :next)
                ON CONFLICT (entity_type) DO UPDATE SET next_number = EXCLUDED.next_number
            """), {"next": plan_num + 1})

        # Build plan numeric map
        plan_map = {str(r[0]): idx + 1 for idx, r in enumerate(rows)}

        # Suites per plan
        res = conn.execute(text("""
            SELECT s.id, s.test_plan_id
            FROM test_suites s
            ORDER BY s.created_at ASC
        """))
        suites = res.fetchall()
        # Track per-plan suite counters
        per_plan_count = {}
        for suite_id, s_plan_id in suites:
            plan_id_str = str(s_plan_id) if s_plan_id else None
            if not plan_id_str:
                # orphan suite; skip numbering but keep columns nullable
                continue
            plan_numeric = plan_map.get(plan_id_str)
            if not plan_numeric:
                # If plan not in map (legacy), try to read numeric_id
                res2 = conn.execute(text("SELECT numeric_id FROM test_plans WHERE id = :id"), {"id": plan_id_str}).fetchone()
                plan_numeric = res2[0] if res2 and res2[0] else None
                if not plan_numeric:
                    # Assign next plan number
                    plan_num += 1
                    plan_numeric = plan_num
                    conn.execute(text("UPDATE test_plans SET numeric_id=:n, human_id=:hid WHERE id=:id"),
                                 {"n": plan_numeric, "hid": f"TP-{pad3(plan_numeric)}", "id": plan_id_str})
                    plan_map[plan_id_str] = plan_numeric
            count = per_plan_count.get(plan_id_str, 0) + 1
            per_plan_count[plan_id_str] = count
            suite_numeric = count
            hid = f"TP-{pad3(plan_numeric)}-TS-{pad3(suite_numeric)}"
            conn.execute(text("""
                UPDATE test_suites
                SET numeric_id = :num, human_id = :hid
                WHERE id = :id AND (numeric_id IS NULL OR human_id IS NULL)
            """), {"num": suite_numeric, "hid": hid, "id": str(suite_id)})
        print(f'[BACKFILL] Suites processed: {len(suites)}')

        # Seed per-plan suite counters
        for plan_id_str, count in per_plan_count.items():
            conn.execute(text("""
                INSERT INTO human_id_counters(entity_type, plan_id, next_number)
                VALUES ('suite', :pid, :next)
                ON CONFLICT (entity_type, plan_id) DO UPDATE SET next_number = EXCLUDED.next_number
            """), {"pid": plan_id_str, "next": count + 1})

        # Cases per suite
        res = conn.execute(text("""
            SELECT c.id, c.test_suite_id, s.test_plan_id
            FROM test_cases c
            LEFT JOIN test_suites s ON s.id = c.test_suite_id
            ORDER BY c.created_at ASC
        """))
        cases = res.fetchall()
        per_suite_count = {}
        for case_id, suite_id, s_plan_id in cases:
            suite_id_str = str(suite_id) if suite_id else None
            plan_id_str = str(s_plan_id) if s_plan_id else None
            if not suite_id_str or not plan_id_str:
                continue
            # Get plan numeric
            respn = conn.execute(text("SELECT numeric_id FROM test_plans WHERE id = :id"), {"id": plan_id_str}).fetchone()
            plan_numeric = respn[0] if respn else None
            if not plan_numeric:
                continue
            # Get suite numeric or increment
            ress = conn.execute(text("SELECT numeric_id FROM test_suites WHERE id = :id"), {"id": suite_id_str}).fetchone()
            suite_numeric = ress[0] if ress else None
            if not suite_numeric:
                # derive from counter
                count = per_suite_count.get(suite_id_str, 0) + 1
                per_suite_count[suite_id_str] = count
                suite_numeric = count
                conn.execute(text("UPDATE test_suites SET numeric_id=:n, human_id=:hid WHERE id=:id"),
                             {"n": suite_numeric, "hid": f"TP-{pad3(plan_numeric)}-TS-{pad3(suite_numeric)}", "id": suite_id_str})
            # Now case
            cnt = per_suite_count.get(f'case:{suite_id_str}', 0) + 1
            per_suite_count[f'case:{suite_id_str}'] = cnt
            case_numeric = cnt
            hid = f"TP-{pad3(plan_numeric)}-TS-{pad3(suite_numeric)}-TC-{pad3(case_numeric)}"
            conn.execute(text("""
                UPDATE test_cases
                SET numeric_id = :num, human_id = :hid
                WHERE id = :id AND (numeric_id IS NULL OR human_id IS NULL)
            """), {"num": case_numeric, "hid": hid, "id": str(case_id)})
        print(f'[BACKFILL] Cases processed: {len(cases)}')

        # Seed per-suite case counters
        for key, count in per_suite_count.items():
            if not key.startswith('case:'):
                continue
            suite_id_str = key.split(':', 1)[1]
            conn.execute(text("""
                INSERT INTO human_id_counters(entity_type, suite_id, next_number)
                VALUES ('case', :sid, :next)
                ON CONFLICT (entity_type, suite_id) DO UPDATE SET next_number = EXCLUDED.next_number
            """), {"sid": suite_id_str, "next": count + 1})

    # 4) Constraints and uniqueness (apply even if dry-run? No, only when not dry-run)
    if dry_run:
        print('[DRY-RUN] Skipping constraints (NOT NULL/UNIQUE) enforcement for safety.')
    else:
        # test_plans unique + not null
        op.create_unique_constraint('uq_test_plans_numeric_id', 'test_plans', ['numeric_id'])
        op.create_unique_constraint('uq_test_plans_human_id', 'test_plans', ['human_id'])
        op.alter_column('test_plans', 'numeric_id', existing_type=sa.Integer(), nullable=False)
        op.alter_column('test_plans', 'human_id', existing_type=sa.String(length=32), nullable=False)

        # test_suites constraints
        op.create_unique_constraint('uq_test_suites_human_id', 'test_suites', ['human_id'])
        op.create_unique_constraint('uq_test_suites_plan_numeric', 'test_suites', ['test_plan_id', 'numeric_id'])
        op.alter_column('test_suites', 'numeric_id', existing_type=sa.Integer(), nullable=False)
        op.alter_column('test_suites', 'human_id', existing_type=sa.String(length=64), nullable=False)

        # test_cases constraints
        op.create_unique_constraint('uq_test_cases_human_id', 'test_cases', ['human_id'])
        op.create_unique_constraint('uq_test_cases_suite_numeric', 'test_cases', ['test_suite_id', 'numeric_id'])
        op.alter_column('test_cases', 'numeric_id', existing_type=sa.Integer(), nullable=False)
        op.alter_column('test_cases', 'human_id', existing_type=sa.String(length=96), nullable=False)


def downgrade() -> None:
    # Drop constraints first
    with op.batch_alter_table('test_cases') as b:
        try:
            b.drop_constraint('uq_test_cases_suite_numeric', type_='unique')
        except Exception:
            pass
        try:
            b.drop_constraint('uq_test_cases_human_id', type_='unique')
        except Exception:
            pass
        try:
            b.drop_index('ix_test_cases_human_id')
        except Exception:
            pass
        try:
            b.drop_column('numeric_id')
        except Exception:
            pass
        try:
            b.drop_column('human_id')
        except Exception:
            pass

    with op.batch_alter_table('test_suites') as b:
        try:
            b.drop_constraint('uq_test_suites_plan_numeric', type_='unique')
        except Exception:
            pass
        try:
            b.drop_constraint('uq_test_suites_human_id', type_='unique')
        except Exception:
            pass
        try:
            b.drop_index('ix_test_suites_human_id')
        except Exception:
            pass
        try:
            b.drop_column('numeric_id')
        except Exception:
            pass
        try:
            b.drop_column('human_id')
        except Exception:
            pass

    with op.batch_alter_table('test_plans') as b:
        try:
            b.drop_constraint('uq_test_plans_human_id', type_='unique')
        except Exception:
            pass
        try:
            b.drop_constraint('uq_test_plans_numeric_id', type_='unique')
        except Exception:
            pass
        try:
            b.drop_index('ix_test_plans_human_id')
        except Exception:
            pass
        try:
            b.drop_column('numeric_id')
        except Exception:
            pass
        try:
            b.drop_column('human_id')
        except Exception:
            pass

    try:
        op.drop_constraint('uq_hid_counter_case_per_suite', 'human_id_counters', type_='unique')
    except Exception:
        pass
    try:
        op.drop_constraint('uq_hid_counter_suite_per_plan', 'human_id_counters', type_='unique')
    except Exception:
        pass
    try:
        op.drop_constraint('uq_hid_counter_plan_singleton', 'human_id_counters', type_='unique')
    except Exception:
        pass
    try:
        op.drop_table('human_id_counters')
    except Exception:
        pass
