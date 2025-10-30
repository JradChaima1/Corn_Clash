import { Scene, GameObjects } from 'phaser';
import { AudioManager } from '../utils/AudioManager';
import { ButtonFactory } from '../utils/ButtonFactory';

interface GameOverData {
  winner: string;
  player1Score: number;
  player2Score: number;
  reason?: string; // 'completed' | 'disconnect'
  gameId?: string;
  playerRole?: string; // 'player1' | 'player2'
}

export class MultiplayerGameOver extends Scene {
  private background!: GameObjects.Image;
  private gameId: string | null = null;

  constructor() {
    super('MultiplayerGameOver');
  }

  init(data: GameOverData) {
    this.gameId = data.gameId || null;

    // Record only the current player's score to leaderboard
    const myScore = data.playerRole === 'player1' ? data.player1Score : data.player2Score;
    this.recordScore(myScore);

    // Switch back to menu music
    AudioManager.getInstance().init(this);
    AudioManager.getInstance().playMusic('menu_music', 0.3);

    // Clean up game after 5 seconds to ensure both players see scores
    if (this.gameId) {
      console.log(`[GameOver] Scheduling game cleanup for ${this.gameId} in 5 seconds`);
      setTimeout(() => {
        if (this.gameId) {
          fetch(`/api/multiplayer/end?gameId=${this.gameId}`, {
            method: 'POST',
          }).catch((err) => {
            console.error('[GameOver] Error ending game:', err);
          });
        }
      }, 5000);
    }
  }

  shutdown() {
    // Ensure game is ended on shutdown (if player leaves before 5 second timer)
    if (this.gameId) {
      console.log(`[GameOver] Ending game ${this.gameId} on shutdown`);
      void fetch(`/api/multiplayer/end?gameId=${this.gameId}`, {
        method: 'POST',
      }).catch((err) => {
        console.error('[GameOver] Error ending game on shutdown:', err);
      });
    }
  }

  create(data: GameOverData) {
    const { width, height } = this.scale;

    // Background
    this.background = this.add.image(width / 2, height / 2, 'kitchen');
    this.background.setDisplaySize(width, height);
    this.background.setAlpha(0.7);

    // Check if game ended due to disconnect
    if (data.reason === 'disconnect') {
      // Disconnect message
      this.add
        .text(width / 2, height * 0.3, 'OPPONENT LEFT', {
          fontFamily: 'Arial Black',
          fontSize: '48px',
          color: '#FF6B6B',
          stroke: '#000000',
          strokeThickness: 10,
          align: 'center',
        })
        .setOrigin(0.5);

      this.add
        .text(width / 2, height * 0.45, 'The other player disconnected', {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 6,
          align: 'center',
        })
        .setOrigin(0.5);
    } else {
      // Normal game over - show winner
      const winnerColor =
        data.winner === 'Player 1' ? '#FF6B6B' : data.winner === 'Player 2' ? '#4ECDC4' : '#FFD700';

      this.add
        .text(width / 2, height * 0.25, 'GAME OVER!', {
          fontFamily: 'Arial Black',
          fontSize: '56px',
          color: '#FFD700',
          stroke: '#000000',
          strokeThickness: 10,
          align: 'center',
        })
        .setOrigin(0.5);

      this.add
        .text(
          width / 2,
          height * 0.4,
          data.winner === 'Tie' ? "IT'S A TIE!" : `${data.winner.toUpperCase()} WINS!`,
          {
            fontFamily: 'Arial Black',
            fontSize: '42px',
            color: winnerColor,
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center',
          }
        )
        .setOrigin(0.5);
    }

    // Scores
    this.add
      .text(width / 2, height * 0.55, 'FINAL SCORES', {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.63, `Player 1: ${data.player1Score}`, {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#FF6B6B',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.71, `Player 2: ${data.player2Score}`, {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#4ECDC4',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5);

    // Main Menu button using ButtonFactory
    const mainMenuButton = ButtonFactory.createButton(
      this,
      width / 2,
      height * 0.93,
      'Main Menu',
      0x22c55e,
      0x16a34a,
      220
    );
    mainMenuButton.setInteractive(
      new Phaser.Geom.Rectangle(
        -110,
        -30,
        220,
        60
      ) as unknown as Phaser.Types.Input.InputConfiguration,
      Phaser.Geom.Rectangle.Contains
    );

    ButtonFactory.addHoverEffect(this, mainMenuButton);
    ButtonFactory.addClickEffect(this, mainMenuButton, () => {
      this.scene.start('MainMenu');
    });
  }

  private async recordScore(score: number): Promise<void> {
    try {
      await fetch('/api/leaderboard/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });
      console.log(`[MultiplayerGameOver] Score ${score} recorded to leaderboard`);
    } catch (error) {
      console.error('[MultiplayerGameOver] Error recording score to leaderboard:', error);
    }
  }
}
