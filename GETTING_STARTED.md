# Getting Started with Cognitest

Welcome to Cognitest! This guide will help you get the platform up and running in minutes.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://www.python.org/downloads/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Redis** 7+ ([Download](https://redis.io/download/))
- **Git** ([Download](https://git-scm.com/downloads))

---

## 🚀 Quick Start

### Step 1: Clone the Repository

```bash
git clone https://github.com/AK1699/Cognitest-AI.git
cd cognitest
```

### Step 2: Set Up Environment Variables

#### Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

**Get your OpenAI API key**: Sign up at [platform.openai.com](https://platform.openai.com/)

#### Frontend Environment

```bash
cd ../frontend
cp .env.example .env.local
```

Edit `frontend/.env.local` and add your Clerk keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
CLERK_SECRET_KEY=sk_test_your-key-here
```

**Get Clerk keys**: Sign up at [clerk.com](https://clerk.com/) and create a new application

### Step 3: Install and Start Database Services

**macOS:**
```bash
# Install PostgreSQL and Redis with Homebrew
brew install postgresql@15 redis

# Start services
brew services start postgresql@15
brew services start redis

# Create database
createdb cognitest
```

**Ubuntu/Debian:**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib redis-server

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server

# Create database
sudo -u postgres createdb cognitest
```

**Windows:**
- Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
- Install Redis from [redis.io](https://redis.io/download/)
- Create database using pgAdmin or psql

**Qdrant (Vector DB):**

Download and run Qdrant locally:
```bash
# Download Qdrant binary (macOS/Linux)
curl -sSL https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-unknown-linux-musl.tar.gz | tar -xz

# Run Qdrant
./qdrant

# Or install via package manager
# macOS:
brew install qdrant

# Ubuntu:
wget https://github.com/qdrant/qdrant/releases/latest/download/qdrant-amd64.deb
sudo dpkg -i qdrant-amd64.deb
sudo systemctl start qdrant
```

Qdrant will be available at: http://localhost:6333

### Step 4: Set Up Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

Backend will be available at: [http://localhost:8000](http://localhost:8000)

### Step 5: Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: [http://localhost:3000](http://localhost:3000)

---

## 🎯 Your First Project

### 1. Create an Account

Navigate to [http://localhost:3000](http://localhost:3000) and sign up using Clerk authentication.

### 2. Create Your First Project

1. Click **"Create New Project"**
2. Enter project details:
   - **Name**: My First Test Project
   - **Description**: Testing the Cognitest platform
3. Click **"Create"**

### 3. Generate a Test Plan with AI

1. Go to **Test Management** → **Test Plans**
2. Click **"Generate with AI"**
3. Enter your requirements:
   ```
   I need to test a login feature that allows users to:
   - Log in with email and password
   - See validation errors for invalid credentials
   - Be redirected to dashboard on successful login
   - Have the option to reset password
   ```
4. Click **"Generate Test Plan"**
5. Review and edit the AI-generated test plan

### 4. Create Test Cases

1. Select a test suite from your test plan
2. Click **"Generate Test Cases"**
3. Review the AI-generated test cases
4. Modify or add manual test cases as needed

### 5. Try API Testing

1. Go to **API Testing** → **Collections**
2. Click **"New Collection"**
3. Add an API request:
   - **Method**: GET
   - **URL**: https://jsonplaceholder.typicode.com/posts/1
4. Click **"Send"**
5. View the response and save as a test

### 6. Build an Automation Workflow

1. Go to **Automation** → **Workflows**
2. Click **"Create Workflow"**
3. Drag and drop nodes:
   - **Trigger**: Manual
   - **Action**: Run Test Suite
   - **Condition**: If test fails
   - **Action**: Send Slack notification
4. Configure each node
5. Click **"Execute Workflow"**

---

## 🎨 Understanding the Dashboard

### Navigation

```
Cognitest
├── Dashboard       # Overview and analytics
├── Projects        # Manage your projects
├── Test Management
│   ├── Test Plans
│   ├── Test Suites
│   ├── Test Cases
│   └── Issues
├── API Testing
│   ├── Collections
│   └── Environments
├── Security
│   ├── Scans
│   └── Vulnerabilities
├── Performance
│   ├── Load Tests
│   └── Reports
└── Automation
    ├── Web Tests (Playwright)
    ├── Workflows
    └── Mobile Tests (Appium)
```

### Key Features to Explore

#### 🤖 AI Agents
- **Test Plan Generator**: Creates comprehensive test strategies
- **Test Case Generator**: Generates detailed test scenarios
- **Issue Detector**: Identifies bugs automatically
- **Security Analyzer**: Finds vulnerabilities

#### 📊 Analytics
- Test coverage metrics
- AI confidence scores
- Execution trends
- Performance insights

#### 🔗 Integrations
- JIRA (Issue tracking)
- Slack (Notifications)
- GitHub (CI/CD)
- Notion (Documentation)

---

## 🔧 Configuration

### Customize AI Models

Edit `backend/.env`:

```env
# Use GPT-4 for better quality (higher cost)
OPENAI_MODEL=gpt-4-turbo-preview

# Or use GPT-3.5 for faster/cheaper (lower quality)
OPENAI_MODEL=gpt-3.5-turbo
```

### Configure Integrations

#### JIRA

```env
JIRA_URL=https://your-domain.atlassian.net
JIRA_USERNAME=your-email@example.com
JIRA_API_TOKEN=your-api-token
```

Get JIRA API token: [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

#### Slack

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Create Slack webhook: [api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks)

#### Notion

```env
NOTION_API_KEY=secret_your-integration-key
```

Create Notion integration: [www.notion.so/my-integrations](https://www.notion.so/my-integrations)

---

## 📚 Next Steps

### Learn More

- 📖 Read the [Architecture Documentation](ARCHITECTURE.md)
- 🗺️ Check the [Implementation Roadmap](IMPLEMENTATION_ROADMAP.md)
- 🏗️ Explore the [System Design](docs/architecture/SYSTEM_DESIGN.md)
- 🎥 Watch tutorial videos (Coming soon)

### Customize Your Setup

- Add custom AI agents
- Create reusable test templates
- Set up CI/CD pipelines
- Configure team access controls

### Join the Community

- Star the repo on GitHub ⭐
- Report bugs or request features
- Contribute code improvements
- Share your use cases

---

## 🆘 Troubleshooting

### Backend won't start

**Error**: `ModuleNotFoundError: No module named 'app'`

**Solution**:
```bash
cd backend
pip install -r requirements.txt
```

---

### Frontend build errors

**Error**: `Module not found: Can't resolve '@/components/ui/button'`

**Solution**:
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

---

### Database connection failed

**Error**: `could not connect to server: Connection refused`

**Solution**:
```bash
# Check if PostgreSQL is running
# macOS:
brew services list

# Ubuntu/Linux:
sudo systemctl status postgresql

# Restart PostgreSQL
# macOS:
brew services restart postgresql@15

# Ubuntu/Linux:
sudo systemctl restart postgresql
```

---

### OpenAI API errors

**Error**: `Invalid API key`

**Solution**:
- Verify your API key in `backend/.env`
- Check your OpenAI account has credits
- Ensure the key starts with `sk-`

---

## 🎓 Tutorials

### Tutorial 1: Generate Your First Test Plan

Coming soon...

### Tutorial 2: Build an API Test Collection

Coming soon...

### Tutorial 3: Create a Playwright Web Test

Coming soon...

### Tutorial 4: Set Up Automated Workflows

Coming soon...

---

## ✅ Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] Node.js 20+ installed
- [ ] Python 3.11+ installed
- [ ] PostgreSQL 15+ installed and running
- [ ] Redis 7+ installed and running
- [ ] Qdrant installed and running
- [ ] Repository cloned
- [ ] Backend `.env` configured
- [ ] Frontend `.env.local` configured
- [ ] OpenAI API key added
- [ ] Clerk keys added
- [ ] Database created (cognitest)
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Frontend accessible at localhost:3000
- [ ] Backend API accessible at localhost:8000
- [ ] Successfully created first project
- [ ] Generated first AI test plan

---

## 🚀 Ready to Go!

You're all set! Start exploring Cognitest and accelerate your testing workflows with AI.

**Need help?** Open an issue on [GitHub](https://github.com/AK1699/Cognitest-AI/issues)

Happy Testing! 🎉
