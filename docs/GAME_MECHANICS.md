# CornClash - Complete Game Mechanics

## Assets Required

Place these images in `src/client/public/assets/`:

- `kitchen backgorund.png` - Kitchen background scene
- `counter.png` - Kitchen counter platform
- `larger pot.png` - Cooking pot that spawns popcorn
- `empty_pop_corn_cup.png` - Player character (popcorn cup)
- `single corn.png` - Individual popcorn piece

## Audio Assets

Place these audio files in `src/client/public/assets/audio/`:

- `menu_music.mp3` - Menu background music
- `game_music.mp3` - Gameplay background music
- `catch.mp3` - Popcorn catch sound effect
- `negative.mp3` - Red popcorn catch sound effect

## Physics & Gameplay

### Popcorn Spawning

- **Spawn Rate**: 1 piece every 400-700ms (randomized)
- **Spawn Location**: Center of pot (width/2, height - 120)
- **Launch Velocity**:
  - Horizontal: 100-250 pixels/sec (random direction)
  - Vertical: -300 to -450 pixels/sec (upward)
- **Gravity**: 300 pixels/sec² (arcade physics)
- **Rotation**: Random angular velocity (-200 to 200 deg/sec)
- **Bounce**: 0.3 coefficient
- **Max Active**: 50 popcorn pieces simultaneously
- **Destruction**: Auto-remove when off-screen (y > height + 100)

### Popcorn Types

- **White Popcorn** (70% spawn rate):
  - Value: +1 point
  - Tint: None (default white)
  - Sound: catch.mp3
  
- **Red Popcorn** (20% spawn rate):
  - Value: -10 points
  - Tint: 0xFF0000 (red)
  - Special: Spawns 5 chaos popcorn pieces
  - Sound: negative.mp3
  - Visual: Red flash effect
  
- **Blue Popcorn** (10% spawn rate):
  - Value: +20 points
  - Tint: 0x0088FF (blue)
  - Sound: catch.mp3
  - Visual: Blue flash effect

### Collision Detection

- **Detection Method**: Overlap between player and popcorn
- **Collision Radius**: Player body 80% width × 60% height
- **On Catch**:
  - Score updated based on popcorn type
  - Popcorn destroyed
  - Catch animation triggered (scale to 110%)
  - Particle effect spawned (8 particles)
  - Flash effect displayed (color-coded)
  - Screen shake (0.002 intensity, 50ms)
  - Sound effect played

### Scoring

- **White Popcorn**: +1 point
- **Blue Popcorn**: +20 points
- **Red Popcorn**: -10 points (minimum score: 0)
- **Display**: Real-time score updates
- **Tracking**: Independent scores for each player
- **Multiplayer Sync**: Server-authoritative scoring with 166ms polling

### Game Timer

- **Duration**: 60 seconds
- **Format**: MM:SS (e.g., "01:00", "00:45")
- **Display**: Top center of screen
- **End Condition**: Timer reaches 00:00
- **Winner**: Highest score (or "Tie" if equal)

## Animations & Visual Effects

### Pot Animation

- **Vertical Wobble**: ±5 pixels (height - 120 to height - 125)
- **Duration**: 600ms cycle
- **Rotation**: ±1 degree
- **Rotation Duration**: 700ms cycle
- **Easing**: Sine.easeInOut
- **Loop**: Continuous (yoyo, repeat: -1)
- **Size**: 300×300px

### Popcorn Animation

- **Rotation**: Continuous spin while airborne
  - Angular velocity: -200 to 200 deg/sec (random)
- **Physics**: Realistic arc trajectory with gravity
- **Velocity**: Affected by gravity (300 px/s²)
- **Size**: 40×40px

### Player Idle Animation

- **Vertical Bounce**: ±2 pixels
- **Duration**: 800ms cycle
- **Easing**: Sine.easeInOut
- **Loop**: Continuous (yoyo, repeat: -1)

### Catch Animation

- **Scale**: Grows to 110% (from 0.5 to 0.55 scale)
- **Duration**: 100ms
- **Yoyo**: Returns to normal size
- **Easing**: Back.easeOut
- **Trigger**: On successful popcorn catch

### Particle Effects

- **Trigger**: On successful catch
- **Count**: 8 particles per burst
- **Speed**: 50-150 pixels/sec (random)
- **Scale**: 0.3 → 0 (fade out)
- **Lifespan**: 400ms
- **Gravity**: 200 pixels/sec²
- **Texture**: 'popcorn' sprite
- **Blend Mode**: ADD (for glow effect)

### Flash Effect

- **Shape**: Circle, 20px radius
- **Color**: 
  - White popcorn: Yellow (#FFFF00)
  - Blue popcorn: Blue (#0088FF)
  - Red popcorn: Red (#FF0000)
- **Alpha**: 0.6 → 0
- **Scale**: 1 → 2
- **Duration**: 200ms
- **Easing**: Power2

### Screen Shake

- **Trigger**: On popcorn catch
- **Duration**: 50ms
- **Intensity**: 0.002 (1-2 pixels)
- **Camera Effect**: Main camera shake

### Pot Wobble on Catch

- **Trigger**: When popcorn is caught
- **Horizontal**: ±3 pixels
- **Duration**: 800ms
- **Easing**: Elastic.easeOut
- **Yoyo**: Yes

## Game Modes

### Solo Mode

- **Players**: 1
- **Objective**: Get the highest score in 60 seconds
- **Controls**: 
  - Keyboard: A/D or Arrow Keys
  - Mobile: Touch buttons (left/right)
- **Movement**: Full screen width (with world bounds)
- **Character**: Single popcorn cup (100×100px)
- **Starting Position**: Right side (width - 100, height - 120)
- **Music**: game_music.mp3 (0.3 volume)

### Multiplayer Mode (Online)

- **Players**: 2 (different devices/users)
- **Objective**: Outscore opponent in 60 seconds
- **Matchmaking**: Automatic pairing via Redis sorted set
- **Controls**: 
  - Keyboard: A/D or Arrow Keys
  - Mobile: Touch buttons (left/right)
- **Movement**:
  - Player 1: Left half of screen (0 to width/2)
  - Player 2: Right half of screen (width/2 to width)
- **Characters**: Two popcorn cups (100×100px each)
  - Player 1: Red tint (0xFF6B6B)
  - Player 2: Cyan tint (0x4ECDC4)
- **Starting Positions**:
  - Player 1: x=150, y=height-120
  - Player 2: x=650, y=height-120
- **Network Sync**: 
  - Position updates: Every 10 frames (throttled)
  - Score updates: Immediate POST to server
  - State polling: Every 166ms (10 frames at 60fps)
  - Disconnect detection: 10 consecutive failed fetches
- **Server Features**:
  - Server-authoritative scoring
  - Atomic Redis transactions (WATCH/MULTI/EXEC)
  - Self-matching prevention
  - Duplicate join prevention
  - Ready timeout: 30 seconds
  - Game expiry: 2 minutes
  - Disconnect detection: 5 seconds of inactivity
- **Music**: game_music.mp3 (0.3 volume)

## Technical Implementation

### Client-Side (Phaser.js)

- **Engine**: Phaser 3.88.2
- **Physics**: Arcade physics with gravity (300 px/s²)
- **Rendering**: WebGL/Canvas (auto-detect)
- **Resolution**: 800×600 (scaled to fit)
- **Input**: 
  - Keyboard (A/D, Arrow Keys)
  - Touch buttons (mobile)
- **Animations**: Tween-based (Phaser tweens)
- **Particles**: Built-in particle emitter system
- **Audio**: AudioManager singleton with volume control
- **Scenes**:
  - Preloader: Asset loading with progress bar
  - MainMenu: Mode selection
  - SoloGame: Single-player gameplay
  - MultiplayerLobby: Matchmaking and ready system
  - MultiplayerGame: Two-player gameplay
  - GameOver: Results screen
  - MultiplayerGameOver: Multiplayer results

### Server-Side (Multiplayer)

- **Platform**: Reddit Devvit (Node.js)
- **Framework**: Express.js
- **Database**: Redis (via Devvit)
- **Architecture**: Server-authoritative
- **State Management**: 
  - Game state stored in Redis with TTL (120s)
  - Player-game mapping for duplicate prevention
  - Waiting games queue (sorted set by timestamp)
- **Matchmaking**: 
  - Automatic pairing via Redis sorted set
  - Self-matching prevention
  - Stale game cleanup
- **Sync Strategy**:
  - Client polls every 166ms (10 frames at 60fps)
  - Position updates throttled (every 10 frames)
  - Score updates immediate (POST on catch)
  - Final score sync before game over (500ms delay)
- **Atomic Operations**:
  - WATCH/MULTI/EXEC for race condition prevention
  - Retry logic with exponential backoff (3 attempts)
- **Cleanup**:
  - Game expiry: 2 minutes
  - Ready timeout: 30 seconds
  - Disconnect detection: 5 seconds inactivity
  - Automatic cleanup on player leave

### API Endpoints

- `POST /api/multiplayer/join` - Join or create game
- `POST /api/multiplayer/ready` - Signal ready to start
- `GET /api/multiplayer/state` - Get game state
- `POST /api/multiplayer/position` - Update player position
- `POST /api/multiplayer/score` - Update player score
- `POST /api/multiplayer/leave` - Leave game
- `POST /api/multiplayer/end` - End game

## Performance Considerations

- **Max Popcorn**: 50 active pieces simultaneously
- **Particle Limit**: 8 particles per catch (400ms lifespan)
- **Update Rate**: 60 FPS (client)
- **Network**: 
  - Position updates throttled (every 10 frames = 166ms)
  - State polling: 166ms interval
  - Score updates: Immediate (not throttled)
- **Memory**: Automatic cleanup of off-screen popcorn
- **Redis TTL**: 120 seconds for game states
- **Disconnect Handling**: 10 consecutive failed fetches = disconnect

## Color Scheme

### Multiplayer Player Colors
- **Player 1**: Red tint (0xFF6B6B / #FF6B6B)
- **Player 2**: Cyan tint (0x4ECDC4 / #4ECDC4)

### Popcorn Colors
- **White Popcorn**: No tint (default)
- **Blue Popcorn**: Blue tint (0x0088FF / #0088FF)
- **Red Popcorn**: Red tint (0xFF0000 / #FF0000)

### UI Colors
- **Score Text**: White (#FFFFFF), 32px bold
- **Timer Text**: White (#FFFFFF), 48px bold
- **Flash Effects**: 
  - Normal: Yellow (#FFFF00)
  - Blue: Blue (#0088FF)
  - Red: Red (#FF0000)
- **Background**: Kitchen scene image
- **Counter**: Kitchen counter image

### Button Colors (Main Menu)
- **Solo Button**: Green gradient
- **Multiplayer Button**: Blue gradient
- **Text**: White (#FFFFFF)
- **Hover**: Slight scale increase (1.05x)

## Mobile Controls

### Touch Buttons
- **Position**: Bottom corners of screen
- **Size**: 80×80px
- **Left Button**: 
  - Position: (60, height - 60)
  - Text: "◄"
  - Color: White with 50% opacity
- **Right Button**:
  - Position: (width - 60, height - 60)
  - Text: "►"
  - Color: White with 50% opacity
- **Interaction**: Touch down/up events
- **Visual Feedback**: Alpha change on press

## Loading Screen

- **Background**: Kitchen scene
- **Progress Bar**: 
  - Width: 400px
  - Height: 30px
  - Position: Center of screen
  - Fill Color: White
  - Border: 2px white
- **Loading Text**: "Loading..." (24px white)
- **Asset Count Display**: Shows loaded/total assets

## Multiplayer Lobby

### UI Elements
- **Game ID Display**: Top of screen
- **Player Status**:
  - Player 1: Left side with ready indicator
  - Player 2: Right side with ready indicator
- **Ready Button**: Center bottom
- **Leave Button**: Top right corner
- **Waiting Message**: "Waiting for opponent..." when solo
- **Ready Countdown**: Shows when both players ready

### Ready System
- **Ready Timeout**: 30 seconds from first ready
- **Visual Indicator**: Green checkmark when ready
- **Both Ready**: Automatic countdown (3 seconds)
- **Transition**: Fade to MultiplayerGame scene
