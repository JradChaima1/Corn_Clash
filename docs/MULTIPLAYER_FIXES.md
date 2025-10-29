# Multiplayer Bug Fixes

## Issues Fixed

### 1. Score Desynchronization Bug

**Problem**: Players sometimes saw different scores for each other during multiplayer games.

**Root Cause**: Race condition in the `updateScore` method. When both players caught popcorn simultaneously, the server would:

1. Player 1 reads game state
2. Player 2 reads game state (same state)
3. Player 1 updates their score and writes
4. Player 2 updates their score and writes (overwrites Player 1's update)

**Solution**: Implemented optimistic locking with Redis WATCH/EXEC transactions:

- Watch the game key before reading
- If the key changes between read and write, the transaction fails
- Retry up to 5 times with exponential backoff (10ms, 20ms, 30ms, etc.)
- This ensures atomic score updates without race conditions

**Files Changed**:

- `src/server/core/multiplayer.ts` - `updateScore()` method

### 2. False Disconnect Detection

**Problem**: Players were sometimes incorrectly detected as disconnected even though they were still playing.

**Root Causes**:

1. **Client-side**: Too aggressive disconnect detection (3 failed fetches = 0.5 seconds)
2. **Server-side**: Too short inactivity threshold (3 seconds)
3. Network hiccups or slow responses triggered false positives

**Solutions**:

1. **Client-side changes** (`src/client/game/scenes/MultiplayerGame.ts`):

   - Increased failed fetch threshold from 3 to 10 (now ~1.66 seconds)
   - Only trigger disconnect on 404 errors (game not found) or sustained failures
   - Added better logging to distinguish between network issues and actual disconnects

2. **Server-side changes** (`src/server/core/multiplayer.ts`):
   - Increased disconnect threshold from 3 seconds to 5 seconds
   - This gives more tolerance for network latency and slow connections

**Files Changed**:

- `src/client/game/scenes/MultiplayerGame.ts` - `fetchOpponentPosition()` method
- `src/server/core/multiplayer.ts` - `DISCONNECT_THRESHOLD` constant

## Technical Details

### Score Update Flow (After Fix)

```
Client catches popcorn
  ↓
Client updates local score immediately (for instant feedback)
  ↓
Client sends score to server via POST /api/multiplayer/score
  ↓
Server uses Redis WATCH transaction:
  1. WATCH game key
  2. Read current game state
  3. Update appropriate player's score
  4. SET game key (fails if modified)
  5. EXEC transaction
  6. If failed, retry with backoff
  ↓
Other client fetches game state
  ↓
Other client updates opponent's score from server (authoritative)
```

### Disconnect Detection Flow (After Fix)

```
Client polls every 166ms (10 frames)
  ↓
If fetch fails:
  - Increment consecutiveFailedFetches counter
  - If counter >= 10 AND response is 404:
    → Trigger disconnect
  - If counter >= 10 AND sustained errors:
    → Trigger disconnect
  ↓
If fetch succeeds:
  - Reset consecutiveFailedFetches to 0
  - Update opponent position and score
  - Check server's disconnect flag
```

### Server Activity Tracking

- Every API call updates player's lastActivity timestamp
- Server checks if `now - lastActivity > 5000ms` (5 seconds)
- If inactive, marks player as disconnected in game state
- Client receives disconnect flag and shows "OPPONENT LEFT" message

## Testing Recommendations

1. **Score Synchronization**:

   - Have both players catch popcorn rapidly at the same time
   - Verify both players see the same final scores
   - Check server logs for "Score updated" messages

2. **Disconnect Detection**:

   - Simulate network lag (Chrome DevTools → Network → Slow 3G)
   - Verify game continues without false disconnect
   - Actually close one player's browser
   - Verify other player sees disconnect after ~5 seconds

3. **Edge Cases**:
   - Both players catch red popcorn simultaneously
   - One player catches many kernels in quick succession
   - Network drops for 2-3 seconds then recovers

## Performance Impact

- **Score updates**: Minimal overhead from retry logic (typically 0 retries needed)
- **Disconnect detection**: Reduced false positives = better player experience
- **Network traffic**: No change (same polling frequency)

## Future Improvements

1. Consider using Redis Lua scripts for atomic score updates (if Devvit supports it)
2. Add client-side prediction for opponent scores to reduce perceived lag
3. Implement exponential backoff for polling during network issues
4. Add reconnection logic for temporary disconnects
