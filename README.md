## Corn Clash 🍿

A fast-paced arcade game where you catch flying popcorn kernels as they explode from a shaking pot! Built with Phaser.js and running natively on Reddit, this game offers both solo high-score challenges and real-time online multiplayer battles.

**Play it on Reddit** - No downloads, no external websites. Just click and play directly in Reddit posts!

---

---

### What Is This Game?

**Corn Clash** is a physics-based arcade game where players control a popcorn cup to catch kernels launching from an animated cooking pot. The game features realistic physics with randomized trajectories, gravity, and rotation for each popcorn piece. Players must position their cup strategically to intercept falling kernels within a 60-second time limit.

The game runs entirely within Reddit posts using Devvit's web framework, requiring no downloads or external websites. It features two distinct game modes: a solo mode for personal high-score challenges, and an online multiplayer mode where two players compete head-to-head in real-time with automatic matchmaking.

**Core Gameplay Loop:**
1. Popcorn kernels launch from a shaking pot with random velocities and spin
2. Players move their cup left/right to catch falling kernels
3. Each catch awards points with satisfying visual feedback (particles, flash effects)
4. Special colored popcorn awards bonus points (red +10, blue +20)
5. 60-second timer creates intense, fast-paced sessions
6. Game ends with final score display and options to replay or return to menu

**Key Gameplay Elements:**
- **Dynamic Physics**: Each popcorn kernel (40x40px) launches with unique velocity (100-250 px/s horizontal, -300 to -450 px/s vertical) and random spin (-200 to 200 deg/s)
- **Bonus Popcorn System**: 70% normal (+1 point), 20% red (+10 points), 10% blue (+20 points) with color-coded visual indicators
- **Arcade Physics Engine**: Phaser's built-in system with 300 px/s² gravity creates realistic arcing trajectories with 0.3 bounce coefficient
- **Responsive Controls**: Smooth keyboard controls (A/D or Arrow keys) with 300 px/s movement speed, plus mobile touch controls (80px diameter on-screen buttons)
- **Visual Feedback**: 8-particle bursts, expanding flash effects (20px → 40px), score popups for special popcorn, and subtle screen shake (2px, 50ms) on every launch
- **Time Pressure**: 60-second countdown (displayed in MM:SS format) creates intense, fast-paced gameplay sessions
- **Collision Detection**: Overlap-based physics with custom hitbox sizing (80% width, 60% height of cup)
- **Warm Kitchen Theme**: Cozy kitchen background with animated pot, counter, and cream color scheme (#FFF8DC)
- **Spawn Randomization**: Kernels spawn every 0.4-0.7 seconds with randomized intervals for unpredictable, fast-paced gameplay
- **Modern Loading Screen**: Professional loading experience with centered app icon (scaled to 128x128px) on pure black background (#000000), featuring a glowing pulsing effect (1.0→1.05 scale, 0.4→0.32 alpha, 2s cycle) and real-time cyan-to-blue gradient progress bar (400x20px with rounded corners, multi-layer glow effect)
- **Menu Button**: Quick access to main menu from solo mode via green "Menu" button in top-right corner

### What Makes This Game Innovative

**🎮 Reddit-Native Gaming Platform**
- Runs entirely within Reddit posts using Devvit's web framework - no external websites needed
- Zero downloads or installations - click the post and play instantly
- Seamlessly integrated into the Reddit browsing experience
- Players can compete without leaving the platform
- Automatic post creation on app installation for easy deployment (via `onAppInstall` trigger)
- Built with Phaser.js (v3.88.2) for smooth 60 FPS gameplay in the browser
- 800x600 canvas with responsive scaling (Phaser.Scale.FIT) adapts to any screen size
- Moderators can create new game posts via subreddit menu action
- Custom splash screen with "Corn Clash" branding and "🍿 Play Now" button
- Professional loading screen with centered icon (128x128px scaled proportionally), glowing pulsing animation (1.0→1.05 scale, 0.4→0.32 alpha, 2s Sine.easeInOut cycle), and real-time cyan-to-blue gradient progress bar (400x20px with rounded corners, multi-layer glow effect with alpha 0.6 and 0.3 layers) on pure black background (#000000)

**🎯 Dual Game Mode Architecture**
- **Solo Mode**: Single-player arcade challenge with full-screen movement (100x100px cup)
- **Multiplayer Mode**: Real-time online PvP with split-screen territories (100x100px cups, color-coded)
- Shared physics engine and visual effects across both modes
- Smooth scene transitions via intuitive menu system (Boot → Preloader → MainMenu → ModeSelect → Game)
- Separate game over screens tailored to each mode (SoloGameOver vs MultiplayerGameOver)
- Consistent cup sizes (100x100px) across both modes for fair gameplay
- Mobile-friendly touch controls with on-screen left/right buttons (80px diameter, positioned at bottom)
- Clean scene architecture with 9 distinct scenes handling different game states

**⚡ Instant Multiplayer Matchmaking**
- Zero-friction entry: click "Multiplayer" and you're matched automatically
- No room codes, friend invites, or lobby management needed
- Server maintains a queue in Redis and pairs players as they join (first player creates game, second joins)
- Games start immediately when two players are ready (status changes from "waiting" to "playing")
- Visual lobby (MultiplayerLobby scene) with real-time status updates showing your role (player1/player2)
- Back button with proper cleanup (stops polling timer via `leaveGame()` method) to return to mode selection
- 60-second timeout protection prevents indefinite waiting
- Robust validation ensures both players exist before game starts (double-checks on both join and game start)
- 500ms polling interval in lobby for responsive matchmaking feedback

**🎲 Server-Authoritative Multiplayer**
- All game logic runs on the server (MultiplayerGameManager singleton) to prevent cheating
- Server uses Redis for persistent game state storage (via Devvit's @devvit/web/server)
- Clients poll game state every 500ms via `/api/multiplayer/state` for smooth synchronization
- Both players see identical game state with server-controlled start time for perfect sync
- Fair gameplay guaranteed through centralized authority (Express.js 5.1.0 backend)
- Position updates throttled (every 10 frames) via `/api/multiplayer/position` to reduce network load
- Score updates sent immediately on catch via `/api/multiplayer/score` for real-time feedback
- Disconnect detection (5 consecutive failed fetches = ~1.6 seconds) with graceful game termination
- Server fetches authoritative final scores with 1-second delay to ensure all updates are synced
- Automatic cleanup of old games with non-zero scores to prevent stale matchmaking

**🌊 Advanced Physics Simulation**
- **Randomized Launch Mechanics**: Each kernel has unique trajectory
  - Horizontal: 100-250 px/s in random direction
  - Vertical: -300 to -450 px/s upward launch
  - Angular velocity: -200 to 200 deg/s rotation
- **Bonus Popcorn Types**: Three types with different point values
  - Normal (white): +1 point (70% spawn rate)
  - Red: +10 points (20% spawn rate)
  - Blue: +20 points (10% spawn rate)
- **Arcade Physics Engine**: Phaser's built-in system with 300 px/s² gravity
- **Bounce Dynamics**: 0.3 coefficient for realistic bouncing
- **Collision Detection**: Overlap-based with custom hitbox sizing (80% width, 60% height)
- **Off-Screen Cleanup**: Automatic removal when kernels leave play area (checked every 100ms)
- **Max Popcorn Limit**: 50 active kernels on screen at once
- **Fast Spawn Rate**: Kernels spawn every 0.4-0.7 seconds for intense gameplay

**✨ Layered Visual Polish**
- **Multi-Axis Pot Animation**: Simultaneous horizontal wobble (±4px, 80ms), vertical bounce (±2px, 100ms), and rotation (±2°, 120ms) with Sine.easeInOut
- **Particle System**: 8-particle burst on each catch with gravity (200 px/s²), scaling (0.15 → 0), and 400ms lifespan
- **Flash Effects**: Color-coded expanding circles with alpha fade (0.6 → 0, 20px → 40px over 200ms) - yellow for normal, red/blue for special popcorn
- **Score Popups**: Floating "+10" or "+20" text appears for special popcorn catches with color-matched styling
- **Screen Shake**: Subtle 2-pixel camera shake on popcorn launch (50ms duration, 0.002 intensity)
- **Idle Animations**: Players float with 800ms sine-wave cycles (±2px vertical, offset by 400ms in multiplayer)
- **Smooth Interpolation**: Position updates use 150ms linear tweens for fluid movement in multiplayer

**🏆 Split-Screen Territory System (Multiplayer)**
- Multiplayer divides the 800px screen into two equal zones (400px each)
- Player 1 (red tint #FF6B6B, 100x100px) controls left half (x: 50-350), Player 2 (cyan tint #4ECDC4, 100x100px) controls right half (x: 450-750)
- Hard boundaries enforced in update() loop prevent crossing into opponent's territory
- Pot positioned at center (x=400, y=480 from bottom) creates contested zone for kernels
- Strategic positioning required to catch kernels near the center line (x=400)
- Creates unique competitive dynamic not found in traditional catching games
- Both players use same controls (A/D or Arrow keys, or touch controls) but movement is restricted to their half
- Each player only scores when THEIR cup catches popcorn (prevents double-counting via `isMyPlayer` check)
- Opponent position updates with smooth 150ms linear interpolation tweens for fluid movement

**📱 Responsive Canvas Scaling**
- Base resolution: 800x600 pixels (defined in src/client/game/main.ts config)
- Phaser.Scale.FIT mode maintains aspect ratio across all screen sizes
- Phaser.Scale.CENTER_BOTH auto-centers on any screen size
- Works seamlessly on desktop and mobile devices (touch and keyboard)
- UI elements scale proportionally with canvas (text, sprites, particles)
- Background color: #FFF8DC (cream/beige) for warm kitchen atmosphere
- Canvas renders in #game-container div (see src/client/index.html)
- Touch controls positioned at fixed screen coordinates (100px from edges, 150px from bottom) for consistent mobile experience

**🎨 Cohesive Kitchen Theme**
- Warm, inviting color palette (#FFF8DC cream background)
- Kitchen counter (full width, 100px height) positioned 50px from bottom
- Large pot (30% scale) positioned 120px from bottom with continuous multi-axis animation
- Popcorn kernels sized at 40x40px for visibility with color tints for special types
- Player cups sized at 100x100px for balanced difficulty (consistent across both modes)
- Gold score text (#FFD700) in solo mode, team colors (#FF6B6B, #4ECDC4) in multiplayer
- White timer text (#FFFFFF) with black stroke (6px thickness) for high contrast
- All assets loaded from `/assets/` directory (kitchen_background.png, large_pot.png, single_corn.png, empty_popcorn_cup.png, counter1.png)
- Custom app icon (myiconimage.png) and splash screen (mybgimage.png) for Reddit integration
- Loading screen features pure black background (#000000) with centered glowing icon and cyan-to-blue gradient progress bar with multi-layer glow effect for professional first impression

**🎮 Intuitive Scene Flow**
- **Boot Scene** (`src/client/game/scenes/Boot.ts`): Loads app icon (myiconimage.png) for loading screen and transitions to Preloader
- **Preloader Scene** (`Preloader.ts`): Displays modern loading screen with pure black background (#000000), centered app icon scaled proportionally to 128x128px target size, glowing duplicate layer behind icon (1.1x scale, 0.4 alpha) with pulsing animation (1.0→1.05 scale, 0.4→0.32 alpha, 2s Sine.easeInOut cycle), and cyan-to-blue gradient progress bar (400x20px with rounded corners, gradient from #00FFFF to #0080FF, multi-layer glow effect with alpha 0.6 and 0.3 layers, animated fill from 4px to 396px width) while fetching game assets from `/assets/` (kitchen_background.png, large_pot.png, single_corn.png, empty_popcorn_cup.png, counter1.png) with error handling
- **Main Menu** (`MainMenu.ts`): Click-to-start splash screen with "POPCORN CATCH!" title, controls explanation, and blinking "Click to Start!" text (alpha animation 0.3-1.0, 800ms)
- **Mode Select** (`ModeSelect.ts`): Choose between Solo Mode (red #FF6B6B button) or Multiplayer (cyan #4ECDC4 button) with hover effects (1.05x scale) and descriptive subtitles
- **Solo Game** (`SoloGame.ts`): Immediate gameplay with full-screen movement (x: 50-750), randomized popcorn spawning, and bonus popcorn system
- **Multiplayer Lobby** (`MultiplayerLobby.ts`): Matchmaking screen with "Finding opponent..." status (alpha animation), player role display, back button with proper cleanup, and 60-second timeout
- **Multiplayer Game** (`MultiplayerGame.ts`): Split-screen gameplay with real-time synchronization (500ms polling), disconnect detection, server-controlled start time, and bonus popcorn system
- **Game Over Screens**: 
  - **Solo** (`SoloGameOver.ts`): Shows final score with "Play Again" (green #00FF00, blinking) and "Main Menu" (white) buttons
  - **Multiplayer** (`MultiplayerGameOver.ts`): Shows winner (color-coded), both scores, disconnect handling ("OPPONENT LEFT" message), and "Back to Menu" button

### Tech Stack

- **[Devvit](https://developers.reddit.com/)**: Reddit's developer platform for building immersive apps (provides hosting, authentication, Redis)
- **[Phaser 3.88.2](https://phaser.io/)**: 2D game engine with Arcade Physics system (gravity: 300 px/s², 60 FPS rendering)
- **[Vite 6.2.4](https://vite.dev/)**: Lightning-fast build tool for the webview (compiles client and server separately)
- **[Express 5.1.0](https://expressjs.com/)**: Backend API server with multiplayer game state manager (MultiplayerGameManager singleton)
- **[TypeScript 5.8.2](https://www.typescriptlang.org/)**: Type-safe development across client and server (shared types in `src/shared/types/api.ts`)
- **[Redis](https://redis.io/)**: Data persistence layer (via Devvit, stores game state with keys like `popcorn_game:{gameId}` and `popcorn_waiting_games`)
- **Node.js 22+**: Required runtime for Devvit platform

## How to Play

### Getting Started

1. **Launch the Game**: Open the Reddit post containing Corn Clash and click the "🍿 Play Now" button on the splash screen
   - Splash screen shows "Corn Clash" branding with custom background and icon
   - Description: "Catch flying popcorn!"
2. **Wait for Loading**: The Preloader scene displays a modern loading screen while assets load:
   - Pure black background (#000000) for clean, professional look
   - Centered app icon (myiconimage.png) scaled proportionally to 128x128 pixels at position (400, 250)
   - Glowing duplicate icon layer behind main icon (1.1x scale, 0.4 alpha, depth -1) with smooth pulsing animation
   - Pulsing animation: scale 1.0→1.05→1.0 and alpha 0.4→0.32→0.4 over 2-second cycle with Sine.easeInOut easing
   - Cyan-to-blue gradient progress bar (400x20px with rounded corners) positioned at (400, 380) with animated fill showing load progress
   - Progress bar background: dark gray (#333333) with lighter gray stroke (#666666), drawn with rounded corners
   - Progress bar fill: cyan-to-blue gradient (#00FFFF → #0080FF) that grows from left to right (4px to 396px width)
   - Multi-layer glow effect: Two glow layers behind the fill bar (alpha 0.6 with +4px padding, alpha 0.3 with +8px padding) for neon effect
   - Assets loaded: kitchen_background.png, large_pot.png, single_corn.png, empty_popcorn_cup.png, counter1.png
   - If any asset fails to load, a warning appears in console but game continues
3. **Main Menu**: Click or tap anywhere on the screen to continue past the splash screen
   - Displays "POPCORN CATCH!" title in gold (#FFD700)
   - Shows control instructions: "Player 1: A/D to move" and "Player 2: Arrow Keys to move"
   - Game objective: "Catch the popcorn! 60 seconds - Most popcorn wins!"
   - Blinking "Click to Start!" text (green #00FF00) indicates interactivity
4. **Mode Selection**: Choose your preferred game mode:
   - **SOLO MODE** (Red #FF6B6B button): "Play alone and beat your high score!"
   - **MULTIPLAYER** (Cyan #4ECDC4 button): "Compete against another player online!"
   - Buttons scale to 1.05x on hover for visual feedback

---

### 🎮 Solo Mode

**Objective**: Catch as many popcorn kernels as possible in 60 seconds and beat your personal best!

#### Controls
- **Keyboard**: 
  - **A** or **← Left Arrow**: Move your cup left (300 px/s)
  - **D** or **→ Right Arrow**: Move your cup right (300 px/s)
- **Mobile Touch**: 
  - Tap and hold the **◄ button** (bottom-left, 80px diameter) to move left
  - Tap and hold the **► button** (bottom-right, 80px diameter) to move right
  - Buttons positioned 100px from screen edges, 150px from bottom
  - Semi-transparent black circles (#000000, 30% alpha) with white stroke

#### Gameplay Mechanics

**Your Character**: You control a 100x100 pixel popcorn cup (empty_popcorn_cup.png asset) that can move freely across the entire screen width (with 50px margins on each side, x: 50-750).

**Popcorn Spawning**: 
- Kernels (single_corn.png asset) launch from the shaking pot positioned on the kitchen counter (center at x=400, y=480 from bottom)
- Spawn rate: Every 0.8-1.2 seconds (randomized via `scheduleNextPopcorn()` method with `Phaser.Math.Between(800, 1200)`)
- Popcorn size: 40x40 pixels (setDisplaySize in `spawnPopcorn()`)
- Launch physics (Phaser Arcade Physics):
  - Horizontal velocity: 100-250 pixels/second in a random direction (left or right via `Phaser.Math.Between(100, 250)`)
  - Vertical velocity: -300 to -450 pixels/second (upward launch via `Phaser.Math.Between(-450, -300)`)
  - Gravity pulls kernels down at 300 pixels/second² (configured in main.ts arcade physics)
  - Kernels spin while airborne with random angular velocity (-200 to 200 deg/s via `setAngularVelocity(Phaser.Math.Between(-200, 200))`)
  - Bounce coefficient: 0.3 (kernels bounce slightly when hitting surfaces via `setBounce(0.3)`)
  - World bounds collision disabled (`setCollideWorldBounds(false)`) - kernels can fall off screen

**Catching Popcorn**:
- Position your cup to intercept falling kernels
- Cup size: 100x100 pixels (consistent across both modes)
- Collision detection uses overlap physics (80% of cup width, 60% of cup height via `setSize()`)
- **Three types of popcorn with different point values:**
  - **Normal (white)**: +1 point (70% spawn rate)
  - **Red**: +10 points (20% spawn rate) - shows "+10" popup on catch
  - **Blue**: +20 points (10% spawn rate) - shows "+20" popup on catch
- Maximum 50 active popcorn kernels on screen at once (configured in `popcornGroup` maxSize)
- Cup stays at fixed Y position (120px from bottom) - only moves horizontally
- Cup movement speed: 300 pixels/second (via `setVelocityX()`)
- Kernels auto-destroy when they fall off-screen (checked every 100ms via `time.addEvent()`)
- Caught kernels immediately deactivate (`setActive(false)`) to prevent double-counting

**Visual Feedback**:
- **Particle Burst**: 8 popcorn particles explode from the catch point (speed: 50-150 px/s, lifespan: 400ms, scale: 0.15→0, gravity: 200 px/s²)
- **Flash Effect**: Color-coded circle expands and fades at catch location (20px → 40px over 200ms, alpha: 0.6→0)
  - Yellow (#FFFF00) for normal popcorn
  - Red (#FF0000) for red popcorn
  - Blue (#0088FF) for blue popcorn
- **Score Popups**: Floating text shows "+10" (red) or "+20" (blue) for special popcorn catches, rising and fading over 800ms
- **Screen Shake**: Subtle 2-pixel shake when popcorn launches (50ms duration, 0.002 intensity via `cameras.main.shake()`)
- **Idle Animation**: Your cup gently floats up and down (±2px, 800ms sine wave cycle via `tweens.add()`)
- **Pot Animation**: Multi-axis wobble with Sine.easeInOut:
  - Horizontal: ±4px, 80ms cycle, yoyo repeat
  - Vertical: ±2px, 100ms cycle, yoyo repeat
  - Rotation: ±2°, 120ms cycle, yoyo repeat
  - All animations run continuously in parallel

**Timer**: Displayed at the top center in MM:SS format (starts at 01:00, counts down to 00:00)
- White text (#FFFFFF) with black stroke (6px thickness)
- Arial Black font, 36px size
- Updates every second via `time.addEvent()` with 1000ms delay

**Score Display**: Shows in the top-left corner in gold text (#FFD700, Arial Black 28px) - "Score: X"
- Updates immediately on each catch
- Positioned 20px from left edge, 30px from top

**Game Over**: After 60 seconds, view your final score with options to:
- **Play Again** (green #00FF00 button with blinking animation, alpha: 0.5-1.0, 800ms): Restart solo mode immediately
- **Main Menu** (white button): Return to mode selection
- Both buttons scale to 1.1x on hover
- Semi-transparent black overlay (70% alpha) dims the background

---

### 👥 Multiplayer Mode

**Objective**: Outscore your opponent by catching more popcorn in 60 seconds!

#### Matchmaking Process

1. Select **MULTIPLAYER** from mode selection (ModeSelect scene)
2. Enter the **Matchmaking Lobby** (MultiplayerLobby scene shows "Finding opponent..." with alpha animation 0.5-1.0)
3. System automatically pairs you with another player via `/api/multiplayer/join` endpoint:
   - First player creates a new game (becomes player1, status: "waiting", stored in Redis)
   - Second player joins existing game (becomes player2, status changes to "playing")
   - Server checks `popcorn_waiting_games` list in Redis for available games
4. Lobby displays your role and polls every 500ms for status updates
5. Game starts immediately when both players are connected (automatic transition to MultiplayerGame scene)
   - Double validation ensures both player1Id and player2Id exist before starting
   - Server-controlled start time ensures synchronized countdown
6. Option to return to menu if waiting too long:
   - "Back to Menu" button (red #FF6B6B) at bottom with hover effect (1.1x scale)
   - Clicking back button calls `leaveGame()` which stops polling timer and returns to ModeSelect
   - 60-second timeout automatically returns to menu if no opponent found

#### Controls (Same as Solo)
- **Keyboard**: A/D or Arrow Keys to move left/right (300 px/s)
- **Mobile Touch**: On-screen ◄ and ► buttons (80px diameter, positioned 100px from edges, 150px from bottom)
- Controls work identically in both modes, but movement is restricted to your territory in multiplayer

#### Multiplayer Mechanics

**Split-Screen Territory**:
- **Player 1 (Red Cup #FF6B6B, 100x100px)**: Controls the LEFT half of the screen (x: 50 to 350)
- **Player 2 (Cyan Cup #4ECDC4, 100x100px)**: Controls the RIGHT half of the screen (x: 450 to 750)
- You **cannot cross** the center line (x=400) - enforced by boundary checks in `update()` loop
- Pot positioned at center (x=400, y=480) creates contested zone for kernels
- Each player only scores when THEIR cup catches popcorn (no double-counting via `isMyPlayer` check)
- Boundary enforcement: `if (myPlayer.x < minX) myPlayer.x = minX` and `if (myPlayer.x > maxX) myPlayer.x = maxX`

**Server-Authoritative Gameplay** (MultiplayerGameManager class):
- Game state stored in Redis with keys: `popcorn_game:{gameId}` and `popcorn_waiting_games` list
- Server manages game lifecycle (waiting → playing → finished)
- Server tracks both players' positions and scores in GameState object
- Server-controlled start time ensures synchronized countdown for both players
- Position updates sync every 500ms (client polling via `/api/multiplayer/state`)
- Client sends position updates every 10 frames (throttled via `positionSyncDelay` counter)
- Score updates sent immediately on catch via `/api/multiplayer/score` for real-time feedback
- Server uses singleton pattern (`MultiplayerGameManager.getInstance()`) for centralized state management

**Real-Time Synchronization**:
- Opponent's cup position updates smoothly with 150ms linear interpolation tweens (`tweens.add()` with Linear ease)
- Score updates appear for both players (server tracks player1Score and player2Score)
- Timer counts down simultaneously using server-controlled start time (elapsed = `(Date.now() - gameStartTime) / 1000`)
- Both players see the same game state via polling every 500ms (10 frames)
- Cups positioned at y=480 from bottom (100x100px size) for both players
- Disconnect detection: If opponent leaves (5 consecutive failed fetches = ~1.6 seconds), game ends with "OPPONENT LEFT" message
- Server scores are authoritative - client fetches final scores with 1-second delay before showing game over screen

**Visual Indicators**:
- **Player 1 Score**: Top-left in red (#FF6B6B, Arial Black 28px) - "P1: X" (positioned 20px from left, 30px from top)
- **Player 2 Score**: Top-right in cyan (#4ECDC4, Arial Black 28px) - "P2: X" (positioned 20px from right, 30px from top)
- **Timer**: Top-center in white (#FFFFFF, Arial Black 36px) with black stroke (6px thickness, MM:SS format)
- Both cups have matching idle animations (±2px vertical, 800ms cycle, offset by 400ms delay for visual variety)
- Popcorn size: 40x40 pixels (same as solo mode)
- Cup tints applied via `setTint()` method (0xff6b6b for P1, 0x4ecdc4 for P2)

**Catch Effects**:
- Particle bursts (8 particles, speed: 50-150 px/s, lifespan: 400ms) and color-coded flash effects (20px→40px) when catching popcorn
- Score popups for special popcorn: "+10" (red) or "+20" (blue) float upward and fade
- Screen shake on popcorn launch (2px, 50ms, 0.002 intensity)
- Visual feedback appears for the player who catches (prevents double-counting)
- Flash color matches popcorn type: yellow for normal, red for +10, blue for +20

**Game Over**: After 60 seconds, see:
- Winner announcement (or "It's a Tie!" if scores are equal)
- Both players' final scores displayed (Player 1: X in red, Player 2: X in cyan)
- Winner's name displayed in their team color (red #FF6B6B or cyan #4ECDC4, gold #FFD700 for tie)
- Disconnect handling: Shows "OPPONENT LEFT" message (red #FF6B6B) if player disconnects mid-game
- "Back to Menu" button (gold stroke #FFD700, black background) to return to mode selection
- Server fetches authoritative final scores to ensure accuracy (1-second delay via `setTimeout()` for sync)
- Game over screen shows reason: 'completed' (normal end) or 'disconnect' (opponent left)

---

### 🎯 Tips & Strategy

#### Solo Mode Strategy
- **Center Positioning**: Start near the middle (x=400) to react to launches in either direction
- **Predict Trajectories**: Watch the pot's wobble and anticipate where kernels will land based on launch angle
- **Prioritize Special Popcorn**: Red (+10) and blue (+20) popcorn are worth significantly more - adjust position to catch them
- **Color Recognition**: Train your eyes to spot red and blue popcorn quickly among the white kernels
- **Smooth Movement**: Avoid oversteering - small adjustments (A/D taps) are more effective than holding keys
- **Learn the Physics**: Kernels follow consistent gravity (300 px/s²) - practice reading their arcs
- **Stay Calm**: Frantic movement causes you to miss easy catches - focus on positioning
- **Movement Range**: You have full screen access (x: 50-750), use it to your advantage
- **Risk vs Reward**: Sometimes it's worth missing a normal kernel to position for a special one

#### Multiplayer Strategy
- **Territory Mastery**: Learn the exact boundaries of your half (P1: x=50-350, P2: x=450-750, center line at x=400)
- **Positioning**: Stay slightly toward the center line (x=350 for P1, x=450 for P2) to catch kernels coming from the pot
- **Special Popcorn Priority**: Red (+10) and blue (+20) popcorn can swing the game - prioritize them over normal kernels
- **Opponent Awareness**: Watch your opponent's position (updates every 500ms with smooth interpolation) to predict which kernels they'll catch
- **Boundary Play**: Kernels near the center line are contested - time your movements carefully
- **Score Tracking**: Monitor both scores (top corners) - if behind, take more risks for special popcorn
- **Consistency Over Speed**: Steady catches beat risky dashes that leave you out of position
- **Pot Collision**: Don't get stuck on the pot (positioned at x=400) - maintain distance to stay mobile
- **Network Awareness**: Position updates are throttled (every 10 frames), so smooth movements work better than erratic dashing
- **Comeback Potential**: A single blue popcorn (+20) can close a large score gap quickly

#### Advanced Techniques
- **Arc Reading**: High-velocity kernels (250 px/s horizontal) travel farther - position accordingly based on launch angle
- **Color Spotting**: Train your peripheral vision to detect red/blue tints while tracking multiple kernels
- **Value Calculation**: Quick mental math - catching 2 blue popcorn (+40) equals 40 normal kernels
- **Bounce Prediction**: Kernels have 0.3 bounce coefficient - anticipate second chances off the counter (positioned 50px from bottom)
- **Spawn Timing**: Screen shake (2px, 50ms) indicates new kernel launch - prepare to track it immediately
- **Edge Control**: Use the screen boundaries (x=50, x=750) to your advantage - kernels can't escape sideways
- **Spawn Rate**: Kernels spawn every 0.4-0.7 seconds - expect 85-150 kernels per 60-second game
- **Physics Prediction**: Gravity is constant at 300 px/s² - learn to predict landing zones based on launch velocity
- **Pot Position Awareness**: Pot is at center (x=400, y=480) - kernels launch from this point with random trajectories
- **Mobile Optimization**: Touch controls work best with quick taps rather than holding for precise positioning
- **Velocity Calculation**: Horizontal (100-250 px/s) + Vertical (-300 to -450 px/s) + Gravity (300 px/s²) = predictable arcs
- **Collision Timing**: Kernels deactivate immediately on catch (`setActive(false)`) - no need to worry about double-catches
- **Special Popcorn Odds**: Expect ~21 red and ~11 blue popcorn per game (20% and 10% of ~105 average spawns)

---

### 🎨 Visual Design

**Kitchen Theme**:
- Warm kitchen background with counter
- Large pot positioned on the counter (30% scale, continuously animated)
- Cream/beige color scheme (#FFF8DC background)
- Kitchen counter spans full width at bottom (100px height, positioned 50px from bottom)

**Animations** (implemented via Phaser tweens):
- **Pot Wobble**: Multi-axis shake with Sine.easeInOut (continuous animation via `tweens.add()`)
  - Horizontal: ±4px, 80ms cycle, yoyo repeat -1
  - Vertical: ±2px, 100ms cycle, yoyo repeat -1
  - Rotation: ±2°, 120ms cycle, yoyo repeat -1
- **Player Idle**: Gentle 2-pixel vertical bounce (800ms sine wave, continuous, yoyo repeat -1)
  - In multiplayer: Player 2 has 400ms delay offset for visual variety
- **Particle System**: 8-particle burst on catch (`catchParticles.explode(8, x, y)`)
  - Speed: 50-150 px/s
  - Scale: 0.15 → 0 (fade out)
  - Lifespan: 400ms
  - Gravity: 200 px/s²
- **Flash Effect**: Color-coded expanding circle (`add.circle()` with tween)
  - Colors: Yellow (#FFFF00) for normal, Red (#FF0000) for +10, Blue (#0088FF) for +20
  - Alpha: 0.6 → 0 (fade out)
  - Scale: 1 → 2 (20px → 40px radius)
  - Duration: 200ms
- **Score Popups**: Floating "+10" or "+20" text for special popcorn
  - Rise: y position moves up 50px
  - Fade: Alpha 1.0 → 0
  - Duration: 800ms
  - Colors: Red (#FF0000) for +10, Blue (#0088FF) for +20
- **Screen Shake**: 2-pixel camera shake on each popcorn launch (50ms, 0.002 intensity via `cameras.main.shake()`)
- **Button Hover**: 1.05x scale on mode selection buttons, 1.1x on game over buttons
- **Text Blinking**: "Click to Start!" and "Play Again" buttons use alpha animation (0.3-1.0 or 0.5-1.0, 800ms, yoyo repeat -1)

**Size Reference**:
- **Canvas**: 800x600 pixels (scales to fit any screen with Phaser.Scale.FIT and CENTER_BOTH)
- **Popcorn**: 40x40px (both solo and multiplayer)
- **Player Cup**: 100x100px (both solo and multiplayer)
- **Pot**: 30% scale of original asset, positioned 120px from bottom (y=480)
- **Counter**: Full width, 100px height at bottom (50px from bottom edge)
- **Touch Buttons**: 80px diameter circles (positioned 100px from left/right edges, 150px from bottom)

**Color Coding**:
- Solo player: Default cup color (no tint), 100x100px
- Player 1: Red tint (#FF6B6B), 100x100px
- Player 2: Cyan tint (#4ECDC4), 100x100px
- Normal popcorn: White (no tint), +1 point
- Red popcorn: Red tint (#FF0000), +10 points
- Blue popcorn: Blue tint (#0088FF), +20 points
- Score text: Gold (#FFD700) in solo, team colors (#FF6B6B, #4ECDC4) in multiplayer
- Timer: White (#FFFFFF) with black stroke (#000000, 6px thickness)
- Flash effects: Yellow (#FFFF00) for normal, Red (#FF0000) for +10, Blue (#0088FF) for +20
- Background: Cream (#FFF8DC)
- Touch buttons: Black (#000000) with 30% alpha, white stroke (#FFFFFF, 4px)

## Getting Started (For Developers)

> Make sure you have Node.js 22.2.0 or higher installed on your machine before running!

### Initial Setup

1. Run `npm create devvit@latest --template=phaser`
2. Go through the installation wizard. You will need to create a Reddit account and connect it to Reddit developers
3. Copy the command on the success page into your terminal
4. Navigate to your project directory: `cd corn-clash`
5. Install dependencies: `npm install`

### Development Commands

- `npm run dev`: Starts a development server where you can develop your application live on Reddit
  - Runs client build watcher, server build watcher, and Devvit playtest concurrently
  - Opens playtest at `r/corn_clash_dev` (configured in devvit.json)
  - Provides a playtest URL to test the game in your browser
- `npm run build`: Builds both client and server projects for production
  - Client builds to `dist/client/` with HTML entry point
  - Server builds to `dist/server/index.cjs` as CommonJS module
- `npm run deploy`: Uploads a new version of your app to Reddit
- `npm run launch`: Publishes your app for review (required for subreddits with >200 members)
- `npm run login`: Logs your CLI into Reddit (use `--copy-paste` flag if needed)
- `npm run check`: Type checks, lints, and prettifies your app

### Testing Your Changes

1. Run `npm run dev` in your terminal
2. Wait for the build to complete (you'll see "Build complete" messages)
3. Open the provided playtest URL in your browser (e.g., `https://www.reddit.com/r/corn_clash_dev?playtest=corn-clash`)
4. Click "Launch App" to test the game
5. Make changes to your code - the build will automatically recompile
6. Refresh the browser to see your changes

### Project Structure

```
src/
├── client/              # Frontend Phaser.js game
│   ├── game/
│   │   ├── main.ts     # Phaser config and scene setup
│   │   └── scenes/     # Game scenes (Boot, Preloader, MainMenu, etc.)
│   ├── index.html      # HTML entry point
│   └── vite.config.ts  # Client build config
├── server/              # Backend Express API
│   ├── index.ts        # API endpoints and Devvit integration
│   ├── core/           # Business logic (multiplayer manager, post creation)
│   └── vite.config.ts  # Server build config (SSR, CommonJS)
└── shared/              # Shared TypeScript types
    └── types/api.ts    # API request/response types

assets/                  # Game assets (images)
dist/                    # Build output (client + server)
devvit.json             # Devvit app configuration
```

## Cursor Integration

This template comes with a pre-configured cursor environment. To get started, [download cursor](https://www.cursor.com/downloads) and enable the `devvit-mcp` when prompted.

## Credits

Thanks to the Phaser team for [providing a great template](https://github.com/phaserjs/template-vite-ts)!
