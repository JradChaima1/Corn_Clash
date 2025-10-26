export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

// Multiplayer Game Types
export type PlayerRole = 'player1' | 'player2' | 'spectator';

export type GameState = {
  gameId: string;
  status: 'waiting' | 'playing' | 'finished';
  player1Id: string | null;
  player2Id: string | null;
  player1Score: number;
  player2Score: number;
  player1Position: number;
  player2Position: number;
  timeRemaining: number;
  popcornItems: PopcornItem[];
  startTime: number | null;
  winner: string | null;
};

export type PopcornItem = {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  spawnTime: number;
};

export type JoinGameResponse = {
  success: boolean;
  gameState: GameState;
  playerRole: PlayerRole;
  playerId: string;
  message?: string;
};

export type GameStateResponse = {
  success: boolean;
  gameState: GameState;
  playerRole: PlayerRole;
};

export type UpdatePositionRequest = {
  position: number;
};

export type UpdatePositionResponse = {
  success: boolean;
  gameState: GameState;
};
