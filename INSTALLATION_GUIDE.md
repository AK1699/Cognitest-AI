# Web Automation Module - Installation Guide

## ✅ Current Status

**Implementation Complete!** All files have been created successfully:

### Backend (9 files)
- ✅ `backend/app/models/web_automation.py` (12.5 KB)
- ✅ `backend/app/schemas/web_automation.py` (10.2 KB)
- ✅ `backend/app/services/web_automation_service.py` (23.8 KB)
- ✅ `backend/app/api/v1/web_automation.py` (20.4 KB)
- ✅ `backend/migrations/versions/add_web_automation_tables.py` (12.9 KB)
- ✅ `backend/app/services/gemini_service.py` (exists)
- ✅ `backend/requirements.txt` (updated with playwright, selenium)
- ✅ `backend/install_playwright.sh` (installer script)
- ✅ Integration in `__init__.py` files

### Frontend (6 files)
- ✅ `frontend/components/automation/TestFlowBuilder.tsx` (14.7 KB)
- ✅ `frontend/components/automation/LiveBrowserPreview.tsx` (6.6 KB)
- ✅ `frontend/components/automation/ExecutionResults.tsx` (9.3 KB)
- ✅ `frontend/app/.../web-automation/new/page.tsx`
- ✅ `frontend/app/.../web-automation/[id]/page.tsx`
- ✅ `frontend/app/.../web-automation/[id]/results/page.tsx`

### Documentation (5 files)
- ✅ `WEB_AUTOMATION_MODULE_IMPLEMENTATION.md`
- ✅ `WEB_AUTOMATION_QUICK_START.md`
- ✅ `WEB_AUTOMATION_TESTING_GUIDE.md`
- ✅ `WEB_AUTOMATION_COMPLETE_SUMMARY.md`
- ✅ `WEB_AUTOMATION_ARCHITECTURE.md`

---

## 🚀 Installation Steps

### Step 1: Verify Files
```bash
# Run verification script
cd backend
python3 test_web_automation_setup.py
```

Expected output: All tests should pass (syntax checks, file structure)

### Step 2: Install Backend Dependencies
```bash
cd backend

# Install Python packages
pip3 install -r requirements.txt

# This installs:
# - playwright==1.41.0
# - selenium==4.17.0
# - bull==4.12.0
# Plus all existing dependencies (FastAPI, SQLAlchemy, etc.)
```

### Step 3: Install Playwright Browsers
```bash
cd backend

# Option A: Use the provided script
chmod +x install_playwright.sh
./install_playwright.sh

# Option B: Manual installation
playwright install chromium firefox webkit

# This downloads browser binaries (~500MB total)
```

### Step 4: Configure Environment
```bash
cd backend

# Add Gemini API key to .env
echo "GEMINI_API_KEY=your_gemini_api_key_here" >> .env

# Optional: Configure other settings
echo "CORS_ORIGINS=['http://localhost:3000']" >> .env
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

### Step 5: Run Database Migration
```bash
cd backend

# Check current migration status
alembic current

# Run the migration to create web automation tables
alembic upgrade head

# Verify tables were created
psql -d cognitest -c "\dt" | grep -E "test_flows|execution_runs|step_results|healing_events|locator_alternatives"
```

Expected tables:
- `test_flows`
- `execution_runs`
- `step_results`
- `healing_events`
- `locator_alternatives`

### Step 6: Start Backend Server
```bash
cd backend

# Start with hot reload
uvicorn app.main:app --reload --port 8000

# Or use the startup script
./restart_backend.sh
```

Verify backend is running:
- API: http://localhost:8000
- Docs: http://localhost:8000/api/docs
- Check for web-automation endpoints in docs

### Step 7: Install Frontend Dependencies
```bash
cd frontend

# Install packages (if not already installed)
npm install

# React Flow should already be in package.json
# Verify: cat package.json | grep reactflow
```

### Step 8: Start Frontend Server
```bash
cd frontend

# Start development server
npm run dev
```

Frontend should be running at: http://localhost:3000

### Step 9: Test the Implementation
```bash
# Open browser to:
http://localhost:3000

# Navigate to:
Organizations → [Your Org] → Projects → [Your Project] → 
Automation Hub → Web Automation → New Test Flow

# You should see:
# - Test Flow Builder interface
# - Action library on the left
# - Flow canvas in the center
# - Properties panel on the right
```

---

## 🧪 Quick Smoke Test

### Create a Simple Test Flow

1. **Set Base URL**: `https://example.com`
2. **Add Actions**:
   - Drag "Navigate" → Configure URL
   - Drag "Assert" → Check page loaded
3. **Save Flow**: Name it "Example Test"
4. **Execute**: Click "Execute" button
5. **Verify**: See live preview and results

---

## 🔍 Verification Checklist

### Backend Verification
- [ ] Dependencies installed (`pip3 list | grep playwright`)
- [ ] Playwright browsers installed (`playwright --version`)
- [ ] Database migration complete (`alembic current`)
- [ ] Tables created (check PostgreSQL)
- [ ] Backend server running (http://localhost:8000/api/docs)
- [ ] Web automation endpoints visible in API docs

### Frontend Verification
- [ ] Dependencies installed (`npm list reactflow`)
- [ ] Frontend server running (http://localhost:3000)
- [ ] Can navigate to Web Automation page
- [ ] Test Flow Builder loads
- [ ] Can drag and drop actions
- [ ] Can save flows

### Integration Verification
- [ ] Can create test flow via UI
- [ ] Can execute test flow
- [ ] WebSocket connection works (live preview)
- [ ] Results display correctly
- [ ] Healing events are recorded (if applicable)

---

## 🐛 Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'playwright'`
```bash
Solution:
pip3 install playwright==1.41.0
playwright install
```

### Issue: `alembic.util.exc.CommandError: Can't locate revision identified by 'web_automation_v1'`
```bash
Solution:
# Check migration file name and revision ID match
cd backend/migrations/versions
ls -la add_web_automation_tables.py

# The file should have: revision = 'web_automation_v1'
# Run migration
alembic upgrade head
```

### Issue: `ImportError: cannot import name 'web_automation'`
```bash
Solution:
# Verify router is registered
cat backend/app/api/v1/__init__.py | grep web_automation

# Should see:
# from app.api.v1 import ... web_automation
# api_router.include_router(web_automation.router, ...)
```

### Issue: Frontend - "Module not found: reactflow"
```bash
Solution:
cd frontend
npm install reactflow@11.10.0
npm install zustand@4.5.0
```

### Issue: WebSocket connection fails
```bash
Solution:
# Check CORS settings in backend/.env
CORS_ORIGINS=["http://localhost:3000"]

# Restart backend server
```

### Issue: Gemini API errors
```bash
Solution:
# Verify API key
cat backend/.env | grep GEMINI_API_KEY

# Or disable healing temporarily
# In flow settings: healing_enabled = false
```

---

## 📊 Expected Performance

After installation, you should see:

- **Backend startup**: < 5 seconds
- **Frontend startup**: < 10 seconds
- **Page load**: < 2 seconds
- **Flow creation**: Instant
- **Test execution**: Depends on test complexity
  - Simple test (3 steps): 5-10 seconds
  - Complex test (10+ steps): 30-60 seconds

---

## 🎯 Next Steps After Installation

1. **Create sample test flows** for common scenarios
2. **Test self-healing** by intentionally breaking selectors
3. **Try multi-browser execution**
4. **Review healing analytics**
5. **Set up CI/CD integration**
6. **Train team members**

---

## 📞 Need Help?

If you encounter issues:

1. Run the verification script: `python3 backend/test_web_automation_setup.py`
2. Check logs: `tail -f backend/logs/app.log`
3. Review documentation: `WEB_AUTOMATION_QUICK_START.md`
4. Check API docs: http://localhost:8000/api/docs

---

## ✅ Installation Complete?

Once all steps are done, you should have:

✅ Backend running with web automation endpoints  
✅ Frontend displaying Test Flow Builder  
✅ Database tables created  
✅ Playwright browsers installed  
✅ Sample test flow created and executed  

**Congratulations! The Web Automation Module is ready to use! 🎉**

---

*Last updated: 2024-01-15*
