# Design Document

## Overview

This design implements a modern loading screen for the Phaser.js game by enhancing the existing Preloader scene. The loading screen features a centered glowing icon and an animated progress bar with neon effects, displayed on a black background. The implementation leverages Phaser's built-in loading events and graphics capabilities to create a polished visual experience.

## Architecture

### Scene Flow

The current scene flow is: Boot → Preloader → MainMenu

The Boot scene loads minimal assets (including the loading icon), then the Preloader scene displays the loading screen while loading all game assets. This flow will be maintained, with enhancements to the Preloader scene's visual presentation.

### Component Structure

```
Preloader Scene
├── Background (black, full canvas)
├── Icon Display
│   ├── Image (myiconimage.png)
│   └── Glow Effect (shader/post-processing)
└── Progress Bar
    ├── Background Bar (outline)
    ├── Fill Bar (animated)
    └── Neon Glow Effect
```

## Components and Interfaces

### Preloader Scene Enhancement

**File:** `src/client/game/scenes/Preloader.ts`

**Responsibilities:**
- Render black background
- Display centered icon with glow effect
- Create and animate progress bar
- Apply neon/glow visual effects
- Transition to MainMenu on completion

**Key Methods:**

- `init()`: Set up background, icon, and progress bar UI elements
- `preload()`: Load game assets with progress tracking
- `create()`: Transition to MainMenu scene

**Properties:**
- `loadingIcon`: GameObjects.Image - The centered icon
- `progressBar`: GameObjects.Rectangle - The fill bar
- `progressBarBg`: GameObjects.Rectangle - The outline/background

### Boot Scene Update

**File:** `src/client/game/scenes/Boot.ts`

**Current Implementation:**
The Boot scene already loads `myiconimage.png` as 'loadingIcon', which is perfect for our needs.

**No changes required** - the icon is already being loaded in the Boot scene.

## Data Models

No persistent data models are required for this feature. All visual elements are ephemeral and exist only during the loading phase.

## Visual Design Specifications

### Layout

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│            [ICON]                   │  ← Centered icon with glow
│           (glowing)                 │
│                                     │
│     ┌─────────────────────┐         │  ← Progress bar below icon
│     │█████████░░░░░░░░░░░░│         │    (with neon glow)
│     └─────────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

### Dimensions and Positioning

- **Canvas Size:** 800x600 (from game config)
- **Icon Position:** Center (400, 250)
- **Icon Size:** Scale to 128x128 pixels (or maintain aspect ratio)
- **Progress Bar Position:** Center horizontally (400, 380)
- **Progress Bar Size:** 400px width × 20px height
- **Spacing:** 130px between icon center and progress bar

### Color Scheme

- **Background:** #000000 (pure black)
- **Progress Bar Background:** #333333 with 2px stroke #666666
- **Progress Bar Fill:** Linear gradient (#00FFFF → #0080FF)
- **Neon Glow:** Cyan (#00FFFF) with blur effect
- **Icon Glow:** White (#FFFFFF) with soft blur

### Visual Effects

#### Icon Glow Effect

**Implementation:** Phaser PostFX pipeline or multiple layered images with alpha blending

**Approach 1 - PostFX (Preferred):**
```typescript
this.loadingIcon.setPostPipeline('Glow');
```

**Approach 2 - Layered Images:**
- Base icon image
- Duplicate icon with tint and alpha (0.3-0.5)
- Scale duplicate slightly larger (1.1x)
- Animate alpha for pulsing effect

#### Progress Bar Neon Glow

**Implementation:** Multiple rectangle layers with decreasing alpha and increasing size

**Layers:**
1. Inner fill bar (solid color)
2. Glow layer 1 (alpha 0.6, +4px padding)
3. Glow layer 2 (alpha 0.3, +8px padding)
4. Outer stroke (alpha 0.8)

**Animation:** Smooth width transition as progress updates

### Animations

#### Icon Pulse Animation
- **Duration:** 2000ms
- **Effect:** Subtle scale (1.0 → 1.05 → 1.0) and alpha (1.0 → 0.8 → 1.0)
- **Repeat:** Infinite loop
- **Easing:** Sine.easeInOut

#### Progress Bar Fill
- **Duration:** Instant update on progress event
- **Effect:** Width increases from left to right
- **Smoothing:** Tween with 100ms duration for smooth transitions

## Error Handling

### Asset Loading Failures

**Scenario:** Icon image fails to load in Boot scene

**Handling:**
- Display text fallback: "LOADING..."
- Continue with progress bar display
- Log error to console
- Proceed to MainMenu after timeout (5 seconds)

**Implementation:**
```typescript
this.load.on('loaderror', (file) => {
  console.error(`Failed to load: ${file.key}`);
  // Display fallback text
});
```

### Scene Transition Issues

**Scenario:** Preloader scene fails to transition to MainMenu

**Handling:**
- Force transition after 10-second timeout
- Log warning to console

- Ensure game remains playable

## Testing Strategy

### Visual Testing

**Manual Testing Checklist:**
1. Verify black background covers entire canvas
2. Confirm icon is centered and visible
3. Check glow effect is applied to icon
4. Verify progress bar appears below icon
5. Confirm progress bar fills smoothly from 0% to 100%
6. Check neon glow effect on progress bar
7. Verify transition to MainMenu occurs after loading completes
8. Test on different screen sizes (responsive scaling)

### Performance Testing

**Metrics to Monitor:**
- Loading time should not increase significantly (< 100ms overhead)
- Animation frame rate should maintain 60 FPS
- Memory usage should remain stable

**Testing Approach:**
- Use browser DevTools Performance tab
- Monitor FPS during loading screen display
- Check for memory leaks after multiple scene transitions

### Cross-Browser Testing

**Target Browsers:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

**Test Cases:**
- Verify visual effects render correctly
- Check animation smoothness
- Confirm responsive scaling works

### Edge Cases

1. **Very Fast Loading:** Assets load in < 500ms
   - Expected: Loading screen still displays briefly
   - Minimum display time: 500ms

2. **Very Slow Loading:** Assets take > 10 seconds
   - Expected: Progress bar continues to update
   - Timeout: Force transition after 30 seconds

3. **Missing Icon Asset:** Icon fails to load
   - Expected: Fallback text displays
   - Game continues to function

## Implementation Notes

### Phaser Version Compatibility

This design is compatible with Phaser 3.x (current project version). All features use standard Phaser APIs.

### Asset Requirements

- **Icon File:** `assets/myiconimage.png` (already exists)
- **Format:** PNG with transparency
- **Recommended Size:** 256x256 pixels or larger for quality
- **File Size:** Keep under 100KB for fast loading in Boot scene

### Performance Considerations

- Use Phaser's built-in graphics primitives (rectangles) for progress bar
- Avoid complex shaders if performance is impacted
- Limit number of glow layers to 2-3 for optimal performance
- Use hardware-accelerated CSS transforms where possible


## Design Decisions and Rationales

### Decision 1: Enhance Existing Preloader vs. New Scene

**Choice:** Enhance existing Preloader scene

**Rationale:**
- Preloader scene already handles asset loading
- Avoids adding complexity to scene flow
- Maintains existing Boot → Preloader → MainMenu pattern
- Reduces code duplication

### Decision 2: Glow Effect Implementation

**Choice:** Use layered images with alpha blending (fallback to PostFX if needed)

**Rationale:**
- Layered approach is more compatible across devices
- PostFX may not be supported on all mobile browsers
- Provides consistent visual result
- Easier to debug and adjust

### Decision 3: Progress Bar Style

**Choice:** Horizontal bar with neon glow and gradient fill

**Rationale:**
- Horizontal bars are universally understood
- Neon aesthetic matches modern game design trends
- Gradient adds visual interest without complexity
- Easy to implement with Phaser rectangles

### Decision 4: Black Background

**Choice:** Pure black (#000000) background

**Rationale:**
- Makes glow effects more prominent
- Creates high contrast with bright elements
- Common in modern loading screens
- Reduces eye strain during loading

### Decision 5: Minimal Text

**Choice:** No loading percentage text, only visual progress bar

**Rationale:**
- Cleaner, more modern aesthetic
- Progress bar provides sufficient feedback
- Reduces visual clutter
- Matches user's request for icon + progress bar only

## Responsive Design

### Mobile Considerations

- Icon scales proportionally to screen size
- Progress bar width adjusts to 80% of screen width (max 400px)
- Maintain aspect ratio for icon
- Touch-friendly spacing (no interaction required)

### Desktop Considerations

- Fixed canvas size (800x600) with FIT scaling mode
- Elements positioned relative to canvas center
- Glow effects optimized for larger displays
