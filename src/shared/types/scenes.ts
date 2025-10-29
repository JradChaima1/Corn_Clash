// Type definitions for scene data passed between Phaser scenes

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SoloGameData {
  // Currently no data needed for solo game initialization
}

export interface MultiplayerGameData {
  gameId: string;
  playerId: string;
  playerRole: 'player1' | 'player2';
}

export interface SoloGameOverData {
  score: number;
}

export interface MultiplayerGameOverData {
  winner: 'Player 1' | 'Player 2' | 'Tie' | 'Disconnect';
  player1Score: number;
  player2Score: number;
  reason: 'completed' | 'disconnect';
  gameId?: string;
}

export type GameOverData = SoloGameOverData | MultiplayerGameOverData;
