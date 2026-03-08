/**
 * INTEGRATION GUIDE: How to Update LiveBrowserTab.tsx
 *
 * This file shows the exact changes needed to integrate the new browser components.
 * Copy and paste these sections into your LiveBrowserTab.tsx
 */

'use client'

import BrowserSelector, { BrowserConfig } from './BrowserSelector'
import EnhancedLiveBrowser from './EnhancedLiveBrowser'

// ============================================================================
// STEP 1: Add these imports at the top of LiveBrowserTab.tsx
// ============================================================================

// import BrowserSelector, { BrowserConfig } from './BrowserSelector'
// import EnhancedLiveBrowser from './EnhancedLiveBrowser'


// ============================================================================
// STEP 2: Add these state variables in LiveBrowserTab component
// ============================================================================

// Inside the component function, add:
// const [showBrowserSelector, setShowBrowserSelector] = useState(true)
// const [selectedBrowserConfig, setSelectedBrowserConfig] = useState<BrowserConfig | null>(null)
// const [pendingExecutionRunId, setPendingExecutionRunId] = useState<string | null>(null)


// ============================================================================
// STEP 3: Add this handler function
// ============================================================================

const handleBrowserSelect = async (config: BrowserConfig) => {
  // This function is called when user clicks "Launch Browser" in the selector
  try {
    // Start the test execution with browser configuration
    const executionConfig = {
      browser_type: BrowserType.CHROME, // Map from config if needed
      execution_mode: ExecutionMode.FULLY_AUTOMATED,
      variables: testToRun?.flowId ? {} : undefined,
      // NEW: Add browser configuration
      os: config.os,
      browser: config.browser,
      browser_version: config.browserVersion,
      resolution: config.resolution,
    }

    // Call the execute endpoint
    const response = await webAutomationApi.executeTest(
      testToRun?.flowId || testFlowId,
      executionConfig
    )

    // Store the execution run ID and config
    setPendingExecutionRunId(response.id)
    setSelectedBrowserConfig(config)

    // Hide selector and show browser
    setShowBrowserSelector(false)

  } catch (error) {
    console.error('Failed to launch browser:', error)
    // Show error toast
  }
}

// ============================================================================
// STEP 4: Replace the return statement with this
// ============================================================================

// Existing code that should stay:
// - All the tabs (Test Explorer, Test Builder, Logs, etc.)
// - Test execution controls

// In the Live Browser tab content, replace the old browser preview with:

return (
  <div>
    {/* Keep existing tabs structure */}
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="test-explorer">Test Explorer</TabsTrigger>
        <TabsTrigger value="test-builder">Test Builder</TabsTrigger>
        <TabsTrigger value="live-browser">Live Browser</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
        {/* ... other tabs ... */}
      </TabsList>

      {/* Keep existing tab contents */}
      <TabsContent value="test-explorer">{/* ... existing ... */}</TabsContent>
      <TabsContent value="test-builder">{/* ... existing ... */}</TabsContent>

      {/* NEW: Replace Live Browser tab content */}
      <TabsContent value="live-browser" className="h-full">
        {showBrowserSelector ? (
          // Show browser selector when no execution or execution is stopped
          <BrowserSelector
            onSelect={handleBrowserSelect}
            isLoading={isLaunching}
          />
        ) : (
          // Show browser preview during execution
          <EnhancedLiveBrowser
            executionRunId={pendingExecutionRunId || undefined}
            isRunning={sessionStatus === 'running'}
            browserConfig={selectedBrowserConfig ? {
              os: selectedBrowserConfig.os || 'Unknown',
              browser: selectedBrowserConfig.browser || 'Unknown',
              resolution: selectedBrowserConfig.resolution || 'Unknown',
            } : undefined}
            onPlay={() => {
              // Resume AI execution
              if (sessionStatus === 'paused') {
                resumeExecution()
              }
            }}
            onPause={() => {
              // Pause AI execution
              if (sessionStatus === 'running') {
                pauseExecution()
              }
            }}
            onStop={stopExecution}
            onRefresh={handleRefresh}
          />
        )}
      </TabsContent>

      {/* Keep other tabs */}
      <TabsContent value="logs">{/* ... existing ... */}</TabsContent>
    </Tabs>
  </div>
)


// ============================================================================
// STEP 5: Update the stopExecution handler to reset selector
// ============================================================================

const stopExecution = async () => {
  // ... existing stop logic ...

  // After stopping, show selector again
  setShowBrowserSelector(true)
  setPendingExecutionRunId(null)
  setSelectedBrowserConfig(null)
}


// ============================================================================
// STEP 6: Export schema updates needed in backend
// ============================================================================

/*
In ExecutionRunCreate schema (backend/app/schemas/web_automation.py), add:

class ExecutionRunCreate(BaseModel):
    # Existing fields...
    test_flow_id: Optional[UUID] = None
    browser_type: Optional[BrowserType] = None
    execution_mode: Optional[ExecutionMode] = None
    variables: Optional[Dict[str, Any]] = None

    # NEW: Browser configuration fields
    os: Optional[str] = Field(default="Linux", description="Operating System")
    browser: Optional[str] = Field(default="Chrome", description="Browser type")
    browser_version: Optional[str] = Field(default="Latest", description="Browser version")
    resolution: Optional[str] = Field(default="1280x720", description="Screen resolution")
*/


// ============================================================================
// OPTIONAL: Custom hooks for better state management
// ============================================================================

export function useBrowserState() {
  const [showBrowserSelector, setShowBrowserSelector] = useState(true)
  const [selectedBrowserConfig, setSelectedBrowserConfig] = useState<BrowserConfig | null>(null)
  const [executionRunId, setExecutionRunId] = useState<string | null>(null)

  const selectBrowser = (config: BrowserConfig) => {
    setSelectedBrowserConfig(config)
    setExecutionRunId(null)
    setShowBrowserSelector(false)
  }

  const resetBrowser = () => {
    setShowBrowserSelector(true)
    setSelectedBrowserConfig(null)
    setExecutionRunId(null)
  }

  return {
    showBrowserSelector,
    selectedBrowserConfig,
    executionRunId,
    selectBrowser,
    resetBrowser,
    setExecutionRunId,
  }
}
