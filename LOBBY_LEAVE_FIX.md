# Multiplayer Lobby Leave Fix

## Problem
When a player clicked "Back to Menu" in the multiplayer lobby:
1. The other player still saw the "Ready" button
2. The other player remained stuck waiting for the player who left
3. If the player who left tried to rejoin, matchmaking didn't detect them
4. The other player kept seeing "Waiting for opponent to click ready"

## Root Cause
- When a player left during the "waiting" status, the game was deleted from Redis
- However, the other player's lobby scene continued polling the deleted game
- The polling logic didn't handle 404 (game not found) responses
- The polling logic didn't detect when a player left after both were present

## Solution

### 1. Client-Side Changes (MultiplayerLobby.ts)

#### Added `restartMatchmaking()` method
- Resets all lobby state (gameId, playerId, playerRole, ready flags)
- Hides the ready button if it exists
- Updates status text to "Finding opponent..."
- Restarts the loading animation
- Calls `joinGame()` to start fresh matchmaking

#### Enhanced `pollForGameStart()` method
- **404 Detection**: If the game returns 404, immediately restart matchmaking
- **Invalid Game Detection**: If game state is null or unsuccessful, restart matchmaking
- **Player Left Detection**: If both players were present but now one is missing, restart matchmaking
- This ensures the remaining player is notified immediately when their opponent leaves

### 2. Server-Side Changes (multiplayer.ts)

#### Enhanced `leaveGame()` method
- Now cleans up **both players'** Redis keys when a game in "waiting" status is deleted
- Previously only cleaned up the leaving player's key
- This ensures both players can immediately rejoin matchmaking
- The other player's polling will detect the game is gone (404) and restart

## Flow After Fix

### Scenario: Player 2 leaves lobby before game starts

1. **Player 2 clicks "Back to Menu"**
   - Calls `/api/multiplayer/leave`
   - Server deletes the game from Redis
   - Server deletes both player1 and player2 Redis keys
   - Player 2 returns to mode select

2. **Player 1's lobby is polling**
   - Next poll request returns 404 (game not found)
   - Lobby detects 404 and calls `restartMatchmaking()`
   - Ready button is hidden
   - Status changes to "Finding opponent..."
   - New matchmaking begins

3. **Both players can now rejoin**
   - Player 1 is already in new matchmaking
   - Player 2 can click "Multiplayer" again and join
   - They may be matched together again, or with other players

### Scenario: Player leaves after both joined but before ready

1. **Both players are in lobby, ready button visible**
   - `bothPlayersPresent = true`
   - Both see "Both players connected! Click Ready when you're prepared."

2. **Player 2 clicks "Back to Menu"**
   - Game is deleted from Redis
   - Both player keys are cleaned up

3. **Player 1's next poll**
   - Detects game is gone (404) OR detects player2Id is now null
   - Calls `restartMatchmaking()`
   - Ready button disappears
   - New matchmaking begins

## Key Improvements

1. **Immediate Feedback**: The remaining player sees matchmaking restart within 1 second (polling interval)
2. **Clean State**: Both players' Redis keys are cleaned up, preventing stale state
3. **Rejoin Support**: Players who left can immediately rejoin matchmaking
4. **No Stuck States**: No more situations where players are stuck waiting forever

## Testing Recommendations

1. Test Player 2 leaving before Player 1 joins
2. Test Player 2 leaving after both joined but before ready
3. Test Player 1 leaving (creator) before Player 2 joins
4. Test Player 1 leaving after both joined but before ready
5. Test rapid leave/rejoin cycles
6. Test both players leaving and rejoining multiple times

## Files Modified

- `src/client/game/scenes/MultiplayerLobby.ts`
  - Added `restartMatchmaking()` method
  - Enhanced `pollForGameStart()` with 404 and player-left detection

- `src/server/core/multiplayer.ts`
  - Enhanced `leaveGame()` to clean up both players' keys
