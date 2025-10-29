import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MultiplayerGameManager } from './multiplayer';
import { redis } from '@devvit/web/server';
import { GameState } from '../../shared/types/api';

// Mock Redis
vi.mock('@devvit/web/server', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    zRange: vi.fn(),
    zRem: vi.fn(),
    zAdd: vi.fn(),
    watch: vi.fn(),
  },
}));

describe('MultiplayerGameManager Unit Tests', () => {
  let gameManager: MultiplayerGameManager;
  const player1Id = 'player1';
  const player2Id = 'player2';

  beforeEach(() => {
    gameManager = MultiplayerGameManager.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('joinGame()', () => {
    it('should create new game for first player', async () => {
      // Mock: No existing player game
      (redis.get as any).mockResolvedValue(null);

      // Mock: No waiting games
      (redis.zRange as any).mockResolvedValue([]);

      // Mock: Successful atomic create
      const mockTxn = {
        unwatch: vi.fn().mockResolvedValue(undefined),
        multi: vi.fn().mockResolvedValue(undefined),
        set: vi.fn().mockResolvedValue(undefined),
        zAdd: vi.fn().mockResolvedValue(undefined),
        exec: vi.fn().mockResolvedValue([true, true, true]),
      };
      (redis.watch as any).mockResolvedValue(mockTxn);

      // Mock: Return created game state
      (redis.get as any).mockImplementation(async (key: string) => {
        if (key.startsWith('popcorn_game:')) {
          const gameState: GameState = {
            gameId: key.replace('popcorn_game:', ''),
            status: 'waiting',
            player1Id,
            player2Id: null,
            player1Ready: null,
            player2Ready: null,
            lastActivity1: Date.now(),
            lastActivity2: Date.now(),
            player1Score: 0,
            player2Score: 0,
            player1Position: 150,
            player2Position: 650,
            timeRemaining: 60,
            popcornItems: [],
            startTime: null,
            createdAt: Date.now(),
            winner: null,
          };
          return JSON.stringify(gameState);
        }
        return null;
      });

      const result = await gameManager.joinGame(player1Id);

      expect(result.playerRole).toBe('player1');
      expect(result.gameState.status).toBe('waiting');
      expect(result.gameState.player1Id).toBe(player1Id);
      expect(result.gameState.player2Id).toBeNull();
      expect(redis.watch).toHaveBeenCalled();
    });

    it('should join existing game as second player', async () => {
      const gameId = 'test_game_123';
      let joinAttempted = false;

      // Mock: No existing player game for player2
      (redis.get as any).mockImplementation(async (key: string) => {
        if (key === `popcorn_player_game:${player2Id}`) {
          return null;
        }
        if (key === `popcorn_game:${gameId}`) {
          const gameState: GameState = {
            gameId,
            status: 'waiting',
            player1Id,
            player2Id: joinAttempted ? player2Id : null,
            player1Ready: null,
            player2Ready: null,
            lastActivity1: Date.now(),
            lastActivity2: Date.now(),
            player1Score: 0,
            player2Score: 0,
            player1Position: 150,
            player2Position: 650,
            timeRemaining: 60,
            popcornItems: [],
            startTime: null,
            createdAt: Date.now(),
            winner: null,
          };
          return JSON.stringify(gameState);
        }
        return null;
      });

      // Mock: One waiting game
      (redis.zRange as any).mockResolvedValue([{ member: gameId, score: Date.now() }]);

      // Mock: Successful atomic join
      const mockTxn = {
        unwatch: vi.fn().mockResolvedValue(undefined),
        multi: vi.fn().mockResolvedValue(undefined),
        set: vi.fn().mockImplementation(async () => {
          joinAttempted = true;
        }),
        zRem: vi.fn().mockResolvedValue(undefined),
        exec: vi.fn().mockResolvedValue([true, true, true]),
      };
      (redis.watch as any).mockResolvedValue(mockTxn);

      const result = await gameManager.joinGame(player2Id);

      expect(result.playerRole).toBe('player2');
      expect(result.gameState.player2Id).toBe(player2Id);
      expect(redis.watch).toHaveBeenCalled();
    });

    it('should prevent self-matching', async () => {
      const gameId = 'test_game_123';
      let newGameCreated = false;

      // Mock: No existing player game
      (redis.get as any).mockImplementation(async (key: string) => {
        if (key === `popcorn_player_game:${player1Id}`) {
          return null;
        }
        if (key === `popcorn_game:${gameId}`) {
          const gameState: GameState = {
            gameId,
            status: 'waiting',
            player1Id,
            player2Id: null,
            player1Ready: null,
            player2Ready: null,
            lastActivity1: Date.now(),
            lastActivity2: Date.now(),
            player1Score: 0,
            player2Score: 0,
            player1Position: 150,
            player2Position: 650,
            timeRemaining: 60,
            popcornItems: [],
            startTime: null,
            createdAt: Date.now(),
            winner: null,
          };
          return JSON.stringify(gameState);
        }
        // Return new game after creation
        if (newGameCreated && key.startsWith('popcorn_game:')) {
          const gameState: GameState = {
            gameId: key.replace('popcorn_game:', ''),
            status: 'waiting',
            player1Id,
            player2Id: null,
            player1Ready: null,
            player2Ready: null,
            lastActivity1: Date.now(),
            lastActivity2: Date.now(),
            player1Score: 0,
            player2Score: 0,
            player1Position: 150,
            player2Position: 650,
            timeRemaining: 60,
            popcornItems: [],
            startTime: null,
            createdAt: Date.now(),
            winner: null,
          };
          return JSON.stringify(gameState);
        }
        return null;
      });

      // Mock: Player's own game in waiting list
      (redis.zRange as any).mockResolvedValue([{ member: gameId, score: Date.now() }]);

      // Mock: Successful cleanup and create new game
      const mockTxn = {
        unwatch: vi.fn().mockResolvedValue(undefined),
        multi: vi.fn().mockResolvedValue(undefined),
        set: vi.fn().mockImplementation(async () => {
          newGameCreated = true;
        }),
        zAdd: vi.fn().mockResolvedValue(undefined),
        exec: vi.fn().mockResolvedValue([true, true, true]),
      };
      (redis.watch as any).mockResolvedValue(mockTxn);

      const result = await gameManager.joinGame(player1Id);

      // Should create a new game instead of joining own game
      expect(result.gameState.gameId).not.toBe(gameId);
      expect(redis.del).toHaveBeenCalled();
      expect(redis.zRem).toHaveBeenCalled();
    });

    it('should prevent duplicate joins', async () => {
      const gameId = 'test_game_123';

      // Mock: Player already in a game
      (redis.get as any).mockImplementation(async (key: string) => {
        if (key === `popcorn_player_game:${player1Id}`) {
          return gameId;
        }
        if (key === `popcorn_game:${gameId}`) {
          const gameState: GameState = {
            gameId,
            status: 'waiting',
            player1Id,
            player2Id: null,
            player1Ready: null,
            player2Ready: null,
            lastActivity1: Date.now(),
            lastActivity2: Date.now(),
            player1Score: 0,
            player2Score: 0,
            player1Position: 150,
            player2Position: 650,
            timeRemaining: 60,
            popcornItems: [],
            startTime: null,
            createdAt: Date.now(),
            winner: null,
          };
          return JSON.stringify(gameState);
        }
        return null;
      });

      const result = await gameManager.joinGame(player1Id);

      // Should return existing game
      expect(result.gameState.gameId).toBe(gameId);
      expect(result.playerRole).toBe('player1');
      expect(redis.watch).not.toHaveBeenCalled();
    });
  });

  describe('sendReady()', () => {
    const gameId = 'test_game_123';

    it('should record timestamps correctly', async () => {
      const now = Date.now();

      const gameState: GameState = {
        gameId,
        status: 'waiting',
        player1Id,
        player2Id,
        player1Ready: null,
        player2Ready: null,
        lastActivity1: now,
        lastActivity2: now,
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: 60,
        popcornItems: [],
        startTime: null,
        createdAt: now,
        winner: null,
      };

      (redis.get as any).mockResolvedValue(JSON.stringify(gameState));
      (redis.set as any).mockResolvedValue(undefined);

      const result = await gameManager.sendReady(gameId, player1Id);

      expect(result.success).toBe(true);
      expect(result.bothReady).toBe(false);
      expect(redis.set).toHaveBeenCalled();

      // Verify the game state was updated with ready timestamp
      const setCall = (redis.set as any).mock.calls[0];
      const updatedGame = JSON.parse(setCall[1]);
      expect(updatedGame.player1Ready).toBeGreaterThan(0);
    });

    it('should transition to playing when both ready', async () => {
      const now = Date.now();

      const gameState: GameState = {
        gameId,
        status: 'waiting',
        player1Id,
        player2Id,
        player1Ready: now,
        player2Ready: null,
        lastActivity1: now,
        lastActivity2: now,
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: 60,
        popcornItems: [],
        startTime: null,
        createdAt: now,
        winner: null,
      };

      (redis.get as any).mockResolvedValue(JSON.stringify(gameState));
      (redis.set as any).mockResolvedValue(undefined);

      const result = await gameManager.sendReady(gameId, player2Id);

      expect(result.success).toBe(true);
      expect(result.bothReady).toBe(true);
      expect(result.startTime).toBeDefined();

      // Verify the game state was updated to playing
      const setCall = (redis.set as any).mock.calls[0];
      const updatedGame = JSON.parse(setCall[1]);
      expect(updatedGame.status).toBe('playing');
      expect(updatedGame.startTime).toBeDefined();
    });

    it('should handle timeout after 30 seconds', async () => {
      const oldTimestamp = Date.now() - 35000; // 35 seconds ago

      const gameState: GameState = {
        gameId,
        status: 'waiting',
        player1Id,
        player2Id,
        player1Ready: oldTimestamp,
        player2Ready: null,
        lastActivity1: Date.now(),
        lastActivity2: Date.now(),
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: 60,
        popcornItems: [],
        startTime: null,
        createdAt: Date.now(),
        winner: null,
      };

      (redis.get as any).mockResolvedValue(JSON.stringify(gameState));
      (redis.set as any).mockResolvedValue(undefined);

      const result = await gameManager.sendReady(gameId, player2Id);

      expect(result.success).toBe(false);
      expect(result.timeout).toBe(true);
      expect(result.message).toContain('timeout');

      // Verify ready flags were reset
      const setCall = (redis.set as any).mock.calls[0];
      const updatedGame = JSON.parse(setCall[1]);
      expect(updatedGame.player1Ready).toBeNull();
      expect(updatedGame.player2Ready).toBeNull();
    });
  });

  describe('cleanupExpiredGames()', () => {
    it('should delete games older than 2 minutes', async () => {
      const oldGameId = 'old_game_123';
      const oldTimestamp = Date.now() - 130000; // 2 minutes 10 seconds ago

      const oldGame: GameState = {
        gameId: oldGameId,
        status: 'waiting',
        player1Id,
        player2Id: null,
        player1Ready: null,
        player2Ready: null,
        lastActivity1: oldTimestamp,
        lastActivity2: oldTimestamp,
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: 60,
        popcornItems: [],
        startTime: null,
        createdAt: oldTimestamp,
        winner: null,
      };

      (redis.zRange as any).mockResolvedValue([{ member: oldGameId, score: oldTimestamp }]);
      (redis.get as any).mockResolvedValue(JSON.stringify(oldGame));
      (redis.del as any).mockResolvedValue(undefined);
      (redis.zRem as any).mockResolvedValue(undefined);

      const cleanedCount = await gameManager.cleanupExpiredGames();

      expect(cleanedCount).toBe(1);
      expect(redis.del).toHaveBeenCalledWith(`popcorn_game:${oldGameId}`);
      expect(redis.del).toHaveBeenCalledWith(`popcorn_player_game:${player1Id}`);
      expect(redis.zRem).toHaveBeenCalledWith('popcorn_waiting_games', [oldGameId]);
    });

    it('should not delete games younger than 2 minutes', async () => {
      const recentGameId = 'recent_game_123';
      const recentTimestamp = Date.now() - 60000; // 1 minute ago

      const recentGame: GameState = {
        gameId: recentGameId,
        status: 'waiting',
        player1Id,
        player2Id: null,
        player1Ready: null,
        player2Ready: null,
        lastActivity1: recentTimestamp,
        lastActivity2: recentTimestamp,
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: 60,
        popcornItems: [],
        startTime: null,
        createdAt: recentTimestamp,
        winner: null,
      };

      (redis.zRange as any).mockResolvedValue([{ member: recentGameId, score: recentTimestamp }]);
      (redis.get as any).mockResolvedValue(JSON.stringify(recentGame));

      const cleanedCount = await gameManager.cleanupExpiredGames();

      expect(cleanedCount).toBe(0);
      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('checkPlayerActivity()', () => {
    const gameId = 'test_game_123';

    it('should detect disconnect after 3 seconds', async () => {
      const oldActivity = Date.now() - 4000; // 4 seconds ago

      const gameState: GameState = {
        gameId,
        status: 'playing',
        player1Id,
        player2Id,
        player1Ready: Date.now(),
        player2Ready: Date.now(),
        lastActivity1: oldActivity,
        lastActivity2: Date.now(),
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: 60,
        popcornItems: [],
        startTime: Date.now(),
        createdAt: Date.now(),
        winner: null,
      };

      (redis.get as any).mockResolvedValue(JSON.stringify(gameState));

      const disconnectInfo = await gameManager.checkPlayerActivity(gameId);

      expect(disconnectInfo.disconnected).toBe(true);
      expect(disconnectInfo.playerId).toBe(player1Id);
    });

    it('should not flag active players', async () => {
      const recentActivity = Date.now() - 1000; // 1 second ago

      const gameState: GameState = {
        gameId,
        status: 'playing',
        player1Id,
        player2Id,
        player1Ready: Date.now(),
        player2Ready: Date.now(),
        lastActivity1: recentActivity,
        lastActivity2: recentActivity,
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: 60,
        popcornItems: [],
        startTime: Date.now(),
        createdAt: Date.now(),
        winner: null,
      };

      (redis.get as any).mockResolvedValue(JSON.stringify(gameState));

      const disconnectInfo = await gameManager.checkPlayerActivity(gameId);

      expect(disconnectInfo.disconnected).toBe(false);
      expect(disconnectInfo.playerId).toBeUndefined();
    });

    it('should return not disconnected for non-playing games', async () => {
      const gameState: GameState = {
        gameId,
        status: 'waiting',
        player1Id,
        player2Id: null,
        player1Ready: null,
        player2Ready: null,
        lastActivity1: Date.now() - 10000,
        lastActivity2: Date.now(),
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: 60,
        popcornItems: [],
        startTime: null,
        createdAt: Date.now(),
        winner: null,
      };

      (redis.get as any).mockResolvedValue(JSON.stringify(gameState));

      const disconnectInfo = await gameManager.checkPlayerActivity(gameId);

      expect(disconnectInfo.disconnected).toBe(false);
    });
  });

  describe('Atomic operations', () => {
    it('should handle race conditions with WATCH/MULTI/EXEC', async () => {
      const gameId = 'test_game_123';

      // Mock: No existing player game
      (redis.get as any).mockImplementation(async (key: string) => {
        if (key === `popcorn_player_game:${player2Id}`) {
          return null;
        }
        if (key === `popcorn_game:${gameId}`) {
          const gameState: GameState = {
            gameId,
            status: 'waiting',
            player1Id,
            player2Id: null,
            player1Ready: null,
            player2Ready: null,
            lastActivity1: Date.now(),
            lastActivity2: Date.now(),
            player1Score: 0,
            player2Score: 0,
            player1Position: 150,
            player2Position: 650,
            timeRemaining: 60,
            popcornItems: [],
            startTime: null,
            createdAt: Date.now(),
            winner: null,
          };
          return JSON.stringify(gameState);
        }
        return null;
      });

      // Mock: One waiting game
      (redis.zRange as any).mockResolvedValue([{ member: gameId, score: Date.now() }]);

      // Mock: Transaction with watch/multi/exec
      const mockTxn = {
        unwatch: vi.fn().mockResolvedValue(undefined),
        multi: vi.fn().mockResolvedValue(undefined),
        set: vi.fn().mockResolvedValue(undefined),
        zRem: vi.fn().mockResolvedValue(undefined),
        exec: vi.fn().mockResolvedValue([true, true, true]),
      };
      (redis.watch as any).mockResolvedValue(mockTxn);

      await gameManager.joinGame(player2Id);

      // Verify atomic operations were used
      expect(redis.watch).toHaveBeenCalledWith(
        `popcorn_game:${gameId}`,
        `popcorn_player_game:${player2Id}`
      );
      expect(mockTxn.multi).toHaveBeenCalled();
      expect(mockTxn.exec).toHaveBeenCalled();
    });

    it('should retry on transaction failure', async () => {
      // Mock: No existing player game
      (redis.get as any).mockResolvedValue(null);

      // Mock: No waiting games
      (redis.zRange as any).mockResolvedValue([]);

      // Mock: First attempt fails, second succeeds
      let attemptCount = 0;
      (redis.watch as any).mockImplementation(async () => {
        const mockTxn = {
          unwatch: vi.fn().mockResolvedValue(undefined),
          multi: vi.fn().mockResolvedValue(undefined),
          set: vi.fn().mockResolvedValue(undefined),
          zAdd: vi.fn().mockResolvedValue(undefined),
          exec: vi.fn().mockImplementation(async () => {
            attemptCount++;
            if (attemptCount === 1) {
              throw new Error('Transaction failed');
            }
            return [true, true, true];
          }),
        };
        return mockTxn;
      });

      // Mock: Return created game state after retry
      (redis.get as any).mockImplementation(async (key: string) => {
        if (key.startsWith('popcorn_game:')) {
          const gameState: GameState = {
            gameId: key.replace('popcorn_game:', ''),
            status: 'waiting',
            player1Id,
            player2Id: null,
            player1Ready: null,
            player2Ready: null,
            lastActivity1: Date.now(),
            lastActivity2: Date.now(),
            player1Score: 0,
            player2Score: 0,
            player1Position: 150,
            player2Position: 650,
            timeRemaining: 60,
            popcornItems: [],
            startTime: null,
            createdAt: Date.now(),
            winner: null,
          };
          return JSON.stringify(gameState);
        }
        return null;
      });

      const result = await gameManager.joinGame(player1Id);

      expect(result.playerRole).toBe('player1');
      expect(attemptCount).toBe(2);
    });
  });
});

describe('Multiplayer Integration Tests', () => {
  let gameManager: MultiplayerGameManager;
  const player1Id = 'player1';
  const player2Id = 'player2';
  let mockRedisStore: Map<string, string>;

  beforeEach(() => {
    gameManager = MultiplayerGameManager.getInstance();
    vi.clearAllMocks();

    // Create an in-memory store to simulate Redis
    mockRedisStore = new Map<string, string>();

    // Setup Redis get to read from our store
    (redis.get as any).mockImplementation(async (key: string) => {
      return mockRedisStore.get(key) || null;
    });

    // Setup Redis set to write to our store
    (redis.set as any).mockImplementation(async (key: string, value: string) => {
      mockRedisStore.set(key, value);
    });

    // Setup default mock implementations for successful transactions
    (redis.watch as any).mockImplementation(async (...keys: string[]) => {
      const txn = {
        unwatch: vi.fn().mockResolvedValue(undefined),
        multi: vi.fn().mockResolvedValue(undefined),
        set: vi.fn().mockImplementation(async (key: string, value: string) => {
          mockRedisStore.set(key, value);
        }),
        zAdd: vi.fn().mockResolvedValue(undefined),
        zRem: vi.fn().mockResolvedValue(undefined),
        exec: vi.fn().mockResolvedValue([true, true, true]), // Simulate successful transaction
      };
      return txn;
    });

    (redis.zRange as any).mockResolvedValue([]);
    (redis.del as any).mockImplementation(async (key: string) => {
      mockRedisStore.delete(key);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockRedisStore.clear();
  });

  describe('Complete join-ready-play-end flow with two players', () => {
    it('should handle complete game flow from join to end', async () => {
      // Step 1: Player 1 joins and creates a game
      const join1Result = await gameManager.joinGame(player1Id);

      expect(join1Result.playerRole).toBe('player1');
      expect(join1Result.gameState.status).toBe('waiting');
      expect(join1Result.gameState.player1Id).toBe(player1Id);
      expect(join1Result.gameState.player2Id).toBeNull();

      const gameId = join1Result.gameState.gameId;

      // Step 2: Player 2 joins the same game
      (redis.zRange as any).mockResolvedValue([{ member: gameId, score: Date.now() }]);

      const join2Result = await gameManager.joinGame(player2Id);

      expect(join2Result.playerRole).toBe('player2');
      expect(join2Result.gameState.player2Id).toBe(player2Id);

      // Step 3: Both players send ready signals
      const ready1Result = await gameManager.sendReady(gameId, player1Id);
      expect(ready1Result.success).toBe(true);
      expect(ready1Result.bothReady).toBe(false);

      const ready2Result = await gameManager.sendReady(gameId, player2Id);
      expect(ready2Result.success).toBe(true);
      expect(ready2Result.bothReady).toBe(true);
      expect(ready2Result.startTime).toBeDefined();

      // Step 4: Game is now playing
      const gameState = await gameManager.getGameState(gameId);
      expect(gameState?.status).toBe('playing');

      // Step 5: Update positions and scores during gameplay
      const updatePosResult = await gameManager.updatePlayerPosition(gameId, player1Id, 200);
      expect(updatePosResult).toBe(true);

      const updateScoreResult = await gameManager.updateScore(gameId, player1Id, 5);
      expect(updateScoreResult).toBe(true);

      // Step 6: End game
      const endResult = await gameManager.endGame(gameId);
      expect(endResult).toBe(true);
      expect(redis.del).toHaveBeenCalled();
    });
  });

  describe('Self-matching prevention', () => {
    it('should prevent a player from joining their own game', async () => {
      // Player 1 creates a game
      const join1Result = await gameManager.joinGame(player1Id);
      const gameId = join1Result.gameState.gameId;

      // Clear the player_game key to simulate player trying to join again
      mockRedisStore.delete(`popcorn_player_game:${player1Id}`);

      // Player 1 tries to join again - should see their own game in waiting list
      (redis.zRange as any).mockResolvedValue([{ member: gameId, score: Date.now() }]);

      const join2Result = await gameManager.joinGame(player1Id);

      // Should create a new game instead of joining the old one (self-matching prevented)
      expect(join2Result.gameState.gameId).not.toBe(gameId);
      expect(redis.del).toHaveBeenCalled(); // Old game should be cleaned up
    });
  });

  describe('Duplicate join prevention', () => {
    it('should prevent a player from joining multiple games', async () => {
      // Player 1 creates a game
      const join1Result = await gameManager.joinGame(player1Id);
      const gameId = join1Result.gameState.gameId;

      // Simulate player already in game by keeping the player_game key
      // (it was already set by the first join)

      const join2Result = await gameManager.joinGame(player1Id);

      // Should return the existing game
      expect(join2Result.gameState.gameId).toBe(gameId);
      expect(join2Result.playerRole).toBe('player1');
    });
  });

  describe('Ready timeout (30 seconds)', () => {
    it('should timeout and reset if both players do not ready within 30 seconds', async () => {
      // Create a game with both players
      const gameId = 'test_game_123';
      const oldTimestamp = Date.now() - 35000; // 35 seconds ago

      const gameState = {
        gameId,
        status: 'waiting',
        player1Id,
        player2Id,
        player1Ready: oldTimestamp,
        player2Ready: null,
        lastActivity1: Date.now(),
        lastActivity2: Date.now(),
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: 60,
        popcornItems: [],
        startTime: null,
        createdAt: Date.now(),
        winner: null,
      };

      (redis.get as any).mockResolvedValue(JSON.stringify(gameState));

      const readyResult = await gameManager.sendReady(gameId, player2Id);

      expect(readyResult.success).toBe(false);
      expect(readyResult.timeout).toBe(true);
      expect(readyResult.message).toContain('timeout');
      expect(redis.set).toHaveBeenCalled(); // Should reset ready flags
    });
  });

  describe('Game expiry (2 minutes)', () => {
    it('should clean up games older than 2 minutes', async () => {
      const oldGameId = 'old_game_123';
      const oldTimestamp = Date.now() - 130000; // 2 minutes 10 seconds ago

      const oldGame = {
        gameId: oldGameId,
        status: 'waiting',
        player1Id,
        player2Id: null,
        player1Ready: null,
        player2Ready: null,
        lastActivity1: oldTimestamp,
        lastActivity2: oldTimestamp,
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: 60,
        popcornItems: [],
        startTime: null,
        createdAt: oldTimestamp,
        winner: null,
      };

      (redis.zRange as any).mockResolvedValue([{ member: oldGameId, score: oldTimestamp }]);
      (redis.get as any).mockResolvedValue(JSON.stringify(oldGame));

      const cleanedCount = await gameManager.cleanupExpiredGames();

      expect(cleanedCount).toBe(1);
      expect(redis.del).toHaveBeenCalled();
      expect(redis.zRem).toHaveBeenCalled();
    });
  });

  describe('Disconnect detection (3 seconds)', () => {
    it('should detect player disconnect after 3 seconds of inactivity', async () => {
      const gameId = 'test_game_123';
      const oldActivity = Date.now() - 4000; // 4 seconds ago

      const gameState = {
        gameId,
        status: 'playing',
        player1Id,
        player2Id,
        player1Ready: Date.now(),
        player2Ready: Date.now(),
        lastActivity1: oldActivity,
        lastActivity2: Date.now(),
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: 60,
        popcornItems: [],
        startTime: Date.now(),
        createdAt: Date.now(),
        winner: null,
      };

      (redis.get as any).mockResolvedValue(JSON.stringify(gameState));

      const disconnectInfo = await gameManager.checkPlayerActivity(gameId);

      expect(disconnectInfo.disconnected).toBe(true);
      expect(disconnectInfo.playerId).toBe(player1Id);
    });
  });

  describe('Race conditions with concurrent joins', () => {
    it('should handle concurrent joins atomically', async () => {
      // Setup: Player 1 creates a game
      const join1Result = await gameManager.joinGame(player1Id);
      const gameId = join1Result.gameState.gameId;

      (redis.zRange as any).mockResolvedValue([{ member: gameId, score: Date.now() }]);

      // Player 2 tries to join
      const join2Result = await gameManager.joinGame(player2Id);

      // Should successfully join the game
      expect(join2Result.gameState.player2Id).toBe(player2Id);
      expect(join2Result.playerRole).toBe('player2');

      // Verify atomic operations were used (watch was called)
      expect(redis.watch).toHaveBeenCalled();

      // Verify the game state is consistent
      const finalGameState = await gameManager.getGameState(gameId);
      expect(finalGameState?.player1Id).toBe(player1Id);
      expect(finalGameState?.player2Id).toBe(player2Id);
      expect(finalGameState?.status).toBe('waiting');
    });
  });

  describe('Cleanup on player leave during waiting', () => {
    it('should delete game when player leaves during waiting state', async () => {
      const gameId = 'test_game_123';
      const gameState = {
        gameId,
        status: 'waiting',
        player1Id,
        player2Id: null,
        player1Ready: null,
        player2Ready: null,
        lastActivity1: Date.now(),
        lastActivity2: Date.now(),
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: 60,
        popcornItems: [],
        startTime: null,
        createdAt: Date.now(),
        winner: null,
      };

      (redis.get as any).mockResolvedValue(JSON.stringify(gameState));

      const leaveResult = await gameManager.leaveGame(gameId, player1Id);

      expect(leaveResult).toBe(true);
      expect(redis.del).toHaveBeenCalledWith(expect.stringContaining(gameId));
      expect(redis.del).toHaveBeenCalledWith(expect.stringContaining(`player_game:${player1Id}`));
      expect(redis.zRem).toHaveBeenCalled();
    });
  });

  describe('Cleanup on player leave during gameplay', () => {
    it('should mark player as disconnected when leaving during gameplay', async () => {
      const gameId = 'test_game_123';
      const gameState = {
        gameId,
        status: 'playing',
        player1Id,
        player2Id,
        player1Ready: Date.now(),
        player2Ready: Date.now(),
        lastActivity1: Date.now(),
        lastActivity2: Date.now(),
        player1Score: 5,
        player2Score: 3,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: 45,
        popcornItems: [],
        startTime: Date.now(),
        createdAt: Date.now(),
        winner: null,
      };

      (redis.get as any).mockResolvedValue(JSON.stringify(gameState));

      const leaveResult = await gameManager.leaveGame(gameId, player1Id);

      expect(leaveResult).toBe(true);
      expect(redis.del).toHaveBeenCalledWith(expect.stringContaining(`player_game:${player1Id}`));
      expect(redis.set).toHaveBeenCalled(); // Game state updated with player removed
    });
  });
});
