# Copy Button Visual Guide

## Button Styles by Component

### 1. Test Plan Card & Modal Header (Full Button)
```
┌─────────────────────────────────────────┐
│  [TP-001] [📋 Copy]                     │
│   Badge    Button                       │
└─────────────────────────────────────────┘
```
**Features:**
- Icon + "Copy" text
- `px-2 py-1` padding
- Hover: gray background

---

### 2. Test Suite Card (Compact with Icon)
```
┌─────────────────────────────────────────┐
│  Test Suite Name                        │
│  [TP-001-TS-001] [📋]  [🔗 Linked]      │
│   Badge           Copy   Link Badge     │
└─────────────────────────────────────────┘
```
**Features:**
- Icon only (no text)
- `px-1.5 py-0.5` padding (smaller)
- NEW: Now shows human_id!

---

### 3. Test Case Card (Compact with Icon)
```
┌─────────────────────────────────────────┐
│  [▶] [TP-001-TS-001-TC-001] [📋]        │
│  Exp.  Badge                Copy        │
│  Test Case Title                        │
└─────────────────────────────────────────┘
```
**Features:**
- Icon only (no text)
- `px-1.5 py-0.5` padding
- Compact for inline display

---

### 4. Hierarchical View - Test Suites
```
┌─────────────────────────────────────────┐
│  📁 Smoke Test Suite                    │
│     [TP-001-TS-001] [📋 Copy]           │
└─────────────────────────────────────────┘
```
**Features:**
- Icon + "Copy" text
- Full button style
- Clear hierarchy indication

---

### 5. Hierarchical View - Test Cases
```
┌─────────────────────────────────────────┐
│    ├─ [TP-001-TS-001-TC-001] [📋]       │
│       Verify login functionality        │
└─────────────────────────────────────────┘
```
**Features:**
- Icon only (compact)
- Nested under suite
- Space-efficient

---

## Color Scheme

### Human ID Badges
- **Background**: `bg-gradient-to-r from-blue-500 to-blue-600`
- **Text**: `text-white`
- **Border**: `border-blue-600`
- **Font**: `font-mono font-semibold`

### Copy Buttons
- **Default**: `text-gray-600`
- **Hover**: `text-gray-900 bg-gray-100`
- **Border**: `rounded` (smooth corners)
- **Transition**: `transition-colors` (smooth)

---

## Hover States

### Default State:
```
[TP-001] Copy
 ^^^^^^  ^^^^
 Badge   Gray text
```

### Hover State:
```
[TP-001] [Copy]
 ^^^^^^  ^^^^^^
 Badge   Darker + bg
```

---

## Implementation Details

### Full Button HTML:
```tsx
<button
  className="inline-flex items-center gap-1 px-2 py-1 text-xs 
             text-gray-600 hover:text-gray-900 hover:bg-gray-100 
             rounded transition-colors"
>
  <Copy className="w-3 h-3" />
  Copy
</button>
```

### Compact Button HTML:
```tsx
<button
  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs 
             text-gray-600 hover:text-gray-900 hover:bg-gray-100 
             rounded transition-colors"
>
  <Copy className="w-3 h-3" />
</button>
```

---

## Responsive Behavior

All buttons:
- ✅ Click stops event propagation
- ✅ Copies ID to clipboard
- ✅ Shows tooltip on hover
- ✅ Works on touch devices
- ✅ Accessible keyboard navigation

---

**Last Updated**: After Human ID Fix & Copy Button Update
**Consistency**: 100% across all components
