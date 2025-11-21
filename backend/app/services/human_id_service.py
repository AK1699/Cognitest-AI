from __future__ import annotations
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import Table, Column, Integer, String, ForeignKey, UniqueConstraint, select, update, insert, literal, and_, text
from sqlalchemy import MetaData
from sqlalchemy.exc import IntegrityError
from sqlalchemy.dialects.postgresql import UUID

PAD_WIDTH = 3

ENTITY_PLAN = "plan"
ENTITY_SUITE = "suite"
ENTITY_CASE = "case"


def pad3(n: int) -> str:
    s = str(int(n))
    return s.zfill(PAD_WIDTH)


def format_plan(n_plan: int) -> str:
    return f"TP-{pad3(n_plan)}"


def format_suite(n_plan: int, n_suite: int) -> str:
    # New format: TP-<plan>-TS-<suite>
    return f"TP-{pad3(n_plan)}-TS-{pad3(n_suite)}"


def format_case(n_plan: int, n_suite: int, n_case: int) -> str:
    # New format: TP-<plan>-TS-<suite>-TC-<case>
    return f"TP-{pad3(n_plan)}-TS-{pad3(n_suite)}-TC-{pad3(n_case)}"


class HumanIdAllocator:
    """
    Concurrency-safe allocator using a counters table with row-level locking.
    This uses a hand-written SQL approach to avoid ORM pitfalls with SELECT FOR UPDATE.
    """

    def __init__(self, db: Session):
        self.db = db
        # late-bound table to work without declarative model
        metadata = MetaData(bind=db.get_bind())
        self.counters = Table(
            "human_id_counters",
            metadata,
            Column("id", Integer, primary_key=True, autoincrement=True),
            Column("entity_type", String(16), nullable=False),
            Column("plan_id", UUID(as_uuid=True), nullable=True),
            Column("suite_id", UUID(as_uuid=True), nullable=True),
            Column("next_number", Integer, nullable=False),
            UniqueConstraint("entity_type", name="uq_hid_counter_plan_singleton"),
            UniqueConstraint("entity_type", "plan_id", name="uq_hid_counter_suite_per_plan"),
            UniqueConstraint("entity_type", "suite_id", name="uq_hid_counter_case_per_suite"),
            extend_existing=True,
        )

    def _lock_and_get(self, entity_type: str, plan_id: Optional[str] = None, suite_id: Optional[str] = None) -> int:
        bind = self.db.get_bind()
        if entity_type == ENTITY_PLAN:
            # singleton row
            row = self.db.execute(text("SELECT id, next_number FROM human_id_counters WHERE entity_type = :t FOR UPDATE"), {"t": entity_type}).fetchone()
            if row is None:
                self.db.execute(text("INSERT INTO human_id_counters(entity_type, next_number) VALUES (:t, :n)"), {"t": entity_type, "n": 1})
                self.db.flush()
                return 1
            return int(row[1])
        elif entity_type == ENTITY_SUITE:
            assert plan_id, "plan_id required for suite counter"
            row = self.db.execute(text("SELECT id, next_number FROM human_id_counters WHERE entity_type = :t AND plan_id = :p FOR UPDATE"), {"t": entity_type, "p": str(plan_id)}).fetchone()
            if row is None:
                self.db.execute(text("INSERT INTO human_id_counters(entity_type, plan_id, next_number) VALUES (:t, :p, :n)"), {"t": entity_type, "p": str(plan_id), "n": 1})
                self.db.flush()
                return 1
            return int(row[1])
        elif entity_type == ENTITY_CASE:
            assert suite_id, "suite_id required for case counter"
            row = self.db.execute(text("SELECT id, next_number FROM human_id_counters WHERE entity_type = :t AND suite_id = :s FOR UPDATE"), {"t": entity_type, "s": str(suite_id)}).fetchone()
            if row is None:
                self.db.execute(text("INSERT INTO human_id_counters(entity_type, suite_id, next_number) VALUES (:t, :s, :n)"), {"t": entity_type, "s": str(suite_id), "n": 1})
                self.db.flush()
                return 1
            return int(row[1])
        else:
            raise ValueError("unknown entity type")

    def _bump(self, entity_type: str, plan_id: Optional[str] = None, suite_id: Optional[str] = None) -> None:
        if entity_type == ENTITY_PLAN:
            self.db.execute(text("UPDATE human_id_counters SET next_number = next_number + 1 WHERE entity_type = :t"), {"t": entity_type})
        elif entity_type == ENTITY_SUITE:
            self.db.execute(text("UPDATE human_id_counters SET next_number = next_number + 1 WHERE entity_type = :t AND plan_id = :p"), {"t": entity_type, "p": str(plan_id)})
        elif entity_type == ENTITY_CASE:
            self.db.execute(text("UPDATE human_id_counters SET next_number = next_number + 1 WHERE entity_type = :t AND suite_id = :s"), {"t": entity_type, "s": str(suite_id)})
        else:
            raise ValueError("unknown entity type")

    def allocate_plan(self) -> int:
        n = self._lock_and_get(ENTITY_PLAN)
        self._bump(ENTITY_PLAN)
        return n

    def allocate_suite(self, plan_id: str) -> int:
        n = self._lock_and_get(ENTITY_SUITE, plan_id=plan_id)
        self._bump(ENTITY_SUITE, plan_id=plan_id)
        return n

    def allocate_case(self, suite_id: str) -> int:
        n = self._lock_and_get(ENTITY_CASE, suite_id=suite_id)
        self._bump(ENTITY_CASE, suite_id=suite_id)
        return n
