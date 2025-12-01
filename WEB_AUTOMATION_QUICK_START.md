# Web Automation Module - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- PostgreSQL database running
- Redis running (optional but recommended)
- Node.js 18+ and Python 3.9+
- Google Gemini API key (for AI self-healing)

---

## Step 1: Backend Setup

### 1.1 Install Dependencies
```bash
cd backend
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium firefox webkit
```

### 1.2 Configure Environment
Add to `backend/.env`:
```env
# Gemini API for AI Self-Healing
GEMINI_API_KEY=your_gemini_api_key_here

# Database (if not already set)
DATABASE_URL=postgresql://user:password@localhost:5432/cognitest

# Redis (optional)
REDIS_URL=redis://localhost:6379/0
```

### 1.3 Run Database Migration
```bash
# From backend directory
alembic upgrade head
```

This creates 5 new tables:
- `test_flows`
- `execution_runs`
- `step_results`
- `healing_events`
- `locator_alternatives`

### 1.4 Start Backend Server
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

✅ Backend should be running at http://localhost:8000

---

## Step 2: Frontend Setup

### 2.1 Install Dependencies
```bash
cd frontend
npm install
```

All required dependencies are already in `package.json`:
- `reactflow` - Flow builder
- `zustand` - State management
- `lucide-react` - Icons

### 2.2 Start Frontend
```bash
npm run dev
```

✅ Frontend should be running at http://localhost:3000

---

## Step 3: Create Your First Test Flow

### 3.1 Navigate to Web Automation
1. Login to CogniTest
2. Select your Organization
3. Open a Project
4. Go to **Automation Hub** → **Web Automation**
5. Click **"New Test Flow"**

### 3.2 Build a Simple Test
**Example: Login Test**

1. **Set Base URL**
   ```
   https://example.com
   ```

2. **Drag Actions to Canvas**:
   - 🌐 **Navigate** → Set URL: `/login`
   - ⌨️ **Type** → Selector: `#username`, Value: `testuser`
   - ⌨️ **Type** → Selector: `#password`, Value: `password123`
   - 👆 **Click** → Selector: `button[type="submit"]`
   - ✓ **Assert** → Selector: `.welcome-message`, Expected: `Welcome`

3. **Connect Actions**
   - Drag arrows between nodes to create flow

4. **Configure Settings**:
   - Name: "Login Test"
   - Browser: Chrome
   - Mode: Headed (to see it run)

5. **Save** the flow

### 3.3 Execute the Test
1. Click **"Execute"** button
2. Watch live browser preview
3. See real-time step updates
4. View results when complete

---

## Step 4: Test Self-Healing

### 4.1 Create Test with Healing
```javascript
// Add a Click action with alternatives
{
  actionType: "click",
  selector: {
    primary: "#submit-btn",  // This might change
    alternatives: [
      { strategy: "css", value: "button[data-testid='submit']" },
      { strategy: "text", value: "button:has-text('Submit')" },
      { strategy: "role", value: "button[name='Submit']" }
    ]
  }
}
```

### 4.2 Enable Healing
- In flow settings, ensure **"Healing Enabled"** is ON
- Set **"Confidence Threshold"** to 0.75

### 4.3 Watch Healing in Action
When the primary selector fails:
1. System tries alternatives
2. If all fail, AI suggests new selectors
3. Healing event is recorded
4. Test continues successfully

---

## Step 5: View Analytics

### 5.1 Execution Results
After running a test:
- View summary: passed/failed/healed steps
- See screenshots for each step
- Review error messages
- Check execution time

### 5.2 Healing Report
View healing events:
- Original vs. healed selectors
- Healing strategy used (alternative, AI, similarity)
- Confidence scores
- AI reasoning (if applicable)

### 5.3 Flow Analytics
- Total executions
- Success rate over time
- Browser statistics
- Average duration
- Healing success rate

---

## 📚 Common Actions Reference

### Navigation
```javascript
{
  actionType: "navigate",
  value: "https://example.com/page"
}
```

### Click
```javascript
{
  actionType: "click",
  selector: {
    primary: "button#submit",
    alternatives: [...]
  },
  options: { timeout: 5000, retryCount: 3 }
}
```

### Type Text
```javascript
{
  actionType: "type",
  selector: { primary: "input#username" },
  value: "myusername"
}
```

### Wait
```javascript
{
  actionType: "wait",
  waitType: "element",  // or "time"
  selector: { primary: ".loading" },
  duration: 2000  // if waitType is "time"
}
```

### Assert
```javascript
{
  actionType: "assert",
  assertion: {
    type: "text",  // or "visible", "url", "attribute"
    selector: ".success-message",
    expectedValue: "Success!"
  }
}
```

### Screenshot
```javascript
{
  actionType: "screenshot",
  path: "step-result.png"
}
```

---

## 🎯 Advanced Features

### Multi-Browser Execution
Execute the same test across multiple browsers:

```bash
POST /api/v1/web-automation/test-flows/{id}/execute/multi
{
  "browsers": ["chrome", "firefox", "safari", "edge"],
  "execution_mode": "headless",
  "parallel": true
}
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run Web Automation Tests
  run: |
    curl -X POST http://api.cognitest.ai/v1/web-automation/test-flows/{flow_id}/execute \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"execution_mode": "headless"}'
```

### WebSocket Live Updates
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/web-automation/ws/live-preview/{execution_id}')

ws.onmessage = (event) => {
  const update = JSON.parse(event.data)
  
  switch(update.type) {
    case 'stepStarted':
      console.log('Step started:', update.payload.step_name)
      break
    case 'stepCompleted':
      console.log('Step completed:', update.payload.step_id)
      break
    case 'screenUpdate':
      displayScreenshot(update.payload.screenshot)
      break
  }
}
```

---

## 🐛 Troubleshooting

### Issue: Playwright browsers not installed
```bash
# Solution
playwright install
```

### Issue: Gemini API errors
```bash
# Check your API key
echo $GEMINI_API_KEY

# Or disable healing temporarily in flow settings
healing_enabled: false
```

### Issue: WebSocket connection fails
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check CORS settings in backend/.env
CORS_ORIGINS=["http://localhost:3000"]
```

### Issue: Database migration fails
```bash
# Check current revision
alembic current

# Rollback and retry
alembic downgrade -1
alembic upgrade head
```

---

## 📊 Example Test Scenarios

### 1. E-Commerce Checkout Flow
```
Navigate → Search Product → Add to Cart → Checkout → 
Fill Shipping → Submit Order → Assert Confirmation
```

### 2. Form Validation Test
```
Navigate → Fill Invalid Email → Click Submit → 
Assert Error Message → Fill Valid Email → 
Click Submit → Assert Success
```

### 3. Multi-Step Wizard
```
Navigate → Step 1: Personal Info → Next →
Step 2: Address → Next → Step 3: Payment → 
Submit → Assert Completion
```

---

## 🔍 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/web-automation/test-flows` | Create flow |
| GET | `/web-automation/test-flows/{id}` | Get flow |
| PUT | `/web-automation/test-flows/{id}` | Update flow |
| DELETE | `/web-automation/test-flows/{id}` | Delete flow |
| POST | `/web-automation/test-flows/{id}/execute` | Execute |
| GET | `/web-automation/executions/{id}` | Get results |
| GET | `/web-automation/executions/{id}/healings` | Healing report |
| WS | `/web-automation/ws/live-preview/{id}` | Live updates |

---

## 📈 Best Practices

### 1. Selector Strategy
✅ Use data-testid attributes when possible
✅ Provide 2-3 alternative selectors
✅ Avoid brittle selectors (nth-child, complex XPath)
✅ Use semantic selectors (role, aria-label)

### 2. Test Organization
✅ Group related tests by feature
✅ Use descriptive flow names
✅ Add tags for filtering
✅ Maintain clear step names

### 3. Healing Configuration
✅ Enable healing for dynamic UIs
✅ Set appropriate confidence thresholds
✅ Review healing events regularly
✅ Update alternatives based on learnings

### 4. Execution
✅ Use headless mode for CI/CD
✅ Use headed mode for debugging
✅ Run cross-browser tests before releases
✅ Monitor execution trends

---

## 🎓 Next Steps

1. **Explore Advanced Actions**
   - File uploads
   - Drag and drop
   - API mocking
   - Network interception

2. **Integrate with Test Management**
   - Link flows to test cases
   - Track automation coverage
   - Generate reports

3. **Set Up CI/CD**
   - GitHub Actions
   - Jenkins pipelines
   - Scheduled executions

4. **Scale Your Testing**
   - Parallel execution
   - Cloud browsers
   - Performance optimization

---

## 💡 Tips & Tricks

- **Tip 1**: Use screenshots liberally for debugging
- **Tip 2**: Add wait steps before assertions
- **Tip 3**: Keep flows focused (single feature per flow)
- **Tip 4**: Review healing events to improve selectors
- **Tip 5**: Use tags to organize and filter flows

---

## 📞 Support

- Documentation: `/docs`
- API Reference: `http://localhost:8000/api/docs`
- Issues: GitHub Issues
- Community: Discord/Slack

---

**Happy Testing! 🎉**

*"Test. Self Evolve. Self Heal."* - CogniTest AI
