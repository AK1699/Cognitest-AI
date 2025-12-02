# Web Automation Layout - Visual Guide

## Complete Layout Overview

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                              TOP BAR (White Background)                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  [Create Project]                    Web Automation                            ┃
┃                                                                                 ┃
┃  ┌─────────────┬──────────────┬──────────────┬────────────┬───────┬──────┬───┐┃
┃  │Test Explorer│Live Env      │Test Builder  │Screenshot  │Trace  │Code  │...│┃
┃  └─────────────┴──────────────┴──────────────┴────────────┴───────┴──────┴───┘┃
┃                                                                                 ┃
┃  Browser: [Chrome ▼]  Mode: [Headed (Watch) ▼]  [▶ Run Test]  [✏ Edit Steps] ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━┯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃   TEST EXPLORER        │              TEST DETAILS                            ┃
┃   (Gray Background)    │              (White Background)                      ┃
┃   384px Width          │              Flexible Width                          ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                        │                                                      ┃
┃  🔍 Search tests...    │  Test Details: funder                    [Pending]  ┃
┃  ─────────────────     │                                                      ┃
┃                        │  ┌────────────────────────────────────────────────┐ ┃
┃  ▼ sanity (0)          │  │ Steps │Code│Activity│Video│Screenshots│Trace... │ ┃
┃                        │  └────────────────────────────────────────────────┘ ┃
┃  ▼ Interactions (4)    │                                                      ┃
┃    ✓ Login Flow        │  ╔════════════════════════════════════════════════╗ ┃
┃    ✓ Navigation Test   │  ║ Step 1                                         ║ ┃
┃    ✗ Form Submit       │  ║ ────────────────────────────────────────────── ║ ┃
┃    ○ Button Click      │  ║                                                ║ ┃
┃                        │  ║  ┌───┐                                         ║ ┃
┃  ▼ Onboarding (1)      │  ║  │ 1 │  Navigate                               ║ ┃
┃    ○ funder ◄──────────┼──║  └───┘  - Test step 1                          ║ ┃
┃                        │  ║                                                ║ ┃
┃  ▼ utility (1)         │  ╚════════════════════════════════════════════════╝ ┃
┃    ○ Raise Login       │                                                      ┃
┃                        │                                                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┷━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Section Details

### 1. Top Bar Components

#### Header Section
```
┌──────────────────────────────────────────────────────┐
│ [Create Project]        Web Automation               │
└──────────────────────────────────────────────────────┘
```
- **Create Project**: Blue button on the left
- **Web Automation**: Bold title text, centered

#### Tab Navigation
```
┌────────────┬─────────────┬──────────────┬───────────┬───────┬──────┬──────┬──────────────┐
│Test Explorer│Live Env     │Test Builder  │Screenshot │Trace  │Code  │Logs  │AI Self-Heal  │
└────────────┴─────────────┴──────────────┴───────────┴───────┴──────┴──────┴──────────────┘
     Active       Inactive      Inactive      Inactive   Inactive Inactive Inactive  Inactive
   (Blue border)  (Gray text)   (Gray text)   (Gray text)
```

#### Control Bar
```
┌────────────────────────────────────────────────────────────────┐
│ Browser: [Chrome ▼]  Mode: [Headed (Watch) ▼]                 │
│                                                                │
│ [▶ Run Test]  [✏ Edit Steps]                                  │
└────────────────────────────────────────────────────────────────┘
```

### 2. Test Explorer Panel

#### Search Bar
```
┌──────────────────────┐
│ 🔍 Search tests...   │
└──────────────────────┘
```

#### Test Groups Structure
```
▼ sanity (0)
  └─ (no tests)

▼ Interactions (4)
  ├─ ✓ Login Flow        [Green checkmark - Passed]
  ├─ ✓ Navigation Test   [Green checkmark - Passed]
  ├─ ✗ Form Submit       [Red X - Failed]
  └─ ○ Button Click      [Gray circle - Pending]

▼ Onboarding (1)
  └─ ○ funder            [Gray circle - Pending] ◄── SELECTED

▼ utility (1)
  └─ ○ Raise Login       [Gray circle - Pending]
```

#### Status Icons Legend
```
✓  Green Checkmark  = Passed
✗  Red X            = Failed
⏳ Blue Spinner     = Running
○  Gray Circle      = Pending
```

### 3. Test Details Panel

#### Header
```
┌─────────────────────────────────────────────────┐
│ Test Details: funder                  [Pending] │
└─────────────────────────────────────────────────┘
```

#### Tab Bar
```
┌───────┬──────┬──────────┬───────┬────────────┬───────┬──────┬─────────┬──────────┐
│ Steps │ Code │ Activity │ Video │ Screenshots│ Trace │ Runs │ AI Logs │ Raw Logs │
└───────┴──────┴──────────┴───────┴────────────┴───────┴──────┴─────────┴──────────┘
  Active  Inactive  (9 tabs total)
```

#### Steps Tab Content
```
╔══════════════════════════════════════════════════════════╗
║ Step 1                                                   ║
║ ──────────────────────────────────────────────────────── ║
║                                                          ║
║  ┌───┐                                                   ║
║  │ 1 │  Navigate                              [Pending]  ║
║  └───┘  - Test step 1                                    ║
║                                                          ║
║         Selector: #login-button                          ║
║         Value: https://example.com                       ║
╚══════════════════════════════════════════════════════════╝
```

### 4. Tab Content Examples

#### Code Tab
```
╔══════════════════════════════════════════════════════════╗
║ // Generated test code                                   ║
║ import { test, expect } from '@playwright/test';         ║
║                                                          ║
║ test('funder', async ({ page }) => {                    ║
║   // Test steps will be generated here                  ║
║ });                                                      ║
╚══════════════════════════════════════════════════════════╝
```

#### AI Logs Tab
```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║                    ⚡                                     ║
║                                                          ║
║        AI Self-Healing Not Triggered                     ║
║                                                          ║
║    Logs will appear when AI healing is activated         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

#### Raw Logs Tab
```
╔══════════════════════════════════════════════════════════╗
║ [00:00:00] Test initialized                              ║
║ [00:00:01] Browser launched: Chrome                      ║
║ [00:00:02] Waiting for execution...                      ║
╚══════════════════════════════════════════════════════════╝
```

## Color Coding

### Background Colors
- **Top Bar**: White (`bg-white`)
- **Test Explorer**: Light Gray (`bg-gray-50`)
- **Test Details**: White (`bg-white`)
- **Tab Bar**: Light Gray (`bg-gray-50`)
- **Active Tab**: White (`bg-white`)

### Text Colors
- **Headers**: Dark Gray (`text-gray-900`)
- **Body Text**: Medium Gray (`text-gray-700`)
- **Muted Text**: Light Gray (`text-gray-500`)
- **Active Elements**: Primary Blue (`text-primary`)

### Status Colors
- **Passed**: Green (`text-green-500`, `bg-green-100`)
- **Failed**: Red (`text-red-500`, `bg-red-100`)
- **Running**: Blue (`text-blue-500`, `bg-blue-100`)
- **Pending**: Gray (`text-gray-500`, `bg-gray-100`)

### Interactive States
```
Button Hover:
[Normal]     → [Hovered]
bg-gray-50     bg-gray-100

Active Selection:
[Normal]     → [Selected]
bg-white       bg-primary/10
text-gray-700  text-primary
```

## Dimensions

### Panel Widths
```
┌──────────┬────────────────────────────┐
│  384px   │      Remaining Space       │
│          │      (Flexible)            │
│ Explorer │        Details             │
└──────────┴────────────────────────────┘
```

### Heights
```
Top Bar: Auto (approx 200px)
├─ Header: 64px
├─ Tabs: 48px
└─ Controls: 56px

Content: Remaining (100vh - Top Bar)
└─ Scrollable
```

## Interactive Elements

### Clickable Areas
```
✓ Test Groups      → Expand/Collapse
✓ Test Names       → Select Test
✓ Tab Buttons      → Switch Tab
✓ Browser Select   → Choose Browser
✓ Mode Select      → Choose Mode
✓ Run Test Button  → Execute Test
✓ Edit Steps       → Modify Steps
✓ Search Input     → Filter Tests
```

### Hover States
```
Element          Normal          Hover
─────────────────────────────────────────
Test Group       bg-transparent  bg-gray-100
Test Item        bg-transparent  bg-gray-100
Tab Button       text-gray-500   text-gray-900
Button           bg-primary      bg-primary/90
```

## Responsive Behavior

### Desktop (1920px+)
```
┌────────┬──────────────────────┐
│  384px │   Remaining Width    │
│        │   (Lots of space)    │
└────────┴──────────────────────┘
```

### Laptop (1280px)
```
┌────────┬────────────────┐
│  384px │  Remaining     │
│        │  (Adequate)    │
└────────┴────────────────┘
```

### Small Screen (1024px)
```
┌────────┬──────────┐
│  384px │ Compact  │
│        │ Details  │
└────────┴──────────┘
```

## Usage Flow

### User Journey
```
1. User navigates to test flow
   ↓
2. Layout loads with Test Explorer visible
   ↓
3. User searches or browses tests
   ↓
4. User clicks on a test (e.g., "funder")
   ↓
5. Test Details panel updates
   ↓
6. User explores different tabs
   ↓
7. User configures browser/mode
   ↓
8. User clicks "Run Test"
   ↓
9. Real-time updates appear in tabs
```

### Navigation Pattern
```
Test Explorer     →  Test Details  →  Tab Content
(Browse/Search)      (Overview)       (Detailed Info)
```

## Key Features Visualization

### Search & Filter
```
┌────────────────────┐
│ 🔍 inter          │ ← Type "inter"
└────────────────────┘
         ↓
┌────────────────────┐
│ ▼ Interactions (4) │ ← Shows matching group
│   ✓ Login Flow     │
│   ✓ Navigation     │
│   ✗ Form Submit    │
│   ○ Button Click   │
└────────────────────┘
```

### Step Numbering
```
Steps Display:
┌───┐  ┌───┐  ┌───┐  ┌───┐
│ 1 │  │ 2 │  │ 3 │  │ 4 │
└───┘  └───┘  └───┘  └───┘
Navigate Click  Type  Assert
```

### Status Progression
```
Test Lifecycle:
○ Pending → ⏳ Running → ✓ Passed
                      ↘ ✗ Failed
```

## Accessibility Features

### Keyboard Navigation
- `Tab` - Move between interactive elements
- `Enter` - Activate selected element
- `Space` - Toggle checkboxes/buttons
- `Arrow Keys` - Navigate lists

### Screen Reader Support
- Proper ARIA labels
- Role attributes
- Live region updates
- Focus management

## Mobile Considerations (Future)

```
Mobile Layout (< 768px):
┌────────────────────┐
│  Top Bar (Compact) │
├────────────────────┤
│  Explorer          │ ← Swipeable
├────────────────────┤
│  Details           │ ← Panels
└────────────────────┘
```

---

## Quick Reference

**Access URL**: `/organizations/{org}/projects/{project}/automation-hub/web-automation/{test-id}`

**Component**: `frontend/components/automation/WebAutomationWorkspace.tsx`

**Key Props**:
- `projectId: string` - Project identifier
- `flowId?: string` - Optional flow identifier

**Sample Data**: Pre-populated with 6 tests across 4 groups
