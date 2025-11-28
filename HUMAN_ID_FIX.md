# Fixing Missing Human IDs for Test Cases

## Problem
Existing test cases in the database don't have `human_id` values because they were created before the human ID generation system was fully implemented.

## Solution

### 1. Backend Fix (Already Applied ✅)
Updated `backend/app/api/v1/test_cases.py` to default to `1` instead of `0` for plan_numeric and suite_numeric.

### 2. Run Migration Script

**Option A: Run the migration script (Recommended)**

```bash
cd /Users/akash/Platform/Cognitest/Cognitest-AI/backend
python migrate_human_ids.py
```

When prompted, type `yes` to proceed. This will:
- ✅ Add human_id to all existing test plans
- ✅ Add human_id to all existing test suites  
- ✅ Add human_id to all existing test cases

**Option B: Manual SQL Update (Advanced)**

If you prefer SQL, you can run these queries directly in your database to see what needs updating:

```sql
-- Check how many records are missing human_id
SELECT COUNT(*) FROM test_plans WHERE human_id IS NULL;
SELECT COUNT(*) FROM test_suites WHERE human_id IS NULL;
SELECT COUNT(*) FROM test_cases WHERE human_id IS NULL;
```

### 3. Restart the Backend

After running the migration:
```bash
# The backend should auto-reload if using acli rovodev run
# Otherwise, restart it manually
```

### 4. Refresh the Frontend

Hard refresh your browser:
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

## Expected Result

After migration, all test cases should display human IDs like:
- `TP-001-TS-001-TC-001`
- `TP-001-TS-001-TC-002`
- etc.

## Verification

1. Navigate to Test Cases page
2. You should see blue clickable badges with human IDs
3. Click any badge to view the test case details
4. The "Copy" button should work to copy the ID

## Notes

- The migration script is **safe to run multiple times** - it only updates records that don't have human_id
- New test cases created after the fix will automatically get human IDs
- The script uses the same allocation logic as the live system
