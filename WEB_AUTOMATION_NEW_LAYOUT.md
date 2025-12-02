# Web Automation New Layout

## Overview
The Web Automation layout has been redesigned to provide a comprehensive testing workspace with an integrated test explorer and detailed test view.

## New Layout Structure

```
+-------------------------------------------------------------------------------------------+
|  Top Bar                                                                                  |
|-------------------------------------------------------------------------------------------|
|  [Create Project]                      Web Automation                                     |
|                                                                                           |
|  Test Explorer | Live | Test Builder | Screenshot | Trace | Code | Logs | AI Self-Heal     |
|                | Environment                                                                  |
|                                                                                           |
|  Browser: [Chrome]   Mode: [Headed (Watch)]   [Run Test]   [Edit Steps]                  |
+-------------------------------------------------------------------------------------------+

+--------------------------------------+----------------------------------------------------+
|              Test Explorer           |                Test Details: funder                |
|--------------------------------------|----------------------------------------------------|
|  Search tests…                       |   Status: Pending                                  |
|                                      |                                                    |
|  > sanity (0)                        |   Tabs:                                            |
|  > Interactions (4)                  |   [Steps] [Code] [Activity] [Video] [Screenshots]  |
|  > Onboarding (1)                    |   [Trace] [Runs] [AI Logs] [Raw Logs]              |
|      - funder                        |                                                    |
|  > utility (1)                       |----------------------------------------------------|
|      - Raise Login                   |                                                    |
|                                      |   Step 1                                           |
|                                      |   ------------------------------------------------ |
|                                      |   [1]  Action                                      |
|                                      |        - Test step 1                               |
|                                      |                                                    |
+--------------------------------------+----------------------------------------------------+
```

## Key Features

### 1. Top Navigation Bar
- **Create Project Button**: Quick access to create new projects
- **Module Title**: Clear identification of the Web Automation module
- **Tab Navigation**: 
  - Test Explorer
  - Live Environment
  - Test Builder
  - Screenshot
  - Trace
  - Code
  - Logs
  - AI Self-Heal

### 2. Test Controls
- **Browser Selection**: Choose from Chrome, Firefox, Safari, Edge
- **Mode Selection**: Headed (Watch) or Headless
- **Run Test Button**: Execute the selected test
- **Edit Steps Button**: Modify test steps

### 3. Test Explorer (Left Panel)
- **Search Functionality**: Filter tests by name
- **Hierarchical Test Organization**: 
  - Tests grouped by category (sanity, Interactions, Onboarding, utility)
  - Expandable/collapsible groups
  - Test count display per group
- **Status Indicators**: Visual indicators for test status (pending, passed, failed, running)
- **Quick Selection**: Click to select and view test details

### 4. Test Details (Right Panel)
- **Test Header**: 
  - Test name display
  - Status badge
- **Comprehensive Tabs**:
  - **Steps**: View all test steps with detailed information
  - **Code**: Generated test code (Playwright format)
  - **Activity**: Test execution activity log
  - **Video**: Test execution recordings
  - **Screenshots**: Captured screenshots during execution
  - **Trace**: Detailed execution trace
  - **Runs**: Execution history
  - **AI Logs**: AI Self-Healing logs and insights
  - **Raw Logs**: Raw console output

### 5. Step Details
Each step displays:
- Step number (visual indicator)
- Action type (Navigate, Click, Type, etc.)
- Description
- Selector information (if applicable)
- Value/input data (if applicable)
- Status badge

## Implementation Details

### Component Location
- **Component**: `frontend/components/automation/WebAutomationWorkspace.tsx`
- **Page**: `frontend/app/organizations/[uuid]/projects/[projectId]/automation-hub/web-automation/[id]/page.tsx`

### Key Technologies
- **React**: Component framework
- **Next.js 14**: App router
- **Tailwind CSS**: Styling
- **Lucide Icons**: Icon library
- **shadcn/ui**: UI components (Tabs, Buttons, Cards, Badges)

### State Management
- Test groups with expandable/collapsible functionality
- Selected test tracking
- Active tab management
- Browser and mode selection
- Search filtering

## Test Organization

### Default Test Groups
1. **sanity** (0 tests)
2. **Interactions** (4 tests)
   - Login Flow
   - Navigation Test
   - Form Submit
   - Button Click
3. **Onboarding** (1 test)
   - funder
4. **utility** (1 test)
   - Raise Login

## Usage

### Accessing the Workspace
Navigate to: `/organizations/{org-id}/projects/{project-id}/automation-hub/web-automation/{test-id}`

### Selecting a Test
1. Click on any test in the Test Explorer
2. The Test Details panel will update with the test information
3. Use tabs to view different aspects of the test

### Running Tests
1. Select desired browser and mode
2. Choose a test from the explorer
3. Click "Run Test" button
4. Monitor execution in real-time through various tabs

### Viewing Test Details
- **Steps Tab**: See sequential test actions
- **Code Tab**: View generated Playwright code
- **AI Logs Tab**: Monitor self-healing events
- **Raw Logs Tab**: Access detailed execution logs

## Future Enhancements

### Planned Features
1. **Live Environment Tab**: Real-time browser preview during test execution
2. **Test Builder Tab**: Visual step editor with drag-and-drop
3. **Screenshot Comparison**: Visual regression testing
4. **Trace Viewer**: Interactive execution trace viewer
5. **Video Playback**: Embedded video player with step markers
6. **AI Self-Heal Integration**: Real-time healing suggestions and actions

### Integration Points
- Backend API for test flow management
- WebSocket for live execution updates
- AI service for self-healing capabilities
- Screenshot and video storage
- Trace data collection

## Styling Notes

### Color Scheme
- **Primary**: Blue for active states and highlights
- **Success**: Green for passed tests
- **Error**: Red for failed tests
- **Warning**: Yellow for healing events
- **Neutral**: Gray scale for base UI

### Layout
- **Left Panel**: 384px (w-96) fixed width
- **Right Panel**: Flexible width (flex-1)
- **Top Bar**: Auto height with padding
- **Content Area**: Full height with scroll

## Accessibility
- Keyboard navigation support
- Screen reader friendly labels
- Color contrast compliance
- Focus indicators
- ARIA attributes

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance Considerations
- Lazy loading of tab content
- Virtualized test list for large test suites
- Optimized re-renders with React.memo
- Efficient state updates

## API Integration

### Expected Endpoints
- `GET /api/v1/web-automation/projects/{projectId}/test-flows`
- `GET /api/v1/web-automation/test-flows/{flowId}`
- `POST /api/v1/web-automation/test-flows/{flowId}/execute`
- `WS /api/v1/web-automation/ws/live-preview/{executionId}`

### Data Structures
```typescript
interface TestFlow {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  steps: TestStep[]
  groupId: string
}

interface TestStep {
  id: string
  action: string
  description: string
  selector?: string
  value?: string
  status?: 'pending' | 'running' | 'passed' | 'failed'
}
```

## Migration Notes

### From Previous Layout
The new layout replaces the flow-based builder with a test explorer approach:
- **Old**: Flow canvas with drag-and-drop nodes
- **New**: List-based test explorer with detailed step view

### Backwards Compatibility
The previous `TestFlowBuilder` component is still available at:
- `frontend/components/automation/TestFlowBuilder.tsx`

To use the old layout, import `TestFlowBuilder` instead of `WebAutomationWorkspace`.

## Conclusion

The new Web Automation layout provides a comprehensive, user-friendly interface for managing and executing web automation tests. It combines the simplicity of a test explorer with the power of detailed test inspection and AI-powered self-healing capabilities.
