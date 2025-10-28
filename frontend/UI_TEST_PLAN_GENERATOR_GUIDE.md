# Test Plan Generator - UI Implementation Guide

## Overview

This guide explains how to integrate the AI-powered Test Plan Generator into the Cognitest UI. The Test Plan Generator allows users to create comprehensive test plans from requirements documents, BRDs, user stories, and other sources.

---

## 📋 Table of Contents

1. [API Endpoints](#api-endpoints)
2. [User Flow](#user-flow)
3. [Implementation Steps](#implementation-steps)
4. [React Components](#react-components)
5. [API Integration](#api-integration)
6. [UI/UX Guidelines](#uiux-guidelines)
7. [Example Code](#example-code)

---

## API Endpoints

### 1. Create Test Plan (Manual)
```
POST /api/v1/test-plans/
```

**Request Body:**
```typescript
{
  project_id: string (UUID)
  name: string
  description?: string
  objectives: string[]
  tags?: string[]
  meta_data?: Record<string, any>
  generated_by: "manual" | "ai"
  source_documents?: string[]
  created_by: string (email)
}
```

### 2. AI Generate Test Plan
```
POST /api/v1/test-plans/ai-generate
```

**Request Body:**
```typescript
{
  project_id: string (UUID)
  source_documents: string[]  // URLs or document references
  additional_context?: string
  objectives?: string[]
}
```

**Response:**
```typescript
{
  test_plan: {
    id: string
    name: string
    description: string
    objectives: string[]
    // ... other fields
  }
  confidence_score: string
  suggestions: string[]
  warnings: string[]
}
```

### 3. List Test Plans
```
GET /api/v1/test-plans/?project_id={uuid}
```

### 4. Get Single Test Plan
```
GET /api/v1/test-plans/{test_plan_id}
```

### 5. Update Test Plan
```
PUT /api/v1/test-plans/{test_plan_id}
```

### 6. Delete Test Plan
```
DELETE /api/v1/test-plans/{test_plan_id}
```

---

## User Flow

### Option 1: Manual Test Plan Creation

```
1. User clicks "Create Test Plan" button
2. Modal/Form opens with manual input fields
3. User fills in:
   - Name
   - Description
   - Objectives (multi-input)
   - Tags
4. User clicks "Create"
5. Test plan is created and appears in the list
```

### Option 2: AI-Powered Test Plan Generation

```
1. User clicks "Generate with AI" button
2. Modal opens with AI generation options
3. User provides:
   - Requirements document URL/upload
   - Additional context (optional)
   - Specific objectives (optional)
4. User clicks "Generate"
5. AI processes the documents
6. Generated test plan preview shown with:
   - Confidence score
   - Suggestions
   - Warnings (if any)
7. User can:
   - Accept and save
   - Edit before saving
   - Regenerate with different parameters
8. Test plan is saved
```

---

## Implementation Steps

### Step 1: Update the Test Management Page

Replace the empty state button with two options:

```tsx
<div className="flex gap-3">
  <button
    onClick={() => setShowManualForm(true)}
    className="px-6 py-3 bg-white hover:bg-gray-50 text-primary border-2 border-primary rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
  >
    <Plus className="w-4 h-4 inline mr-2" />
    Create Manually
  </button>

  <button
    onClick={() => setShowAIGenerator(true)}
    className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
  >
    <Sparkles className="w-4 h-4 inline mr-2" />
    Generate with AI
  </button>
</div>
```

### Step 2: Create Component Files

Create these new components in `frontend/components/test-management/`:

1. `TestPlanList.tsx` - Display list of test plans
2. `TestPlanCard.tsx` - Individual test plan card
3. `CreateTestPlanModal.tsx` - Manual creation form
4. `AITestPlanGenerator.tsx` - AI generation interface
5. `TestPlanPreview.tsx` - Preview generated test plan

### Step 3: Add State Management

```tsx
const [testPlans, setTestPlans] = useState([])
const [showManualForm, setShowManualForm] = useState(false)
const [showAIGenerator, setShowAIGenerator] = useState(false)
const [isGenerating, setIsGenerating] = useState(false)
const [generatedPlan, setGeneratedPlan] = useState(null)
```

### Step 4: Implement API Calls

Create API service file: `frontend/lib/api/test-plans.ts`

---

## React Components

### 1. Manual Test Plan Creation Modal

**File:** `components/test-management/CreateTestPlanModal.tsx`

**Features:**
- Name input field
- Description textarea
- Objectives list (add/remove)
- Tags input
- Form validation
- Submit and cancel actions

**Key Fields:**
```tsx
interface FormData {
  name: string
  description: string
  objectives: string[]
  tags: string[]
}
```

### 2. AI Test Plan Generator

**File:** `components/test-management/AITestPlanGenerator.tsx`

**Features:**
- Document upload/URL input
- Multiple document support
- Additional context textarea
- Objectives input (optional)
- Progress indicator
- Loading states
- Error handling

**UI Sections:**
1. **Input Section**
   - Document selection
   - Context input
   - Objectives input

2. **Generation Section**
   - Loading animation
   - Progress messages
   - Status updates

3. **Preview Section**
   - Generated test plan details
   - Confidence score indicator
   - Suggestions list
   - Warnings list
   - Edit/Accept/Regenerate actions

### 3. Test Plan List

**File:** `components/test-management/TestPlanList.tsx`

**Features:**
- Grid/List view toggle
- Search and filter
- Sort options
- Test plan cards
- Empty state
- Loading skeleton

**Display Fields:**
- Name
- Description (truncated)
- Objectives count
- Generated by (Manual/AI badge)
- Confidence score (if AI-generated)
- Created date
- Created by
- Tags
- Actions (Edit, Delete, View)

---

## API Integration

### Create API Service

**File:** `frontend/lib/api/test-plans.ts`

```typescript
import axios from '@/lib/axios'

export interface TestPlan {
  id: string
  project_id: string
  name: string
  description?: string
  objectives: string[]
  tags: string[]
  generated_by: 'manual' | 'ai'
  source_documents: string[]
  confidence_score?: string
  created_at: string
  updated_at?: string
  created_by: string
}

export interface AIGenerateRequest {
  project_id: string
  source_documents: string[]
  additional_context?: string
  objectives?: string[]
}

export interface AIGenerateResponse {
  test_plan: TestPlan
  confidence_score: string
  suggestions: string[]
  warnings: string[]
}

export const testPlanAPI = {
  // List all test plans for a project
  list: async (projectId: string): Promise<TestPlan[]> => {
    const response = await axios.get(`/api/v1/test-plans/?project_id=${projectId}`)
    return response.data
  },

  // Get single test plan
  get: async (testPlanId: string): Promise<TestPlan> => {
    const response = await axios.get(`/api/v1/test-plans/${testPlanId}`)
    return response.data
  },

  // Create test plan manually
  create: async (data: Partial<TestPlan>): Promise<TestPlan> => {
    const response = await axios.post('/api/v1/test-plans/', data)
    return response.data
  },

  // Update test plan
  update: async (testPlanId: string, data: Partial<TestPlan>): Promise<TestPlan> => {
    const response = await axios.put(`/api/v1/test-plans/${testPlanId}`, data)
    return response.data
  },

  // Delete test plan
  delete: async (testPlanId: string): Promise<void> => {
    await axios.delete(`/api/v1/test-plans/${testPlanId}`)
  },

  // AI Generate test plan
  aiGenerate: async (request: AIGenerateRequest): Promise<AIGenerateResponse> => {
    const response = await axios.post('/api/v1/test-plans/ai-generate', request)
    return response.data
  },
}
```

---

## UI/UX Guidelines

### Design Principles

1. **Progressive Disclosure**
   - Show simple options first
   - Reveal advanced options on demand
   - Keep the UI clean and uncluttered

2. **Clear Feedback**
   - Show loading states during AI generation
   - Display progress messages
   - Provide success/error notifications
   - Show confidence scores clearly

3. **Flexible Workflow**
   - Allow switching between manual and AI modes
   - Enable editing AI-generated plans before saving
   - Support regeneration with different parameters

### Visual Elements

#### Badges

```tsx
// Generation Type Badge
{testPlan.generated_by === 'ai' ? (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
    <Sparkles className="w-3 h-3" />
    AI Generated
  </span>
) : (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
    <User className="w-3 h-3" />
    Manual
  </span>
)}
```

#### Confidence Score Indicator

```tsx
// Confidence Score
const getConfidenceColor = (score: string) => {
  const numScore = parseInt(score)
  if (numScore >= 80) return 'text-green-600 bg-green-100'
  if (numScore >= 60) return 'text-yellow-600 bg-yellow-100'
  return 'text-red-600 bg-red-100'
}

<div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(testPlan.confidence_score)}`}>
  <Target className="w-3 h-3" />
  {testPlan.confidence_score}% Confidence
</div>
```

#### Loading States

```tsx
// AI Generation Loading
{isGenerating && (
  <div className="flex flex-col items-center gap-4 py-8">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <Sparkles className="w-5 h-5 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    </div>
    <p className="text-gray-600 font-medium">Generating Test Plan...</p>
    <p className="text-sm text-gray-500">Analyzing your requirements</p>
  </div>
)}
```

### Empty States

```tsx
// No Test Plans
<div className="text-center py-16">
  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
  <h3 className="text-lg font-medium text-gray-900 mb-2">No test plans yet</h3>
  <p className="text-gray-500 mb-6">Get started by creating your first test plan</p>
  {/* Action buttons */}
</div>
```

---

## Example Code

### Complete Test Plans Page Component

**File:** `app/organizations/[uuid]/projects/[projectId]/test-management/page.tsx`

```typescript
'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Sparkles, FileText, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { testPlanAPI, TestPlan } from '@/lib/api/test-plans'
import TestPlanList from '@/components/test-management/TestPlanList'
import CreateTestPlanModal from '@/components/test-management/CreateTestPlanModal'
import AITestPlanGenerator from '@/components/test-management/AITestPlanGenerator'

interface PageParams {
  uuid: string
  projectId: string
}

export default function TestManagementPage({ params }: { params: Promise<PageParams> }) {
  const { user } = useAuth()
  const { uuid, projectId } = use(params)

  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showManualForm, setShowManualForm] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTestPlans()
  }, [projectId])

  const fetchTestPlans = async () => {
    try {
      setLoading(true)
      const data = await testPlanAPI.list(projectId)
      setTestPlans(data)
    } catch (error: any) {
      console.error('Failed to fetch test plans:', error)
      toast.error('Failed to load test plans')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateManual = async (formData: any) => {
    try {
      await testPlanAPI.create({
        ...formData,
        project_id: projectId,
        generated_by: 'manual',
        created_by: user?.email || '',
      })
      toast.success('Test plan created successfully')
      setShowManualForm(false)
      fetchTestPlans()
    } catch (error) {
      toast.error('Failed to create test plan')
    }
  }

  const handleAIGenerate = async (request: any) => {
    try {
      const response = await testPlanAPI.aiGenerate({
        ...request,
        project_id: projectId,
      })
      toast.success(`Test plan generated with ${response.confidence_score}% confidence`)
      setShowAIGenerator(false)
      fetchTestPlans()
      return response
    } catch (error: any) {
      if (error.response?.status === 501) {
        toast.error('AI generation is not yet available. Coming soon!')
      } else {
        toast.error('Failed to generate test plan')
      }
      throw error
    }
  }

  const filteredTestPlans = testPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar (same as before) */}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="px-8 py-5 flex items-center justify-between">
            <h1 className="text-2xl font-normal text-gray-900">Test Plans</h1>

            {testPlans.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowManualForm(true)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-primary border border-primary rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Manually
                </button>
                <button
                  onClick={() => setShowAIGenerator(true)}
                  className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : testPlans.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-24 h-24 text-gray-300 mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No Test Plans Yet
              </h2>
              <p className="text-gray-500 mb-8 text-center max-w-md">
                Create your first test plan manually or use AI to generate one from your requirements.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowManualForm(true)}
                  className="px-6 py-3 bg-white hover:bg-gray-50 text-primary border-2 border-primary rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Manually
                </button>
                <button
                  onClick={() => setShowAIGenerator(true)}
                  className="px-6 py-3 bg-primary hover:opacity-90 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Search and Filter */}
              <div className="mb-6 flex gap-3">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search test plans..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>

              {/* Test Plans List */}
              <TestPlanList
                testPlans={filteredTestPlans}
                onRefresh={fetchTestPlans}
              />
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      {showManualForm && (
        <CreateTestPlanModal
          onClose={() => setShowManualForm(false)}
          onCreate={handleCreateManual}
        />
      )}

      {showAIGenerator && (
        <AITestPlanGenerator
          projectId={projectId}
          onClose={() => setShowAIGenerator(false)}
          onGenerate={handleAIGenerate}
        />
      )}
    </div>
  )
}
```

---

## Next Steps

1. **Create Component Files**
   - Create the component files in `frontend/components/test-management/`
   - Implement each component according to the specifications above

2. **Style with Tailwind**
   - Use your existing Tailwind configuration
   - Maintain consistency with your design system

3. **Test the Integration**
   - Test manual test plan creation
   - Test AI generation (will show "not implemented" message until AI is integrated)
   - Test list, edit, and delete operations

4. **Add AI Integration (Future)**
   - Connect OpenAI API
   - Implement document parsing
   - Add LangChain integration

---

## Additional Features to Consider

1. **Bulk Operations**
   - Select multiple test plans
   - Bulk delete
   - Bulk tag updates

2. **Export/Import**
   - Export test plans to PDF/Excel
   - Import from templates

3. **Collaboration**
   - Comments on test plans
   - Mentions and notifications
   - Activity history

4. **Analytics**
   - Test plan coverage metrics
   - AI generation success rate
   - Most used objectives/tags

---

## Support

For questions or issues:
- Check API documentation at http://localhost:8000/docs
- Review `TEST_MANAGEMENT_IMPLEMENTATION.md` for backend details
- Check existing components in `frontend/components/` for patterns
