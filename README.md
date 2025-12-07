# Cognitest AI

<div align="center">

<img src="frontend/public/cognitest-logo.png" alt="Cognitest Logo" width="120" />

**AI-Powered Software Testing Platform**

*Test Smarter. Ship Faster.*

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.11-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql)](https://www.postgresql.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Automation-2EAD33?logo=playwright)](https://playwright.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 🎯 Overview

Cognitest AI is a comprehensive **AI-driven software testing platform** that combines intelligent test generation, automated web testing, and self-healing capabilities into a unified ecosystem.

### Key Highlights

| Feature | Description |
|---------|-------------|
| 🧠 **AI Test Generation** | Generate test plans, suites, and cases from requirements using GPT-4/Gemini |
| 🎭 **No-Code Automation** | Visual test builder with drag-and-drop action library |
| 🔧 **Self-Healing Tests** | AI-powered locator recovery when elements change |
| 📊 **Real-Time Execution** | Live browser view with WebSocket-powered step tracking |
| 👥 **Team Management** | Organizations, projects, RBAC, and environment variables |

---

## ✨ Features

### 📝 Test Management
- **AI Test Plan Generator** - Create comprehensive test plans from BRDs, JIRA tickets, or plain text
- **Test Suites & Cases** - Organize tests with hierarchical structure and human-readable IDs
- **Rich Text Editor** - Document test steps with TipTap-powered formatting

### 🤖 Web Automation Hub
- **Visual Test Builder** - Drag-and-drop 40+ actions (click, type, assert, loops, API calls)
- **Browser Recorder** - Record user interactions into test steps
- **AI Step Generator** - Describe tests in plain English, get executable steps
- **Live Browser Preview** - Watch tests execute with real-time step highlighting

### 🔒 Enterprise Features
- **RBAC** - Role-based access control with granular permissions
- **Multi-Tenancy** - Organizations with isolated projects
- **Environment Variables** - Manage configs per environment (dev, staging, prod)
- **Google SSO** - OAuth 2.0 authentication support

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **PostgreSQL** 15+
- **Redis** (optional, for caching)

### Installation

```bash
# Clone the repository
git clone https://github.com/AK1699/Cognitest-AI.git
cd Cognitest-AI

# Install dependencies
npm install
npm run install:all

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit both files with your API keys (Gemini/OpenAI)

# Run database migrations
npm run migrate

# Start development servers
npm start
```

### Access the Application

| Service | URL |
|---------|-----|
| 🖥️ Frontend | http://localhost:3000 |
| ⚡ Backend API | http://localhost:8000 |
| 📚 API Docs | http://localhost:8000/api/docs |

---

## 📁 Project Structure

```
Cognitest-AI/
├── frontend/                    # Next.js 16 application
│   ├── app/                    # App Router pages
│   ├── components/             # React components
│   │   ├── automation/         # Web automation module
│   │   │   └── test-builder/   # Modular test builder (refactored)
│   │   ├── test-management/    # Test plans, suites, cases
│   │   └── ui/                 # Shared UI components
│   └── lib/api/                # API client layer
│
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── api/v1/            # REST API endpoints
│   │   ├── models/            # SQLAlchemy models
│   │   ├── services/          # Business logic
│   │   │   └── web_automation_service.py
│   │   └── core/              # Config, auth, database
│   └── alembic/               # Database migrations
│
└── docs/                        # Documentation
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                     │
│          React 18 • TypeScript • Tailwind • shadcn/ui        │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API / WebSocket
┌─────────────────────────┴───────────────────────────────────┐
│                   Backend (FastAPI)                          │
│     Python 3.11 • SQLAlchemy • Pydantic • Alembic           │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │  Playwright  │
│   Database   │  │    Cache     │  │   Browsers   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 18, TypeScript, Tailwind CSS, shadcn/ui, React Query, Zustand |
| **Backend** | FastAPI, Python 3.11, SQLAlchemy, Pydantic, Alembic |
| **Database** | PostgreSQL 15+, Redis |
| **AI** | Google Gemini, OpenAI GPT-4, LangChain |
| **Automation** | Playwright (Chrome, Firefox, Safari) |

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](GETTING_STARTED.md) | Full setup walkthrough |
| [Development Guide](DEVELOPMENT.md) | Local development tips |
| [Architecture](ARCHITECTURE.md) | System design details |
| [Web Automation Guide](START_HERE_WEB_AUTOMATION.md) | Automation module usage |
| [RBAC Guide](RBAC_README.md) | Role-based access control |
| [API Reference](http://localhost:8000/api/docs) | Interactive API docs |

---

## 🧪 Running Tests

```bash
# Frontend type check
cd frontend && npm run type-check

# Backend tests
cd backend && pytest

# Or run all checks
npm run test
```

---

## 🤝 Contributing

Contributions are welcome! Please follow the standard GitHub flow:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for the QA community**

[⬆ Back to top](#cognitest-ai)

</div>
