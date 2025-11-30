# Pagination Quick Reference

## API Endpoints with Pagination

### Test Plans
```
GET /api/v1/test-plans/?project_id={uuid}&page=1&size=50&search=regression
```

### Test Suites
```
GET /api/v1/test-suites/?project_id={uuid}&test_plan_id={uuid}&page=1&size=50&search=api
```

### Test Cases
```
GET /api/v1/test-cases/?project_id={uuid}&test_suite_id={uuid}&page=1&size=50&search=login&status=passed&priority=high
```

## Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | int | 1 | - | Page number (1-indexed) |
| `size` | int | 50 | 100 | Items per page |
| `search` | string | - | - | Search in name/description |

## Human ID Ordering

All endpoints return results ordered by `numeric_id` in **ascending order**:

- ✅ Test Plans: TP-001, TP-002, TP-003, ...
- ✅ Test Suites: TP-001-TS-001, TP-001-TS-002, ...
- ✅ Test Cases: TP-001-TS-001-TC-001, TP-001-TS-001-TC-002, ...

## Changes Summary

| Endpoint | Before | After |
|----------|--------|-------|
| Test Plans | No pagination | ✅ Paginated, ordered by numeric_id ASC |
| Test Suites | No pagination | ✅ Paginated, ordered by numeric_id ASC |
| Test Cases | Paginated, ordered by created_at DESC | ✅ Ordered by numeric_id ASC |

## Files Modified

1. ✅ `backend/app/api/v1/test_plans.py`
2. ✅ `backend/app/api/v1/test_suites.py`
3. ✅ `backend/app/services/test_plan_service.py`
