import { redis } from '@devvit/web/server';
import { GameState } from '../../shared/types/api';

const GAME_DURATION = 60; // seconds

// Redis key constants
const REDIS_GAME_PREFIX = 'popcorn_game:';
const REDIS_WAITING_GAMES = 'popcorn_waiting_games';
const REDIS_PLAYER_GAME_PREFIX = 'popcorn_player_game:';

// TTL constants
const GAME_TTL = 120; // 2 minutes in seconds
const GAME_EXPIRY_THRESHOLD = 120000; // 2 minutes in milliseconds
const MAX_RETRY_ATTEMPTS = 3;
const READY_TIMEOUT = 30000; // 30 seconds in milliseconds
const DISCONNECT_THRESHOLD = 3000; // 3 seconds in milliseconds

export class MultiplayerGameManager {
  private static instance: MultiplayerGameManager;

  private constructor() { }

  static getInstance(): MultiplayerGameManager {
    if (!MultiplayerGameManager.instance) {
      MultiplayerGameManager.instance = new MultiplayerGameManager();
    }
    return MultiplayerGameManager.instance;
  }

  async joinGame(playerId: string): Promise<{ gameState: GameState; playerRole: string }> {
    console.log(`[Multiplayer] Player ${playerId} attempting to join game`);

    // Step 1: Check if player already in a game using atomic key
    const existingGameId = await redis.get(`${REDIS_PLAYER_GAME_PREFIX}${playerId}`);
    if (existingGameId) {
      const game = await this.getGameState(existingGameId);
      if (game && game.status !== 'finished') {
        console.log(`[Multiplayer] Player ${playerId} already in game ${existingGameId}`);
        const playerRole = game.player1Id === playerId ? 'player1' : 'player2';
        return { gameState: game, playerRole };
      } else {
        // Game doesn't exist or is finished - clean up stale player key
        console.log(`[Multiplayer] Cleaning up stale player key for ${playerId} (game ${existingGameId} not found or finished)`);
        await redis.del(`${REDIS_PLAYER_GAME_PREFIX}${playerId}`);
      }
    }

    // Step 2: Find waiting game with cleanup
    // Using zRange to get all waiting games (sorted set with score as timestamp)
    let waitingGames: string[] = [];
    try {
      const waitingGamesResult = await redis.zRange(REDIS_WAITING_GAMES, 0, -1, { by: 'rank' });
      waitingGames = waitingGamesResult.map(item => item.member);
      console.log(`[Multiplayer] Waiting games in Redis: ${waitingGames.length}`);
    } catch (error: any) {
      // Handle WRONGTYPE error - key exists with wrong data type
      if (error?.details?.includes('WRONGTYPE')) {
        console.log(`[Multiplayer] Fixing corrupted waiting games key - deleting and recreating`);
        await redis.del(REDIS_WAITING_GAMES);
        waitingGames = [];
      } else {
        throw error;
      }
    }

    for (const gameId of waitingGames) {
      const gameStr = await redis.get(`${REDIS_GAME_PREFIX}${gameId}`);
      if (!gameStr) {
        // Game doesn't exist, remove from waiting list
        await redis.zRem(REDIS_WAITING_GAMES, [gameId]);
        continue;
      }

      const game: GameState = JSON.parse(gameStr);
      console.log(
        `[Multiplayer] Checking game ${gameId}: status=${game.status}, player1=${game.player1Id}, player2=${game.player2Id}, scores=${game.player1Score}-${game.player2Score}`
      );

      // Clean up invalid games (non-zero scores, expired, or finished)
      if (game.player1Score > 0 || game.player2Score > 0 || game.status !== 'waiting' || this.isGameExpired(game.createdAt)) {
        console.log(`[Multiplayer] Cleaning up invalid game ${gameId}`);
        await redis.del(`${REDIS_GAME_PREFIX}${gameId}`);
        await redis.zRem(REDIS_WAITING_GAMES, [gameId]);
        continue;
      }

      // Skip self-matching
      if (game.player1Id === playerId) {
        console.log(`[Multiplayer] Player ${playerId} tried to join own game - cleaning up`);
        await redis.del(`${REDIS_GAME_PREFIX}${gameId}`);
        await redis.zRem(REDIS_WAITING_GAMES, [gameId]);
        await redis.del(`${REDIS_PLAYER_GAME_PREFIX}${playerId}`);
        continue;
      }

      // Try to join atomically with retry
      if (game.status === 'waiting' && game.player2Id === null) {
        console.log(`[Multiplayer] Attempting atomic join to game ${gameId}`);
        
        const success = await this.executeWithRetry(async () => {
          const joined = await this.executeAtomicJoin(playerId, gameId);
          if (!joined) {
            throw new Error('Atomic join failed');
          }
          return joined;
        });

        if (success) {
          const updatedGame = await this.getGameState(gameId);
          if (updatedGame) {
            console.log(`[Multiplayer] Player ${playerId} successfully joined game ${gameId} as player2`);
            return { gameState: updatedGame, playerRole: 'player2' };
          }
        }
      }
    }

    // Step 3: Create new game atomically with retry
    const newGameId = this.generateGameId();
    console.log(`[Multiplayer] Creating new game ${newGameId} for player ${playerId} as player1`);

    const success = await this.executeWithRetry(async () => {
      const created = await this.executeAtomicCreate(playerId, newGameId);
      if (!created) {
        throw new Error('Atomic create failed');
      }
      return created;
    });

    if (success) {
      const newGame = await this.getGameState(newGameId);
      if (newGame) {
        console.log(`[Multiplayer] Game ${newGameId} created and waiting for player2`);
        return { gameState: newGame, playerRole: 'player1' };
      }
    }

    throw new Error('Failed to create or join game after retries');
  }

  async sendReady(gameId: string, playerId: string): Promise<{ success: boolean; bothReady: boolean; startTime?: number; timeout?: boolean; message?: string }> {
    console.log(`[Multiplayer] Player ${playerId} sending ready signal for game ${gameId}`);

    const game = await this.getGameState(gameId);

    if (!game) {
      console.log(`[Multiplayer] Game ${gameId} not found`);
      return { success: false, bothReady: false, message: 'Game not found' };
    }

    if (game.status !== 'waiting') {
      console.log(`[Multiplayer] Game ${gameId} is not in waiting status (status: ${game.status})`);
      return { success: false, bothReady: false, message: 'Game is not in waiting status' };
    }

    const now = Date.now();

    // Check if ready timeout exceeded (30 seconds from first ready)
    const player1ReadyTime = game.player1Ready;
    const player2ReadyTime = game.player2Ready;

    if (player1ReadyTime && now - player1ReadyTime > READY_TIMEOUT) {
      console.log(`[Multiplayer] Ready timeout exceeded for game ${gameId}, resetting to waiting`);
      // Reset ready flags
      game.player1Ready = null;
      game.player2Ready = null;
      await redis.set(`${REDIS_GAME_PREFIX}${gameId}`, JSON.stringify(game));
      return { success: false, bothReady: false, timeout: true, message: 'Ready timeout exceeded, please try again' };
    }

    if (player2ReadyTime && now - player2ReadyTime > READY_TIMEOUT) {
      console.log(`[Multiplayer] Ready timeout exceeded for game ${gameId}, resetting to waiting`);
      // Reset ready flags
      game.player1Ready = null;
      game.player2Ready = null;
      await redis.set(`${REDIS_GAME_PREFIX}${gameId}`, JSON.stringify(game));
      return { success: false, bothReady: false, timeout: true, message: 'Ready timeout exceeded, please try again' };
    }

    // Set ready timestamp for the player
    if (game.player1Id === playerId) {
      game.player1Ready = now;
      console.log(`[Multiplayer] Player1 ${playerId} marked as ready`);
    } else if (game.player2Id === playerId) {
      game.player2Ready = now;
      console.log(`[Multiplayer] Player2 ${playerId} marked as ready`);
    } else {
      console.log(`[Multiplayer] Player ${playerId} is not part of game ${gameId}`);
      return { success: false, bothReady: false, message: 'Player is not part of this game' };
    }

    // Check if both players are ready
    const bothReady = game.player1Ready !== null && game.player2Ready !== null;

    if (bothReady) {
      // Transition to playing
      const startTime = Date.now();
      game.status = 'playing';
      game.startTime = startTime;
      console.log(`[Multiplayer] Both players ready, transitioning game ${gameId} to playing with startTime ${startTime}`);
      
      await redis.set(`${REDIS_GAME_PREFIX}${gameId}`, JSON.stringify(game));
      
      return { success: true, bothReady: true, startTime };
    }

    // Save the ready state
    await redis.set(`${REDIS_GAME_PREFIX}${gameId}`, JSON.stringify(game));
    console.log(`[Multiplayer] Player ${playerId} ready, waiting for other player`);

    return { success: true, bothReady: false };
  }

  async getGameState(gameId: string, playerId?: string): Promise<GameState | null> {
    const gameStr = await redis.get(`${REDIS_GAME_PREFIX}${gameId}`);
    if (!gameStr) return null;

    const game: GameState = JSON.parse(gameStr);

    // Update activity timestamp if playerId provided
    if (playerId) {
      const now = Date.now();
      if (game.player1Id === playerId) {
        game.lastActivity1 = now;
      } else if (game.player2Id === playerId) {
        game.lastActivity2 = now;
      }
      await redis.set(`${REDIS_GAME_PREFIX}${gameId}`, JSON.stringify(game));
    }

    return game;
  }

  async updatePlayerPosition(
    gameId: string,
    playerId: string,
    position: number
  ): Promise<boolean> {
    try {
      if (!gameId || !playerId || position === undefined) {
        console.error('[Multiplayer] Invalid parameters for updatePlayerPosition');
        return false;
      }

      const game = await this.getGameState(gameId);
      if (!game) {
        console.error(`[Multiplayer] Game ${gameId} not found for position update`);
        return false;
      }

      if (game.player1Id === playerId) {
        game.player1Position = position;
      } else if (game.player2Id === playerId) {
        game.player2Position = position;
      } else {
        console.error(`[Multiplayer] Player ${playerId} not in game ${gameId}`);
        return false;
      }

      await redis.set(`${REDIS_GAME_PREFIX}${gameId}`, JSON.stringify(game));
      return true;
    } catch (error) {
      console.error('[Multiplayer] Error updating player position:', error);
      return false;
    }
  }

  async updateScore(
    gameId: string,
    playerId: string,
    score: number
  ): Promise<boolean> {
    try {
      if (!gameId || !playerId || score === undefined) {
        console.error('[Multiplayer] Invalid parameters for updateScore');
        return false;
      }

      const game = await this.getGameState(gameId);
      if (!game) {
        console.error(`[Multiplayer] Game ${gameId} not found for score update`);
        return false;
      }

      if (game.player1Id === playerId) {
        game.player1Score = score;
      } else if (game.player2Id === playerId) {
        game.player2Score = score;
      } else {
        console.error(`[Multiplayer] Player ${playerId} not in game ${gameId}`);
        return false;
      }

      await redis.set(`${REDIS_GAME_PREFIX}${gameId}`, JSON.stringify(game));
      return true;
    } catch (error) {
      console.error('[Multiplayer] Error updating score:', error);
      return false;
    }
  }

  async leaveGame(gameId: string, playerId: string): Promise<boolean> {
    console.log(`[Multiplayer] Player ${playerId} leaving game ${gameId}`);

    const game = await this.getGameState(gameId);
    if (!game) {
      console.log(`[Multiplayer] Game ${gameId} not found`);
      return false;
    }

    // Delete player game key
    await redis.del(`${REDIS_PLAYER_GAME_PREFIX}${playerId}`);

    // If game is still waiting (not started), remove the player and delete the game
    if (game.status === 'waiting') {
      console.log(`[Multiplayer] Game ${gameId} was waiting, deleting it`);

      // Remove from waiting list
      await redis.zRem(REDIS_WAITING_GAMES, [gameId]);

      // Delete the game
      await redis.del(`${REDIS_GAME_PREFIX}${gameId}`);
      console.log(`[Multiplayer] Game ${gameId} deleted`);
      return true;
    }

    // If game is playing, mark player as disconnected
    console.log(`[Multiplayer] Game ${gameId} is playing, marking player as disconnected`);
    if (game.player1Id === playerId) {
      game.player1Id = null;
    } else if (game.player2Id === playerId) {
      game.player2Id = null;
    }

    await redis.set(`${REDIS_GAME_PREFIX}${gameId}`, JSON.stringify(game));
    return true;
  }

  async endGame(gameId: string): Promise<boolean> {
    console.log(`[Multiplayer] Ending and deleting game ${gameId}`);

    // Get game state to clean up player keys
    const game = await this.getGameState(gameId);
    if (game) {
      // Delete player game keys
      if (game.player1Id) {
        await redis.del(`${REDIS_PLAYER_GAME_PREFIX}${game.player1Id}`);
      }
      if (game.player2Id) {
        await redis.del(`${REDIS_PLAYER_GAME_PREFIX}${game.player2Id}`);
      }
    }

    // Delete the game from Redis
    await redis.del(`${REDIS_GAME_PREFIX}${gameId}`);

    // Remove from waiting list (in case it's still there)
    await redis.zRem(REDIS_WAITING_GAMES, [gameId]);

    console.log(`[Multiplayer] Game ${gameId} deleted from Redis`);
    return true;
  }

  /**
   * Check if a game has expired (older than 2 minutes)
   */
  private isGameExpired(createdAt: number): boolean {
    const now = Date.now();
    return now - createdAt > GAME_EXPIRY_THRESHOLD;
  }

  /**
   * Check if a player is disconnected (no activity for 3 seconds)
   */
  private isPlayerDisconnected(lastActivity: number): boolean {
    const now = Date.now();
    return now - lastActivity > DISCONNECT_THRESHOLD;
  }

  /**
   * Check for disconnected players in a game
   * Returns disconnect info if any player is disconnected
   */
  async checkPlayerActivity(gameId: string): Promise<{ disconnected: boolean; playerId?: string | null }> {
    const game = await this.getGameState(gameId);

    if (!game || game.status !== 'playing') {
      return { disconnected: false };
    }

    const player1Disconnected = this.isPlayerDisconnected(game.lastActivity1);
    const player2Disconnected = this.isPlayerDisconnected(game.lastActivity2);

    if (player1Disconnected || player2Disconnected) {
      return {
        disconnected: true,
        playerId: player1Disconnected ? game.player1Id : game.player2Id,
      };
    }

    return { disconnected: false };
  }

  /**
   * Clean up expired games from Redis
   * Returns the number of games cleaned up
   */
  async cleanupExpiredGames(): Promise<number> {
    console.log('[Multiplayer] Running cleanup for expired games');
    let cleanedCount = 0;

    // Get all waiting games
    let waitingGames: string[] = [];
    try {
      const waitingGamesResult = await redis.zRange(REDIS_WAITING_GAMES, 0, -1, { by: 'rank' });
      waitingGames = waitingGamesResult.map(item => item.member);
    } catch (error: any) {
      // Handle WRONGTYPE error - key exists with wrong data type
      if (error?.details?.includes('WRONGTYPE')) {
        console.log(`[Multiplayer] Fixing corrupted waiting games key during cleanup`);
        await redis.del(REDIS_WAITING_GAMES);
        return 0;
      }
      throw error;
    }

    for (const gameId of waitingGames) {
      const gameStr = await redis.get(`${REDIS_GAME_PREFIX}${gameId}`);
      
      if (!gameStr) {
        // Game doesn't exist, remove from waiting list
        await redis.zRem(REDIS_WAITING_GAMES, [gameId]);
        cleanedCount++;
        continue;
      }

      const game: GameState = JSON.parse(gameStr);

      // Check if game is expired
      if (this.isGameExpired(game.createdAt)) {
        console.log(`[Multiplayer] Cleaning up expired game ${gameId} (created ${new Date(game.createdAt).toISOString()})`);
        
        // Delete player game keys
        if (game.player1Id) {
          await redis.del(`${REDIS_PLAYER_GAME_PREFIX}${game.player1Id}`);
        }
        if (game.player2Id) {
          await redis.del(`${REDIS_PLAYER_GAME_PREFIX}${game.player2Id}`);
        }

        // Delete the game
        await redis.del(`${REDIS_GAME_PREFIX}${gameId}`);
        
        // Remove from waiting queue
        await redis.zRem(REDIS_WAITING_GAMES, [gameId]);
        
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[Multiplayer] Cleaned up ${cleanedCount} expired games`);
    }

    return cleanedCount;
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Execute atomic join operation using WATCH/MULTI/EXEC transaction
   * Prevents race conditions when multiple players try to join the same game
   */
  private async executeAtomicJoin(playerId: string, gameId: string): Promise<boolean> {
    const gameKey = `${REDIS_GAME_PREFIX}${gameId}`;
    const playerGameKey = `${REDIS_PLAYER_GAME_PREFIX}${playerId}`;

    try {
      // Watch both keys for changes
      const txn = await redis.watch(gameKey, playerGameKey);

      // Verify game still waiting and player not in another game
      const gameStr = await redis.get(gameKey);
      const playerGame = await redis.get(playerGameKey);

      if (!gameStr) {
        await txn.unwatch();
        return false;
      }

      const game: GameState = JSON.parse(gameStr);

      // Check if game is still valid for joining
      if (game.status !== 'waiting' || game.player2Id !== null || playerGame) {
        await txn.unwatch();
        return false;
      }

      // Execute atomic update
      await txn.multi();
      
      // Update game state - keep in waiting status until both players are ready
      game.player2Id = playerId;
      game.player2Position = 650;
      game.player2Ready = null;
      game.lastActivity2 = Date.now();
      // Status remains 'waiting' until both players send ready signal
      
      await txn.set(gameKey, JSON.stringify(game));
      await txn.set(playerGameKey, gameId, { expiration: new Date(Date.now() + GAME_TTL * 1000) });
      await txn.zRem(REDIS_WAITING_GAMES, [gameId]);

      const result = await txn.exec();
      // exec() returns null if transaction was aborted (watched key changed)
      return result !== null;
    } catch (error) {
      console.error(`[Multiplayer] Error in executeAtomicJoin:`, error);
      return false;
    }
  }

  /**
   * Execute atomic create operation for new games with TTL
   * Ensures no race conditions when creating new games
   */
  private async executeAtomicCreate(playerId: string, gameId: string): Promise<boolean> {
    const gameKey = `${REDIS_GAME_PREFIX}${gameId}`;
    const playerGameKey = `${REDIS_PLAYER_GAME_PREFIX}${playerId}`;

    try {
      // Watch player game key to ensure they're not already in a game
      const txn = await redis.watch(playerGameKey);

      const playerGame = await redis.get(playerGameKey);
      if (playerGame) {
        await txn.unwatch();
        return false;
      }

      // Create new game state
      const now = Date.now();
      const newGame: GameState = {
        gameId,
        status: 'waiting',
        player1Id: playerId,
        player2Id: null,
        player1Ready: null,
        player2Ready: null,
        lastActivity1: now,
        lastActivity2: now,
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: GAME_DURATION,
        popcornItems: [],
        startTime: null,
        createdAt: now,
        winner: null,
      };

      // Execute atomic create
      await txn.multi();
      await txn.set(gameKey, JSON.stringify(newGame), { expiration: new Date(Date.now() + GAME_TTL * 1000) });
      await txn.set(playerGameKey, gameId, { expiration: new Date(Date.now() + GAME_TTL * 1000) });
      // Use zAdd with current timestamp as score for sorted set
      await txn.zAdd(REDIS_WAITING_GAMES, { member: gameId, score: Date.now() });

      const result = await txn.exec();
      // exec() returns null if transaction was aborted (watched key changed)
      if (result === null) {
        console.log(`[Multiplayer] Transaction aborted - player ${playerId} already has a game key`);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`[Multiplayer] Error in executeAtomicCreate:`, error);
      return false;
    }
  }

  /**
   * Execute operation with retry logic and exponential backoff
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = MAX_RETRY_ATTEMPTS
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        // Exponential backoff: 100ms, 200ms, 400ms
        const delay = 100 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

}