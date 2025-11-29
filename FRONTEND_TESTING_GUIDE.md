# Frontend Testing Guide - Comprehensive Test Plan Generator

## 🎯 Complete Step-by-Step Testing Instructions

### Prerequisites
✅ Backend is running on `http://localhost:8000`
✅ Frontend is running on `http://localhost:3000`
✅ User `akashtest@gmail.com` has been added to organisation
✅ All fixes have been applied (Human ID, Copy Buttons, Async, Permissions)

---

## 📋 Testing Steps

### Step 1: Login to the Application
1. Open browser and navigate to: `http://localhost:3000`
2. Login with credentials:
   - **Email**: `akashtest@gmail.com`
   - **Password**: [your password]
3. You should see the dashboard

### Step 2: Navigate to Test Management
1. From the dashboard, click on **"cognitest"** organisation (or your organisation)
2. Click on **"API Testing"** project (or select any project)
3. Click on **"Test Management"** tab in the project navigation
4. You should see three tabs: **Test Plans**, **Test Suites**, **Test Cases**

### Step 3: Open AI Test Plan Generator
1. Make sure you're on the **"Test Plans"** tab
2. Look for the button: **"Generate with AI"** (with ✨ Sparkles icon)
3. Click **"Generate with AI"**
4. A modal/dialog should open: **"AI Test Plan Generator"**

### Step 4: Fill Out the Form

#### Basic Information
- **Title** (optional): `E-Commerce Platform Test Plan`
- **Project Type**: Select `Web Application` from dropdown
- **Description**: 
  ```
  Comprehensive testing for e-commerce platform with user authentication,
  product catalog, shopping cart, and payment processing.
  ```

#### Features (Add multiple, one per line)
Click "+ Add Feature" button and add:
- `User Registration and Login`
- `Product Search and Filtering`
- `Shopping Cart Management`
- `Checkout and Payment`
- `Order History`

#### Platforms (Select from checkboxes)
Select:
- ☑️ `Web`
- ☑️ `Chrome`
- ☑️ `Firefox`
- ☑️ `Safari`

#### Project Settings
- **Priority**: Select `High`
- **Complexity**: Select `Medium - Moderate complexity` (2-4 weeks)
- **Timeframe**: Will auto-populate based on complexity

### Step 5: Generate the Test Plan
1. Review your inputs
2. Click the purple button: **"Generate Comprehensive Test Plan"** (bottom right)
3. The button should show a loading spinner
4. Modal should show "Generating..." state

### Step 6: Wait for Generation (60-90 seconds)
**Expected Behavior**:
- ✅ Loading indicator appears
- ✅ Button becomes disabled
- ✅ No error messages
- ⏱️ Wait approximately 60-90 seconds

**What's Happening**:
- Backend is calling Google Gemini AI
- AI is analyzing your requirements
- Generating comprehensive test plan with 7 suites and ~22 test cases

### Step 7: Review the Generated Test Plan
After generation completes, you should see:

**Preview Screen with**:
- ✅ **Test Plan Name**: Your title or AI-generated name
- ✅ **Confidence Score**: ~95%
- ✅ **Test Objectives**: List of testing goals
- ✅ **Scope of Testing**: In-scope and out-of-scope items
- ✅ **Test Approach**: Testing methodology
- ✅ **Test Suites**: Approximately 7 suites
- ✅ **Test Cases**: Approximately 22 test cases total
- ✅ **Resources**: Team roles and responsibilities
- ✅ **Schedule**: Testing timeline
- ✅ **Risks**: Risk management plan

### Step 8: Review Test Suites
Scroll through the preview to see all generated test suites:

**Expected Suites** (examples):
1. **Smoke Test Suite** - Critical path testing
2. **Authentication & Authorization** - Login/registration
3. **Product Management** - Search, filter, catalog
4. **Shopping Cart** - Add/remove/update items
5. **Checkout & Payment** - Payment processing
6. **Order Management** - Order history, tracking
7. **Regression Suite** - End-to-end scenarios

Each suite should have 2-5 test cases with:
- Test case name
- Description
- Steps
- Expected results
- Priority

### Step 9: Accept or Edit
You have two options:

**Option A: Accept the Plan**
- Click **"Accept & Create Test Plan"** button
- Test plan will be saved to database
- All test suites and test cases will be created
- You'll be redirected back to Test Plans list

**Option B: Edit Before Accepting**
- Click **"Edit"** button (if available)
- Modify any section
- Then accept

### Step 10: Verify Creation
After accepting:
1. ✅ You should see a success toast: "Test plan generated successfully!"
2. ✅ Modal closes automatically
3. ✅ Test Plans list refreshes
4. ✅ New test plan appears in the list with:
   - Human ID badge (e.g., `TP-001`)
   - Test plan name
   - AI Generated badge
   - Copy button with icon

5. Click on the test plan to open details
6. Verify all sections are populated
7. Check that test suites are listed
8. Navigate to Test Suites tab - should see 7 new suites
9. Navigate to Test Cases tab - should see ~22 new test cases

---

## 🔍 What to Check

### Success Indicators ✅
- [ ] Modal opens without errors
- [ ] Form fields are all functional
- [ ] "Generate" button shows loading state
- [ ] No 500 errors in console
- [ ] Generation completes in 60-90 seconds
- [ ] Preview shows comprehensive test plan
- [ ] Test plan has ~7 suites
- [ ] Test plan has ~22 test cases
- [ ] Confidence score shows ~95%
- [ ] Accept creates plan in database
- [ ] Human IDs are assigned (TP-XXX, TS-XXX, TC-XXX)
- [ ] Copy buttons work on all IDs
- [ ] Test plan appears in list with proper formatting

### Error Scenarios ❌ (Should NOT happen)
- ❌ 500 Internal Server Error
- ❌ 403 Forbidden error
- ❌ "Failed to generate test plan" error
- ❌ Infinite loading (hanging)
- ❌ Modal crashes
- ❌ Empty response
- ❌ Missing test suites or cases

---

## 🐛 If You Encounter Errors

### Error: "Failed to generate test plan. Please try again."
1. Open browser console (F12 → Console tab)
2. Look for red error messages
3. Check Network tab (F12 → Network)
4. Find the request to `/api/v1/test-plans/generate-comprehensive`
5. Click on it to see response details
6. Share the error details with me

### Error: Request takes too long (>2 minutes)
- This might indicate the backend is still processing
- Check backend terminal for logs
- The AI generation can take up to 90 seconds for complex plans
- If it exceeds 2 minutes, there might be an issue

### Error: 403 Forbidden
- This means permission issue (should be fixed now)
- Verify you're logged in as `akashtest@gmail.com`
- Check if you're accessing the correct organisation/project

### Error: Network Error
- Check if backend is running: `http://localhost:8000/docs`
- Check if frontend is running: `http://localhost:3000`
- Verify no firewall blocking requests

---

## 📸 Screenshots to Capture

If testing, please capture screenshots of:
1. AI Test Plan Generator modal (form view)
2. Loading state during generation
3. Preview screen with generated test plan
4. Test Plans list showing new plan with human ID
5. Test Plan details modal
6. Any errors (if they occur)

---

## 🎉 Expected Final Result

After successful testing, you should have:
- ✅ 1 new test plan in database
- ✅ 7 new test suites linked to the plan
- ✅ ~22 new test cases linked to suites
- ✅ All with proper human IDs (TP-001, TS-XXX, TC-XXX)
- ✅ All visible in the UI with copy functionality
- ✅ Confidence score displayed
- ✅ AI Generated badge shown

---

## 📊 Performance Expectations

| Metric | Expected Value |
|--------|----------------|
| Modal Load Time | < 1 second |
| Form Submission | < 1 second |
| AI Generation | 60-90 seconds |
| Preview Display | < 1 second |
| Database Save | < 2 seconds |
| List Refresh | < 1 second |

---

## 🆘 Need Help?

If you encounter any issues during testing:
1. Check the browser console for errors
2. Check the Network tab for failed requests
3. Take screenshots of the error
4. Share the error details
5. I can help debug and fix!

---

**Ready to test?** Follow the steps above and let me know what happens! 🚀
