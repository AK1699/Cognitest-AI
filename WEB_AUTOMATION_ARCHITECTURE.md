# Web Automation Module - System Architecture

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CogniTest Web Automation                         │
│                     "Test. Self Evolve. Self Heal."                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │  Test Flow       │  │  Live Browser    │  │  Execution       │     │
│  │  Builder         │  │  Preview         │  │  Results         │     │
│  │                  │  │                  │  │                  │     │
│  │  - Drag & Drop   │  │  - Live Screenshot│  │  - Step Results │     │
│  │  - 10+ Actions   │  │  - WebSocket     │  │  - Healing Events│     │
│  │  - Node Config   │  │  - Console Logs  │  │  - Analytics    │     │
│  │  - Save/Load     │  │  - Controls      │  │  - Screenshots  │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│         ↓                      ↑                       ↑                │
│         │                      │                       │                │
│         └──────────────────────┴───────────────────────┘                │
│                                 │                                        │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
                                  │ HTTPS/REST + WebSocket
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                            API LAYER (FastAPI)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Web Automation Router                        │   │
│  │  /web-automation/*                                               │   │
│  │                                                                  │   │
│  │  • POST   /test-flows                - Create flow              │   │
│  │  • GET    /test-flows/{id}           - Get flow                 │   │
│  │  • PUT    /test-flows/{id}           - Update flow              │   │
│  │  • POST   /test-flows/{id}/execute   - Execute single           │   │
│  │  • POST   /execute/multi             - Execute multi-browser    │   │
│  │  • GET    /executions/{id}           - Get results              │   │
│  │  • GET    /executions/{id}/healings  - Healing report           │   │
│  │  • WS     /ws/live-preview/{id}      - Live updates             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                 │                                        │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │           WebAutomationExecutor (Main Engine)                 │      │
│  │                                                               │      │
│  │  execute_test_flow(flow_id, browser, mode)                   │      │
│  │    ↓                                                          │      │
│  │    1. Load test flow from DB                                 │      │
│  │    2. Setup browser (Playwright)                             │      │
│  │    3. For each step:                                         │      │
│  │       - Resolve locator (with healing)                       │      │
│  │       - Execute action                                       │      │
│  │       - Capture screenshot                                   │      │
│  │       - Emit live update (WebSocket)                         │      │
│  │       - Record step result                                   │      │
│  │    4. Generate execution report                              │      │
│  │    5. Save to database                                       │      │
│  │    6. Cleanup browser resources                              │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                 │                                        │
│  ┌──────────────────┬───────────┴───────────┬──────────────────┐       │
│  │                  │                       │                  │       │
│  ↓                  ↓                       ↓                  ↓       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Self-Healing │  │ Self-Healing │  │   Browser    │  │ WebSocket │ │
│  │   Locator    │  │  Assertion   │  │  Controller  │  │  Manager  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘ │
│         │                  │                  │                        │
└─────────┼──────────────────┼──────────────────┼────────────────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      INTELLIGENCE LAYER (AI)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │              Self-Healing Locator Strategy                    │      │
│  │                                                               │      │
│  │  1. Try Primary Selector                                     │      │
│  │     ↓ (fails)                                                │      │
│  │  2. Try Alternative Selectors                                │      │
│  │     ↓ (fails)                                                │      │
│  │  3. AI-Powered Healing (Gemini API)                          │      │
│  │     • Analyze DOM structure                                  │      │
│  │     • Generate selector suggestions                          │      │
│  │     • Confidence scoring                                     │      │
│  │     ↓ (fails)                                                │      │
│  │  4. Similarity-Based Matching                                │      │
│  │     • Element type matching                                  │      │
│  │     • Position/context analysis                              │      │
│  │     ↓                                                         │      │
│  │  5. Record Healing Event                                     │      │
│  │     • Store successful selector                              │      │
│  │     • Update alternatives                                    │      │
│  │     • Log confidence & reasoning                             │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │            Self-Healing Assertion Strategy                    │      │
│  │                                                               │      │
│  │  1. Try Standard Assertion                                   │      │
│  │     ↓ (fails)                                                │      │
│  │  2. Get Actual Value                                         │      │
│  │     ↓                                                         │      │
│  │  3. AI Analysis (Gemini API)                                 │      │
│  │     • Semantic equivalence check                             │      │
│  │     • Determine if change is legitimate                      │      │
│  │     • Suggest updated expectation                            │      │
│  │     ↓                                                         │      │
│  │  4. Update Assertion or Report Failure                       │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                 │                                        │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXECUTION LAYER (Playwright)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Chrome   │  │ Firefox  │  │  Safari  │  │   Edge   │              │
│  │(Chromium)│  │          │  │ (WebKit) │  │(Chromium)│              │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
│       │              │              │              │                    │
│       └──────────────┴──────────────┴──────────────┘                    │
│                          │                                               │
│  ┌───────────────────────┴────────────────────────────────────┐        │
│  │          Browser Context Management                         │        │
│  │                                                             │        │
│  │  • Launch browsers (headed/headless)                       │        │
│  │  • Create isolated contexts                                │        │
│  │  • Manage pages & frames                                   │        │
│  │  • Handle downloads & uploads                              │        │
│  │  • Network interception                                    │        │
│  │  • Screenshot & video capture                              │        │
│  │  • Console & error logging                                 │        │
│  └────────────────────────────────────────────────────────────┘        │
│                                 │                                        │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     STORAGE & ANALYTICS LAYER                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    PostgreSQL Database                        │      │
│  │                                                               │      │
│  │  ┌─────────────────┐  ┌─────────────────┐                   │      │
│  │  │   test_flows    │  │ execution_runs  │                   │      │
│  │  │  - Flow config  │  │  - Browser type │                   │      │
│  │  │  - Nodes/edges  │  │  - Status       │                   │      │
│  │  │  - Settings     │  │  - Metrics      │                   │      │
│  │  └─────────────────┘  └─────────────────┘                   │      │
│  │           │                    │                              │      │
│  │           └────────┬───────────┘                              │      │
│  │                    │                                          │      │
│  │  ┌─────────────────┴─────────┬──────────────────────┐        │      │
│  │  │                           │                      │        │      │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │      │
│  │  │step_results  │  │healing_events│  │locator_alternatives│  │      │
│  │  │- Step status │  │- Heal type   │  │- Primary selector │  │      │
│  │  │- Screenshots │  │- Strategy    │  │- Alternatives    │  │      │
│  │  │- Duration    │  │- Confidence  │  │- Success rates   │  │      │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                      Redis Cache (Optional)                   │      │
│  │  - Session management                                         │      │
│  │  - WebSocket connections                                      │      │
│  │  - Execution queue                                            │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────┐
│   User      │
│   Creates   │
│   Flow      │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│  Test Flow Builder (React + React Flow)     │
│  - Drag & drop actions                      │
│  - Configure selectors                      │
│  - Set browser/mode                         │
└──────┬──────────────────────────────────────┘
       │
       │ POST /web-automation/test-flows
       ↓
┌─────────────────────────────────────────────┐
│  API Layer (FastAPI)                        │
│  - Validate flow data                       │
│  - Store in database                        │
└──────┬──────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│  PostgreSQL Database                        │
│  - test_flows table                         │
└──────┬──────────────────────────────────────┘
       │
       │ User clicks "Execute"
       ↓
┌─────────────────────────────────────────────┐
│  POST /test-flows/{id}/execute              │
│  - Load flow from DB                        │
│  - Create execution_run record              │
└──────┬──────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│  WebAutomationExecutor Service              │
│  - Setup browser                            │
│  - Start WebSocket connection               │
└──────┬──────────────────────────────────────┘
       │
       │ For each step
       ↓
┌─────────────────────────────────────────────┐
│  Step Execution                             │
│  1. Resolve locator                         │
│  2. Execute action                          │
│  3. Capture screenshot                      │
│  4. Record result                           │
└──────┬──────────────────────────────────────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ↓                                     ↓
┌─────────────────────┐          ┌──────────────────────┐
│  Self-Healing       │          │  WebSocket Broadcast │
│  (if needed)        │          │  - Screenshot        │
│  - Try alternatives │          │  - Step status       │
│  - AI suggestion    │          │  - Console logs      │
│  - Record healing   │          └──────────┬───────────┘
└──────┬──────────────┘                     │
       │                                     │
       │                                     ↓
       │                          ┌──────────────────────┐
       │                          │  Frontend Update     │
       │                          │  - Live preview      │
       │                          │  - Progress display  │
       │                          └──────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│  Save Results to Database                   │
│  - step_results                             │
│  - healing_events                           │
│  - Update execution_run                     │
└──────┬──────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│  Execution Complete                         │
│  - Send final WebSocket message             │
│  - Close browser                            │
│  - Return execution summary                 │
└──────┬──────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│  Frontend Displays Results                  │
│  - Summary metrics                          │
│  - Step-by-step results                     │
│  - Healing events                           │
│  - Screenshots                              │
└─────────────────────────────────────────────┘
```

## Component Interaction Matrix

| Component | Interacts With | Purpose |
|-----------|---------------|---------|
| TestFlowBuilder | API + WebSocket | Create/edit flows, execute, live updates |
| LiveBrowserPreview | WebSocket | Real-time execution monitoring |
| ExecutionResults | API | Display execution history & analytics |
| API Router | Services + DB | Route requests, validate, respond |
| WebAutomationExecutor | Playwright + DB + WS | Orchestrate test execution |
| SelfHealingLocator | Playwright + Gemini | Find elements with healing |
| SelfHealingAssertion | Playwright + Gemini | Validate with healing |
| Playwright | Browsers | Control browser automation |
| PostgreSQL | All Backend | Persist all data |
| WebSocket Manager | Frontend + Executor | Real-time updates |
| Gemini Service | Google AI | AI-powered healing suggestions |

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Technology Stack                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend:                                               │
│    • React 18 + Next.js 16                              │
│    • TypeScript                                          │
│    • React Flow (drag-drop)                             │
│    • Zustand (state management)                         │
│    • TailwindCSS                                         │
│    • Lucide Icons                                        │
│                                                          │
│  Backend:                                                │
│    • Python 3.9+                                         │
│    • FastAPI                                             │
│    • SQLAlchemy (ORM)                                    │
│    • Alembic (migrations)                                │
│    • Pydantic (validation)                               │
│    • WebSockets                                          │
│                                                          │
│  Browser Automation:                                     │
│    • Playwright 1.41.0                                   │
│    • Supports: Chrome, Firefox, Safari, Edge             │
│    • Headed & Headless modes                             │
│                                                          │
│  AI/ML:                                                  │
│    • Google Gemini Pro                                   │
│    • Custom healing algorithms                           │
│    • Confidence scoring                                  │
│                                                          │
│  Database:                                               │
│    • PostgreSQL 14+                                      │
│    • Redis (optional cache)                              │
│                                                          │
│  Infrastructure:                                         │
│    • Docker (optional)                                   │
│    • GitHub Actions (CI/CD)                              │
│    • Nginx (reverse proxy)                               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────┐
│         Security & Authentication            │
├─────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────┐    │
│  │  User Authentication               │    │
│  │  • JWT tokens                      │    │
│  │  • OAuth2 (Google, Apple, MS)      │    │
│  │  • Session management              │    │
│  └────────────────────────────────────┘    │
│                   ↓                          │
│  ┌────────────────────────────────────┐    │
│  │  Authorization (RBAC)              │    │
│  │  • Organization isolation          │    │
│  │  • Project-based access            │    │
│  │  • Module permissions              │    │
│  │  • automation_hub permissions      │    │
│  └────────────────────────────────────┘    │
│                   ↓                          │
│  ┌────────────────────────────────────┐    │
│  │  API Security                      │    │
│  │  • CORS configuration              │    │
│  │  • Rate limiting                   │    │
│  │  • Input validation (Pydantic)     │    │
│  │  • SQL injection prevention        │    │
│  └────────────────────────────────────┘    │
│                   ↓                          │
│  ┌────────────────────────────────────┐    │
│  │  Data Security                     │    │
│  │  • Encrypted connections (HTTPS)   │    │
│  │  • Secure WebSocket (WSS)          │    │
│  │  • Environment variables           │    │
│  │  • API key protection              │    │
│  └────────────────────────────────────┘    │
│                                              │
└─────────────────────────────────────────────┘
```

## Scalability Architecture

```
┌────────────────────────────────────────────────────┐
│              Scalability Patterns                   │
├────────────────────────────────────────────────────┤
│                                                     │
│  Load Balancer (Nginx)                             │
│         │                                           │
│         ├──────┬──────┬──────┬──────┐             │
│         ↓      ↓      ↓      ↓      ↓             │
│    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│    │API-1│ │API-2│ │API-3│ │API-4│ │API-N│       │
│    └─────┘ └─────┘ └─────┘ └─────┘ └─────┘       │
│        │       │       │       │       │           │
│        └───────┴───────┴───────┴───────┘           │
│                    │                                │
│         ┌──────────┴──────────┐                    │
│         ↓                     ↓                    │
│    ┌─────────┐         ┌──────────┐               │
│    │PostgreSQL│         │  Redis   │               │
│    │ Primary  │←──────→│  Cache   │               │
│    └─────────┘         └──────────┘               │
│         │                                           │
│         ↓                                           │
│    ┌─────────┐                                     │
│    │PostgreSQL│                                     │
│    │ Replicas │                                     │
│    └─────────┘                                     │
│                                                     │
│  Execution Workers Pool:                           │
│    • Queue-based job distribution                  │
│    • Worker auto-scaling                           │
│    • Browser instance pooling                      │
│    • Resource cleanup                              │
│                                                     │
└────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌────────────────────────────────────────────────────┐
│            Production Deployment                    │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────┐     │
│  │          Frontend (Next.js)               │     │
│  │  • Vercel / AWS CloudFront / Nginx        │     │
│  │  • Static assets CDN                      │     │
│  │  • Environment configs                    │     │
│  └──────────────────────────────────────────┘     │
│                     │                              │
│                     │ HTTPS                        │
│                     ↓                              │
│  ┌──────────────────────────────────────────┐     │
│  │       Backend API (FastAPI)              │     │
│  │  • Docker containers                      │     │
│  │  • Kubernetes / Docker Swarm              │     │
│  │  • Auto-scaling                           │     │
│  │  • Health checks                          │     │
│  └──────────────────────────────────────────┘     │
│                     │                              │
│         ┌───────────┴───────────┐                 │
│         ↓                       ↓                 │
│  ┌────────────┐          ┌────────────┐          │
│  │ PostgreSQL │          │   Redis    │          │
│  │  • RDS     │          │ • ElastiCache│         │
│  │  • Backups │          │ • Session   │         │
│  └────────────┘          └────────────┘          │
│                                                     │
│  ┌──────────────────────────────────────────┐     │
│  │      Browser Execution Nodes             │     │
│  │  • Dedicated worker instances             │     │
│  │  • Playwright browsers installed          │     │
│  │  • Video/screenshot storage (S3)          │     │
│  └──────────────────────────────────────────┘     │
│                                                     │
│  ┌──────────────────────────────────────────┐     │
│  │          Monitoring & Logging            │     │
│  │  • Prometheus / Grafana                   │     │
│  │  • ELK Stack / CloudWatch                 │     │
│  │  • Error tracking (Sentry)                │     │
│  └──────────────────────────────────────────┘     │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

**Architecture designed for:**
- High scalability (horizontal scaling)
- High availability (99.9% uptime)
- Performance (sub-second response times)
- Security (enterprise-grade)
- Maintainability (clean separation of concerns)
