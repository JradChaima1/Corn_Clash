# Popcorn Catch Game

A popcorn catching game with both solo and online multiplayer modes, built with Phaser.js for Reddit's Devvit platform.

## Game Modes

### Solo Mode
Play alone and try to beat your high score! Catch as much popcorn as you can in 60 seconds.

### Multiplayer Mode
Compete against another player online in real-time. The player who catches the most popcorn wins!

## Game Setup

- **Canvas Size**: 800x600 pixels
- **Game Duration**: 60 seconds
- **Players**: 1 (Solo) or 2 (Multiplayer)

## Controls

### Solo Mode
- `A` or `←` (Left Arrow) - Move left
- `D` or `→` (Right Arrow) - Move right

### Multiplayer Mode
- Each player uses their own device
- `A` or `←` (Left Arrow) - Move left
- `D` or `→` (Right Arrow) - Move right
- Player 1 stays on the left half, Player 2 on the right half

## Game Flow

1. **Main Menu**: Click to start
2. **Mode Selection**: Choose Solo or Multiplayer
3. **Solo Mode**: Start playing immediately
4. **Multiplayer Mode**: 
   - Join matchmaking lobby
   - Wait for opponent
   - Game starts when 2 players are ready
5. **Gameplay**: Catch popcorn for 60 seconds
6. **Game Over**: View final score/winner and play again

## Visual Elements

- Kitchen background with counter
- Animated shaking pot in the center
- Falling popcorn pieces with physics
- Player characters (currently placeholder rectangles)
- Score displays
- Countdown timer

## Multiplayer Features

- **Automatic Matchmaking**: Players are automatically matched with opponents
- **Real-time Synchronization**: Game state updates every 100ms
- **Server-side Game Logic**: Popcorn spawning and collision detection handled by server
- **Fair Gameplay**: Both players see the same popcorn at the same time

## Technical Details

### Client-Side
- Phaser.js for game rendering
- Polling-based state synchronization
- Smooth player movement with position updates

### Server-Side
- Express.js API endpoints
- In-memory game state management
- Automatic game cleanup after completion

## Development

Run the game in development mode:
```bash
npm run dev
```

This will start the Devvit playtest environment where you can test both solo and multiplayer modes.

## API Endpoints

- `POST /api/multiplayer/join` - Join or create a game
- `GET /api/multiplayer/state?gameId={id}` - Get current game state
- `POST /api/multiplayer/position?gameId={id}` - Update player position

## Next Steps

The current implementation uses placeholder rectangles for player characters. Future updates will include:
- Custom character sprites (Cupcorn characters)
- Catching animations
- Sound effects
- Particle effects for caught popcorn
- High score leaderboard for solo mode
- Player statistics and match history
