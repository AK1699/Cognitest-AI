# Quick Test Checklist - Test Management System

**Last Updated**: 2025-11-02
**Status**: Ready for Manual Testing
**Time to Complete**: 15-20 minutes

---

## ✅ Automated Verification (Already Completed)

```
✅ Backend is running and healthy
✅ Frontend is running and accessible
✅ Axios withCredentials is configured (CRITICAL FIX)
✅ All API modules are exported
✅ All API methods are implemented (21 total)
✅ Authentication handling is configured
```

---

## 🧪 Manual Testing Steps (Do This Now)

### Step 1: Login (2 min)
```
[ ] Open http://localhost:3000
[ ] Login with your credentials
[ ] Wait for redirect to complete
[ ] Check browser console (F12) - look for success message
```

**Expected Console Output**:
```
[Auth] Token found: eyJhbGciOiJIUzI1NiIs...
```

---

### Step 2: Navigate to Test Management (1 min)
```
[ ] Go to: http://localhost:3000/organizations/{org}/projects/{project}/test-management
[ ] Or: Organizations → Select Project → Test Management
[ ] Page should load without errors
```

**Expected Result**: Page visible and interactive

---

### Step 3: Check API Calls (2 min)
```
[ ] Open DevTools (F12) → Network tab
[ ] Look for these requests:
    [ ] GET /api/v1/test-plans/?project_id=...
    [ ] GET /api/v1/test-suites/?project_id=...
    [ ] GET /api/v1/test-cases/?project_id=...
[ ] Check status codes - all should be 200 OK
```

**Expected Status**: All 200 OK (or 401 if logged out, or 404 if no data)

---

### Step 4: Check for No 401 Errors (1 min)
```
[ ] Review Network tab - scan all requests
[ ] Check Console tab - look for "AxiosError"
[ ] Check for "401 Unauthorized" errors
```

**Expected Result**: NO 401 errors (unless you're logged out)

---

### Step 5: Create a Test Plan (3 min)
```
[ ] Click "Create Test Plan" button
[ ] Fill in:
    - Name: "Sample Test Plan"
    - Description: "Test plan description"
    - Objectives: ["Objective 1", "Objective 2"]
[ ] Click Save
[ ] Verify it appears in the list
```

**Expected Result**: Test plan created and visible in list

---

### Step 6: Create a Test Suite (3 min)
```
[ ] Click "Create Test Suite" button
[ ] Fill in:
    - Name: "Sample Test Suite"
    - Description: "Suite description"
    - Select the test plan you created
[ ] Click Save
[ ] Verify it appears in the list
```

**Expected Result**: Test suite created and visible

---

### Step 7: Create a Test Case (3 min)
```
[ ] Click "Create Test Case" button
[ ] Fill in:
    - Title: "Sample Test Case"
    - Description: "Test case description"
    - Steps: At least 2 steps with actions and expected results
    - Priority: High
    - Status: Ready
[ ] Click Save
[ ] Verify it appears in the list
```

**Expected Result**: Test case created with steps visible

---

### Step 8: Test AI Generation (3 min)
```
[ ] Click "Generate with AI" button
[ ] Fill in:
    - Feature Description: "User login functionality"
    - Count: 5
[ ] Click Generate
[ ] Wait for results
[ ] Check if test cases are generated
```

**Expected Result**: 5 test cases generated and added to list

---

### Step 9: Check Console Logs (1 min)
```
[ ] Open DevTools Console (F12)
[ ] Look for any error messages
[ ] Should see:
    [ ] No AxiosError messages
    [ ] No 401 Unauthorized messages
    [ ] No "failed to fetch" messages
```

**Expected Result**: Clean console with no errors

---

## 📋 Quick Pass/Fail Checklist

Copy this into your test results:

```
=== QUICK TEST RESULTS ===

Basic Functionality:
[ ] Can login successfully
[ ] Test management page loads
[ ] No 401 errors in Network tab
[ ] No AxiosError in Console

API Endpoints (All should be 200 OK):
[ ] Test Plans API working
[ ] Test Suites API working
[ ] Test Cases API working

Create Operations:
[ ] Can create test plan
[ ] Can create test suite
[ ] Can create test case

AI Generation:
[ ] AI generation works
[ ] Generated items appear in list

Error Handling:
[ ] Helpful error messages shown
[ ] 401 errors properly handled

OVERALL STATUS: [ ] PASS [ ] FAIL

Notes:
_________________________________
_________________________________
```

---

## 🆘 If Tests Fail

### 401 Unauthorized Error
```
1. Check if you're logged in (refresh page)
2. Check browser console: localStorage.getItem('access_token')
3. If empty, login again
4. Refresh test-management page
```

### API Returns 404
```
1. Check Network tab - endpoint URL
2. Verify project ID is correct
3. Check backend logs
```

### Page Won't Load
```
1. Check browser console for errors
2. Verify backend is running: curl http://localhost:8000/health
3. Verify frontend is running: curl http://localhost:3000 -I
4. Clear browser cache and refresh (Ctrl+Shift+Delete)
```

### AI Generation Not Working
```
1. Check backend logs for errors
2. Verify OpenAI API key is set
3. Check response in Network tab
4. Look for error message in response body
```

---

## ✨ Success Criteria

✅ **PASS** if:
- No 401 Unauthorized errors
- All API requests return 200 OK
- Can create test plans, suites, cases
- AI generation works
- No AxiosError in console
- Page is responsive and interactive

❌ **FAIL** if:
- Any 401 errors appear
- API returns 500 errors
- Cannot create items
- Console has AxiosError
- Page crashes or is unresponsive

---

## 📞 Report Results

When done, share:

1. **Pass/Fail Status** (PASS or FAIL)
2. **Any Errors** (if FAIL, describe errors)
3. **Screenshot** (Network tab showing API calls)
4. **Console Output** (F12 Console tab)

---

## 🚀 Next Steps

**If PASS**:
- ✅ Implementation is successful
- ✅ Ready for production deployment
- ✅ Create user documentation
- ✅ Set up monitoring

**If FAIL**:
- 🔧 Identify specific failure
- 🔧 Debug using troubleshooting guide
- 🔧 Share details for fix
- 🔧 Re-test after fix

---

## 📊 Quick Reference

**File Locations**:
- Backend API: `/Applications/TestingHub/testingHub/Cognitest-AI/backend/`
- Frontend API: `/Applications/TestingHub/testingHub/Cognitest-AI/frontend/lib/api/test-management.ts`
- Database: Cognitest PostgreSQL database

**URLs**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Test Management: http://localhost:3000/organizations/{org}/projects/{project}/test-management

**Important Files**:
- VERIFICATION_AND_TESTING_GUIDE.md (detailed testing steps)
- TOKEN_DEBUG_GUIDE.md (authentication debugging)
- TEST_MANAGEMENT_GUIDE.md (complete reference)
- IMPLEMENTATION_COMPLETE_SUMMARY.md (full summary)

---

**Ready to Test?** Start with **Step 1: Login** above! 🚀

Time Required: ~15-20 minutes
Difficulty: Easy
Success Rate: High (if prerequisites are met)

---

**Version**: 1.0.0
**Status**: Ready for Testing
**Date**: 2025-11-02
