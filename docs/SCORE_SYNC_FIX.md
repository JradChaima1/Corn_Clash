# Score Synchronization Fix

## Problem

Players saw different scores on the game over screen in multiplayer games. For example:

- Player 1 sees: P1=50, P2=30
- Player 2 sees: P1=45, P2=35

## Root Causes

### 1. Partial Score Syncing During Gameplay

**Old behavior**: Each player only synced their opponent's score from the server

- Player 1 updated P2's score from server, but used local P1 score
- Player 2 updated P1's score from server, but used local P2 score
- This meant each player had a mix of local and server scores

**Code location**: `src/client/game/scenes/MultiplayerGame.ts` - `fetchOpponentPosition()`

### 2. No Final Score Sync Before Game Over

**Old behavior**: When the game ended, it immediately used local scores

- No fetch from server to get authoritative final scores
- Each player's local scores could be out of sync due to:
  - Network latency in score updates
  - Race conditions in score updates
  - Last-second catches not yet reaching the server

**Code location**: `src/client/game/scenes/MultiplayerGame.ts` - `endGame()`

## Solutions Implemented

### Fix 1: Sync BOTH Scores from Server (Not Just Opponent)

**New behavior**: Every poll updates both P1 and P2 scores from server

```typescript
// OLD CODE (WRONG):
if (this.playerRole === 'player1') {
  // Only update opponent's score
  this.player2Score = data.gameState.player2Score;
} else {
  // Only update opponent's score
  this.player1Score = data.gameState.player1Score;
}

// NEW CODE (CORRECT):
// Always sync BOTH scores from server (server is authoritative)
if (data.gameState.player1Score !== this.player1Score) {
  this.player1Score = data.gameState.player1Score;
  this.player1ScoreText.setText(`P1: ${this.player1Score}`);
}
if (data.gameState.player2Score !== this.player2Score) {
  this.player2Score = data.gameState.player2Score;
  this.player2ScoreText.setText(`P2: ${this.player2Score}`);
}
```

**Why this works**:

- Server is the single source of truth for ALL scores
- Both players continuously sync to match server state
- Eliminates local score drift

### Fix 2: Fetch Final Authoritative Scores Before Game Over

**New behavior**: Wait 500ms then fetch final scores from server before showing game over

```typescript
// Wait for any in-flight score updates to reach server
await new Promise<void>((resolve) => setTimeout(resolve, 500));

// Fetch authoritative scores from server
const response = await fetch(`/api/multiplayer/state?gameId=${this.gameId}`);
const data = await response.json();

// Use server's scores for game over screen
const finalP1Score = data.gameState.player1Score;
const finalP2Score = data.gameState.player2Score;

this.scene.start('MultiplayerGameOver', {
  player1Score: finalP1Score,
  player2Score: finalP2Score,
  // ...
});
```

**Why this works**:

- 500ms delay ensures last-second catches reach the server
- Server scores are guaranteed to be consistent for both players
- Fallback to local scores if server fetch fails

## Score Flow (After Fix)

### During Gameplay

```
Player catches popcorn
  ↓
Update local score immediately (instant visual feedback)
  ↓
Send score to server via POST /api/multiplayer/score
  ↓
Server updates score with Redis transaction (atomic)
  ↓
Every 166ms, client polls server for game state
  ↓
Client updates BOTH P1 and P2 scores from server
  ↓
Both players now have identical scores
```

### At Game End

```
Timer reaches 0
  ↓
endGame() called
  ↓
Stop all timers and popcorn spawning
  ↓
Show "Calculating final scores..." loading screen
  ↓
Wait 500ms for in-flight updates
  ↓
Fetch final scores from server
  ↓
Use server's authoritative scores
  ↓
Both players see identical game over screen
```

## Testing Verification

### Test Case 1: Rapid Scoring

1. Both players catch popcorn rapidly at the same time
2. Check that scores stay in sync during gameplay
3. Verify both players see identical final scores

### Test Case 2: Last-Second Catch

1. Player 1 catches popcorn right as timer hits 0
2. Verify the catch is counted in final scores
3. Verify both players see the same final score

### Test Case 3: Network Lag

1. Simulate 500ms network lag
2. Play normally and let game end
3. Verify scores still match on game over screen

### Test Case 4: Red Popcorn Chaos

1. Both players catch red popcorn (negative points)
2. Verify negative scores sync correctly
3. Verify final scores match

## Key Changes Summary

| File                 | Method                    | Change                                            |
| -------------------- | ------------------------- | ------------------------------------------------- |
| `MultiplayerGame.ts` | `fetchOpponentPosition()` | Sync BOTH scores from server, not just opponent   |
| `MultiplayerGame.ts` | `endGame()`               | Fetch final authoritative scores before game over |
| `multiplayer.ts`     | `updateScore()`           | Use Redis transactions to prevent race conditions |

## Performance Impact

- **500ms delay at game end**: Acceptable trade-off for score accuracy
- **Syncing both scores**: No additional network calls (same polling frequency)
- **Server fetch at end**: One extra API call per game (negligible)

## Edge Cases Handled

1. **Server fetch fails**: Falls back to local scores
2. **Network timeout**: 500ms delay ensures most updates complete
3. **Race conditions**: Redis transactions prevent score overwrites
4. **Disconnect during end**: Game over still shows with available scores

## Future Improvements

1. Add visual indicator when scores are syncing
2. Implement score prediction to reduce perceived lag
3. Add retry logic for failed score updates
4. Consider WebSocket for real-time score updates (if Devvit supports it)
