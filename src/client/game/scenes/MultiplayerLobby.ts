import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { JoinGameResponse } from '../../../shared/types/api';

export class MultiplayerLobby extends Scene {
  private background!: Phaser.GameObjects.Image;
  private titleText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private backButton!: Phaser.GameObjects.Text;
  private gameId: string | null = null;
  private playerId: string | null = null;
  private playerRole: string | null = null;
  private pollTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super('MultiplayerLobby');
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.background = this.add.image(width / 2, height / 2, 'kitchen');
    this.background.setDisplaySize(width, height);
    this.background.setAlpha(0.6);

    // Title
    this.titleText = this.add
      .text(width / 2, height * 0.25, 'MULTIPLAYER LOBBY', {
        fontFamily: 'Arial Black',
        fontSize: '48px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 10,
        align: 'center',
      })
      .setOrigin(0.5);

    // Status text
    this.statusText = this.add
      .text(width / 2, height * 0.5, 'Finding opponent...', {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5);

    // Loading animation
    this.tweens.add({
      targets: this.statusText,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Back button
    this.backButton = this.add
      .text(width / 2, height * 0.8, 'Back to Menu', {
        fontFamily: 'Arial Black',
        fontSize: '24px',
        color: '#FF6B6B',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.backButton
      .on('pointerover', () => {
        this.backButton.setScale(1.1);
      })
      .on('pointerout', () => {
        this.backButton.setScale(1);
      })
      .on('pointerdown', () => {
        this.leaveGame();
      });

    // Join game
    this.joinGame();
  }

  private async joinGame(): Promise<void> {
    try {
      const response = await fetch('/api/multiplayer/join', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to join game');
      }

      const data = (await response.json()) as JoinGameResponse;

      if (data.success) {
        this.gameId = data.gameState.gameId;
        this.playerId = data.playerId;
        this.playerRole = data.playerRole;

        // CRITICAL: Only start if status is 'playing' AND both players exist
        if (
          data.gameState.status === 'playing' &&
          data.gameState.player1Id !== null &&
          data.gameState.player2Id !== null
        ) {
          // Game is ready with both players, start playing
          this.startMultiplayerGame();
        } else {
          // Wait for another player
          this.statusText.setText('Waiting for opponent...');
          this.pollForGameStart();
        }
      } else {
        this.showError('Failed to join game.');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      this.showError('Server is offline or unreachable.');
    }
  }

  private showError(message: string): void {
    this.statusText.setText(message + '\n\nReturning to menu...');
    this.statusText.setColor('#FF6B6B');
    
    // Stop loading animation
    this.tweens.killTweensOf(this.statusText);
    this.statusText.setAlpha(1);

    // Auto-return to menu after 3 seconds
    this.time.delayedCall(3000, () => {
      this.scene.start('ModeSelect');
    });
  }

  private pollForGameStart(): void {
    console.log(`[Lobby] Starting to poll for game ${this.gameId}`);
    this.pollTimer = this.time.addEvent({
      delay: 1000,
      callback: async () => {
        try {
          console.log(`[Lobby] Polling game state for ${this.gameId}...`);
          const response = await fetch(`/api/multiplayer/state?gameId=${this.gameId}`);
          if (!response.ok) {
            console.error(`[Lobby] Poll failed with status ${response.status}`);
            return;
          }

          const data = await response.json();
          console.log(`[Lobby] Poll response:`, data);

          // CRITICAL: Only start if status is 'playing' AND both players exist
          if (
            data.success &&
            data.gameState.status === 'playing' &&
            data.gameState.player1Id !== null &&
            data.gameState.player2Id !== null
          ) {
            console.log(`[Lobby] Game is now playing with both players! Starting game...`);
            this.pollTimer.remove();
            this.startMultiplayerGame();
          } else {
            console.log(
              `[Lobby] Game status: ${data.gameState?.status || 'unknown'}, P1: ${data.gameState?.player1Id ? 'present' : 'missing'}, P2: ${data.gameState?.player2Id ? 'present' : 'missing'}`
            );
          }
        } catch (error) {
          console.error('Error polling game state:', error);
        }
      },
      loop: true,
    });
  }

  private async leaveGame(): Promise<void> {
    // Stop polling
    if (this.pollTimer) {
      this.pollTimer.remove();
    }

    // Notify server that player is leaving
    if (this.gameId) {
      try {
        await fetch(`/api/multiplayer/leave?gameId=${this.gameId}`, {
          method: 'POST',
        });
        console.log(`[Lobby] Left game ${this.gameId}`);
      } catch (error) {
        console.error('[Lobby] Error leaving game:', error);
      }
    }

    // Return to menu
    this.scene.start('ModeSelect');
  }

  private startMultiplayerGame(): void {
    this.scene.start('MultiplayerGame', {
      gameId: this.gameId,
      playerId: this.playerId,
      playerRole: this.playerRole,
    });
  }

  shutdown() {
    // Clean up when scene is destroyed (e.g., browser closed)
    if (this.pollTimer) {
      this.pollTimer.remove();
    }
    // Try to leave game if still in lobby
    if (this.gameId) {
      void fetch(`/api/multiplayer/leave?gameId=${this.gameId}`, {
        method: 'POST',
      }).catch(() => {
        // Ignore errors on shutdown
      });
    }
  }
}
