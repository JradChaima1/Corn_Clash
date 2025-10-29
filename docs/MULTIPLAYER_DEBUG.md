# Multiplayer Debugging Guide

## How to Test Multiplayer

1. **Start the dev server:**

   ```bash
   npm run dev
   ```

2. **Open the game in 2 browsers:**

   - Browser 1 (Chrome): Open the playtest URL
   - Browser 2 (Edge/Firefox): Open the same playtest URL

3. **Both players select "Multiplayer"**

4. **Check the logs:**
   - **Browser Console** (F12 → Console): Shows client-side logs
   - **Terminal/Server logs**: Shows server-side logs

## What Should Happen

### Player 1 (First to join):

1. Clicks "Multiplayer"
2. Client logs: `Attempting to join multiplayer game...`
3. Server logs: `Creating new game [gameId] for player [playerId] as player1`
4. Client logs: `Joined as player1, game status: waiting`
5. Shows: "Waiting for opponent... (You are player1)"
6. Starts polling every 1 second

### Player 2 (Second to join):

1. Clicks "Multiplayer"
2. Client logs: `Attempting to join multiplayer game...`
3. Server logs: `Player [playerId] joining existing game [gameId] as player2`
4. Server logs: `Game [gameId] is now PLAYING with both players`
5. Client logs: `Joined as player2, game status: playing`
6. Client logs: `Game is ready! Starting...`
7. Game starts immediately for Player 2

### Player 1 (After Player 2 joins):

1. Next poll (within 1 second)
2. Client logs: `Polling game state for [gameId]...`
3. Server logs: `Returning state for game [gameId]: status=playing`
4. Client logs: `Game is now playing! Starting game...`
5. Game starts for Player 1

## Common Issues

### Issue: Player 1 stuck on "Waiting for opponent"

**Possible causes:**

1. Polling not working
2. Server not updating game status
3. Different game IDs being used

**Check:**

- Browser console for polling logs
- Server logs for game status updates
- Verify both players have the same gameId

### Issue: Player 2 can't join

**Possible causes:**

1. Server not finding waiting game
2. Network/API errors

**Check:**

- Server logs for "Creating new game" vs "joining existing game"
- Browser console for API errors

## Debug Logs Added

### Client-side (MultiplayerLobby.ts):

- `Attempting to join multiplayer game...`
- `Join response status: [status]`
- `Joined as [role], game status: [status]`
- `Polling game state for [gameId]...`
- `Game is now playing! Starting game...`

### Server-side (multiplayer.ts):

- `Player [id] attempting to join game`
- `Current active games: [count]`
- `Creating new game [id] for player [id] as player1`
- `Player [id] joining existing game [id] as player2`
- `Game [id] is now PLAYING with both players`

### Server-side (index.ts):

- `State request for game: [id]`
- `Returning state for game [id]: status=[status]`

## Testing Steps

1. Open Browser 1 → Select Multiplayer
2. Check console: Should see "Joined as player1, game status: waiting"
3. Open Browser 2 → Select Multiplayer
4. Check Browser 2 console: Should see "Game is ready! Starting..."
5. Check Browser 1 console: Within 1 second should see "Game is now playing! Starting game..."
6. Both should enter the game

If it doesn't work, share the console logs from both browsers!
