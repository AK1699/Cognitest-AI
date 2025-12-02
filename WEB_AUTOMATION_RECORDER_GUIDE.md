# Web Automation Recorder - Like Supatest

## 🎬 **What You Get Now**

A **Chrome extension-style recorder** similar to Supatest that captures your browser interactions!

---

## 🎯 **Features (Like Supatest)**

### ✅ **Record & Replay**
- Click "Start Recording" button
- Browse your website normally
- All interactions are automatically captured
- Click "Stop" when done
- Playback anytime!

### ✅ **Captured Actions**
- **Navigate**: Page navigation
- **Click**: Button/link clicks  
- **Type**: Text input
- **Select**: Dropdown selections
- **Hover**: Mouse hovers
- **Wait**: Delays
- **Assert**: Validations

### ✅ **Visual Step List**
- See all recorded steps in left panel
- Each step shows:
  - Icon (🌐 Navigate, 👆 Click, ⌨️ Type)
  - Action type
  - Element details
  - Selector path
- Edit or delete any step
- Reorder steps (drag & drop)

### ✅ **Live Browser Preview**
- Right side shows live browser
- See exactly what you're recording
- Real-time interaction capture
- Browser-like controls

### ✅ **Export Options**
- **Save Test**: Save to CogniTest
- **Export JSON**: Download test file
- **Generate Code**: Get Playwright code
- **Copy Code**: Copy to clipboard

---

## 🎨 **Interface Overview**

```
┌─────────────────────────────────────────────────────────────┐
│               Web Automation Recorder                        │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                           │
│  Left Panel      │        Right Panel                        │
│  (Steps)         │        (Browser Preview)                  │
│                  │                                           │
│  ┌────────────┐  │  ┌──────────────────────────────────┐   │
│  │ Test Name  │  │  │ 🔴⚪️🟢  https://example.com    │   │
│  │            │  │  └──────────────────────────────────┘   │
│  └────────────┘  │                                           │
│                  │  ┌──────────────────────────────────┐   │
│  ┌────────────┐  │  │                                   │   │
│  │ Base URL   │  │  │     LIVE BROWSER                  │   │
│  │            │  │  │     (Your Website)                │   │
│  └────────────┘  │  │                                   │   │
│                  │  │  Captures clicks, types, etc.     │   │
│  🔴 Start        │  │                                   │   │
│  Recording       │  └──────────────────────────────────┘   │
│                  │                                           │
│  ───────────────  │  When recording, every interaction       │
│  Recorded Steps:  │  is automatically captured!              │
│                  │                                           │
│  1. 🌐 Navigate  │                                           │
│     example.com  │                                           │
│                  │                                           │
│  2. 👆 Click     │                                           │
│     Login Button │                                           │
│                  │                                           │
│  3. ⌨️ Type      │                                           │
│     username     │                                           │
│                  │                                           │
│  ───────────────  │                                           │
│  ▶️ Playback     │                                           │
│  💾 Save Test    │                                           │
│  📥 Export       │                                           │
│  </> Show Code   │                                           │
└──────────────────┴──────────────────────────────────────────┘
```

---

## 📝 **How to Use (Step by Step)**

### **1. Create New Test**

Navigate to:
```
Automation Hub → Web Automation → Click "Create Your First Test Flow"
```

You'll see the **Recorder Interface**

### **2. Set Up Your Test**

```
┌─────────────────────┐
│ Test Name           │
│ [Login Test Flow]   │
└─────────────────────┘

┌─────────────────────┐
│ Base URL            │
│ [https://myapp.com] │
└─────────────────────┘
```

### **3. Start Recording**

Click the big red button:
```
🔴 Start Recording
```

The browser loads in the right panel!

### **4. Interact with Your App**

Do whatever you want to test:
- Click buttons
- Fill forms
- Navigate pages
- Submit data

**Everything is automatically recorded!** ✨

### **5. See Steps Appear**

Left panel updates in real-time:
```
Recorded Steps (5)

#1 🌐 Navigate
   https://myapp.com

#2 👆 Click
   Login button
   #login-btn

#3 ⌨️ Type
   Type: user@example.com
   input[name="email"]

#4 ⌨️ Type
   Type: password123
   input[name="password"]

#5 👆 Click
   Submit button
   button[type="submit"]
```

### **6. Stop Recording**

Click:
```
⏹️ Stop
```

### **7. Edit Steps (Optional)**

- Click any step to select it
- Click ✏️ to edit
- Click 🗑️ to delete
- Drag to reorder

### **8. Playback Test**

Click:
```
▶️ Playback
```

Watch your test run automatically!

### **9. View Generated Code**

Click:
```
</> Show Code
```

See the Playwright code:
```javascript
// Login Test Flow
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://myapp.com');
  await page.click('#login-btn');
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await browser.close();
})();
```

### **10. Save or Export**

**Option A: Save to CogniTest**
```
💾 Save Test
```

**Option B: Export JSON**
```
📥 Export
```

**Option C: Copy Code**
```
📋 Copy Code
```

---

## 🎯 **Key Features**

### **1. Automatic Selector Detection**
- Smart selector generation
- Uses best practices:
  - IDs first
  - Data attributes second
  - Class names third
  - XPath as fallback

### **2. Visual Feedback**
```
Recording 🔴 (animated pulse)
```

### **3. Step Management**
- Edit any step
- Delete steps
- Reorder steps
- Add manual steps

### **4. Code Generation**
- Playwright format
- Clean, readable code
- Copy with one click
- Use in CI/CD

### **5. Export Formats**
- JSON (portable format)
- Playwright code
- CogniTest format

---

## 🎨 **Step Types & Icons**

| Type | Icon | Description | Example |
|------|------|-------------|---------|
| Navigate | 🌐 | Go to URL | `https://example.com` |
| Click | 👆 | Click element | `Login button` |
| Type | ⌨️ | Enter text | `username123` |
| Select | 📋 | Dropdown select | `United States` |
| Hover | 👁️ | Mouse hover | `Menu item` |
| Wait | ⏰ | Delay | `2 seconds` |
| Assert | ✓ | Validate | `Check text present` |
| Scroll | ↕️ | Scroll page | `Scroll to bottom` |

---

## 💡 **Pro Tips**

### **Tip 1: Use Meaningful Names**
```
❌ Bad: "Test 1"
✅ Good: "Login Flow - Valid Credentials"
```

### **Tip 2: Add Waits**
After dynamic content:
```
1. Click "Load More"
2. Wait 2 seconds  ← Add this!
3. Assert "New items visible"
```

### **Tip 3: Test Base URL First**
Make sure it loads before recording!

### **Tip 4: Keep Tests Short**
Aim for 5-10 steps per test.
Multiple short tests > One long test

### **Tip 5: Use Playback**
Test your recording before saving!

---

## 🔄 **Workflow Comparison**

### **Old Way (Manual Coding)**
```
1. Write Playwright code
2. Figure out selectors
3. Debug syntax errors
4. Test manually
5. Repeat...
⏱️ Time: 30-60 minutes
```

### **New Way (Recorder)**
```
1. Click "Start Recording"
2. Use your app normally
3. Click "Stop"
4. Click "Save"
⏱️ Time: 2-5 minutes
```

**15x faster!** 🚀

---

## 🎬 **Example Workflows**

### **Example 1: Login Test**
```
1. Navigate to /login
2. Type email
3. Type password
4. Click Login button
5. Assert "Dashboard" visible
```

### **Example 2: Checkout Flow**
```
1. Navigate to /products
2. Click "Add to Cart"
3. Click cart icon
4. Click "Checkout"
5. Fill shipping form
6. Click "Place Order"
7. Assert "Order Confirmed"
```

### **Example 3: Search Test**
```
1. Navigate to homepage
2. Type in search box
3. Click search button
4. Assert results appear
5. Click first result
6. Assert product page loaded
```

---

## 🔧 **Technical Details**

### **How It Works**

1. **IFrame Injection**
   - Loads your website in iframe
   - Injects recorder script
   - Captures DOM events

2. **Event Listeners**
   - Click events
   - Input events
   - Navigation events
   - Form submissions

3. **Selector Generation**
   - Analyzes element
   - Generates unique selector
   - Validates uniqueness
   - Stores alternatives

4. **Step Recording**
   - Captures action type
   - Records timestamp
   - Saves element info
   - Generates screenshot

---

## 📊 **Recording vs Flow Builder**

| Feature | Recorder (Supatest-style) | Flow Builder |
|---------|--------------------------|--------------|
| **Interface** | Browser + Steps List | Drag & Drop Canvas |
| **Learning Curve** | None | Moderate |
| **Speed** | Very Fast ⚡ | Medium |
| **Flexibility** | Medium | High |
| **Best For** | Quick tests | Complex flows |
| **Code Generation** | Automatic | Manual config |

**We now have the Recorder!** 🎉

---

## 🚀 **Try It Now!**

1. **Navigate**:
   ```
   http://localhost:3000/organizations/{your-org}/projects/{your-project}/automation-hub/web-automation
   ```

2. **Click**: "Create Your First Test Flow"

3. **You'll see**: The new Recorder interface!

4. **Start Recording** and interact with any website!

---

## 🎨 **Screenshot Guide**

### **Before Recording**
```
Left: Empty steps list
Right: "Browser Preview" placeholder
Button: 🔴 Start Recording (Red)
```

### **During Recording**
```
Left: Steps appearing in real-time
Right: Live browser with your website
Badge: 🔴 Recording (pulsing)
Button: ⏸️ Pause / ⏹️ Stop
```

### **After Recording**
```
Left: Full list of captured steps
Right: Still shows browser
Buttons: ▶️ Playback, 💾 Save, 📥 Export
```

---

## ✅ **What You Have Now**

✅ Supatest-style recorder interface  
✅ Record browser interactions automatically  
✅ Visual step list with icons  
✅ Live browser preview  
✅ Edit/delete steps  
✅ Playback functionality  
✅ Code generation (Playwright)  
✅ Export to JSON  
✅ Save to CogniTest  
✅ Copy code to clipboard  

---

**Status**: ✅ Recorder-based interface ready!  
**Style**: Just like Supatest!  
**Action**: Refresh and try it now!

---

*Last Updated: December 1, 2024*
