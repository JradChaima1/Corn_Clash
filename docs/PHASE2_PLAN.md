# Phase 2 Implementation Plan - BaseGameScene

## Objective

Create a BaseGameScene class that both SoloGame and MultiplayerGame extend, eliminating ~1000 lines of duplicate code while maintaining all existing functionality.

## Strategy

Due to the complexity and risk of breaking existing functionality, I recommend a **conservative approach**:

### Option A: Conservative (Recommended)

Keep the existing SoloGame and MultiplayerGame files working as-is, but refactor them to use the new managers (PopcornManager, EffectsManager, GameConfig). This provides immediate benefits without the risk of breaking changes.

**Benefits:**

- Lower risk
- Immediate value from managers
- Can test incrementally
- Existing code continues to work
- Can create BaseGameScene later if needed

**Steps:**

1. Update SoloGame to use PopcornManager
2. Update SoloGame to use EffectsManager
3. Update SoloGame to use GameConfig constants
4. Update MultiplayerGame to use PopcornManager
5. Update MultiplayerGame to use EffectsManager
6. Update MultiplayerGame to use GameConfig constants
7. Test both modes thoroughly

**Estimated Time:** 2-3 hours
**Risk Level:** Low

### Option B: Aggressive (Higher Risk)

Create BaseGameScene immediately and refactor both games to extend it.

**Benefits:**

- Maximum code reduction
- Best long-term architecture
- Easier to add new game modes

**Risks:**

- High chance of breaking existing functionality
- Difficult to test all edge cases
- May introduce subtle bugs
- Harder to debug if issues arise

**Estimated Time:** 4-6 hours
**Risk Level:** High

## Recommendation

I recommend **Option A (Conservative)** because:

1. **Your game is working** - The multiplayer fixes we just made are critical, don't want to risk breaking them
2. **Immediate value** - Using managers provides 80% of the benefit with 20% of the risk
3. **Incremental testing** - Can test each change independently
4. **Reversible** - Easy to roll back if issues arise
5. **Production ready** - Can deploy after each step

We can always create BaseGameScene later once the managers are proven stable.

## Proposed Implementation (Option A)

### Step 1: Refactor SoloGame

```typescript
// Replace inline popcorn logic with PopcornManager
private popcornManager!: PopcornManager;

create() {
  // ... existing setup ...

  // Replace popcorn group creation
  this.popcornManager = new PopcornManager(this, potX, potY);

  // Replace collision detection
  this.physics.add.overlap(
    this.player,
    this.popcornManager.getGroup(),
    this.handlePopcornCatch,
    undefined,
    this
  );

  // Replace spawn timer
  this.popcornManager.startSpawning();
}

// Simplify catch handler
private handlePopcornCatch(player: object, popcorn: object): void {
  const popcornObj = popcorn as Phaser.GameObjects.GameObject;

  if (!this.popcornManager.isActive(popcornObj)) return;

  const data = this.popcornManager.getData(popcornObj);
  this.popcornManager.deactivate(popcornObj);

  // Update score
  this.score += data.value;
  if (this.score < 0) this.score = 0;
  this.scoreText.setText(`Score: ${this.score}`);

  // Effects
  this.effectsManager.createCatchEffect(x, y, data.type);
  this.effectsManager.showScorePopup(x, y, data.value, data.type);

  // Chaos mode
  if (data.type === 'red') {
    for (let i = 0; i < GameConfig.CHAOS.KERNEL_COUNT; i++) {
      this.time.delayedCall(i * GameConfig.CHAOS.SPAWN_DELAY, () => {
        this.popcornManager.spawnChaos();
      });
    }
  }
}

// Replace magic numbers with GameConfig
private setupPlayer(): void {
  this.player.setDisplaySize(GameConfig.PLAYER.SIZE, GameConfig.PLAYER.SIZE);
  // ... use GameConfig throughout ...
}
```

### Step 2: Refactor MultiplayerGame

Same approach as SoloGame, but with multiplayer-specific logic preserved.

### Step 3: Testing Checklist

- [ ] Solo mode: Popcorn spawns correctly
- [ ] Solo mode: All three popcorn types work
- [ ] Solo mode: Red popcorn triggers chaos
- [ ] Solo mode: Score updates correctly
- [ ] Solo mode: Visual effects work
- [ ] Solo mode: Game ends properly
- [ ] Multiplayer: Both players see popcorn
- [ ] Multiplayer: Scores sync correctly
- [ ] Multiplayer: Territory boundaries work
- [ ] Multiplayer: Disconnect detection works
- [ ] Multiplayer: Game over shows correct scores

## Decision Point

**Which option would you like me to proceed with?**

A) Conservative - Integrate managers into existing scenes (Recommended)
B) Aggressive - Create BaseGameScene and refactor both

Please confirm your choice and I'll proceed with the implementation.
