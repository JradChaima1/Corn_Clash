# Popcorn Catch - Complete Game Mechanics

## Assets Required

Place these images in `src/client/public/assets/`:

- `kitchen backgorund.png` - Kitchen background scene
- `counter.png` - Kitchen counter platform
- `larger pot.png` - Cooking pot that spawns popcorn
- `empty_pop_corn_cup.png` - Player character (popcorn cup)
- `single corn.png` - Individual popcorn piece

## Physics & Gameplay

### Popcorn Spawning
- **Spawn Rate**: 1 piece every 0.8-1.2 seconds (randomized)
- **Spawn Location**: Center of pot
- **Launch Velocity**:
  - Horizontal: 100-250 pixels/sec (random direction)
  - Vertical: -300 to -450 pixels/sec (upward)
- **Gravity**: 300 pixels/sec² (arcade physics)
- **Rotation**: Random angular velocity (-200 to 200 deg/sec)
- **Bounce**: 0.3 coefficient
- **Destruction**: Auto-remove when off-screen

### Collision Detection
- **Detection Method**: Overlap between player and popcorn
- **Collision Radius**: ~60 pixels
- **On Catch**:
  - +1 point to player score
  - Popcorn destroyed
  - Catch animation triggered
  - Particle effect spawned
  - Flash effect displayed

### Scoring
- **Points**: +1 per caught popcorn
- **Display**: Real-time score updates
- **Tracking**: Independent scores for each player

### Game Timer
- **Duration**: 60 seconds
- **Format**: MM:SS (e.g., "01:00", "00:45")
- **Display**: Top center of screen
- **End Condition**: Timer reaches 00:00
- **Winner**: Highest score (or "Tie" if equal)

## Animations & Visual Effects

### Pot Animation
- **Horizontal Wobble**: ±4 pixels, 80ms cycle
- **Vertical Wobble**: ±2 pixels, 100ms cycle
- **Rotation**: ±2 degrees, 120ms cycle
- **Easing**: Sine.easeInOut
- **Loop**: Continuous

### Popcorn Animation
- **Rotation**: Continuous spin while airborne
- **Physics**: Realistic arc trajectory
- **Velocity**: Affected by gravity

### Player Idle Animation
- **Vertical Bounce**: ±2 pixels
- **Duration**: 800ms cycle
- **Easing**: Sine.easeInOut
- **Loop**: Continuous

### Catch Animation
- **Scale**: Grows to 110% (0.55 scale)
- **Duration**: 100ms
- **Yoyo**: Returns to normal size
- **Easing**: Back.easeOut

### Particle Effects
- **Trigger**: On successful catch
- **Count**: 8 particles
- **Speed**: 50-150 pixels/sec
- **Scale**: 0.3 → 0 (fade out)
- **Lifespan**: 400ms
- **Gravity**: 200 pixels/sec²

### Flash Effect
- **Shape**: Circle, 20px radius
- **Color**: Yellow (#FFFF00)
- **Alpha**: 0.6 → 0
- **Scale**: 1 → 2
- **Duration**: 200ms

### Screen Shake
- **Trigger**: Each popcorn launch
- **Duration**: 50ms
- **Intensity**: 0.002 (1-2 pixels)

## Game Modes

### Solo Mode
- **Players**: 1
- **Objective**: Beat your high score
- **Controls**: A/D or Arrow Keys
- **Movement**: Full screen width
- **Character**: Single popcorn cup

### Multiplayer Mode (Online)
- **Players**: 2 (different devices)
- **Objective**: Outscore opponent
- **Controls**: A/D or Arrow Keys (each player)
- **Movement**: 
  - Player 1: Left half of screen
  - Player 2: Right half of screen
- **Characters**: Two popcorn cups (color-coded)
- **Sync**: Real-time via server (100ms polling)

### Local 2-Player Mode
- **Players**: 2 (same device)
- **Objective**: Outscore opponent
- **Controls**:
  - Player 1: A/D keys
  - Player 2: Arrow keys
- **Movement**: Split screen (left/right halves)
- **Characters**: Two popcorn cups (color-coded)

## Technical Implementation

### Client-Side (Phaser.js)
- **Physics**: Arcade physics with gravity
- **Rendering**: WebGL/Canvas
- **Input**: Keyboard controls
- **Animations**: Tween-based
- **Particles**: Built-in particle system

### Server-Side (Multiplayer)
- **Game Loop**: 1-second tick rate
- **Physics**: Server-authoritative
- **State Sync**: 100ms client polling
- **Matchmaking**: Automatic pairing
- **Cleanup**: 30-second post-game

## Performance Considerations

- **Max Popcorn**: 50 active pieces
- **Particle Limit**: 8 per catch
- **Update Rate**: 60 FPS (client), 1 Hz (server)
- **Network**: Throttled position updates (every 5 frames)

## Color Scheme

- **Player 1**: Red tint (#FF6B6B)
- **Player 2**: Cyan tint (#4ECDC4)
- **Score**: Gold (#FFD700)
- **Timer**: White (#FFFFFF)
- **Flash**: Yellow (#FFFF00)
- **Background**: Kitchen scene
- **Counter**: Orange/Grey tones
