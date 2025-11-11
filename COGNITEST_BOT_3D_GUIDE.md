# CognitestBot3D - 3D Animated Logo Component

## Overview

**CognitestBot3D** is a production-ready, beautifully animated 3D logo component inspired by the Cognitest bot. It features a glossy spherical design with realistic lighting effects, cute white oval eyes, and smooth animations.

Perfect for:
- Navbar/header branding
- Sidebar logos
- App icons and branding
- Marketing websites
- Product launches

## Features

✨ **Visual Design**
- Glossy, spherical 3D shape with realistic lighting
- Smooth blue gradient (primary color)
- Multiple layers of highlights and shadows for depth
- White oval eyes for minimalistic, cute appearance
- Professional and playful aesthetic

😊 **Four Emotion States**
- **Happy**: Normal eyes with subtle smile
- **Surprised**: Bigger eyes with open mouth (O shape)
- **Thinking**: One eye looking up, contemplative line, thinking bubbles
- **Sad**: Droopy eyes with frown and tear drops

🎬 **Animations**
- **Floating**: Gentle up-and-down bobbing motion (3s cycle)
- **Blinking**: Natural eye blinking animation (5s cycle)
- **Wobbling**: Subtle rotation for personality (6s cycle)
- **Pulse**: Glow effect on hover for interactivity
- **Emotion Fade**: Smooth transition when changing emotions (300ms)
- All animations loop smoothly and continuously

🖱️ **Interaction**
- **Click to cycle emotions**: Happy → Surprised → Thinking → Sad → Happy
- **Keyboard support**: Enter or Space key to change emotion
- **Hover effect**: Scale up and pulse glow
- **Accessibility**: ARIA labels and title attributes

⚡ **Technical**
- Pure SVG (scalable, lightweight, no dependencies)
- CSS animations (smooth 60fps performance)
- TypeScript (fully typed with interfaces)
- Responsive sizing (40-200px+)
- Dark mode compatible
- Production-ready with comprehensive comments

## Installation

The component is already integrated into the CogniTest-AI project. Located at:

```
frontend/components/ui/CognitestBot3D.tsx
```

## Usage

### Basic Usage (Interactive with Emotions)

```tsx
import CognitestBot3D from '@/components/ui/CognitestBot3D';

export default function App() {
  return <CognitestBot3D />;
  // Click the bot to cycle through emotions!
}
```

### With Custom Size

```tsx
<CognitestBot3D size={50} />
```

### In Navbar

```tsx
<nav className="flex items-center gap-3 p-4">
  <CognitestBot3D size={48} />
  <h1 className="text-xl font-bold">CogniTest</h1>
</nav>
```

### With Custom Styling

```tsx
<CognitestBot3D
  size={60}
  className="hover:drop-shadow-lg transition-all"
/>
```

### Static (No Animation, Still Interactive)

```tsx
<CognitestBot3D size={50} animate={false} />
```

## Component API

### Props

```typescript
interface CognitestBot3DProps {
  /** Size of the bot in pixels (default: 50px, recommended: 40-60px) */
  size?: number;

  /** Optional CSS class for additional styling */
  className?: string;

  /** Whether to show animation (default: true) */
  animate?: boolean;
}
```

### Examples

```tsx
// Default (50px, animated, interactive)
<CognitestBot3D />

// Custom size (60px, animated)
<CognitestBot3D size={60} />

// Static version (no animation, emotions still clickable)
<CognitestBot3D size={50} animate={false} />

// With className
<CognitestBot3D size={48} className="my-logo" />

// Full customization
<CognitestBot3D
  size={55}
  animate={true}
  className="hover:scale-110 transition-transform"
/>
```

## Emotions & Interaction

### Four Emotion States

The bot cycles through four unique emotions when clicked:

| Emotion | Visual | Interaction |
|---------|--------|-------------|
| **Happy** 😊 | Normal eyes + subtle smile | First state (default) |
| **Surprised** 😲 | Bigger eyes + O-shaped mouth | Click once |
| **Thinking** 🤔 | One eye up + contemplative line + bubbles | Click twice |
| **Sad** 😢 | Droopy eyes + frown + tear drops | Click three times |

### How to Trigger Emotions

**Click anywhere on the bot:**
```tsx
<CognitestBot3D size={50} />
// Click → Surprised
// Click → Thinking
// Click → Sad
// Click → Happy (repeats cycle)
```

**Using keyboard:**
- Press **Enter** or **Space** key to cycle emotions
- Works when bot has focus (Tab key navigates to it)

**Hover effect:**
- The bot scales up slightly (1.1x)
- Shows pulse glow effect
- Visual feedback for clickability

### Emotion Details

#### Happy 😊
- Normal-sized oval white eyes
- Eyes positioned at standard height
- Subtle upward curved mouth
- Natural, friendly appearance
- Default starting emotion

#### Surprised 😲
- **Bigger eyes** (26px radius instead of 22px)
- Eyes positioned higher (cy=85 instead of 90)
- **Open O-shaped mouth** (circle at bottom)
- Wide-eyed, amazed expression
- Great for loading or exciting states

#### Thinking 🤔
- **Left eye looking up** (positioned at cy=75)
- Right eye stays normal (cy=90)
- Horizontal contemplative mouth line
- **Thinking bubbles** above head (blue circles)
- Perfect for processing/waiting states

#### Sad 😢
- **Droopy eyes** (positioned lower, cy=98)
- Downward curved mouth (frown)
- **Tear drops** on both sides
- Smaller eye shine (showing sadness)
- Use for errors or completion states

### Smooth Transitions

- All emotion changes fade smoothly (300ms)
- Eyes blink continuously during all emotions
- Body continues floating animation
- Personality wobble continues
- No jarring transitions

### Accessibility

```tsx
// The component has built-in accessibility:
// - ARIA labels for screen readers
// - Keyboard support (Enter/Space)
// - Title attribute shows current emotion
// - Focus ring for keyboard navigation
```

## Animation Details

### Floating Animation
- **Duration**: 3 seconds
- **Movement**: ±4px vertical
- **Easing**: ease-in-out
- **Effect**: Gentle, natural bobbing motion
- **Loop**: Infinite

### Blinking Animation
- **Duration**: 5 seconds
- **Eyes**: Both eyes blink together
- **Offset**: Right eye blinks 0.3s after left eye (natural feel)
- **Blink Duration**: ~0.3 seconds (smooth scaleY)
- **Loop**: Infinite

### Wobbling Animation
- **Duration**: 6 seconds
- **Rotation**: ±1 degree
- **Easing**: ease-in-out
- **Effect**: Subtle personality wobble
- **Loop**: Infinite

### Pulse on Hover
- **Duration**: 2 seconds
- **Effect**: Box shadow glow intensifies
- **Color**: Blue (#4A90E2) with varying opacity
- **Trigger**: Hover state

## 3D Lighting System

The component uses SVG gradients to create realistic 3D depth:

### Radial Gradients

1. **Main Sphere Gradient**
   - Top-left: Bright white highlight (glossy)
   - Middle: Primary blue (#4A90E2)
   - Edges: Dark blue (#2E5C8A) for dimension

2. **Depth Enhancement Gradient**
   - Subtle semi-transparent overlay
   - Creates additional depth perception

3. **Secondary Highlights**
   - Small bright spot (ultra-glossy effect)
   - Large elliptical highlight (general shine)

### Shadows

- **Drop Shadow**: Below the sphere (floating effect)
- **Bottom Shadow**: Dark overlay at bottom-right (depth)
- **Eye Shadows**: Subtle shadows under eyes

## Color Scheme

### Primary Colors
- **Main Body**: Blue (#4A90E2)
- **Dark Shade**: #2E5C8A
- **Highlight**: White/Light colors with opacity

### Secondary Elements
- **Eyes**: White (#FFFFFF) with 95% opacity
- **Shine**: White with varying opacity (40%-70%)
- **Mouth Hint**: Blue with 20% opacity

## Responsive Sizing

Recommended sizes for different contexts:

| Context | Size | Notes |
|---------|------|-------|
| **Favicon** | 40px | Small, still visible |
| **Navbar Logo** | 48-50px | Default, perfect balance |
| **Sidebar** | 48-60px | Common in dashboards |
| **Banner/Hero** | 80-100px | Large, prominent |
| **Full Hero Image** | 150-200px | Max size, HD quality |

The component scales infinitely due to SVG format. All sizes above 200px work fine but may look less prominent.

## Performance

### File Size
- Component file: ~8 KB (uncompressed)
- SVG inline: ~3 KB
- CSS animations: Embedded
- **Total**: Very lightweight

### Performance Metrics
- **Animations**: Pure CSS (GPU accelerated)
- **Frame Rate**: 60fps on most devices
- **Memory**: Minimal (no canvas, no heavy computations)
- **Compatibility**: All modern browsers

### Browser Support
✅ Chrome/Edge 90+
✅ Firefox 88+
✅ Safari 14+
✅ Mobile browsers (iOS Safari 14+, Chrome Android)

## Dark Mode Support

The component works perfectly in dark mode without any changes:

```tsx
// Light mode
<CognitestBot3D size={50} />

// Dark mode (automatic)
<CognitestBot3D size={50} />
```

The blue colors work well on both light and dark backgrounds due to the glossy highlight effect.

## Customization

### Changing Colors

To customize the bot color, edit the radial gradients in the SVG `<defs>`:

```tsx
<stop offset="40%" style={{ stopColor: '#FF6B6B' }} /> {/* Change main color */}
<stop offset="100%" style={{ stopColor: '#8B3A3A' }} /> {/* Change dark shade */}
```

### Changing Animation Speed

Modify the animation duration in the `<style>` block:

```css
@keyframes float {
  /* Change 3s to your desired duration */
  /* Slower = 4s, 5s, 6s */
  /* Faster = 1s, 2s */
}
```

### Disabling Animations

Set `animate={false}`:

```tsx
<CognitestBot3D animate={false} />
```

Or disable specific animations by removing them from the CSS.

## Advanced Usage

### With Click Handler

```tsx
const [scale, setScale] = React.useState(1);

const handleClick = () => {
  setScale(s => s === 1 ? 1.2 : 1);
};

return (
  <div
    onClick={handleClick}
    style={{ transform: `scale(${scale})`, transition: '0.3s' }}
  >
    <CognitestBot3D size={50} />
  </div>
);
```

### With Dynamic Size

```tsx
const [size, setSize] = React.useState(50);

return (
  <>
    <input
      type="range"
      min="30"
      max="150"
      value={size}
      onChange={(e) => setSize(Number(e.target.value))}
    />
    <CognitestBot3D size={size} />
  </>
);
```

### Conditional Animation

```tsx
const [isAnimating, setIsAnimating] = React.useState(true);

return (
  <CognitestBot3D size={50} animate={isAnimating} />
);
```

## Integration Examples

### In Header/Navbar

```tsx
import CognitestBot3D from '@/components/ui/CognitestBot3D';

export function Header() {
  return (
    <header className="border-b px-6 py-4 flex items-center gap-3">
      <CognitestBot3D size={48} />
      <h1 className="text-2xl font-bold text-gray-900">
        Cogni<span className="text-blue-500">Test</span>
      </h1>
    </header>
  );
}
```

### In Sidebar (Current Implementation)

```tsx
<div className="p-4 flex items-center gap-3 border-b">
  <CognitestBot3D size={48} />
  {!isCollapsed && (
    <h1 className="text-lg font-bold">CogniTest</h1>
  )}
</div>
```

### In Marketing Page

```tsx
<section className="text-center py-20">
  <div className="mb-8 flex justify-center">
    <CognitestBot3D size={100} />
  </div>
  <h1 className="text-4xl font-bold">Welcome to CogniTest</h1>
  <p className="text-gray-600 mt-4">AI-Powered Testing Platform</p>
</section>
```

### With Animation Toggle

```tsx
const [isAnimating, setIsAnimating] = React.useState(true);

return (
  <div className="flex flex-col items-center gap-4">
    <CognitestBot3D size={60} animate={isAnimating} />
    <button
      onClick={() => setIsAnimating(!isAnimating)}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      {isAnimating ? 'Pause' : 'Play'} Animation
    </button>
  </div>
);
```

## Troubleshooting

### Animation Not Working

1. **Check CSS support**: Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+)
2. **Check animate prop**: Make sure `animate={true}` (default)
3. **Check browser DevTools**:
   - Open Animations tab
   - Verify animations are playing
   - Check for CSS errors

### Colors Look Different

1. **Check color settings**: Verify gradient stops are correct
2. **Check theme mode**: May appear different in dark mode
3. **Check opacity**: Highlights use transparency effects
4. **Clear cache**: Hard refresh browser (Ctrl+Shift+Delete)

### Component Not Displaying

1. **Check import path**: Verify path matches your project structure
2. **Check file exists**: `frontend/components/ui/CognitestBot3D.tsx`
3. **Check TypeScript errors**: Run `tsc` to check for errors
4. **Check console**: Look for error messages

### Size Issues

1. **Too small**: Increase `size` prop (minimum 40px recommended)
2. **Too large**: Container may have max-width, adjust parent
3. **Distorted**: Check `preserveAspectRatio="xMidYMid meet"` is set
4. **Responsive issues**: Use CSS media queries to adjust size

## Future Enhancements

Possible improvements for future versions:

- 🎨 **Multiple color themes**: Red, green, purple, etc.
- 😊 **Emotion variants**: Happy, sad, thinking faces (with eye movement)
- 🔄 **360° rotation animation**: Slowly spinning bot
- 🎵 **Sound effects**: Optional audio on hover/click
- 📱 **Mobile gestures**: Tap to trigger special animations
- ⚙️ **Customization UI**: Color picker, animation speed control
- 🌟 **Special effects**: Particle effects, sparkles
- 🎯 **Interactive eyes**: Eyes follow mouse cursor
- 💫 **Loading state**: Animated loading spinner variant

## Performance Optimization

### Current Optimizations
✅ Pure SVG (no rasterization)
✅ CSS animations (GPU accelerated)
✅ Minimal DOM elements
✅ No JavaScript animations
✅ Inline styles (no external CSS)
✅ Lazy loading via Next.js

### Best Practices
1. **Use appropriate size**: Don't use 200px when 50px needed
2. **Disable animation when not needed**: `animate={false}`
3. **Use production build**: Minified CSS, smaller file sizes
4. **Cache SVG**: Browser caches inline SVGs
5. **Monitor performance**: Check DevTools Performance tab

## Code Quality

✅ **TypeScript**: Fully typed with interfaces
✅ **Comments**: Comprehensive JSDoc comments
✅ **Accessibility**: ARIA labels, semantic HTML
✅ **Standards**: Follows React best practices
✅ **Testing**: Ready for unit/integration tests
✅ **Production-Ready**: No console warnings/errors

