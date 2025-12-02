# Testing the New Web Automation Layout

## Quick Start

### 1. Access the New Layout

The development server is already running on **http://localhost:3000** (or 3001).

Navigate to:
```
http://localhost:3000/organizations/{org-uuid}/projects/{project-id}/automation-hub/web-automation/{test-id}
```

Replace:
- `{org-uuid}` with your organization UUID
- `{project-id}` with your project ID
- `{test-id}` with any test flow ID (or use "test-1" for sample data)

### 2. What You Should See

Upon loading, you should see:
- ✅ Top bar with "Create Project" button and "Web Automation" title
- ✅ Tab navigation with 8 tabs
- ✅ Browser and Mode dropdowns with Run Test and Edit Steps buttons
- ✅ Left panel (Test Explorer) with search box and test groups
- ✅ Right panel (Test Details) with the selected test information
- ✅ 9 tabs for different views (Steps, Code, Activity, etc.)

---

## Detailed Testing Checklist

### Top Bar Section

#### Header
- [ ] "Create Project" button is visible
- [ ] "Web Automation" title is centered and bold
- [ ] Both elements are properly aligned

#### Tab Navigation
- [ ] All 8 tabs are visible:
  - [ ] Test Explorer (active by default)
  - [ ] Live Environment
  - [ ] Test Builder
  - [ ] Screenshot
  - [ ] Trace
  - [ ] Code
  - [ ] Logs
  - [ ] AI Self-Heal
- [ ] Active tab has blue underline border
- [ ] Inactive tabs have gray text
- [ ] Tabs respond to hover (text darkens)

#### Controls
- [ ] Browser dropdown shows "Chrome" by default
- [ ] Browser dropdown has 4 options: Chrome, Firefox, Safari, Edge
- [ ] Mode dropdown shows "Headed (Watch)" by default
- [ ] Mode dropdown has 2 options: Headed (Watch), Headless
- [ ] "Run Test" button is visible with play icon
- [ ] "Edit Steps" button is visible with edit icon
- [ ] Both buttons respond to hover

---

### Test Explorer Panel (Left)

#### Layout
- [ ] Panel width is approximately 384px
- [ ] Background is light gray (bg-gray-50)
- [ ] Panel has a border on the right side
- [ ] "Test Explorer" heading is visible
- [ ] Search box is properly styled

#### Search Functionality
- [ ] Search input shows "Search tests..." placeholder
- [ ] Search icon (magnifying glass) is visible on the left
- [ ] Input accepts text
- [ ] (Future: typing filters tests)

#### Test Groups
- [ ] 4 groups are visible:
  - [ ] sanity (0)
  - [ ] Interactions (4)
  - [ ] Onboarding (1)
  - [ ] utility (1)
- [ ] Each group shows correct test count
- [ ] Groups have chevron icons (down or right)
- [ ] Groups respond to hover (background changes to gray-100)

#### Group Expansion
- [ ] Click on "sanity" - should expand/collapse (currently empty)
- [ ] Click on "Interactions" - should show/hide 4 tests
- [ ] Click on "Onboarding" - should show/hide "funder" test
- [ ] Click on "utility" - should show/hide "Raise Login" test
- [ ] Chevron icon changes direction when expanded/collapsed

#### Test Items
Under "Interactions" group:
- [ ] "Login Flow" with green checkmark (passed)
- [ ] "Navigation Test" with green checkmark (passed)
- [ ] "Form Submit" with red X (failed)
- [ ] "Button Click" with gray circle (pending)

Under "Onboarding" group:
- [ ] "funder" with gray circle (pending)

Under "utility" group:
- [ ] "Raise Login" with gray circle (pending)

#### Test Selection
- [ ] Click on "funder" - should highlight with blue background
- [ ] Selected test shows primary color text
- [ ] Test Details panel updates
- [ ] Click on another test - selection changes
- [ ] Hover on unselected test shows gray-100 background

---

### Test Details Panel (Right)

#### Header
- [ ] Shows "Test Details: {test-name}"
- [ ] Test name matches selected test
- [ ] Status badge is visible
- [ ] Status badge shows correct color:
  - Gray for pending
  - Green for passed
  - Red for failed
  - Blue for running

#### Tab Bar
- [ ] All 9 tabs are visible in order:
  1. Steps
  2. Code
  3. Activity
  4. Video
  5. Screenshots
  6. Trace
  7. Runs
  8. AI Logs
  9. Raw Logs
- [ ] First tab (Steps) is active by default
- [ ] Active tab has white background
- [ ] Active tab has blue bottom border
- [ ] Inactive tabs have gray background

#### Tab Navigation
- [ ] Click "Steps" tab - shows step content
- [ ] Click "Code" tab - shows code view
- [ ] Click "Activity" tab - shows activity content
- [ ] Click "Video" tab - shows video placeholder
- [ ] Click "Screenshots" tab - shows screenshots placeholder
- [ ] Click "Trace" tab - shows trace placeholder
- [ ] Click "Runs" tab - shows runs history
- [ ] Click "AI Logs" tab - shows AI healing content
- [ ] Click "Raw Logs" tab - shows raw log output
- [ ] Tab content updates when switching tabs
- [ ] No flashing or layout shift

---

### Tab Content Testing

#### Steps Tab
- [ ] Shows "Test Steps" heading
- [ ] Displays step cards
- [ ] Each step has:
  - [ ] Numbered badge (1, 2, 3...)
  - [ ] Action type (Navigate, Click, etc.)
  - [ ] Description with bullet point
  - [ ] Selector (if applicable)
  - [ ] Value (if applicable)
  - [ ] Status badge
- [ ] Step cards have proper spacing
- [ ] Cards respond to hover (subtle shadow)

#### Code Tab
- [ ] Shows dark background (bg-gray-900)
- [ ] Displays Playwright code format
- [ ] Code has syntax highlighting colors:
  - [ ] Purple for keywords (import, test, async)
  - [ ] Green for strings
  - [ ] Gray for comments
- [ ] Font is monospace
- [ ] Text is readable

#### Activity Tab
- [ ] Shows "Test Activity" heading
- [ ] Displays placeholder text "No activity recorded yet"
- [ ] Properly styled

#### Video Tab
- [ ] Shows video icon placeholder
- [ ] Displays "No video recording available" message
- [ ] Centered layout
- [ ] Icon and text are gray

#### Screenshots Tab
- [ ] Shows image icon placeholder
- [ ] Displays "No screenshots available" message
- [ ] Centered layout
- [ ] Icon and text are gray

#### Trace Tab
- [ ] Shows activity icon placeholder
- [ ] Displays "No trace data available" message
- [ ] Centered layout
- [ ] Icon and text are gray

#### Runs Tab
- [ ] Shows "Execution History" heading
- [ ] Displays placeholder text
- [ ] Properly styled

#### AI Logs Tab
- [ ] Shows "AI Self-Healing Logs" heading
- [ ] Displays special styled placeholder:
  - [ ] Lightning bolt icon (Zap)
  - [ ] "AI Self-Healing Not Triggered" message
  - [ ] Subtitle text
  - [ ] Purple/pink gradient background
- [ ] Centered and visually appealing

#### Raw Logs Tab
- [ ] Shows dark background (bg-gray-900)
- [ ] Displays monospace font
- [ ] Shows sample log entries:
  - [ ] "[00:00:00] Test initialized"
  - [ ] "[00:00:01] Browser launched: Chrome"
  - [ ] "[00:00:02] Waiting for execution..."
- [ ] Text is gray-400 color
- [ ] Readable and properly formatted

---

### Interactive Features

#### Browser Selection
1. [ ] Click Browser dropdown
2. [ ] See all 4 options
3. [ ] Select "Firefox"
4. [ ] Dropdown shows "Firefox"
5. [ ] Selection persists

#### Mode Selection
1. [ ] Click Mode dropdown
2. [ ] See both options
3. [ ] Select "Headless"
4. [ ] Dropdown shows "Headless"
5. [ ] Selection persists

#### Search
1. [ ] Click in search box
2. [ ] Type "funder"
3. [ ] (Future: should filter to show only matching tests)
4. [ ] Clear search
5. [ ] All tests reappear

#### Group Toggle
1. [ ] All groups start expanded
2. [ ] Click "Interactions" group
3. [ ] Tests collapse
4. [ ] Chevron points right
5. [ ] Click again
6. [ ] Tests expand
7. [ ] Chevron points down

#### Test Selection
1. [ ] Click "Login Flow" test
2. [ ] Test highlights in explorer
3. [ ] Details panel updates to "Login Flow"
4. [ ] Status badge shows "Passed" in green
5. [ ] Steps tab shows Login Flow steps
6. [ ] Click "Form Submit" test
7. [ ] Selection changes
8. [ ] Details panel updates to "Form Submit"
9. [ ] Status badge shows "Failed" in red

---

### Visual Testing

#### Colors
- [ ] Primary blue (#3b82f6 or similar) for active states
- [ ] Green (#10b981) for passed status
- [ ] Red (#ef4444) for failed status
- [ ] Gray scale properly used throughout
- [ ] No color contrast issues

#### Spacing
- [ ] Proper padding in all sections
- [ ] Consistent gaps between elements
- [ ] No overlapping text or components
- [ ] Adequate whitespace

#### Typography
- [ ] Headers are bold and prominent
- [ ] Body text is readable
- [ ] Font sizes are appropriate
- [ ] Monospace font used for code/logs

#### Icons
- [ ] All icons render correctly
- [ ] Icons are properly sized
- [ ] Icons align with text
- [ ] Status icons show correct symbols

#### Borders
- [ ] Panel borders are visible but subtle
- [ ] Tab borders appear correctly
- [ ] Card borders are consistent
- [ ] No double borders

---

### Responsive Testing

#### Full Width (1920px+)
- [ ] Layout uses full width
- [ ] Explorer panel stays at 384px
- [ ] Details panel expands to fill space
- [ ] No horizontal scrolling
- [ ] Everything visible without scrolling

#### Laptop (1280px)
- [ ] Layout adapts properly
- [ ] Explorer panel stays at 384px
- [ ] Details panel is narrower but usable
- [ ] Tabs might wrap if needed
- [ ] All features accessible

#### Small Screen (1024px)
- [ ] Layout still functional
- [ ] May need some horizontal scrolling
- [ ] Core features still accessible
- [ ] Text remains readable

---

### Performance Testing

#### Load Time
- [ ] Page loads within 2 seconds
- [ ] No visible lag when rendering
- [ ] Smooth initial render

#### Interactions
- [ ] Tab switching is instant
- [ ] Test selection is immediate
- [ ] Group toggle is smooth
- [ ] No stuttering or freezing
- [ ] Hover effects are smooth

#### Browser Console
- [ ] No errors in console
- [ ] No warnings (or only expected ones)
- [ ] No 404s for missing resources

---

### Functional Testing

#### State Persistence
- [ ] Selected test remains selected
- [ ] Active tab stays active
- [ ] Browser selection persists
- [ ] Mode selection persists
- [ ] Group expansion states persist
- [ ] Search query persists (if typed)

#### Edge Cases
- [ ] Selecting test with no steps
- [ ] Empty test group
- [ ] Very long test name
- [ ] Very long step description
- [ ] Switching tabs rapidly
- [ ] Clicking same test twice

---

### Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if on Mac)
- [ ] Edge (latest)

In each browser:
- [ ] Layout renders correctly
- [ ] All interactions work
- [ ] Colors display properly
- [ ] Fonts load correctly
- [ ] No browser-specific issues

---

## Common Issues and Solutions

### Issue 1: Layout Not Loading
**Symptoms**: Blank page or error message
**Solutions**:
1. Check browser console for errors
2. Verify the URL is correct
3. Ensure development server is running
4. Check if component imported correctly
5. Clear browser cache and reload

### Issue 2: Test Explorer Empty
**Symptoms**: No tests showing in explorer
**Solutions**:
1. Check if sample data is loaded
2. Verify testGroups state is initialized
3. Check useEffect hooks are running
4. Look for JavaScript errors

### Issue 3: Tabs Not Switching
**Symptoms**: Clicking tabs doesn't change content
**Solutions**:
1. Check if activeTab state is updating
2. Verify TabsContent components are rendered
3. Look for z-index issues
4. Check if Tabs component is properly configured

### Issue 4: Styling Issues
**Symptoms**: Layout looks broken or misaligned
**Solutions**:
1. Verify Tailwind CSS is loaded
2. Check if custom CSS conflicts
3. Ensure all UI components are imported
4. Clear Next.js cache (.next folder)

### Issue 5: Search Not Working
**Symptoms**: Typing in search doesn't filter
**Solutions**:
1. This is expected - filtering logic needs backend
2. Verify searchQuery state updates
3. Check if input onChange is working

---

## Testing Script

### Quick 5-Minute Test

```bash
# 1. Ensure server is running
http://localhost:3000

# 2. Navigate to test page
/organizations/{org}/projects/{project}/automation-hub/web-automation/test-1

# 3. Visual check (30 seconds)
- Top bar present?
- Two panels visible?
- Test explorer populated?

# 4. Click test "funder" (30 seconds)
- Highlights in explorer?
- Details panel updates?
- Status shows "Pending"?

# 5. Switch tabs (1 minute)
- Click each tab
- Content changes?
- No errors?

# 6. Test interactions (1 minute)
- Click different tests
- Expand/collapse groups
- Try browser dropdown
- Try mode dropdown

# 7. Visual polish (1 minute)
- Colors look good?
- Spacing correct?
- Icons render?
- Text readable?

# 8. Browser console (30 seconds)
- Open DevTools
- Check for errors
- Check for warnings
```

### Comprehensive 30-Minute Test

Follow the full checklist above, testing each section thoroughly.

---

## Reporting Issues

If you find any issues, please document:

1. **What**: Describe the problem
2. **Where**: Which component/section
3. **Steps**: How to reproduce
4. **Expected**: What should happen
5. **Actual**: What actually happens
6. **Browser**: Which browser (version)
7. **Screenshot**: If visual issue
8. **Console**: Any error messages

---

## Success Criteria

The layout is working correctly if:

✅ All visual elements render properly
✅ No console errors
✅ All interactions work smoothly
✅ Tab switching is instant
✅ Test selection updates details panel
✅ Styling matches specification
✅ Layout is responsive
✅ Performance is good (< 2s load, instant interactions)
✅ All 9 tabs display content
✅ Sample data shows correctly

---

## Next Steps After Testing

Once basic testing is complete:

1. **Backend Integration**: Connect to real API endpoints
2. **Live Data**: Replace sample data with real test flows
3. **WebSocket**: Add real-time execution updates
4. **Search**: Implement search filtering logic
5. **Test Builder**: Add ability to edit steps inline
6. **Live Environment**: Implement browser preview tab
7. **Video Player**: Add actual video playback
8. **Screenshot Gallery**: Add image viewing capability
9. **Trace Viewer**: Implement trace visualization
10. **AI Integration**: Connect self-healing service

---

## Useful Commands

```bash
# Start development server (if not running)
cd frontend && npm run dev

# Check for TypeScript errors (optional)
npx tsc --noEmit

# Clear Next.js cache (if issues)
rm -rf .next

# Restart with clean slate
npm run dev

# Check running processes
ps aux | grep "next dev"

# Kill specific process (if needed)
kill -9 {PID}
```

---

## Documentation Reference

- **Layout Specification**: `WEB_AUTOMATION_NEW_LAYOUT.md`
- **Visual Guide**: `WEB_AUTOMATION_LAYOUT_VISUAL_GUIDE.md`
- **Comparison**: `WEB_AUTOMATION_COMPARISON.md`
- **Summary**: `WEB_AUTOMATION_LAYOUT_SUMMARY.md`
- **This Guide**: `WEB_AUTOMATION_TESTING_INSTRUCTIONS.md`

---

## Support

If you encounter any issues during testing or have questions:

1. Check the documentation files listed above
2. Review the component code: `frontend/components/automation/WebAutomationWorkspace.tsx`
3. Check the browser console for error messages
4. Verify the development server is running properly

---

**Happy Testing! 🚀**
