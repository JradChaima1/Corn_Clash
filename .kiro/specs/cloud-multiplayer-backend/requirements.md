# Requirements Document

## Introduction

This document specifies the requirements for a cloud-based multiplayer backend system for a 2-player game running on Reddit's Devvit platform. The system ensures fair matchmaking, prevents duplicate joins, handles disconnections gracefully, and maintains game state consistency using Redis atomic operations.

## Glossary

- **Multiplayer_System**: The backend service that manages game sessions, matchmaking, and player state
- **Game_Session**: A Redis-stored data structure representing a match between two players
- **Player**: A Reddit user identified by username participating in a game
- **Matchmaking_Queue**: A Redis-based queue for players waiting to be matched
- **Ready_State**: A confirmation signal from a client indicating readiness to start gameplay
- **Game_Expiry**: Automatic cleanup of game sessions after a defined time threshold
- **Atomic_Operation**: Redis transaction ensuring race-condition-free state updates
- **Polling_Interval**: The frequency at which clients check for game state updates
- **Disconnect_Detection**: Server-side mechanism to identify when a player has stopped responding

## Requirements

### Requirement 1

**User Story:** As a player, I want to be matched with exactly one other player, so that I can play a fair 2-player game without duplicates or self-matching.

#### Acceptance Criteria

1. WHEN a player requests to join a game, THE Multiplayer_System SHALL prevent the same player from joining twice using atomic Redis operations
2. WHEN a player requests to join a game, THE Multiplayer_System SHALL prevent the player from matching with themselves
3. WHEN two different players are matched, THE Multiplayer_System SHALL create a Game_Session with both player identifiers
4. WHEN a player attempts to join while already in an active Game_Session, THE Multiplayer_System SHALL reject the join request with an error message
5. THE Multiplayer_System SHALL use Redis atomic operations to ensure no race conditions occur during player matching

### Requirement 2

**User Story:** As a player, I want the game to start only when both players are ready, so that neither player has an unfair advantage.

#### Acceptance Criteria

1. WHEN a Game_Session is created, THE Multiplayer_System SHALL set the game status to "waiting" until both players confirm readiness
2. WHEN a player sends a ready signal, THE Multiplayer_System SHALL record the Ready_State for that player with a timestamp
3. IF both players do not send ready signals within 30 seconds of Game_Session creation, THEN THE Multiplayer_System SHALL reset the matchmaking and return both players to the Matchmaking_Queue
4. WHEN both players have confirmed Ready_State, THE Multiplayer_System SHALL transition the Game_Session status to "playing"
5. WHEN the Game_Session status transitions to "playing", THE Multiplayer_System SHALL provide a synchronized server startTime for countdown timers
6. THE Multiplayer_System SHALL start gameplay only after both clients confirm receipt of status "playing"

### Requirement 3

**User Story:** As a player, I want disconnected or inactive players to be detected quickly, so that I'm not stuck waiting in a broken game.

#### Acceptance Criteria

1. WHEN a player stops polling for game state updates, THE Multiplayer_System SHALL detect the disconnection within 3 seconds
2. WHEN a player disconnection is detected during gameplay, THE Multiplayer_System SHALL immediately notify the remaining player
3. WHEN a player is notified of opponent disconnection, THE Multiplayer_System SHALL return the remaining player to the Matchmaking_Queue
4. THE Multiplayer_System SHALL track the last activity timestamp for each player using Redis
5. THE Multiplayer_System SHALL check player activity timestamps on each polling request to identify stale connections

### Requirement 4

**User Story:** As a player, I want abandoned games to be cleaned up automatically, so that server resources are not wasted and I can rejoin matchmaking.

#### Acceptance Criteria

1. WHEN any player leaves a Game_Session, THE Multiplayer_System SHALL immediately clean up the Game_Session from Redis
2. WHEN both players leave a Game_Session, THE Multiplayer_System SHALL reset matchmaking state and remove all associated data
3. WHEN a Game_Session exceeds 2 minutes of age, THE Multiplayer_System SHALL automatically expire and delete the session regardless of status
4. THE Multiplayer_System SHALL use Redis TTL (time-to-live) mechanisms to enforce automatic expiration
5. WHEN a Game_Session is cleaned up, THE Multiplayer_System SHALL remove all player references and session data atomically

### Requirement 5

**User Story:** As a developer, I want all client scenes to properly stop polling and timers when exiting, so that resource leaks and duplicate requests are prevented.

#### Acceptance Criteria

1. WHEN a client exits the Lobby scene, THE Multiplayer_System SHALL ensure all polling intervals are cleared
2. WHEN a client exits the Game scene, THE Multiplayer_System SHALL ensure all polling intervals and countdown timers are cleared
3. THE Multiplayer_System SHALL provide clear lifecycle hooks for clients to clean up resources on scene transitions
4. WHEN a client transitions between scenes, THE Multiplayer_System SHALL cancel any pending API requests from the previous scene
5. THE Multiplayer_System SHALL log warnings if duplicate polling requests are detected from the same client

### Requirement 6

**User Story:** As a system administrator, I want the backend to use atomic Redis operations, so that race conditions are prevented in high-concurrency scenarios.

#### Acceptance Criteria

1. WHEN multiple players attempt to join simultaneously, THE Multiplayer_System SHALL use Redis WATCH/MULTI/EXEC transactions to ensure atomic state updates
2. WHEN updating Game_Session state, THE Multiplayer_System SHALL use Redis atomic operations to prevent partial updates
3. WHEN checking and updating player join status, THE Multiplayer_System SHALL complete the operation atomically without intermediate states
4. THE Multiplayer_System SHALL retry failed atomic operations up to 3 times before returning an error
5. THE Multiplayer_System SHALL use Redis SET NX (set if not exists) commands for creating unique Game_Session identifiers

### Requirement 7

**User Story:** As a player, I want synchronized countdown timers, so that both players see the same game start time.

#### Acceptance Criteria

1. WHEN the Game_Session transitions to "playing" status, THE Multiplayer_System SHALL record a server-side startTime timestamp
2. WHEN clients poll for game state, THE Multiplayer_System SHALL include the server startTime in the response
3. THE Multiplayer_System SHALL calculate countdown values based on server time to ensure synchronization
4. WHEN clients receive the startTime, THE Multiplayer_System SHALL provide the current server time for offset calculation
5. THE Multiplayer_System SHALL use millisecond precision for all timestamp operations
