# Cognitest - AI-Powered Testing Platform

<div align="center">

**Test. Automate. Accelerate.**

A dynamic, self-evolving testing ecosystem powered by AI.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-alpha-orange.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()

**🚀 [START HERE - Launch Localhost](START_HERE.md)** | [Features](#-features) • [Documentation](#-documentation) • [Architecture](#-architecture) • [Roadmap](#-roadmap)

</div>

---

## 🎯 What is Cognitest?

Cognitest is an **AI-first testing platform** that learns from your projects to accelerate QA workflows. It combines intelligent agents, automation tools, and integrations into a unified ecosystem.

### Why Cognitest?

- ✨ **AI-Powered**: Automatically generate test plans, suites, and cases from requirements
- 🚀 **10x Faster**: Automate repetitive testing tasks with visual builders
- 🧠 **Self-Learning**: Improves suggestions based on your feedback and usage patterns
- 🔗 **Integrated**: Connects with JIRA, Notion, Slack, GitHub, and more
- 📊 **Insightful**: Real-time analytics and performance metrics
- 🎨 **Beautiful UI**: Modern, intuitive interface with teal theme

---

## 🌟 Features

### 📝 Test Management
- **AI Test Plan Generator**: Generate comprehensive test plans from BRDs, JIRA tickets, and documentation
- **Smart Test Suites**: Automatically organize tests into logical groupings
- **Test Case AI**: Auto-generate detailed test cases with steps and assertions
- **Issue Tracker**: AI-powered bug detection with remediation suggestions

### 🔌 API Testing Hub
- **Postman-like Interface**: Visual API request builder and tester
- **OpenAPI Import**: Auto-generate tests from Swagger/OpenAPI specs
- **Response Validation**: Intelligent schema validation and assertions
- **Security Analysis**: Automated security header and vulnerability checks
- **Dependency Graph**: Visualize API relationships

### 🔒 Security Testing
- **OWASP Top 10 Scanner**: Automated vulnerability detection
- **Dependency Checker**: Identify vulnerable packages
- **AI Remediation**: Get fix suggestions for security issues
- **Compliance Reports**: Generate security audit reports

### ⚡ Performance Testing
- **Load Test Generator**: AI-powered load test creation
- **Bottleneck Detection**: Identify performance issues automatically
- **Predictive Analysis**: Forecast failures before they happen
- **Scaling Recommendations**: AI-suggested infrastructure improvements

### 🤖 Automation Hub
- **Visual Test Recorder**: Drag-and-drop UI for creating Playwright tests
- **Code Generation**: Export to Python, JavaScript, or TypeScript
- **Workflow Builder**: n8n-style visual automation designer
- **Live Execution**: Run tests in headed or headless mode

### 📱 Mobile Testing
- **Appium Integration**: Test iOS and Android apps
- **Device Farm**: Cross-device testing support
- **AI Visual Testing**: Intelligent element detection
- **Screenshot Comparison**: Automated visual regression testing

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 15+

### Setup Instructions

#### 1. Install PostgreSQL

**macOS:**
```bash
# Install with Homebrew
brew install postgresql@15

# Start service
brew services start postgresql@15

# Create database
createdb cognitest
```

**Ubuntu/Debian:**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb cognitest
```

**Windows:**
- Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
- Create database using pgAdmin or psql

#### 2. Setup Project

```bash
# Install root dependencies
npm install

# Backend setup
cd backend
cp .env.example .env
# Edit .env with your OpenAI API key

# Frontend setup
cd ../frontend
cp .env.example .env.local
# Edit .env.local with your Clerk keys

# Install all dependencies
cd ..
npm run install:all

# Run migrations
npm run migrate
```

#### 3. Run Database Migrations

```bash
# Run migrations to create tables
npm run migrate
```

#### 4. Start Development Server (One Command!)

```bash
npm start
```

That's it! This single command starts:
- ✅ PostgreSQL database
- ✅ Qdrant vector database
- ✅ Backend server (FastAPI)
- ✅ Frontend server (Next.js)

#### 5. Create Your Account

- Visit http://localhost:3000/cognitest.ai
- Click "Get Started" or "Sign In"
- Create your account (email, username, password)
- Start testing!

**Landing Page**: http://localhost:3000/cognitest.ai
**Signup**: http://localhost:3000/auth/signup
**Sign In**: http://localhost:3000/auth/signin

---

## 📖 Documentation

- [JWT Authentication Setup](JWT_AUTH_SETUP.md) - Complete authentication guide
- [Development Guide](DEVELOPMENT.md) - Quick start and best practices
- [NPM Scripts Reference](NPM_SCRIPTS.md) - All available npm commands
- [Architecture Overview](ARCHITECTURE.md)
- [Implementation Roadmap](IMPLEMENTATION_ROADMAP.md)
- [System Design](docs/architecture/SYSTEM_DESIGN.md)
- [API Documentation](http://localhost:8000/api/docs) (when running)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│              Next.js 14 + TypeScript + Tailwind                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST/GraphQL/WebSocket
┌────────────────────────┴────────────────────────────────────────┐
│                      API Gateway Layer                          │
│                    (FastAPI + WebSocket)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────────┐
│   AI Agent   │ │  Backend    │ │   Automation    │
│ Orchestrator │ │  Services   │ │   Engine        │
└──────┬───────┘ └──────┬──────┘ └──────┬──────────┘
       │                │                │
┌──────▼────────────────▼────────────────▼──────┐
│     PostgreSQL | MinIO | Qdrant              │
└───────────────────────────────────────────────┘
```

### Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- React Query
- Zustand

**Backend**
- FastAPI (Python 3.11+)
- SQLAlchemy + Alembic
- Celery (PostgreSQL broker)
- PostgreSQL
- Qdrant (Vector DB)

**AI Layer**
- LangChain
- OpenAI GPT-4 / Google Gemini
- OpenAI Embeddings
- Vector similarity search

**Automation**
- Playwright (Web)
- Appium (Mobile)
- Custom workflow engine

---

## 📊 Project Structure

```
cognitest/
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities
│   └── styles/              # Global styles
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── agents/         # AI agents
│   │   ├── automation/     # Automation module
│   │   │   ├── playwright/ # Web automation
│   │   │   ├── appium/     # Mobile automation
│   │   │   └── workflows/  # Workflow engine
│   │   ├── core/           # Core utilities
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   └── tests/
│
├── database/               # Database migrations
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

---

## 🗺️ Roadmap

### ✅ Phase 1: Foundation (Completed)
- [x] Project architecture
- [x] Database schema
- [x] Authentication system
- [x] Basic UI components

### 🚧 Phase 2: Test Management (In Progress)
- [ ] AI Test Plan Generator
- [ ] Test Suite Management
- [ ] Test Case CRUD
- [ ] Issue Tracker

### 📋 Phase 3: API Testing (Planned)
- [ ] API Collection Management
- [ ] Request Builder
- [ ] OpenAPI Integration
- [ ] Response Validation

### 📋 Phase 4: Security & Performance (Planned)
- [ ] Security Scanner
- [ ] Performance Testing
- [ ] Load Test Generator
- [ ] Analytics Dashboard

### 📋 Phase 5: Automation Hub (Planned)
- [ ] Visual Test Recorder
- [ ] Workflow Builder
- [ ] Mobile Testing
- [ ] CI/CD Integration

See [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) for detailed timeline.

---

## 🤝 Contributing

We welcome contributions! Please follow standard GitHub flow:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [FastAPI](https://fastapi.tiangolo.com/)
- AI by [LangChain](https://python.langchain.com/) & [OpenAI](https://openai.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

---

<div align="center">

**Built with ❤️ for the QA community**

</div>
