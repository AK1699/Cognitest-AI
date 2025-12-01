# Web Automation Module - Testing Guide

## Testing the Implementation

### Backend Tests

#### 1. Test Database Models
```python
# backend/tests/test_web_automation_models.py
import pytest
from app.models.web_automation import TestFlow, ExecutionRun, BrowserType, ExecutionMode
from app.core.database import SessionLocal

def test_create_test_flow():
    db = SessionLocal()
    
    flow = TestFlow(
        project_id="uuid-here",
        organisation_id="uuid-here",
        name="Test Login Flow",
        base_url="https://example.com",
        flow_json={"nodes": [], "edges": []},
        nodes=[],
        edges=[],
        default_browser=BrowserType.CHROME,
        default_mode=ExecutionMode.HEADED
    )
    
    db.add(flow)
    db.commit()
    db.refresh(flow)
    
    assert flow.id is not None
    assert flow.name == "Test Login Flow"
    assert flow.total_executions == 0
    
    db.close()
```

#### 2. Test API Endpoints
```python
# backend/tests/test_web_automation_api.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_test_flow(auth_headers):
    response = client.post(
        "/api/v1/web-automation/test-flows?project_id=uuid-here",
        json={
            "name": "Login Test",
            "base_url": "https://example.com",
            "nodes": [],
            "edges": [],
            "default_browser": "chrome",
            "default_mode": "headed"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Login Test"
    assert data["default_browser"] == "chrome"

def test_list_test_flows(auth_headers):
    response = client.get(
        "/api/v1/web-automation/projects/uuid-here/test-flows",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_execute_test_flow(auth_headers):
    # First create a flow
    flow_response = client.post(
        "/api/v1/web-automation/test-flows?project_id=uuid-here",
        json={...},
        headers=auth_headers
    )
    flow_id = flow_response.json()["id"]
    
    # Execute it
    response = client.post(
        f"/api/v1/web-automation/test-flows/{flow_id}/execute",
        json={
            "browser_type": "chrome",
            "execution_mode": "headless"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["browser_type"] == "chrome"
    assert data["status"] in ["pending", "running", "completed"]
```

#### 3. Test Self-Healing Locator
```python
# backend/tests/test_self_healing.py
import pytest
from app.services.web_automation_service import SelfHealingLocator
from app.services.gemini_service import GeminiService
from playwright.async_api import async_playwright

@pytest.mark.asyncio
async def test_primary_selector_success():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content('<button id="submit">Submit</button>')
        
        locator_healer = SelfHealingLocator(
            primary_selector="#submit",
            alternatives=[],
            ai_service=GeminiService()
        )
        
        element, healing_info = await locator_healer.find_element(
            page, "step1", "click"
        )
        
        assert element is not None
        assert healing_info is None  # No healing needed
        
        await browser.close()

@pytest.mark.asyncio
async def test_alternative_selector_fallback():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content('<button data-testid="submit">Submit</button>')
        
        locator_healer = SelfHealingLocator(
            primary_selector="#nonexistent",
            alternatives=[
                {"strategy": "css", "value": "button[data-testid='submit']"}
            ],
            ai_service=GeminiService()
        )
        
        element, healing_info = await locator_healer.find_element(
            page, "step1", "click"
        )
        
        assert element is not None
        assert healing_info is not None
        assert healing_info["strategy"] == "alternative"
        
        await browser.close()
```

#### 4. Test Execution Engine
```python
# backend/tests/test_execution_engine.py
import pytest
from app.services.web_automation_service import WebAutomationExecutor
from app.core.database import SessionLocal

@pytest.mark.asyncio
async def test_execute_simple_flow():
    db = SessionLocal()
    
    # Create a simple test flow
    flow = TestFlow(
        project_id="uuid",
        organisation_id="uuid",
        name="Simple Test",
        base_url="https://example.com",
        nodes=[
            {
                "id": "nav1",
                "data": {
                    "actionType": "navigate",
                    "value": "https://example.com"
                }
            },
            {
                "id": "assert1",
                "data": {
                    "actionType": "assert",
                    "assertion": {
                        "type": "url",
                        "expectedValue": "https://example.com"
                    }
                }
            }
        ],
        edges=[],
        default_browser=BrowserType.CHROMIUM,
        default_mode=ExecutionMode.HEADLESS
    )
    db.add(flow)
    db.commit()
    
    # Execute
    executor = WebAutomationExecutor(db)
    run = await executor.execute_test_flow(
        test_flow_id=flow.id,
        browser_type=BrowserType.CHROMIUM,
        execution_mode=ExecutionMode.HEADLESS
    )
    
    assert run.status == ExecutionRunStatus.COMPLETED
    assert run.passed_steps == 2
    assert run.failed_steps == 0
    
    db.close()
```

### Frontend Tests

#### 1. Component Tests
```typescript
// frontend/__tests__/TestFlowBuilder.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import TestFlowBuilder from '@/components/automation/TestFlowBuilder'

describe('TestFlowBuilder', () => {
  it('renders the flow builder', () => {
    render(<TestFlowBuilder projectId="test-project" />)
    expect(screen.getByText('Test Actions')).toBeInTheDocument()
  })
  
  it('adds action node on button click', () => {
    render(<TestFlowBuilder projectId="test-project" />)
    
    const clickButton = screen.getByText('Click')
    fireEvent.click(clickButton)
    
    // Check if node was added to canvas
    // Implementation depends on React Flow testing
  })
  
  it('saves flow data', async () => {
    const mockSave = jest.fn()
    render(
      <TestFlowBuilder 
        projectId="test-project" 
        onSave={mockSave}
      />
    )
    
    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)
    
    expect(mockSave).toHaveBeenCalled()
  })
})
```

#### 2. Live Preview Tests
```typescript
// frontend/__tests__/LiveBrowserPreview.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import LiveBrowserPreview from '@/components/automation/LiveBrowserPreview'

describe('LiveBrowserPreview', () => {
  it('shows connection status', () => {
    render(
      <LiveBrowserPreview 
        isRunning={false}
      />
    )
    expect(screen.getByText(/Offline/i)).toBeInTheDocument()
  })
  
  it('displays screenshot when available', () => {
    render(
      <LiveBrowserPreview 
        isRunning={true}
        executionRunId="test-run"
      />
    )
    
    // Mock WebSocket message with screenshot
    // Check if image is displayed
  })
})
```

### Integration Tests

#### End-to-End Flow Test
```python
# backend/tests/test_e2e_web_automation.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.mark.e2e
def test_complete_automation_workflow(auth_headers):
    client = TestClient(app)
    
    # 1. Create test flow
    flow_response = client.post(
        "/api/v1/web-automation/test-flows?project_id=test-project",
        json={
            "name": "E2E Test Flow",
            "base_url": "https://example.com",
            "nodes": [
                {
                    "id": "nav1",
                    "data": {
                        "actionType": "navigate",
                        "value": "https://example.com"
                    }
                }
            ],
            "edges": [],
            "default_browser": "chrome",
            "default_mode": "headless"
        },
        headers=auth_headers
    )
    assert flow_response.status_code == 201
    flow_id = flow_response.json()["id"]
    
    # 2. Execute flow
    exec_response = client.post(
        f"/api/v1/web-automation/test-flows/{flow_id}/execute",
        json={},
        headers=auth_headers
    )
    assert exec_response.status_code == 200
    run_id = exec_response.json()["id"]
    
    # 3. Get execution results
    results_response = client.get(
        f"/api/v1/web-automation/executions/{run_id}",
        headers=auth_headers
    )
    assert results_response.status_code == 200
    results = results_response.json()
    assert results["status"] in ["completed", "running"]
    
    # 4. Get healing report
    healing_response = client.get(
        f"/api/v1/web-automation/executions/{run_id}/healings",
        headers=auth_headers
    )
    assert healing_response.status_code == 200
    
    # 5. Get analytics
    analytics_response = client.get(
        f"/api/v1/web-automation/test-flows/{flow_id}/analytics",
        headers=auth_headers
    )
    assert analytics_response.status_code == 200
```

### Performance Tests

#### Load Testing
```python
# backend/tests/test_performance.py
import pytest
import asyncio
from app.services.web_automation_service import WebAutomationExecutor

@pytest.mark.performance
async def test_concurrent_executions():
    """Test multiple concurrent executions"""
    
    tasks = []
    for i in range(5):
        executor = WebAutomationExecutor(db)
        task = executor.execute_test_flow(
            test_flow_id=flow_id,
            browser_type=BrowserType.CHROMIUM,
            execution_mode=ExecutionMode.HEADLESS
        )
        tasks.append(task)
    
    results = await asyncio.gather(*tasks)
    
    assert len(results) == 5
    assert all(r.status == ExecutionRunStatus.COMPLETED for r in results)
```

### Manual Testing Checklist

#### ✅ Basic Functionality
- [ ] Create a new test flow
- [ ] Add navigation action
- [ ] Add click action
- [ ] Add type action
- [ ] Add assertion
- [ ] Connect actions with edges
- [ ] Save flow
- [ ] Load saved flow
- [ ] Execute flow in headed mode
- [ ] Execute flow in headless mode

#### ✅ Self-Healing
- [ ] Create flow with intentionally wrong selector
- [ ] Add alternative selectors
- [ ] Execute and verify healing occurs
- [ ] Check healing events in results
- [ ] Verify AI suggestions (if Gemini configured)

#### ✅ Live Preview
- [ ] Start execution
- [ ] Verify WebSocket connection
- [ ] See live screenshot updates
- [ ] See step progress
- [ ] See console logs
- [ ] Stop execution mid-run

#### ✅ Results & Analytics
- [ ] View execution summary
- [ ] Check step-by-step results
- [ ] View healing report
- [ ] Check flow analytics
- [ ] Download report (if implemented)

#### ✅ Multi-Browser
- [ ] Execute on Chrome
- [ ] Execute on Firefox
- [ ] Execute on Safari (Mac only)
- [ ] Execute parallel multi-browser
- [ ] Compare results across browsers

#### ✅ Error Handling
- [ ] Handle invalid selector
- [ ] Handle timeout
- [ ] Handle network errors
- [ ] Handle assertion failures
- [ ] Verify error messages are clear

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/test_web_automation_*.py -v

# With coverage
pytest tests/ --cov=app.services.web_automation_service --cov-report=html

# E2E tests only
pytest tests/ -m e2e

# Performance tests
pytest tests/ -m performance

# Frontend tests
cd frontend
npm test

# E2E with Playwright (if configured)
npx playwright test
```

### Test Coverage Goals

- **Models**: 90%+ coverage
- **API Endpoints**: 85%+ coverage
- **Services**: 90%+ coverage
- **Self-Healing Logic**: 95%+ coverage
- **Frontend Components**: 80%+ coverage

### Common Issues & Solutions

**Issue**: Browser not found
```bash
Solution: playwright install
```

**Issue**: WebSocket connection fails in tests
```bash
Solution: Use pytest-asyncio and mock WebSocket
```

**Issue**: Gemini API rate limits
```bash
Solution: Mock AI service in tests
```

**Issue**: Timeouts in CI/CD
```bash
Solution: Increase timeout values for CI environment
```

---

**Next Steps**: After testing, proceed to production deployment with confidence! 🚀
