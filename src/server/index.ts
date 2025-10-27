import express from 'express';
import {
  InitResponse,
  IncrementResponse,
  DecrementResponse,
  JoinGameResponse,
  GameStateResponse,
  UpdatePositionRequest,
  UpdatePositionResponse,
} from '../shared/types/api';
import { redis, createServer, context } from '@devvit/web/server';
import { createPost } from './core/post';
import { MultiplayerGameManager } from './core/multiplayer';

const app = express();
const gameManager = MultiplayerGameManager.getInstance();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const count = await redis.get('count');
      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Multiplayer endpoints
router.post<unknown, JoinGameResponse>('/api/multiplayer/join', async (_req, res): Promise<void> => {
  try {
    console.log('[API] /api/multiplayer/join called');
    const { userId } = context;
    const playerId = userId || `guest_${Date.now()}`;
    console.log(`[API] Player ID: ${playerId}`);

    const result = await gameManager.joinGame(playerId);

    console.log(`[API] Join result: role=${result.playerRole}, status=${result.gameState.status}`);

    res.json({
      success: true,
      gameState: result.gameState,
      playerRole: result.playerRole as 'player1' | 'player2' | 'spectator',
      playerId,
    });
  } catch (error) {
    console.error('[API] Error joining game:', error);
    res.status(500).json({
      success: false,
      gameState: null as any,
      playerRole: 'spectator',
      playerId: '',
      message: 'Failed to join game',
    });
  }
});

router.get<unknown, GameStateResponse>('/api/multiplayer/state', async (req, res): Promise<void> => {
  try {
    const gameId = req.query.gameId as string;
    console.log(`[API] State request for game: ${gameId}`);

    if (!gameId) {
      console.error('[API] No gameId provided in state request');
      res.status(400).json({
        success: false,
        gameState: null as any,
        playerRole: 'spectator',
      });
      return;
    }

    const gameState = await gameManager.getGameState(gameId);

    if (!gameState) {
      console.error(`[API] Game ${gameId} not found`);
      res.status(404).json({
        success: false,
        gameState: null as any,
        playerRole: 'spectator',
      });
      return;
    }

    const { userId } = context;
    const playerId = userId || '';
    let playerRole: 'player1' | 'player2' | 'spectator' = 'spectator';

    if (gameState.player1Id === playerId) {
      playerRole = 'player1';
    } else if (gameState.player2Id === playerId) {
      playerRole = 'player2';
    }

    // Reduced logging to prevent spam
    // console.log(`[API] Returning state for game ${gameId}: status=${gameState.status}`);

    res.json({
      success: true,
      gameState,
      playerRole,
    });
  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).json({
      success: false,
      gameState: null as any,
      playerRole: 'spectator',
    });
  }
});

router.post<unknown, UpdatePositionResponse, UpdatePositionRequest>(
  '/api/multiplayer/position',
  async (req, res): Promise<void> => {
    try {
      const gameId = req.query.gameId as string;
      const { userId } = context;
      const playerId = userId || '';
      const { position } = req.body;

      if (!gameId || position === undefined) {
        res.status(400).json({
          success: false,
          gameState: null as any,
        });
        return;
      }

      const success = await gameManager.updatePlayerPosition(gameId, playerId, position);
      const gameState = await gameManager.getGameState(gameId);

      if (!success || !gameState) {
        res.status(404).json({
          success: false,
          gameState: null as any,
        });
        return;
      }

      res.json({
        success: true,
        gameState,
      });
    } catch (error) {
      console.error('Error updating position:', error);
      res.status(500).json({
        success: false,
        gameState: null as any,
      });
    }
  }
);

router.post<unknown, { success: boolean }, { score: number }>(
  '/api/multiplayer/score',
  async (req, res): Promise<void> => {
    try {
      const gameId = req.query.gameId as string;
      const { userId } = context;
      const playerId = userId || '';
      const { score } = req.body;

      if (!gameId || score === undefined) {
        res.status(400).json({ success: false });
        return;
      }

      const success = await gameManager.updateScore(gameId, playerId, score);
      res.json({ success });
    } catch (error) {
      console.error('Error updating score:', error);
      res.status(500).json({ success: false });
    }
  }
);

router.post<unknown, { success: boolean }>(
  '/api/multiplayer/leave',
  async (req, res): Promise<void> => {
    try {
      const gameId = req.query.gameId as string;
      const { userId } = context;
      const playerId = userId || '';

      console.log(`[API] Player ${playerId} leaving game ${gameId}`);

      if (!gameId) {
        res.status(400).json({ success: false });
        return;
      }

      const success = await gameManager.leaveGame(gameId, playerId);
      res.json({ success });
    } catch (error) {
      console.error('Error leaving game:', error);
      res.status(500).json({ success: false });
    }
  }
);

router.post<unknown, { success: boolean }>(
  '/api/multiplayer/end',
  async (req, res): Promise<void> => {
    try {
      const gameId = req.query.gameId as string;

      console.log(`[API] Ending game ${gameId}`);

      if (!gameId) {
        res.status(400).json({ success: false });
        return;
      }

      const success = await gameManager.endGame(gameId);
      res.json({ success });
    } catch (error) {
      console.error('Error ending game:', error);
      res.status(500).json({ success: false });
    }
  }
);

router.post<unknown, { success: boolean }>(
  '/api/multiplayer/end',
  async (req, res): Promise<void> => {
    try {
      const gameId = req.query.gameId as string;

      console.log(`[API] Ending game ${gameId}`);

      if (!gameId) {
        res.status(400).json({ success: false });
        return;
      }

      const success = await gameManager.endGame(gameId);
      res.json({ success });
    } catch (error) {
      console.error('Error ending game:', error);
      res.status(500).json({ success: false });
    }
  }
);

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = process.env.WEBBIT_PORT || 3000;

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port, () => console.log(`http://localhost:${port}`));