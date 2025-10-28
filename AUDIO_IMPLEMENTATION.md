# Background Music Implementation

## Overview
Implemented a complete background music system with two tracks that play throughout the game.

## Audio Files Required
Place these files in the `assets/` folder:
- `mainmenusong.mp3` - Plays in menus and lobby scenes (loaded as 'menu_music')
- `gameplaysong.mp3` - Plays during gameplay (loaded as 'game_music')

Note: The files are loaded with these exact names in Preloader.ts

## Implementation Details

### AudioManager (Singleton)
Created `src/client/game/utils/AudioManager.ts` - a singleton class that manages background music across all scenes with:
- Smooth fade-in/fade-out transitions (500ms)
- Prevents multiple tracks from playing simultaneously
- Automatic music switching when changing scenes
- Volume control (default: 0.3 or 30%)
- **Uses game's sound manager** instead of scene's to persist music across scene transitions
- Properly destroys old music before starting new tracks

### Music Distribution

**Menu Music** (`menu_music.mp3`) plays on:
- Boot
- Preloader
- MainMenu
- ModeSelect
- HowToPlay
- MultiplayerLobby
- SoloGameOver
- MultiplayerGameOver

**Game Music** (`game_music.mp3`) plays on:
- SoloGame
- MultiplayerGame

## Usage
The AudioManager automatically handles music transitions. Each scene initializes it with:
```typescript
AudioManager.getInstance().init(this);
AudioManager.getInstance().playMusic('menu_music', 0.3);
```

## Features
- Seamless transitions between scenes
- No music overlap or interruptions
- Looping enabled by default
- Fade effects for smooth audio experience
- Centralized volume control

## Testing

### Step 1: Add Audio Files
Add these two MP3 files to the `assets/` folder:
- `mainmenusong.mp3` (menu background music)
- `gameplaysong.mp3` (gameplay background music)

**Important:** The files MUST be named exactly as shown above, or the game won't find them.

### Step 2: Test the Game
1. Run `npm run dev`
2. Open the playtest URL in your browser
3. Open browser console (F12) to see audio debug logs

### Expected Behavior:
- Menu music starts automatically when the main menu loads
- Menu music continues through MainMenu, ModeSelect, HowToPlay, and Lobby
- Music switches to gameplay music when entering Solo or Multiplayer game
- Music switches back to menu music when game ends
- All transitions have smooth 500ms fade effects
- Music persists across scene changes (uses game's sound manager, not scene's)

### Troubleshooting:
- If no music plays: Check that MP3 files exist in `assets/` folder
- If music stops: Check console for errors about missing files
- If music doesn't switch: Check console logs to see which track is playing
