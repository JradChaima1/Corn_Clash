# Refactoring Recommendations

## Overview

After analyzing the codebase, I've identified several opportunities to improve code quality, reduce duplication, and enhance maintainability.

## Priority 1: High Impact Refactorings

### 1. Extract Shared Game Logic into Base Class

**Problem**: `SoloGame.ts` and `MultiplayerGame.ts` have ~70% duplicate code

**Duplicate Code**:

- Popcorn spawning logic (`spawnPopcorn()`, `scheduleNextPopcorn()`)
- Popcorn physics (velocity, rotation, gravity)
- Collision detection (`handlePopcornCatch()`)
- Visual effects (particles, flash, screen shake)
- UI setup (background, counter, pot)
- Pot animations
- Mobile controls
- Keyboard input handling

**Solution**: Create `BaseGameScene` class

```typescript
// src/client/game/scenes/BaseGameScene.ts
export abstract class BaseGameScene extends Scene {
  // Shared properties
  protected gameTime: number = 60;
  protected isGameActive: boolean = false;
  protected pot!: Phaser.GameObjects.Image;
  protected popcornGroup!: Phaser.Physics.Arcade.Group;
  // ... other shared properties

  // Shared methods
  protected setupBackground(): void {
    /* ... */
  }
  protected setupPot(): void {
    /* ... */
  }
  protected spawnPopcorn(): void {
    /* ... */
  }
  protected scheduleNextPopcorn(): void {
    /* ... */
  }
  protected handlePopcornCatch(
    player: Phaser.GameObjects.Image,
    popcorn: Phaser.GameObjects.GameObject
  ): void {
    /* ... */
  }
  protected createVisualEffects(x: number, y: number, type: string): void {
    /* ... */
  }

  // Abstract methods for subclasses to implement
  protected abstract updateScore(value: number, playerNum?: number): void;
  protected abstract onGameEnd(): void;
}

// Then SoloGame and MultiplayerGame extend BaseGameScene
export class SoloGame extends BaseGameScene {
  protected updateScore(value: number): void {
    this.score += value;
    // Solo-specific logic
  }
}

export class MultiplayerGame extends BaseGameScene {
  protected updateScore(value: number, playerNum: number): void {
    // Multiplayer-specific logic with player numbers
  }
}
```

**Benefits**:

- Reduces code duplication by ~1000 lines
- Easier to maintain game mechanics (change once, applies to both modes)
- Consistent behavior between solo and multiplayer
- Easier to add new game modes in the future

**Estimated Effort**: 4-6 hours

---

### 2. Extract Popcorn Logic into Separate Class

**Problem**: Popcorn spawning, physics, and types are scattered across game scenes

**Solution**: Create `PopcornManager` class

```typescript
// src/client/game/managers/PopcornManager.ts
export class PopcornManager {
  private scene: Phaser.Scene;
  private popcornGroup: Phaser.Physics.Arcade.Group;
  private spawnTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.popcornGroup = this.scene.physics.add.group();
  }

  spawn(x: number, y: number): void {
    const popcorn = this.popcornGroup.get(x, y, 'popcorn');
    if (!popcorn) return;

    // Determine type (normal, red, blue)
    const type = this.determinePopcornType();
    this.applyPopcornType(popcorn, type);

    // Apply physics
    this.applyPhysics(popcorn);
  }

  private determinePopcornType(): 'normal' | 'red' | 'blue' {
    const rand = Math.random();
    if (rand < 0.7) return 'normal';
    if (rand < 0.9) return 'red';
    return 'blue';
  }

  private applyPopcornType(popcorn: Phaser.GameObjects.GameObject, type: string): void {
    // Apply tint and store type
  }

  private applyPhysics(popcorn: Phaser.GameObjects.GameObject): void {
    // Apply velocity, rotation, etc.
  }

  startSpawning(callback: () => void): void {
    this.scheduleNext(callback);
  }

  stopSpawning(): void {
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }
  }

  private scheduleNext(callback: () => void): void {
    const delay = Phaser.Math.Between(400, 700);
    this.spawnTimer = this.scene.time.delayedCall(delay, () => {
      callback();
      this.scheduleNext(callback);
    });
  }
}
```

**Benefits**:

- Encapsulates all popcorn-related logic
- Easier to add new popcorn types
- Testable in isolation
- Reusable across different game modes

**Estimated Effort**: 2-3 hours

---

### 3. Create NetworkManager for Multiplayer Communication

**Problem**: Network calls scattered throughout `MultiplayerGame.ts` and `MultiplayerLobby.ts`

**Solution**: Create `NetworkManager` class

```typescript
// src/client/game/managers/NetworkManager.ts
export class NetworkManager {
  private gameId: string;
  private consecutiveFailures: number = 0;

  constructor(gameId: string) {
    this.gameId = gameId;
  }

  async sendScore(score: number): Promise<boolean> {
    try {
      const response = await fetch(`/api/multiplayer/score?gameId=${this.gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to send score:', error);
      return false;
    }
  }

  async sendPosition(position: number): Promise<boolean> {
    // Similar implementation
  }

  async fetchGameState(): Promise<GameState | null> {
    try {
      const response = await fetch(`/api/multiplayer/state?gameId=${this.gameId}`);
      if (!response.ok) {
        this.consecutiveFailures++;
        return null;
      }
      this.consecutiveFailures = 0;
      const data = await response.json();
      return data.gameState;
    } catch (error) {
      this.consecutiveFailures++;
      return null;
    }
  }

  async leaveGame(): Promise<void> {
    await fetch(`/api/multiplayer/leave?gameId=${this.gameId}`, {
      method: 'POST',
    });
  }

  isDisconnected(): boolean {
    return this.consecutiveFailures >= 10;
  }
}
```

**Benefits**:

- Centralizes all network logic
- Easier to add retry logic, caching, etc.
- Testable with mock responses
- Cleaner scene code

**Estimated Effort**: 2-3 hours

---

## Priority 2: Medium Impact Refactorings

### 4. Extract Constants to Configuration File

**Problem**: Magic numbers scattered throughout code

**Solution**: Create configuration file

```typescript
// src/client/game/config/GameConfig.ts
export const GameConfig = {
  GAME_DURATION: 60, // seconds

  POPCORN: {
    SPAWN_DELAY_MIN: 400,
    SPAWN_DELAY_MAX: 700,
    MAX_ACTIVE: 50,
    VELOCITY_X_MIN: 100,
    VELOCITY_X_MAX: 250,
    VELOCITY_Y_MIN: -450,
    VELOCITY_Y_MAX: -300,
    ROTATION_MIN: -200,
    ROTATION_MAX: 200,
    SIZE: 40,
  },

  POPCORN_TYPES: {
    NORMAL: { value: 1, spawnRate: 0.7, tint: null },
    RED: { value: -10, spawnRate: 0.2, tint: 0xff0000 },
    BLUE: { value: 20, spawnRate: 0.1, tint: 0x0088ff },
  },

  PLAYER: {
    SPEED: 300,
    SIZE: 100,
  },

  POT: {
    SIZE: 300,
    WOBBLE_DURATION: 800,
    WOBBLE_AMOUNT: 3,
  },

  PHYSICS: {
    GRAVITY: 300,
    BOUNCE: 0.3,
  },

  NETWORK: {
    POLL_INTERVAL: 166, // ms (10 frames at 60fps)
    DISCONNECT_THRESHOLD: 10, // failed fetches
    POSITION_SYNC_THROTTLE: 10, // frames
    DISCONNECT_TIMEOUT: 5000, // ms
  },
};
```

**Benefits**:

- Easy to tweak game balance
- No magic numbers in code
- Single source of truth for values
- Easy to create difficulty levels

**Estimated Effort**: 1-2 hours

---

### 5. Create ScoreManager Class

**Problem**: Score logic mixed with game logic

**Solution**: Separate score management

```typescript
// src/client/game/managers/ScoreManager.ts
export class ScoreManager {
  private scores: Map<string, number> = new Map();
  private scoreTexts: Map<string, Phaser.GameObjects.Text> = new Map();

  constructor(private scene: Phaser.Scene) {}

  registerPlayer(playerId: string, scoreText: Phaser.GameObjects.Text): void {
    this.scores.set(playerId, 0);
    this.scoreTexts.set(playerId, scoreText);
  }

  addScore(playerId: string, value: number): number {
    const current = this.scores.get(playerId) || 0;
    const newScore = Math.max(0, current + value); // Prevent negative
    this.scores.set(playerId, newScore);
    this.updateDisplay(playerId);
    return newScore;
  }

  getScore(playerId: string): number {
    return this.scores.get(playerId) || 0;
  }

  private updateDisplay(playerId: string): void {
    const score = this.scores.get(playerId);
    const text = this.scoreTexts.get(playerId);
    if (text && score !== undefined) {
      text.setText(`${playerId}: ${score}`);
    }
  }

  showScorePopup(x: number, y: number, value: number): void {
    const color = value > 0 ? '#00FF00' : '#FF0000';
    const text = this.scene.add.text(x, y, `${value > 0 ? '+' : ''}${value}`, {
      fontSize: '32px',
      color: color,
    });

    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }
}
```

**Benefits**:

- Cleaner separation of concerns
- Easier to add score multipliers, combos, etc.
- Testable score logic

**Estimated Effort**: 1-2 hours

---

### 6. Extract Visual Effects to EffectsManager

**Problem**: Particle effects, flashes, and screen shake scattered in game scenes

**Solution**: Create `EffectsManager` class

```typescript
// src/client/game/managers/EffectsManager.ts
export class EffectsManager {
  constructor(private scene: Phaser.Scene) {}

  createCatchEffect(x: number, y: number, type: 'normal' | 'red' | 'blue'): void {
    this.createParticleBurst(x, y);
    this.createFlash(x, y, type);
  }

  private createParticleBurst(x: number, y: number): void {
    // Particle burst logic
  }

  private createFlash(x: number, y: number, type: string): void {
    const colors = {
      normal: 0xffff00,
      red: 0xff0000,
      blue: 0x0088ff,
    };
    // Flash effect logic
  }

  screenShake(intensity: number = 0.002, duration: number = 50): void {
    this.scene.cameras.main.shake(duration, intensity);
  }
}
```

**Benefits**:

- Centralized visual effects
- Easier to add new effects
- Consistent effect behavior

**Estimated Effort**: 1 hour

---

## Priority 3: Code Quality Improvements

### 7. Add Type Safety for Game Events

**Problem**: Scene data passed as `any` or loosely typed

**Solution**: Define strict interfaces

```typescript
// src/shared/types/scenes.ts
export interface SoloGameData {
  // Currently no data needed
}

export interface MultiplayerGameData {
  gameId: string;
  playerId: string;
  playerRole: 'player1' | 'player2';
}

export interface GameOverData {
  winner: 'Player 1' | 'Player 2' | 'Tie' | 'Disconnect';
  player1Score: number;
  player2Score: number;
  reason: 'completed' | 'disconnect';
  gameId?: string;
}
```

**Benefits**:

- Type safety across scene transitions
- Better IDE autocomplete
- Catch errors at compile time

**Estimated Effort**: 30 minutes

---

### 8. Improve Error Handling

**Problem**: Many try-catch blocks with generic error handling

**Solution**: Create error handling utilities

```typescript
// src/client/game/utils/ErrorHandler.ts
export class ErrorHandler {
  static async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 100
  ): Promise<T | null> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) {
          console.error('Max retries reached:', error);
          return null;
        }
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
    return null;
  }

  static logError(context: string, error: unknown): void {
    console.error(`[${context}]`, error instanceof Error ? error.message : error);
  }
}
```

**Benefits**:

- Consistent error handling
- Easier to add error reporting
- Cleaner code

**Estimated Effort**: 1 hour

---

### 9. Remove Duplicate Preloader.ts

**Problem**: Two Preloader files exist:

- `src/client/game/scenes/Preloader.ts` (used)
- `src/client/public/assets/Preloader.ts` (unused)

**Solution**: Delete the unused file

```bash
rm src/client/public/assets/Preloader.ts
```

**Benefits**:

- Reduces confusion
- Cleaner codebase

**Estimated Effort**: 1 minute

---

### 10. Consolidate Documentation Files

**Problem**: Multiple overlapping documentation files

**Current Files**:

- `MULTIPLAYER_DEBUG.md`
- `MULTIPLAYER_FIXES.md`
- `MULTIPLAYER_SETUP.md`
- `SCORE_SYNC_FIX.md`
- `LOBBY_LEAVE_FIX.md`
- `AUDIO_IMPLEMENTATION.md`
- `IMPLEMENTATION_SUMMARY.md`

**Solution**: Consolidate into organized structure

```
docs/
├── ARCHITECTURE.md (overall system design)
├── MULTIPLAYER.md (all multiplayer docs combined)
├── FEATURES.md (audio, loading screen, etc.)
└── CHANGELOG.md (fixes and updates)
```

**Benefits**:

- Easier to find information
- Less duplication
- Better organization

**Estimated Effort**: 1 hour

---

## Summary

### Immediate Actions (Do First)

1. ✅ Delete unused `src/client/public/assets/Preloader.ts`
2. Extract constants to `GameConfig.ts`
3. Add strict type interfaces for scene data

### High-Value Refactorings (Do Next)

1. Create `BaseGameScene` to eliminate duplication
2. Extract `PopcornManager` class
3. Create `NetworkManager` for multiplayer

### Nice-to-Have Improvements

1. `ScoreManager` class
2. `EffectsManager` class
3. Error handling utilities
4. Documentation consolidation

### Estimated Total Effort

- Priority 1: 8-12 hours
- Priority 2: 4-6 hours
- Priority 3: 3-4 hours
- **Total: 15-22 hours**

### ROI Analysis

- **Highest ROI**: BaseGameScene (saves ~1000 lines, easier maintenance)
- **Quick Wins**: Delete unused file, extract constants
- **Long-term Value**: Manager classes for better architecture

Would you like me to implement any of these refactorings?
