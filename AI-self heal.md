# 🔧 AI Self-Heal Analysis for Cognitest

## What is AI Self-Heal?

AI Self-Heal is an intelligent mechanism that automatically detects, diagnoses, and fixes test/script failures without manual intervention. It uses AI to:

- Identify broken selectors/locators
- Update outdated API payloads/headers
- Adapt to UI/DOM changes
- Re-map changed endpoints
- Fix flaky test assertions

---

## 📊 Modules Where AI Self-Heal Can Be Applied

### 1. Web Automation Module ⭐ (Highest Priority)

**Location:**
- `backend/app/services/web_automation_service.py`
- `frontend/app/organizations/[uuid]/projects/[projectId]/automation-hub/`

**Self-Heal Use Cases:**

| Problem | Self-Heal Solution |
|---------|-------------------|
| Broken CSS/XPath selectors | AI generates alternative selectors (ID, class, text, aria-label) |
| Element not found | Use visual AI to find similar elements on page |
| Element position changed | Re-map element using surrounding context |
| Dynamic element IDs | Switch to more stable attribute-based locators |
| Timing issues | Auto-adjust wait times based on load patterns |

---

### 2. API Testing Module ⭐ (High Priority)

**Location:**
- `backend/app/api/v1/api_testing.py`
- `frontend/app/organizations/[uuid]/projects/[projectId]/api-testing/`

**Self-Heal Use Cases:**

| Problem | Self-Heal Solution |
|---------|-------------------|
| Schema changes (new/renamed fields) | Auto-update request/response schemas |
| Endpoint URL changes | Detect moved endpoints via 301 redirects |
| Authentication token expiry | Auto-refresh tokens before requests |
| Rate limiting (429 errors) | Implement intelligent retry with backoff |
| Changed response structure | Adapt assertions to new structure |

---

### 3. Test Management Module

**Location:**
- `backend/app/services/test_plan_service.py`
- `backend/app/api/v1/test_plans.py`

**Self-Heal Use Cases:**

| Problem | Self-Heal Solution |
|---------|-------------------|
| Outdated test steps | Suggest updated steps based on app changes |
| Obsolete test data | Generate fresh test data matching current schema |
| Invalid expected results | Update expectations based on new behavior |
| Broken test dependencies | Reorder or skip dependent tests |

---

### 4. Collection Runner (within API Testing)

**Location:**
- `api-testing/page.tsx`

**Self-Heal Use Cases:**

| Problem | Self-Heal Solution |
|---------|-------------------|
| Environment variable changes | Auto-update variables from new environment |
| Collection execution failures | Retry failed requests with healing |
| Chained request breaks | Fix data extraction from previous responses |

---

### 5. Security Testing Module

**Location:**
- `backend/app/services/security_scanning_service.py`

**Self-Heal Use Cases:**

| Problem | Self-Heal Solution |
|---------|-------------------|
| Scanner configuration outdated | Auto-update scan rules |
| Target URL/endpoints changed | Adapt scan targets |
| False positive patterns | Learn and suppress recurring false positives |

---

### 6. Performance Testing Module

**Location:**
- `backend/app/services/performance_testing_service.py`

**Self-Heal Use Cases:**

| Problem | Self-Heal Solution |
|---------|-------------------|
| Load test script outdated | Update virtual user scenarios |
| Changed thresholds | Adjust based on historical metrics |
| Broken request chains | Fix sequential request dependencies |

---

### 7. Workflow/n8n-style Automation

**Location:**
- `backend/app/api/v1/workflow.py`

**Self-Heal Use Cases:**

| Problem | Self-Heal Solution |
|---------|-------------------|
| Node execution failures | Retry with modified parameters |
| Integration API changes | Update webhook/API configurations |
| Data format mismatches | Transform data to expected format |

---

## 🎯 Recommended Implementation Priority

| Priority | Module | Impact | Complexity |
|----------|--------|--------|------------|
| 🥇 1st | Web Automation | Very High | Medium |
| 🥈 2nd | API Testing / Collection Runner | High | Low-Medium |
| 🥉 3rd | Test Management | Medium | Low |
| 4th | Workflow Automation | Medium | Medium |
| 5th | Security Testing | Low-Medium | Low |
| 6th | Performance Testing | Low | Low |

---

## 💡 Core Self-Heal Architecture Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                    Test Execution Engine                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Test Fails
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Self-Heal Orchestrator                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Failure    │  │   Healing    │  │     Learning         │   │
│  │   Detector   │──│   Strategy   │──│     Engine           │   │
│  │              │  │   Selector   │  │  (Store healed data) │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌────────────┐      ┌────────────┐      ┌────────────┐
   │  Selector  │      │   API      │      │  Assertion │
   │   Healer   │      │   Healer   │      │   Healer   │
   └────────────┘      └────────────┘      └────────────┘
```