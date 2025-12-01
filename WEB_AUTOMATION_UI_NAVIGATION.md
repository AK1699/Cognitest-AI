# Web Automation Module - UI Navigation Guide

## 📍 How to Access Web Automation in the UI

The Web Automation module is already integrated into the CogniTest UI. Here's exactly where to find it:

---

## 🗺️ Navigation Path

### Step-by-Step Navigation:

```
1. Login to CogniTest
   └─> http://localhost:3000

2. Select Organization
   └─> Click on your organization

3. Open a Project
   └─> Click "Projects" or select a project

4. Go to Automation Hub
   └─> Click "Automation Hub" in the navigation

5. Select Web Automation
   └─> Click the "Web Automation" card
```

---

## 🎯 Full URL Structure

```
http://localhost:3000/organizations/{org-uuid}/projects/{project-id}/automation-hub/web-automation
```

### Example:
```
http://localhost:3000/organizations/abc-123/projects/proj-456/automation-hub/web-automation
```

---

## 📱 What You'll See in Automation Hub

When you navigate to **Automation Hub**, you'll see cards for different automation types:

```
┌─────────────────────────────────────────────────────┐
│            Automation Hub                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐               │
│  │   🌐 Web     │  │  📱 Mobile   │               │
│  │  Automation  │  │  Automation  │               │
│  │              │  │              │               │
│  │  Click Here! │  │              │               │
│  └──────────────┘  └──────────────┘               │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐               │
│  │   🔌 API     │  │  💼 Other    │               │
│  │  Testing     │  │  Types       │               │
│  └──────────────┘  └──────────────┘               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Web Automation Card Details

The Web Automation card displays:

**Icon**: 🌐 Globe icon  
**Title**: "Web Automation"  
**Description**: "Visual browser automation with AI-powered self-healing"  
**Path**: `/automation-hub/web-automation`

---

## 📄 Available Pages

Once you click on Web Automation, you have access to:

### 1. **Main Dashboard** (List View)
```
/automation-hub/web-automation
```
- View all test flows
- See recent executions
- Access analytics

### 2. **Create New Flow**
```
/automation-hub/web-automation/new
```
- Drag-and-drop flow builder
- Visual canvas
- Action library

### 3. **Edit Existing Flow**
```
/automation-hub/web-automation/{flow-id}
```
- Modify existing test flows
- Update configurations
- Re-execute tests

### 4. **View Execution Results**
```
/automation-hub/web-automation/{execution-id}/results
```
- Detailed execution report
- Step-by-step breakdown
- Healing events
- Screenshots

---

## 🖱️ Quick Access (After Installation)

### Method 1: Direct Navigation
1. Login to CogniTest
2. Click **Organizations** in top nav
3. Select your organization
4. Click **Projects** 
5. Select a project
6. Click **Automation Hub**
7. Click **Web Automation** card

### Method 2: Direct URL
```
http://localhost:3000/organizations/YOUR-ORG-ID/projects/YOUR-PROJECT-ID/automation-hub/web-automation
```

---

## 🎯 What Happens When You Click?

When you click the "Web Automation" card:

1. **Page loads**: `web-automation/page.tsx`
2. **You see**:
   - Header with project info
   - "Create New Flow" button
   - List of existing test flows
   - Analytics dashboard

3. **Click "New Flow"**:
   - Opens the TestFlowBuilder component
   - Shows drag-and-drop interface
   - Action library on the left
   - Canvas in the center
   - Properties panel on the right

---

## 🔍 Verification Steps

### Check if Web Automation is Available:

1. **Backend Check**:
```bash
# Check if endpoint is registered
curl http://localhost:8000/api/docs
# Look for: /web-automation/* endpoints
```

2. **Frontend Check**:
```bash
# Check if page exists
ls frontend/app/organizations/[uuid]/projects/[projectId]/automation-hub/web-automation/page.tsx
```

3. **Browser Check**:
```
Navigate to Automation Hub page
Look for "Web Automation" card
Should see globe icon 🌐
```

---

## 📊 Current Integration Status

✅ **Page Structure**:
```
automation-hub/
├── page.tsx (Main hub with all automation types)
└── web-automation/
    ├── page.tsx (Web automation dashboard)
    ├── new/
    │   └── page.tsx (Create new flow)
    └── [id]/
        ├── page.tsx (Edit flow)
        └── results/
            └── page.tsx (View results)
```

✅ **Card Configuration**:
- **ID**: `web-automation`
- **Title**: "Web Automation"
- **Icon**: Globe (🌐)
- **Path**: `/automation-hub/web-automation`
- **Status**: Active and ready

---

## 🎨 UI Preview

### Automation Hub Page
```
┌────────────────────────────────────────────────┐
│  CogniTest AI - Automation Hub                 │
├────────────────────────────────────────────────┤
│                                                 │
│  🔙 Back to Project                            │
│                                                 │
│  Automation Hub                                 │
│  Choose your automation type                    │
│                                                 │
│  ┌─────────────────────────────────────┐      │
│  │  🌐 Web Automation           →       │      │
│  │  Visual browser automation           │      │
│  │  with AI-powered self-healing        │      │
│  └─────────────────────────────────────┘      │
│                                                 │
│  ┌─────────────────────────────────────┐      │
│  │  📱 Mobile Automation        →       │      │
│  │  Native mobile app testing           │      │
│  └─────────────────────────────────────┘      │
│                                                 │
└────────────────────────────────────────────────┘
```

### Web Automation Dashboard
```
┌────────────────────────────────────────────────┐
│  Web Automation                                 │
├────────────────────────────────────────────────┤
│                                                 │
│  [+ New Test Flow]          [📊 Analytics]     │
│                                                 │
│  Recent Test Flows:                            │
│                                                 │
│  ┌────────────────────────────────────┐       │
│  │ Login Test Flow              [▶ Run]│       │
│  │ Last run: 2 hours ago              │       │
│  │ Status: ✅ Passed                  │       │
│  └────────────────────────────────────┘       │
│                                                 │
│  ┌────────────────────────────────────┐       │
│  │ Checkout Flow               [▶ Run]│       │
│  │ Last run: 5 hours ago              │       │
│  │ Status: ✅ Passed (2 healed)       │       │
│  └────────────────────────────────────┘       │
│                                                 │
└────────────────────────────────────────────────┘
```

---

## 🚨 Troubleshooting Navigation

### Issue: Can't see Web Automation card

**Check 1**: Is the backend running?
```bash
curl http://localhost:8000/api/docs
```

**Check 2**: Is the page file present?
```bash
ls frontend/app/organizations/[uuid]/projects/[projectId]/automation-hub/web-automation/page.tsx
```

**Check 3**: Clear browser cache
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

**Check 4**: Check console for errors
```
F12 → Console tab
Look for any React errors
```

### Issue: Page not found (404)

**Solution**: Ensure correct URL format:
```
✅ Correct: /organizations/abc-123/projects/proj-456/automation-hub/web-automation
❌ Wrong: /automation-hub/web-automation (missing org/project)
```

### Issue: Empty page or loading forever

**Solution**: Check API connection:
```bash
# Check if backend is running
curl http://localhost:8000/api/v1/web-automation/projects/YOUR-PROJECT-ID/test-flows
```

---

## 📝 Quick Reference Card

```
┌────────────────────────────────────────┐
│   WEB AUTOMATION - QUICK ACCESS        │
├────────────────────────────────────────┤
│                                         │
│ Location:                               │
│   Automation Hub → Web Automation       │
│                                         │
│ URL Pattern:                            │
│   /organizations/{org}/projects/{proj}/ │
│   automation-hub/web-automation         │
│                                         │
│ Features:                               │
│   • Visual flow builder                 │
│   • Multi-browser testing              │
│   • AI self-healing                    │
│   • Live preview                       │
│   • Analytics                          │
│                                         │
│ Quick Actions:                          │
│   • New Flow: Click "+ New Test Flow"  │
│   • Edit Flow: Click on flow card      │
│   • Run Test: Click "▶ Run" button    │
│   • View Results: Click completed run   │
│                                         │
└────────────────────────────────────────┘
```

---

## 🎯 Next Steps

Once you navigate to Web Automation:

1. **Click "+ New Test Flow"** button
2. **See the TestFlowBuilder** interface
3. **Drag actions** from the left sidebar
4. **Configure** each step
5. **Save** and **Execute**
6. **Watch** live preview
7. **Review** results

---

## 💡 Pro Tips

1. **Bookmark** the Web Automation page for quick access
2. **Use keyboard shortcuts** in the flow builder (if implemented)
3. **Check analytics** regularly to track healing events
4. **Create templates** for common test scenarios
5. **Share flows** with your team

---

## ✅ Success Indicators

You've successfully navigated to Web Automation when you see:

- ✅ "Web Automation" header
- ✅ "+ New Test Flow" button
- ✅ List of test flows (or empty state)
- ✅ Navigation breadcrumbs showing: Organization → Project → Automation Hub → Web Automation

---

**Need more help?** 
- See: `WEB_AUTOMATION_QUICK_START.md` for creating your first test
- See: `INSTALLATION_GUIDE.md` if pages aren't loading

**Status**: ✅ Web Automation is integrated and accessible in the UI
