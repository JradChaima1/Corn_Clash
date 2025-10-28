# Popcorn Catch 🍿

A fast-paced arcade game where you catch flying popcorn kernels as they explode from a shaking pot! Built with Phaser.js and running natively on Reddit, this game offers both solo high-score challenges and real-time online multiplayer battles with automatic matchmaking and intelligent lobby recovery.

**Play it on Reddit** - No downloads, no external websites. Just click and play directly in Reddit posts!

---

---

---

---

## What Is This Game?

**Popcorn Catch** is a physics-based arcade game where players control a popcorn cup to catch kernels launching from an animated cooking pot. The game features realistic physics with randomized trajectories, gravity, and rotation for each popcorn piece. Players must position their cup strategically to intercept falling kernels within a 60-second time limit.

The game runs entirely within Reddit posts using Devvit's web framework, requiring no downloads or external websites. It features two distinct game modes: a solo mode for personal high-score challenges, and an online multiplayer mode where two players compete head-to-head in real-time with automatic matchmaking, a ready-state system, and intelligent lobby recovery.

### Core Gameplay Loop

1. **Popcorn Launch**: Kernels launch from a shaking pot with random velocities and spin
2. **Strategic Movement**: Players move their cup left/right to catch falling kernels
3. **Scoring System**: Each catch awards points with satisfying visual feedback (particles, flash effects)
4. **Special Popcorn**: Three types create strategic choices:
   - **White (Normal)**: Safe +1 point baseline (70% spawn rate)
   - **Red (PENALTY)**: Dangerous -10 points + spawns 5 chaos kernels from screen edges (20% spawn rate) - AVOID AT ALL COSTS!
   - **Blue (BONUS)**: High-value +20 points reward (10% spawn rate) - prioritize these!
5. **Chaos Mode**: Red popcorn triggers frantic moments - spawning 5 extra kernels from both sides!
6. **Time Pressure**: 60-second timer creates intense, fast-paced sessions
7. **Game Over**: Final score display with options to replay or return to menu

### Key Features

- **Dynamic Physics**: Each popcorn kernel (40x40px) launches with unique velocity (100-250 px/s horizontal, -300 to -450 px/s vertical) and random spin (-200 to 200 deg/s)
- **Strategic Popcorn System**: 70% normal (+1 point), 20% red (-10 points penalty + chaos spawn), 10% blue (+20 points) with color-coded visual indicators
- **Chaos Mechanic**: Red popcorn spawns 5 extra kernels from screen edges, creating frantic moments - AVOID AT ALL COSTS!
- **Arcade Physics Engine**: Phaser's built-in system with 300 px/s² gravity creates realistic arcing trajectories with 0.3 bounce coefficient
- **Responsive Controls**: Smooth keyboard controls (A/D or Arrow keys) with 300 px/s movement speed, plus mobile touch controls (80px diameter on-screen buttons)
- **Visual Feedback**: 8-particle bursts, expanding flash effects (20px → 40px), score popups for special popcorn, and subtle screen shake (2px, 50ms) on every launch
- **Time Pressure**: 60-second countdown (displayed in MM:SS format) creates intense, fast-paced gameplay sessions
- **How to Play Guide**: Built-in tutorial scene accessible from main menu explaining controls, objectives, and scoring system
- **Collision System**: Pot positioned at center (300x300px) as a static physics body - plan your movements carefully!

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
  - Centered 128x128px game icon with glowing pulsing animation (1.05x scale pulse over 1 second)
  - Real-time cyan-to-blue gradient progress bar with rounded corners (20-segment smooth gradient)
  - Multi-layer glow effects with depth (outermost +8px padding at 0.3 alpha, middle +4px at 0.6 alpha)
  - 30-second timeout protection with automatic fallback to MainMenu

### 🎯 Dual Game Mode Architecture
- **Solo Mode**: Single-player arcade challenge with full-screen movement (100x100px cup)
- **Multiplayer Mode**: Real-time online PvP with split-screen territories (100x100px cups, color-coded)
- Shared physics engine and visual effects across both modes
- Smooth scene transitions via intuitive menu system (Boot → Preloader → MainMenu → ModeSelect → Game)
- Separate game over screens tailored to each mode (SoloGameOver vs MultiplayerGameOver)
- Mobile-friendly touch controls with on-screen left/right buttons (80px diameter)

### 🎲 Strategic Risk-Reward Mechanics
- **Three Popcorn Types** create meaningful gameplay decisions:
  - **White (Normal)**: Safe +1 point baseline (70% spawn rate) - no tint applied
  - **Red (PENALTY)**: Dangerous -10 points + spawns 5 chaos kernels from screen edges (20% spawn rate) - red tint (0xff0000)
  - **Blue (BONUS)**: High-value +20 points reward (10% spawn rate) - cyan tint (0x0088ff)
- **Chaos Mode**: Red popcorn triggers frantic moments with 5 extra kernels spawning from both screen edges (left x=50, right x=750) with high horizontal velocity (200-350 px/s) and staggered timing (100ms intervals)
- **Risk Assessment**: Players must decide whether to catch risky red popcorn or let it fall - catching red costs you 10 points AND creates chaos!
- **Score Popups**: Floating text shows point values (+20 in cyan, -10 in red) that rise 50px and fade over 800ms
- **Color Recognition**: Train your eyes to spot and react to colored popcorn instantly - red means DANGER!

### ⚡ Instant Multiplayer Matchmaking
- Zero-friction entry: click "Multiplayer" and you're matched automatically
- No room codes, friend invites, or lobby management needed
- Server maintains a queue in Redis and pairs players as they join
- **Ready State System**: Both players must confirm readiness before game starts
  - Visual lobby with "Waiting for opponent..." status and pulsing animation
  - Green "READY!" button appears when both players are connected
  - 30-second ready timeout with automatic reset if players don't confirm
  - Games begin immediately when both players signal ready
- **Intelligent Lobby Recovery System**: Automatic restart of matchmaking if opponent leaves during waiting
  - Detects when opponent disconnects before game starts (404 game not found) within 1 second
  - Detects when game state becomes invalid or corrupted
  - Detects when a player leaves after both were present in lobby
  - Seamlessly returns player to matchmaking queue for new opponent
  - Cleans up Redis keys for both players to allow immediate rejoining
  - Prevents all stuck waiting scenarios - you'll never be left hanging
- 60-second matchmaking timeout prevents indefinite waiting
- Self-match prevention ensures players can't join their own games
- "Back to Menu" button available during waiting for easy exit

### 🏆 Server-Authoritative Multiplayer
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

### 🎪 Split-Screen Territory System (Multiplayer)
- Multiplayer divides the 800px screen into two equal zones (400px each)
- Player 1 (red tint) controls left half (x: 50-400), Player 2 (cyan tint) controls right half (x: 400-750)
- Hard boundaries prevent crossing into opponent's territory
- Pot positioned at center creates contested zone for kernels
- Each player only scores when THEIR cup catches popcorn
- Strategic positioning near center line maximizes catch opportunities

---

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
3. **Main Menu**: Two options available:
   - **Play**: Click to continue to mode selection
   - **How to Play**: Click to view the tutorial guide
4. **Mode Selection**: Choose your preferred game mode:
   - **SOLO MODE**: "Play alone and beat your high score!" (Red button)
   - **MULTIPLAYER**: "Compete against another player online!" (Cyan button)
   - **Main Menu**: Return to the main menu (Green button at bottom)

### 🎮 Solo Mode

**Objective**: Catch as many popcorn kernels as possible in 60 seconds while avoiding red penalties!

#### Controls
- **Keyboard**: 
  - **A** or **← Left Arrow**: Move your cup left
  - **D** or **→ Right Arrow**: Move your cup right
- **Mobile Touch**: 
  - Tap and hold the **◄ button** (bottom-left, 80px diameter) to move left
  - Tap and hold the **► button** (bottom-right, 80px diameter) to move right
- **Menu Access**: Click the "Menu" button in the top-right corner to return to main menu

#### Gameplay Mechanics

**Your Character**: You control a 100x100 pixel popcorn cup that can move freely across the entire screen width (x: 50-750) at 300 px/s speed.

**Kitchen Scene**: 
- Animated kitchen background (kitchen_background.png) with counter (counter1.png) at bottom
- Cooking pot (large_pot.png) sized at 300x300px positioned at center (x=400, y=480) as static physics body
- Pot continuously wobbles with smooth, coordinated multi-axis animation:
  - Horizontal wobble: ±5px over 1200ms (Sine.easeInOut) - gentle side-to-side movement
  - Vertical bounce: ±28px over 100ms (Sine.easeInOut) - rapid up-and-down motion (y: 480 ↔ 452)
  - Rotation wobble: ±2° over 120ms (Sine.easeInOut) - quick tilting effect
  - All animations create a lively, active cooking pot appearance
- Pot has collision enabled with static physics body (30% width × 30% height) - cup cannot pass through it
- Players can move freely across the entire screen width (x: 50-750)
- Player starts on the right side (x=700, y=480) for better visibility of incoming popcorn
- Pot is an immovable obstacle - players must navigate around it while catching popcorn

**Popcorn Spawning**: 
- Kernels launch from the shaking pot positioned at screen center
- Spawn rate: Every 0.4-0.7 seconds (randomized for unpredictability)
- Popcorn size: 40x40 pixels with realistic physics
- Launch physics: Random horizontal velocity (100-250 px/s), upward launch (-300 to -450 px/s), with angular spin (-200 to 200 deg/s)
- Kernels have 0.3 bounce coefficient and are affected by 300 px/s² gravity

**Catching Popcorn**:
- Position your cup to intercept falling kernels using Phaser's overlap collision detection
- Cup has collision body sized at 80% width × 60% height for precise hitbox
- **Three types of popcorn with different point values:**
  - **Normal (white)**: +1 point (70% spawn rate) - safe baseline scoring, no tint
  - **Red (PENALTY)**: -10 points (20% spawn rate) - shows "-10" popup on catch with red color (0xff0000) AND spawns 5 extra chaos popcorn pieces from both sides! AVOID AT ALL COSTS!
  - **Blue (BONUS)**: +20 points (10% spawn rate) - shows "+20" popup on catch with cyan color (0x0088ff) - high priority target!
- Maximum 50 active popcorn kernels on screen at once (Phaser group object pooling for performance)
- Caught kernels immediately deactivate to prevent double-counting (active flag check)
- Kernels automatically despawn when they fall off-screen (y > height + 50 or x < -50 or x > width + 50)
- **Chaos Mode**: When you catch red popcorn, 5 extra kernels spawn from screen edges (left x=50, right x=750) with high horizontal velocity (200-350 px/s toward center) and staggered timing (100ms intervals between spawns)

**Visual Feedback**:
- **Particle Burst**: 8 popcorn particles (single_corn.png) explode from the catch point with physics (50-150 px/s speed, scale 0.15→0, 400ms lifespan, 200 px/s² gravity)
- **Flash Effect**: Color-coded circle expands and fades over 200ms:
  - Yellow (0xffff00) for normal popcorn
  - Red (0xff0000) for red popcorn
  - Cyan (0x0088ff) for blue popcorn
  - Starts at 20px radius with 0.6 alpha, scales to 2x (40px) while fading to 0
- **Score Popups**: Floating "+20" or "-10" text (32px Arial Black) for special popcorn that rises 50px and fades over 800ms
- **Screen Shake**: Subtle 2px shake for 50ms (0.002 intensity) when popcorn launches from pot
- **Idle Animation**: Your cup gently floats up and down (±2px over 800ms, Sine.easeInOut) for a lively feel
- **Pot Animation**: Continuous multi-axis wobble creates dynamic launching effect (see Kitchen Scene above)

**UI Elements**:
- **Timer**: Top center in MM:SS format (starts at 01:00, counts down to 00:00)
- **Score**: Top-left in gold text - "Score: X" (cannot go below 0)
- **Menu Button**: Top-right corner for quick exit to main menu

**Game Over**: After 60 seconds, view your final score with options to:
- **Play Again**: Restart solo mode immediately (green pulsing button)
- **Main Menu**: Return to main menu (green button at bottom)

### 👥 Multiplayer Mode

**Objective**: Outscore your opponent by catching more popcorn in 60 seconds while avoiding red penalties!

#### Matchmaking Process

1. Select **MULTIPLAYER** from mode selection
2. Enter the **Matchmaking Lobby** (shows "Waiting for opponent..." with pulsing animation)
3. System automatically pairs you with another player using Redis-based matchmaking
4. Once matched, both players see "Both players connected!" message
5. Green "READY!" button appears with floating animation
6. Both players must click "READY!" to confirm they're prepared
7. Status updates to "You are ready! Waiting for opponent..." with pulsing animation
8. Game begins immediately when both players signal ready
9. **Intelligent Lobby Recovery System**: If opponent leaves before game starts, you're automatically returned to matchmaking
   - Detects when opponent disconnects (404 game not found response)
   - Detects invalid or corrupted game states
   - Detects when a player leaves after both were present in lobby
   - Seamlessly restarts matchmaking within 1 second without manual intervention
   - Cleans up Redis keys for both players to allow immediate rejoining
   - No stuck states - you'll never be left waiting indefinitely
10. 30-second ready timeout: if both players don't ready up, matchmaking resets with "Ready timeout!" message
11. 60-second matchmaking timeout with automatic return to menu if no opponent found
12. "Back to Menu" button (red) available during waiting for easy exit

#### Controls (Same as Solo)
- **Keyboard**: A/D or Arrow Keys to move left/right at 300 px/s
- **Mobile Touch**: On-screen ◄ and ► buttons (80px diameter)
- Movement is restricted to your assigned territory in multiplayer

#### Multiplayer Mechanics

**Split-Screen Territory System**:
- **Player 1 (Red Cup)**: Controls the LEFT half of the screen (x: 50 to 350)
  - Red tint applied (0xff6b6b) for visual distinction
  - Starting position: x=150, y=480 (height - 120)
  - Movement boundaries enforced in update loop (minX=50, maxX=350)
- **Player 2 (Cyan Cup)**: Controls the RIGHT half of the screen (x: 450 to 750)
  - Cyan tint applied (0x4ecdc4) for visual distinction
  - Starting position: x=650, y=480 (height - 120)
  - Movement boundaries enforced in update loop (minX=450, maxX=750)
- Hard boundaries prevent crossing the center line (x=400) - enforced client-side
- Pot positioned at center (x=400, y=480) scaled to 0.3x creates contested zone for kernels
- Pot animation is faster in multiplayer for increased intensity:
  - Horizontal wobble: ±4px over 80ms (Sine.easeInOut)
  - Vertical bounce: ±2px over 100ms (Sine.easeInOut)
  - Rotation wobble: ±2° over 120ms (Sine.easeInOut)
- Each player only scores when THEIR cup catches popcorn (isMyPlayer check prevents opponent catches from counting)
- Same physics and popcorn types as solo mode (white +1, red -10 + chaos, blue +20)
- **Strategic Positioning**: Stay near center line to maximize catch opportunities

**Server-Authoritative Gameplay**:
- All game state managed on server using Redis for persistence
- Server controls game start time for perfect synchronization
- Ready state system ensures both players are prepared before game starts
- Position updates sent every 10 frames (throttled to reduce network load)
- Score updates sent immediately on catch for real-time feedback
- Server validates all catches to prevent cheating
- Activity timestamps updated on every API call for disconnect detection

**Real-Time Synchronization**:
- Opponent's cup position updates every 166ms (10 frames) with smooth Phaser tween interpolation (150ms duration, Linear ease)
- Position updates only sent when player moves >2px from last sent position (throttled to every 10 frames)
- Score updates appear instantly for both players (sent immediately on catch, no throttling)
- Timer synchronized using server start time (not local countdown) - calculates elapsed time from server's startTime timestamp
- Game state polling every 166ms (10 frames) during gameplay for consistency
- Lobby polling every 1000ms (1 second) while waiting for opponent
- Automatic cleanup of finished games from server (2-minute TTL expiry or manual cleanup on leave/end)

**Network Features**:
- **Intelligent Lobby Recovery**: Automatic restart of matchmaking if opponent leaves before game starts
  - Detects 404 responses (game no longer exists) within 1 second
  - Detects invalid game states and corrupted data
  - Detects when a player leaves after both were present in lobby
  - Seamlessly returns player to matchmaking queue
  - Cleans up Redis keys for both players to prevent stale state
  - Prevents indefinite waiting scenarios
- **Disconnect Detection**: 3 consecutive failed fetches (~0.5 seconds) triggers client-side disconnect handling during gameplay
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
  - Animated "Calculating final scores..." message with loading dots
- **Tie Game**: "IT'S A TIE!" message in gold if scores are equal
- **Disconnect**: "OPPONENT LEFT" message in red with explanation
  - "The other player disconnected" subtitle
  - Final scores still displayed
- **Server Issues**: Automatic fallback to local scores if server unavailable
- Final scores fetched from server as authoritative source (1.5-second sync delay ensures both players' scores reach server)
- Games auto-expire after 2 minutes (TTL) or when players leave - no immediate cleanup to allow score fetching
- "Main Menu" button (green) returns to main menu

---

## Tips & Strategy

### Solo Mode Strategy
- **Center Positioning**: Start near the middle (x=400) to react to launches in either direction
- **Predict Trajectories**: Watch the pot's wobble and anticipate where kernels will land based on launch velocity
- **AVOID RED POPCORN**: Red popcorn is a -10 point penalty AND spawns 5 extra chaos kernels from both edges - avoid at all costs!
- **Prioritize Blue Popcorn**: Blue (+20) popcorn is worth 20 normal catches - high priority target worth taking risks for
- **Color Recognition**: Train your eyes to spot red tint (0xff0000 - avoid!) and cyan tint (0x0088ff - catch!) instantly
- **Smooth Movement**: Small adjustments (300 px/s speed) are more effective than holding keys - cup has world bounds collision
- **Learn the Physics**: Kernels follow consistent 300 px/s² gravity with 0.3 bounce coefficient - practice reading their arcs
- **Chaos Management**: If you accidentally catch red popcorn, prepare for 5 chaos kernels spawning from edges with 100ms stagger - stay calm and focused on center
- **Risk vs Reward**: Sometimes it's better to let a kernel fall than risk catching red popcorn - negative scores are prevented (minimum 0)

### Multiplayer Strategy
- **Territory Mastery**: Learn the exact boundaries of your half:
  - Player 1 (Red): x 50-350 (left half)
  - Player 2 (Cyan): x 450-750 (right half)
  - Center line at x=400 is the dividing point
- **Center Line Positioning**: Stay near the center line (x=350 for P1, x=450 for P2) to catch kernels from the pot at x=400
- **AVOID RED POPCORN**: -10 points + 5 chaos kernels can cost you the game - let your opponent catch it if possible!
- **Blue Popcorn Priority**: Blue (+20) popcorn can swing the game - worth taking risks for, equals 20 normal catches
- **Opponent Awareness**: Watch your opponent's position (synced every 166ms) to predict which kernels they'll catch
- **Boundary Play**: Kernels near the center line (x=400) are contested - time movements carefully to intercept
- **Score Tracking**: Monitor both scores (P1 top-left red, P2 top-right cyan) - if behind, prioritize blue popcorn and avoid red at all costs
- **Consistency Over Speed**: Steady catches beat risky dashes - 300 px/s movement speed is the same for both players
- **Sabotage Strategy**: Try to position so red popcorn falls toward your opponent's side - they might catch it accidentally!
- **Defensive Play**: If ahead, play safe and avoid red popcorn to maintain your lead - let opponent take the risks

### Advanced Techniques
- **Arc Reading**: High-velocity kernels (up to -450 px/s vertical launch) travel farther - position accordingly based on initial trajectory
- **Color Spotting**: Train peripheral vision to detect red tint (0xff0000 - avoid!) and cyan tint (0x0088ff - catch!) instantly on 40x40px sprites
- **Value Calculation**: Catching 2 blue popcorn (+40) equals 40 normal kernels, but catching 1 red (-10) negates 10 normal catches PLUS spawns chaos
- **Risk Assessment**: Red popcorn's -10 penalty + 5 chaos kernel spawn makes it the most dangerous element - avoid unless desperate
- **Bounce Prediction**: Kernels have 0.3 bounce coefficient - anticipate second chances after hitting ground or pot
- **Spawn Timing**: Screen shake (2px, 50ms) indicates new kernel launch from pot - prepare to react within 400-700ms (next spawn)
- **Edge Control**: Use screen boundaries (x: 50-750) to your advantage in solo mode - kernels despawn off-screen
- **Physics Prediction**: Learn to predict landing zones based on launch velocity (100-250 px/s horizontal, -300 to -450 px/s vertical) and 300 px/s² gravity
- **Chaos Survival**: When red popcorn spawns chaos (5 kernels from edges with 200-350 px/s horizontal velocity), focus on the center and catch what you can safely
- **Patience**: Don't chase every kernel - sometimes letting one fall is the smart play, especially if it means avoiding red popcorn

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

The game uses Phaser's scene-based architecture with 10 distinct scenes:

1. **Boot** - Loads the loading icon asset (myiconimage.png) and transitions to Preloader
2. **Preloader** - Displays animated loading screen with:
   - 128x128px game icon with 1.05x scale pulsing animation (1s duration, Sine.easeInOut)
   - 20-segment cyan-to-blue gradient progress bar (400x20px with 10px rounded corners)
   - Multi-layer glow effects (outermost +8px at 0.3 alpha, middle +4px at 0.6 alpha)
   - Loads all game assets: kitchen_background.png, large_pot.png, single_corn.png, empty_popcorn_cup.png, counter1.png, mybgimage.png
   - 30-second timeout protection with automatic transition to MainMenu
3. **MainMenu** - Main menu with "Play" (blue button) and "How to Play" (red button) with floating animations
4. **HowToPlay** - Tutorial screen explaining objectives, controls (keyboard A/D or arrows, mobile touch buttons), and scoring system (white +1, red -10 + chaos, blue +20)
5. **ModeSelect** - Game mode selection with "SOLO MODE" (red button) and "MULTIPLAYER" (cyan button) plus descriptions
6. **SoloGame** - Single-player gameplay with 60-second timer, free movement (x: 50-750), smooth pot animation (±3px wobble, ±3px bounce, ±1.5° rotation, all synchronized at 800ms), and full-screen popcorn catching
7. **SoloGameOver** - Solo game results with final score display, "Play Again" (green pulsing button), and "Main Menu" button
8. **MultiplayerLobby** - Matchmaking with automatic pairing, ready state system (30s timeout), and intelligent lobby recovery on opponent disconnect
9. **MultiplayerGame** - Real-time multiplayer gameplay with split territories (P1 left x: 50-350, P2 right x: 450-750), fast pot animation (80-120ms cycles for intensity), synchronized timer, and position/score syncing
10. **MultiplayerGameOver** - Multiplayer results with winner announcement (or "OPPONENT LEFT" for disconnects), final scores for both players, and "Main Menu" button

### Current Development State

**Solo Mode**: 
- Players have complete freedom of movement across the entire screen width (x: 50-750)
- Cup is 100x100px with collision body at 80% width × 60% height
- Starting position: right side of screen (x=700, y=480) for optimal gameplay
- Pot is an immovable physics body at center (x=400, y=480) sized at 300x300px with collision body at 30% width × 30% height
- Pot has setImmovable(true) and setAllowGravity(false) to act as a static obstacle
- Players can move at 300 px/s speed with world bounds collision
- Collision between cup and pot prevents the cup from passing through
- Pot animation creates lively cooking effect:
  - Horizontal wobble: ±5px over 1200ms (Sine.easeInOut)
  - Vertical bounce: ±28px over 100ms (Sine.easeInOut)
  - Rotation wobble: ±2° over 120ms (Sine.easeInOut)
- Idle animation: cup floats ±2px over 800ms (Sine.easeInOut)

**Multiplayer Mode**: 
- Players are restricted to their respective territories with hard boundaries enforced in update loop:
  - Player 1 (Red): x: 50-350 (left half, starting at x=150)
  - Player 2 (Cyan): x: 450-750 (right half, starting at x=650)
- Both cups are 100x100px with color tints (P1: 0xff6b6b red, P2: 0x4ecdc4 cyan)
- Pot scaled to 0.3x (smaller than solo mode) for faster-paced gameplay
- Pot animation is faster in multiplayer for increased intensity:
  - Horizontal wobble: ±4px over 80ms (Sine.easeInOut)
  - Vertical bounce: ±2px over 100ms (Sine.easeInOut)
  - Rotation wobble: ±2° over 120ms (Sine.easeInOut)
- Idle animations offset by 400ms for visual variety
- Position updates throttled to every 10 frames (~166ms) when movement >2px
- Score updates sent immediately on catch with server validation

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