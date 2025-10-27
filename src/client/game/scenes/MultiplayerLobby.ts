import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { JoinGameResponse } from '../../../shared/types/api';
import { ButtonFactory } from '../utils/ButtonFactory';

export class MultiplayerLobby extends Scene {
  private background!: Phaser.GameObjects.Image;
  private titleText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private backButton!: Phaser.GameObjects.Text;
  private readyButton!: Phaser.GameObjects.Container | null;
  private gameId: string | null = null;
  private playerId: string | null = null;
  private playerRole: string | null = null;
  private pollTimer!: Phaser.Time.TimerEvent;
  private isReady: boolean = false;
  private bothPlayersPresent: boolean = false;

  constructor() {
    super('MultiplayerLobby');
  }

  init() {
    // Reset state when entering lobby
    this.gameId = null;
    this.playerId = null;
    this.playerRole = null;
    this.isReady = false;
    this.bothPlayersPresent = false;
    this.readyButton = null;
    
    if (this.pollTimer) {
      this.pollTimer.remove();
    }
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

    // Ready button (initially hidden)
    this.readyButton = null;

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


        // Always wait for opponent - never start immediately
        this.statusText.setText('Waiting for opponent...');
        this.pollForGameStart();

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

          // Check if both players are present
          const bothPresent = data.gameState.player1Id !== null && data.gameState.player2Id !== null;
          
          if (bothPresent && !this.bothPlayersPresent) {
            // Both players just joined - show ready button
            this.bothPlayersPresent = true;
            this.showReadyButton();
            this.statusText.setText('Both players connected!\nClick Ready when you\'re prepared.');
            this.tweens.killTweensOf(this.statusText);
            this.statusText.setAlpha(1);
          }

          // CRITICAL: Only start if status is 'playing' AND both players exist
          if (
            data.success &&
            data.gameState.status === 'playing' &&
            bothPresent
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

  private showReadyButton(): void {
    const { width, height } = this.scale;

    // Create ready button
    this.readyButton = ButtonFactory.createButton(
      this,
      width / 2,
      height * 0.6,
      'READY!',
      0x10b981, // Green
      0x059669, // Dark green
      200
    );

    this.readyButton.setInteractive(
      new Phaser.Geom.Rectangle(-100, -30, 200, 60),
      Phaser.Geom.Rectangle.Contains
    );

    ButtonFactory.addHoverEffect(this, this.readyButton);
    ButtonFactory.addClickEffect(this, this.readyButton, () => {
      this.sendReady();
    });
    ButtonFactory.addFloatingEffect(this, this.readyButton, height * 0.6, 1000);
  }

  private async sendReady(): Promise<void> {
    if (this.isReady || !this.gameId) return;

    try {
      this.isReady = true;

      // Disable button
      if (this.readyButton) {
        this.readyButton.setAlpha(0.5);
        this.readyButton.disableInteractive();
      }

      const response = await fetch(`/api/multiplayer/ready?gameId=${this.gameId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to send ready signal');
      }

      const data = await response.json();
      console.log('[Lobby] Ready response:', data);

      if (data.success) {
        if (data.bothReady) {
          this.statusText.setText('Both players ready!\nStarting game...');
        } else {
          this.statusText.setText('You are ready!\nWaiting for opponent...');
          // Add pulsing animation
          this.tweens.add({
            targets: this.statusText,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
          });
        }
      } else if (data.timeout) {
        // Timeout occurred, reset
        this.isReady = false;
        if (this.readyButton) {
          this.readyButton.setAlpha(1);
          this.readyButton.setInteractive();
        }
        this.statusText.setText('Ready timeout!\nPlease click Ready again.');
      }
    } catch (error) {
      console.error('[Lobby] Error sending ready:', error);
      this.isReady = false;
      if (this.readyButton) {
        this.readyButton.setAlpha(1);
        this.readyButton.setInteractive();
      }
      this.statusText.setText('Error sending ready signal.\nPlease try again.');
    }
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
    // Clean up when scene is destroyed (e.g., browser closed or scene changed)
    console.log('[Lobby] Shutdown called');
    if (this.pollTimer) {
      this.pollTimer.remove();
    }
    // CRITICAL: Always leave game on shutdown to clean up Redis keys
    if (this.gameId) {
      console.log(`[Lobby] Leaving game ${this.gameId} on shutdown`);
      void fetch(`/api/multiplayer/leave?gameId=${this.gameId}`, {
        method: 'POST',
      }).catch((err) => {
        console.error('[Lobby] Error leaving game on shutdown:', err);
      });
    }
  }
}