# Popcorn Catch 🍿

A fast-paced arcade game where you catch flying popcorn kernels as they explode from a shaking pot! Built with Phaser.js and running natively on Reddit, this game offers both solo high-score challenges and real-time online multiplayer battles with automatic matchmaking.

**Play it on Reddit** - No downloads, no external websites. Just click and play directly in Reddit posts!

---

---

## What Is This Game?

**Popcorn Catch** is a physics-based arcade game where players control a popcorn cup to catch kernels launching from an animated cooking pot. The game features realistic physics with randomized trajectories, gravity, and rotation for each popcorn piece. Players must position their cup strategically to intercept falling kernels within a 60-second time limit.

The game runs entirely within Reddit posts using Devvit's web framework, requiring no downloads or external websites. It features two distinct game modes: a solo mode for personal high-score challenges, and an online multiplayer mode where two players compete head-to-head in real-time with automatic matchmaking.

### Core Gameplay Loop
1. Popcorn kernels launch from a shaking pot with random velocities and spin
2. Players move their cup left/right to catch falling kernels
3. Each catch awards points with satisfying visual feedback (particles, flash effects)
4. Special colored popcorn awards bonus points (red +10, blue +20)
5. 60-second timer creates intense, fast-paced sessions
6. Game ends with final score display and options to replay or return to menu

### Key Features
- **Dynamic Physics**: Each popcorn kernel (40x40px) launches with unique velocity (100-250 px/s horizontal, -300 to -450 px/s vertical) and random spin (-200 to 200 deg/s)
- **Bonus Popcorn System**: 70% normal (+1 point), 20% red (+10 points), 10% blue (+20 points) with color-coded visual indicators
- **Arcade Physics Engine**: Phaser's built-in system with 300 px/s² gravity creates realistic arcing trajectories with 0.3 bounce coefficient
- **Responsive Controls**: Smooth keyboard controls (A/D or Arrow keys) with 300 px/s movement speed, plus mobile touch controls (80px diameter on-screen buttons)
- **Visual Feedback**: 8-particle bursts, expanding flash effects (20px → 40px), score popups for special popcorn, and subtle screen shake (2px, 50ms) on every launch
- **Time Pressure**: 60-second countdown (displayed in MM:SS format) creates intense, fast-paced gameplay sessions

---

## What Makes This Game Innovative

### 🎮 Reddit-Native Gaming Platform
- Runs entirely within Reddit posts using Devvit's web framework - no external websites needed
- Zero downloads or installations - click the post and play instantly
- Seamlessly integrated into the Reddit browsing experience
- Players can compete without leaving the platform
- Built with Phaser.js for smooth 60 FPS gameplay in the browser
- 800x600 canvas with responsive scaling adapts to any screen size
- Professional loading screen with:
  - Centered 128x128px game icon with glowing pulsing animation
  - Real-time cyan-to-blue gradient progress bar with rounded corners
  - Smooth glow effects with multi-layer depth
  - 30-second timeout protection with automatic fallback

### 🎯 Dual Game Mode Architecture
- **Solo Mode**: Single-player arcade challenge with full-screen movement (100x100px cup)
- **Multiplayer Mode**: Real-time online PvP with split-screen territories (100x100px cups, color-coded)
- Shared physics engine and visual effects across both modes
- Smooth scene transitions via intuitive menu system (Boot → Preloader → MainMenu → ModeSelect → Game)
- Separate game over screens tailored to each mode (SoloGameOver vs MultiplayerGameOver)
- Mobile-friendly touch controls with on-screen left/right buttons

### ⚡ Instant Multiplayer Matchmaking
- Zero-friction entry: click "Multiplayer" and you're matched automatically
- No room codes, friend invites, or lobby management needed
- Server maintains a queue in Redis and pairs players as they join
- **Ready State System**: Both players must confirm readiness before game starts
  - Visual lobby with "Waiting for opponent..." status and pulsing animation
  - Green "READY!" button appears when both players are connected
  - 30-second ready timeout with automatic reset if players don't confirm
  - Games begin immediately when both players signal ready
- 60-second matchmaking timeout prevents indefinite waiting
- Self-match prevention ensures players can't join their own games
- "Back to Menu" button available during waiting for easy exit

### 🎲 Server-Authoritative Multiplayer
- All game logic runs on the server to prevent cheating
- Server uses Redis for persistent game state storage with atomic operations
- Ready state system with 30-second timeout ensures fair game starts
- Clients poll game state every 166ms (10 frames) during gameplay for smooth synchronization
- Both players see identical game state with server-controlled start time
- Position updates throttled to every 10 frames to reduce network load
- Score updates sent immediately on catch for real-time feedback
- Activity tracking with 3-second disconnect detection threshold
- Automatic game cleanup on disconnect or completion (2-minute TTL expiry)
- Race condition prevention using Redis WATCH/MULTI/EXEC transactions
- Duplicate join prevention and self-match protection
- Graceful disconnect handling with "OPPONENT LEFT" message and 3-second countdown

### 🏆 Split-Screen Territory System (Multiplayer)
- Multiplayer divides the 800px screen into two equal zones (400px each)
- Player 1 (red tint) controls left half (x: 50-350), Player 2 (cyan tint) controls right half (x: 450-750)
- Hard boundaries prevent crossing into opponent's territory
- Pot positioned at center creates contested zone for kernels
- Each player only scores when THEIR cup catches popcorn

---

## Tech Stack

- **[Devvit](https://developers.reddit.com/)**: Reddit's developer platform for building immersive apps
- **[Phaser.js](https://phaser.io/)**: 2D game engine with Arcade Physics system
- **[Vite](https://vite.dev/)**: Lightning-fast build tool for the webview
- **[Express](https://expressjs.com/)**: Backend API server with multiplayer game state manager
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe development across client and server
- **[Redis](https://redis.io/)**: Data persistence layer (via Devvit)
- **Node.js 22+**: Required runtime for Devvit platform

---

## How to Play

### Getting Started

1. **Launch the Game**: Open the Reddit post containing Popcorn Catch
2. **Wait for Loading**: The game displays a modern loading screen with:
   - Animated 128x128px game icon with glowing pulsing effect
   - Real-time cyan-to-blue gradient progress bar showing asset loading
   - Smooth multi-layer glow effects
   - Automatic 30-second timeout protection
3. **Main Menu**: Click the "Play" button to continue to mode selection
4. **Mode Selection**: Choose your preferred game mode:
   - **SOLO MODE**: "Play alone and beat your high score!" (Red button)
   - **MULTIPLAYER**: "Compete against another player online!" (Cyan button)
   - **Main Menu**: Return to the main menu (Green button at bottom)

### 🎮 Solo Mode

**Objective**: Catch as many popcorn kernels as possible in 60 seconds!

#### Controls
- **Keyboard**: 
  - **A** or **← Left Arrow**: Move your cup left
  - **D** or **→ Right Arrow**: Move your cup right
- **Mobile Touch**: 
  - Tap and hold the **◄ button** (bottom-left) to move left
  - Tap and hold the **► button** (bottom-right) to move right
- **Menu Access**: Click the "Menu" button in the top-right corner to return to main menu

#### Gameplay Mechanics

**Your Character**: You control a 100x100 pixel popcorn cup that can move freely across the entire screen width (x: 50-750) at 300 px/s speed.

**Kitchen Scene**: 
- Animated kitchen background with counter and shaking cooking pot
- Pot continuously wobbles with multi-axis animation (horizontal shake, vertical bounce, rotation)
- Pot acts as a physics obstacle that blocks player movement

**Popcorn Spawning**: 
- Kernels launch from the shaking pot positioned at screen center
- Spawn rate: Every 0.4-0.7 seconds (randomized for unpredictability)
- Popcorn size: 40x40 pixels with realistic physics
- Launch physics: Random horizontal velocity (100-250 px/s), upward launch (-300 to -450 px/s), with angular spin (-200 to 200 deg/s)
- Kernels have 0.3 bounce coefficient and are affected by 300 px/s² gravity

**Catching Popcorn**:
- Position your cup to intercept falling kernels using collision detection
- **Three types of popcorn with different point values:**
  - **Normal (white)**: +1 point (70% spawn rate)
  - **Red**: +10 points (20% spawn rate) - shows "+10" popup on catch
  - **Blue**: +20 points (10% spawn rate) - shows "+20" popup on catch
- Maximum 50 active popcorn kernels on screen at once
- Caught kernels immediately deactivate to prevent double-counting
- Kernels automatically despawn when they fall off-screen

**Visual Feedback**:
- **Particle Burst**: 8 popcorn particles explode from the catch point with physics
- **Flash Effect**: Color-coded circle (yellow/red/blue) expands from 20px to 40px and fades
- **Score Popups**: Floating "+10" or "+20" text for special popcorn that rises and fades
- **Screen Shake**: Subtle 2px shake for 50ms when popcorn launches
- **Idle Animation**: Your cup gently floats up and down (2px over 800ms)
- **Pot Animation**: Continuous multi-axis wobble creates dynamic launching effect

**UI Elements**:
- **Timer**: Top center in MM:SS format (starts at 01:00, counts down to 00:00)
- **Score**: Top-left in gold text - "Score: X"
- **Menu Button**: Top-right corner for quick exit to main menu

**Game Over**: After 60 seconds, view your final score with options to:
- **Play Again**: Restart solo mode immediately
- **Main Menu**: Return to mode selection

### 👥 Multiplayer Mode

**Objective**: Outscore your opponent by catching more popcorn in 60 seconds!

#### Matchmaking Process

1. Select **MULTIPLAYER** from mode selection
2. Enter the **Matchmaking Lobby** (shows "Waiting for opponent..." with pulsing animation)
3. System automatically pairs you with another player using Redis-based matchmaking
4. Once matched, both players see "Both players connected!" message
5. Green "READY!" button appears with floating animation
6. Both players must click "READY!" to confirm they're prepared
7. Status updates to "You are ready! Waiting for opponent..." with pulsing animation
8. Game begins immediately when both players signal ready
9. 30-second ready timeout: if both players don't ready up, matchmaking resets with "Ready timeout!" message
10. 60-second matchmaking timeout with automatic return to menu if no opponent found
11. "Back to Menu" button (red) available during waiting for easy exit

#### Controls (Same as Solo)
- **Keyboard**: A/D or Arrow Keys to move left/right at 300 px/s
- **Mobile Touch**: On-screen ◄ and ► buttons (80px diameter)
- Movement is restricted to your assigned territory in multiplayer

#### Multiplayer Mechanics

**Split-Screen Territory System**:
- **Player 1 (Red Cup)**: Controls the LEFT half of the screen (x: 50 to 350)
- **Player 2 (Cyan Cup)**: Controls the RIGHT half of the screen (x: 450 to 750)
- Hard boundaries prevent crossing the center line (x=400)
- Pot positioned at center (x=400) creates contested zone for kernels
- Each player only scores when THEIR cup catches popcorn
- Same physics and popcorn types as solo mode

**Server-Authoritative Gameplay**:
- All game state managed on server using Redis for persistence
- Server controls game start time for perfect synchronization
- Ready state system ensures both players are prepared before game starts
- Position updates sent every 10 frames (throttled to reduce network load)
- Score updates sent immediately on catch for real-time feedback
- Server validates all catches to prevent cheating
- Activity timestamps updated on every API call for disconnect detection

**Real-Time Synchronization**:
- Opponent's cup position updates every 166ms with smooth interpolation
- Score updates appear instantly for both players
- Timer synchronized using server start time (not local countdown)
- Game state polling every 166ms during gameplay for consistency
- Lobby polling every 1000ms while waiting for opponent
- Automatic cleanup of finished games from server

**Network Features**:
- **Disconnect Detection**: 3 consecutive failed fetches (~0.5 seconds) triggers client-side disconnect handling
- **Activity Tracking**: Server monitors player activity with 3-second inactivity threshold for server-side detection
- **Graceful Degradation**: Game continues if network hiccups occur
- **Automatic Cleanup**: Server removes old games (2-minute TTL expiry) and manages waiting queue
- **Anti-Cheat**: Server-side score validation and position limits
- **Atomic Operations**: Redis WATCH/MULTI/EXEC transactions prevent race conditions in matchmaking
- **Self-Match Prevention**: Players cannot join their own waiting games
- **Duplicate Join Prevention**: Players cannot join multiple games simultaneously

**Visual Indicators**:
- **Player 1 Score**: Top-left in red - "P1: X"
- **Player 2 Score**: Top-right in cyan - "P2: X"
- **Timer**: Top-center in white with MM:SS format
- **Color-Coded Cups**: Red tint for Player 1, cyan tint for Player 2
- Both cups have matching idle animations (offset by 400ms for visual variety)

**Game Over Scenarios**:
- **Normal Completion**: After 60 seconds, shows winner announcement and final scores
  - "GAME OVER!" in gold text
  - "[PLAYER] WINS!" in player's color (red/cyan)
  - Final scores displayed for both players
- **Tie Game**: "IT'S A TIE!" message in gold if scores are equal
- **Disconnect**: "OPPONENT LEFT" message in red with explanation
  - "The other player disconnected" subtitle
  - Final scores still displayed
- **Server Issues**: Automatic fallback to local scores if server unavailable
- Final scores fetched from server as authoritative source (1-second sync delay)
- "BACK TO MENU" button returns to mode selection
- "Main Menu" button (green) returns to main menu

---

## Tips & Strategy

### Solo Mode Strategy
- **Center Positioning**: Start near the middle to react to launches in either direction
- **Predict Trajectories**: Watch the pot's wobble and anticipate where kernels will land
- **Prioritize Special Popcorn**: Red (+10) and blue (+20) popcorn are worth significantly more
- **Color Recognition**: Train your eyes to spot red and blue popcorn quickly
- **Smooth Movement**: Small adjustments are more effective than holding keys
- **Learn the Physics**: Kernels follow consistent gravity - practice reading their arcs

### Multiplayer Strategy
- **Territory Mastery**: Learn the exact boundaries of your half
- **Positioning**: Stay slightly toward the center line to catch kernels from the pot
- **Special Popcorn Priority**: Red and blue popcorn can swing the game
- **Opponent Awareness**: Watch your opponent's position to predict which kernels they'll catch
- **Boundary Play**: Kernels near the center line are contested - time movements carefully
- **Score Tracking**: Monitor both scores - if behind, take more risks for special popcorn
- **Consistency Over Speed**: Steady catches beat risky dashes

### Advanced Techniques
- **Arc Reading**: High-velocity kernels travel farther - position accordingly
- **Color Spotting**: Train peripheral vision to detect red/blue tints
- **Value Calculation**: Catching 2 blue popcorn (+40) equals 40 normal kernels
- **Bounce Prediction**: Kernels have bounce coefficient - anticipate second chances
- **Spawn Timing**: Screen shake indicates new kernel launch
- **Edge Control**: Use screen boundaries to your advantage
- **Physics Prediction**: Learn to predict landing zones based on launch velocity

---

## Development

### Commands

```bash
# Development (runs client, server, and devvit in parallel)
npm run dev

# Build for production
npm run build

# Deploy to Reddit
npm run deploy

# Code quality checks
npm run check
```

### Project Structure

```
src/
├── client/     # Phaser.js game (HTML/CSS/JS)
├── server/     # Express API endpoints
└── shared/     # Shared types and interfaces
```

---

---

## Technical Implementation

### Scene Architecture

The game uses Phaser's scene-based architecture with 9 distinct scenes:

1. **Boot** - Loads the loading icon asset
2. **Preloader** - Displays animated loading screen with gradient progress bar and loads all game assets
3. **MainMenu** - Main menu with "Play" and "How to Play" buttons
4. **ModeSelect** - Game mode selection (Solo/Multiplayer)
5. **SoloGame** - Single-player gameplay with 60-second timer
6. **SoloGameOver** - Solo game results with "Play Again" option
7. **MultiplayerLobby** - Matchmaking and ready state management
8. **MultiplayerGame** - Real-time multiplayer gameplay with split territories
9. **MultiplayerGameOver** - Multiplayer results with winner announcement

### Client-Server Communication

- **Client**: Phaser.js game running in browser webview
- **Server**: Express.js API with Redis persistence
- **Protocol**: RESTful API with polling (no WebSockets due to Devvit limitations)
- **Endpoints**: All multiplayer endpoints start with `/api/multiplayer/`
- **Authentication**: Automatic via Devvit context (userId)

### Multiplayer State Management

- **Singleton Pattern**: `MultiplayerGameManager` class manages all game sessions
- **Atomic Operations**: Redis WATCH/MULTI/EXEC prevents race conditions
- **TTL Expiry**: Games auto-delete after 2 minutes (120 seconds)
- **Activity Tracking**: Last activity timestamps for 3-second disconnect detection
- **Ready State**: Timestamp-based ready confirmation with 30-second timeout
- **Server Time**: Synchronized countdown using server-provided startTime

### Performance Optimizations

- **Throttled Updates**: Position updates every 10 frames (~166ms)
- **Smooth Interpolation**: Opponent position tweened over 150ms
- **Object Pooling**: Popcorn sprites reused from Phaser group (max 50)
- **Efficient Polling**: State polls every 166ms during gameplay, 1000ms in lobby
- **Cleanup**: Automatic removal of off-screen popcorn and expired games

---

## License

This project is built for Reddit using the Devvit platform.