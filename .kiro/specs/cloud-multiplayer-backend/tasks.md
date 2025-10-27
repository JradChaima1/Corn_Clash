# Implementation Plan

- [x] 1. Implement Redis data structures and atomic operations
  - Create Redis key constants for game sessions, matchmaking queue, and player active games
  - Implement atomic join operation using WATCH/MULTI/EXEC transactions
  - Implement atomic create operation for new games with TTL
  - Add helper methods for Redis pipeline operations
  - _Requirements: 1.1, 1.5, 6.1, 6.2, 6.3_

- [x] 2. Implement game expiry and cleanup system




  - Add createdAt timestamp to game state
  - Implement isGameExpired() method checking 2-minute threshold
  - Implement cleanupExpiredGames() method to delete old games
  - Add Redis TTL of 120 seconds to all game keys
  - Implement cleanup of expired games from waiting queue
  - _Requirements: 4.3, 4.4, 4.5_
-

- [x] 3. Implement ready state with timeout




  - Add player1Ready and player2Ready timestamp fields to GameState
  - Implement sendReady() endpoint that records ready timestamps
  - Add logic to check if both players are ready within 30 seconds
  - Implement ready timeout detection and reset to waiting state
  - Add server startTime when transitioning to "playing" status
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1_

- [x] 4. Implement disconnect detection system





  - Add lastActivity1 and lastActivity2 timestamp fields to GameState
  - Update activity timestamps on every state poll request
  - Implement checkPlayerActivity() method with 3-second threshold
  - Add disconnected flag to getGameState() response
  - Implement automatic game cleanup when disconnect detected
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Refactor joinGame() with race condition prevention
  - Add check for existing player game using popcorn_player_game:{playerId} key
  - Implement self-matching prevention by comparing player IDs
  - Add cleanup of invalid waiting games (expired, self-match, non-zero scores)
  - Use executeAtomicJoin() for joining existing games
  - Use executeAtomicCreate() for creating new games
  - Add retry logic with exponential backoff for failed atomic operations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.4_

- [x] 6. Implement synchronized countdown timers
  - Add startTime field to GameState (server timestamp)
  - Set startTime when game transitions to "playing"
  - Include startTime in all state poll responses
  - Add current server time to responses for client offset calculation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Update client MultiplayerLobby scene
  - Replace Phaser timer with setInterval for polling
  - Implement sendReady() method to signal readiness
  - Add ready timeout handling (30 seconds)
  - Update pollForGameStart() to check for status="playing" AND both players present
  - Implement proper cleanup in shutdown() method (clear intervals)
  - Add visual ready state indicator
  - _Requirements: 2.6, 5.1, 5.3_

- [x] 8. Update client MultiplayerGame scene
  - Replace Phaser timer with setInterval for state polling
  - Implement waitForBothPlayers() to confirm both clients received "playing" status
  - Update timer calculation to use server startTime instead of local time
  - Reduce disconnect detection threshold to 3 seconds (3 failed polls)
  - Implement proper cleanup in shutdown() method (clear intervals and timers)
  - Add handling for disconnected flag in state response
  - _Requirements: 2.6, 3.2, 3.3, 5.2, 5.3, 7.3_

- [x] 9. Add API endpoint for ready state
  - Create POST /api/multiplayer/ready endpoint
  - Validate gameId and playerId from request
  - Call gameManager.sendReady() and return result
  - Include bothReady flag and startTime in response
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 10. Update existing API endpoints
  - Modify /api/multiplayer/state to update activity timestamp
  - Add disconnected flag to state response
  - Include current server time in state response
  - Update /api/multiplayer/leave to trigger immediate cleanup
  - Ensure all endpoints validate game existence
  - _Requirements: 3.4, 4.1, 7.4_

- [x] 11. Implement player active game tracking
  - Create popcorn_player_game:{playerId} Redis keys with TTL
  - Set player game key on join with 120-second expiry
  - Check player game key before allowing new joins
  - Delete player game key on leave
  - Use SET NX for atomic player game assignment
  - _Requirements: 1.3, 1.4, 6.5_

- [x] 12. Add comprehensive error handling
  - Implement executeWithRetry() helper with exponential backoff
  - Add error handling for all Redis operations
  - Add validation for all API inputs (gameId, playerId, position, score)
  - Return appropriate HTTP status codes (400, 404, 500)
  - Add logging for all critical operations and errors
  - _Requirements: 6.4_

- [x] 13. Update shared types
  - Add player1Ready and player2Ready fields to GameState interface
  - Add lastActivity1 and lastActivity2 fields to GameState interface
  - Add createdAt field to GameState interface
  - Add disconnected and disconnectedPlayerId fields to GameStateResponse
  - Create ReadyResult interface for ready endpoint response
  - Create DisconnectInfo interface for disconnect detection
  - _Requirements: 2.1, 3.4, 4.3_

- [x] 14. Add integration tests for multiplayer flow








  - Test complete join-ready-play-end flow with two players
  - Test self-matching prevention
  - Test duplicate join prevention
  - Test ready timeout (30 seconds)
  - Test game expiry (2 minutes)
  - Test disconnect detection (3 seconds)
  - Test race conditions with concurrent joins
  - Test cleanup on player leave during waiting
  - Test cleanup on player leave during gameplay
  - _Requirements: All_

- [x] 15. Add unit tests for MultiplayerGameManager






  - Test joinGame() creates new game for first player
  - Test joinGame() joins existing game as second player
  - Test joinGame() prevents self-matching
  - Test joinGame() prevents duplicate joins
  - Test sendReady() records timestamps correctly
  - Test sendReady() transitions to playing when both ready
  - Test sendReady() handles timeout after 30 seconds
  - Test cleanupExpiredGames() deletes games older than 2 minutes
  - Test checkPlayerActivity() detects disconnect after 3 seconds
  - Test atomic operations handle race conditions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 4.3, 6.1_
