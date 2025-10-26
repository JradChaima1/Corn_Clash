import { redis } from '@devvit/web/server';
import { GameState } from '../../shared/types/api';

const GAME_DURATION = 60; // seconds
const REDIS_GAME_PREFIX = 'popcorn_game:';
const REDIS_WAITING_GAMES = 'popcorn_waiting_games';

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

    // Try to find a waiting game from Redis
    const waitingGamesStr = await redis.get(REDIS_WAITING_GAMES);
    const waitingGames: string[] = waitingGamesStr ? JSON.parse(waitingGamesStr) : [];
    console.log(`[Multiplayer] Waiting games in Redis: ${waitingGames.length}`);

    let waitingGameId: string | null = null;
    let waitingGame: GameState | null = null;

    for (const gameId of waitingGames) {
      const gameStr = await redis.get(`${REDIS_GAME_PREFIX}${gameId}`);
      if (gameStr) {
        const game: GameState = JSON.parse(gameStr);
        console.log(
          `[Multiplayer] Checking game ${gameId}: status=${game.status}, player2=${game.player2Id}, scores=${game.player1Score}-${game.player2Score}`
        );
        
        // Clean up old games with non-zero scores (finished games that weren't deleted)
        if (game.player1Score > 0 || game.player2Score > 0) {
          console.log(`[Multiplayer] Deleting old game ${gameId} with scores ${game.player1Score}-${game.player2Score}`);
          await redis.del(`${REDIS_GAME_PREFIX}${gameId}`);
          const updatedWaiting = waitingGames.filter((id) => id !== gameId);
          await redis.set(REDIS_WAITING_GAMES, JSON.stringify(updatedWaiting));
          continue; // Skip this game
        }
        
        // Only match games that are 'waiting' with no player2 and have fresh scores (0-0)
        if (
          game.status === 'waiting' &&
          game.player2Id === null &&
          game.player1Score === 0 &&
          game.player2Score === 0
        ) {
          waitingGame = game;
          waitingGameId = gameId;
          break;
        } else if (game.status !== 'waiting') {
          // Clean up old finished games from waiting list
          console.log(`[Multiplayer] Removing finished game ${gameId} from waiting list`);
          await redis.del(`${REDIS_GAME_PREFIX}${gameId}`);
          const updatedWaiting = waitingGames.filter((id) => id !== gameId);
          await redis.set(REDIS_WAITING_GAMES, JSON.stringify(updatedWaiting));
        }
      }
    }

    if (waitingGame && waitingGameId) {
      // CRITICAL: Prevent the same player from joining as both player1 and player2
      if (waitingGame.player1Id === playerId) {
        console.log(
          `[Multiplayer] Player ${playerId} tried to join their own game ${waitingGameId} - BLOCKED`
        );
        // Return the existing game state where they are already player1
        return { gameState: waitingGame, playerRole: 'player1' };
      }

      // Join existing game as player 2
      console.log(
        `[Multiplayer] Player ${playerId} joining existing game ${waitingGameId} as player2`
      );
      waitingGame.player2Id = playerId;
      waitingGame.player2Position = 650;
      waitingGame.status = 'playing';
      waitingGame.startTime = Date.now();

      // Save updated game to Redis
      await redis.set(`${REDIS_GAME_PREFIX}${waitingGameId}`, JSON.stringify(waitingGame));

      // Remove from waiting list
      const updatedWaiting = waitingGames.filter((id) => id !== waitingGameId);
      await redis.set(REDIS_WAITING_GAMES, JSON.stringify(updatedWaiting));

      console.log(`[Multiplayer] Game ${waitingGameId} is now PLAYING with both players`);
      return { gameState: waitingGame, playerRole: 'player2' };
    } else {
      // Create new game
      const gameId = this.generateGameId();
      console.log(`[Multiplayer] Creating new game ${gameId} for player ${playerId} as player1`);
      const newGame: GameState = {
        gameId,
        status: 'waiting',
        player1Id: playerId,
        player2Id: null,
        player1Score: 0,
        player2Score: 0,
        player1Position: 150,
        player2Position: 650,
        timeRemaining: GAME_DURATION,
        popcornItems: [],
        startTime: null,
        winner: null,
      };

      // Save to Redis
      await redis.set(`${REDIS_GAME_PREFIX}${gameId}`, JSON.stringify(newGame));

      // Add to waiting list
      waitingGames.push(gameId);
      await redis.set(REDIS_WAITING_GAMES, JSON.stringify(waitingGames));

      console.log(`[Multiplayer] Game ${gameId} created and waiting for player2`);

      return { gameState: newGame, playerRole: 'player1' };
    }
  }

  async getGameState(gameId: string): Promise<GameState | null> {
    const gameStr = await redis.get(`${REDIS_GAME_PREFIX}${gameId}`);
    return gameStr ? JSON.parse(gameStr) : null;
  }

  async updatePlayerPosition(
    gameId: string,
    playerId: string,
    position: number
  ): Promise<boolean> {
    const game = await this.getGameState(gameId);
    if (!game) return false;

    if (game.player1Id === playerId) {
      game.player1Position = position;
    } else if (game.player2Id === playerId) {
      game.player2Position = position;
    }

    await redis.set(`${REDIS_GAME_PREFIX}${gameId}`, JSON.stringify(game));
    return true;
  }

  async updateScore(
    gameId: string,
    playerId: string,
    score: number
  ): Promise<boolean> {
    const game = await this.getGameState(gameId);
    if (!game) return false;

    if (game.player1Id === playerId) {
      game.player1Score = score;
    } else if (game.player2Id === playerId) {
      game.player2Score = score;
    }

    await redis.set(`${REDIS_GAME_PREFIX}${gameId}`, JSON.stringify(game));
    return true;
  }

  async leaveGame(gameId: string, playerId: string): Promise<boolean> {
    console.log(`[Multiplayer] Player ${playerId} leaving game ${gameId}`);
    
    const game = await this.getGameState(gameId);
    if (!game) {
      console.log(`[Multiplayer] Game ${gameId} not found`);
      return false;
    }

    // If game is still waiting (not started), remove the player and delete the game
    if (game.status === 'waiting') {
      console.log(`[Multiplayer] Game ${gameId} was waiting, deleting it`);
      
      // Remove from waiting list
      const waitingGamesStr = await redis.get(REDIS_WAITING_GAMES);
      const waitingGames: string[] = waitingGamesStr ? JSON.parse(waitingGamesStr) : [];
      const updatedWaiting = waitingGames.filter((id) => id !== gameId);
      await redis.set(REDIS_WAITING_GAMES, JSON.stringify(updatedWaiting));
      
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
    
    // Delete the game from Redis
    await redis.del(`${REDIS_GAME_PREFIX}${gameId}`);
    
    // Remove from waiting list (in case it's still there)
    const waitingGamesStr = await redis.get(REDIS_WAITING_GAMES);
    const waitingGames: string[] = waitingGamesStr ? JSON.parse(waitingGamesStr) : [];
    const updatedWaiting = waitingGames.filter((id) => id !== gameId);
    await redis.set(REDIS_WAITING_GAMES, JSON.stringify(updatedWaiting));
    
    console.log(`[Multiplayer] Game ${gameId} deleted from Redis`);
    return true;
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
