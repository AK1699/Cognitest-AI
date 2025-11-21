from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from app.core.deps import get_db, get_current_active_user
from app.models.test_plan import TestPlan
from app.models.test_suite import TestSuite
from app.models.test_case import TestCase

router = APIRouter(prefix="/search-by-id", tags=["search-by-id"])


def _parse_plan_num(q: str):
    if not q or not q.upper().startswith("TP-"):
        return None
    try:
        seg = q.split("-", 1)[1]
        return int(seg)
    except Exception:
        return None


def _parse_suite_nums(q: str):
    # TP-XXX-TS-YYY or prefix
    try:
        parts = q.split("-")
        if len(parts) < 4:  # allow prefix TP-xxx-TS-
            return None
        if parts[0].upper() != "TP" or parts[2].upper() != "TS":
            return None
        plan_num = int(parts[1])
        suite_num = int(parts[3]) if parts[3].isdigit() else None
        return plan_num, suite_num
    except Exception:
        return None


def _parse_case_nums(q: str):
    # TP-XXX-TS-YYY-TC-ZZZ or prefix
    try:
        parts = q.split("-")
        if len(parts) < 6:
            return None
        if parts[0].upper() != "TP" or parts[2].upper() != "TS" or parts[4].upper() != "TC":
            return None
        plan_num = int(parts[1])
        suite_num = int(parts[3])
        case_num = int(parts[5]) if parts[5].isdigit() else None
        return plan_num, suite_num, case_num
    except Exception:
        return None


@router.get("", response_model=List[Dict[str, Any]])
async def search_by_id(
    q: str = Query(..., description="Human-friendly ID or prefix: TP-XXX, TP-XXX-TS-YYY, TP-XXX-TS-YYY-TC-ZZZ"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    q_upper = q.upper()
    results: List[Dict[str, Any]] = []

    # Exact plan match or plan prefix
    plan_num = _parse_plan_num(q_upper)
    if plan_num is not None:
        # Find plan by numeric_id
        res_plan = await db.execute(select(TestPlan).where(TestPlan.numeric_id == plan_num))
        plan = res_plan.scalar_one_or_none()
        if plan:
            results.append({
                "entity": "plan",
                "human_id": plan.human_id,
                "plan_numeric_id": plan.numeric_id,
                "plan_id": str(plan.id),
            })
            # If prefix like TP-XXX-..., include its suites/cases
            if q_upper.endswith("-") or q_upper.startswith(f"TP-{str(plan_num).zfill(3)}-"):
                res_suites = await db.execute(select(TestSuite).where(TestSuite.test_plan_id == plan.id))
                suites = res_suites.scalars().all()
                for s in suites:
                    results.append({
                        "entity": "suite",
                        "human_id": s.human_id,
                        "plan_numeric_id": plan.numeric_id,
                        "suite_numeric_id": s.numeric_id,
                        "plan_id": str(plan.id),
                        "suite_id": str(s.id),
                    })
                # Optionally include cases too for broad plan prefix
                res_cases = await db.execute(select(TestCase).join(TestSuite, TestCase.test_suite_id == TestSuite.id).where(TestSuite.test_plan_id == plan.id))
                cases = res_cases.scalars().all()
                for c in cases:
                    # Need suite numeric_id
                    res_sn = await db.execute(select(TestSuite.numeric_id).where(TestSuite.id == c.test_suite_id))
                    sn = res_sn.scalar_one_or_none()
                    results.append({
                        "entity": "case",
                        "human_id": c.human_id,
                        "plan_numeric_id": plan.numeric_id,
                        "suite_numeric_id": sn,
                        "case_numeric_id": c.numeric_id,
                        "plan_id": str(plan.id),
                        "suite_id": str(c.test_suite_id),
                        "case_id": str(c.id),
                    })
        return results

    # Suite exact or prefix
    suite_parsed = _parse_suite_nums(q_upper)
    if suite_parsed is not None:
        pnum, snum = suite_parsed
        res_plan = await db.execute(select(TestPlan).where(TestPlan.numeric_id == pnum))
        plan = res_plan.scalar_one_or_none()
        if not plan:
            return results
        if snum is None:
            # Prefix like TP-XXX-TS-, return plan and its suites
            res_suites = await db.execute(select(TestSuite).where(TestSuite.test_plan_id == plan.id))
            for s in res_suites.scalars().all():
                results.append({
                    "entity": "suite",
                    "human_id": s.human_id,
                    "plan_numeric_id": plan.numeric_id,
                    "suite_numeric_id": s.numeric_id,
                    "plan_id": str(plan.id),
                    "suite_id": str(s.id),
                })
            return results
        # Exact suite (and optionally prefix beyond it)
        res_suite = await db.execute(select(TestSuite).where(TestSuite.test_plan_id == plan.id, TestSuite.numeric_id == snum))
        suite = res_suite.scalar_one_or_none()
        if suite:
            results.append({
                "entity": "suite",
                "human_id": suite.human_id,
                "plan_numeric_id": plan.numeric_id,
                "suite_numeric_id": suite.numeric_id,
                "plan_id": str(plan.id),
                "suite_id": str(suite.id),
            })
            # If prefix beyond suite (e.g., TP-xxx-TS-yyy-), include cases
            if q_upper.endswith("-"):
                res_cases = await db.execute(select(TestCase).where(TestCase.test_suite_id == suite.id))
                for c in res_cases.scalars().all():
                    results.append({
                        "entity": "case",
                        "human_id": c.human_id,
                        "plan_numeric_id": plan.numeric_id,
                        "suite_numeric_id": suite.numeric_id,
                        "case_numeric_id": c.numeric_id,
                        "plan_id": str(plan.id),
                        "suite_id": str(suite.id),
                        "case_id": str(c.id),
                    })
        return results

    # Case exact
    case_parsed = _parse_case_nums(q_upper)
    if case_parsed is not None:
        pnum, snum, cnum = case_parsed
        res_plan = await db.execute(select(TestPlan).where(TestPlan.numeric_id == pnum))
        plan = res_plan.scalar_one_or_none()
        if not plan:
            return results
        res_suite = await db.execute(select(TestSuite).where(TestSuite.test_plan_id == plan.id, TestSuite.numeric_id == snum))
        suite = res_suite.scalar_one_or_none()
        if not suite:
            return results
        if cnum is None:
            # Prefix like TP-xxx-TS-yyy-TC- (rare); return cases under suite
            res_cases = await db.execute(select(TestCase).where(TestCase.test_suite_id == suite.id))
            for c in res_cases.scalars().all():
                results.append({
                    "entity": "case",
                    "human_id": c.human_id,
                    "plan_numeric_id": plan.numeric_id,
                    "suite_numeric_id": suite.numeric_id,
                    "case_numeric_id": c.numeric_id,
                    "plan_id": str(plan.id),
                    "suite_id": str(suite.id),
                    "case_id": str(c.id),
                })
            return results
        res_case = await db.execute(select(TestCase).where(TestCase.test_suite_id == suite.id, TestCase.numeric_id == cnum))
        case = res_case.scalar_one_or_none()
        if case:
            results.append({
                "entity": "case",
                "human_id": case.human_id,
                "plan_numeric_id": plan.numeric_id,
                "suite_numeric_id": suite.numeric_id,
                "case_numeric_id": case.numeric_id,
                "plan_id": str(plan.id),
                "suite_id": str(suite.id),
                "case_id": str(case.id),
            })
        return results

    # If none matched, return empty list
    return results
