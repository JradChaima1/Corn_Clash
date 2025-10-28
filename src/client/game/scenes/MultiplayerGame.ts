import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { UpdatePositionRequest } from '../../../shared/types/api';

interface MultiplayerGameData {
  gameId: string;
  playerId: string;
  playerRole: string;
}

export class MultiplayerGame extends Scene {
  private gameId!: string;
  private playerRole!: string;

  // Game state
  private gameTime: number = 60;
  private player1Score: number = 0;
  private player2Score: number = 0;
  private isGameActive: boolean = false;

  // UI elements
  private timerText!: Phaser.GameObjects.Text;
  private player1ScoreText!: Phaser.GameObjects.Text;
  private player2ScoreText!: Phaser.GameObjects.Text;

  // Game objects
  private background!: Phaser.GameObjects.Image;
  private counter!: Phaser.GameObjects.Image;
  private pot!: Phaser.GameObjects.Image;
  private player1!: Phaser.GameObjects.Image;
  private player2!: Phaser.GameObjects.Image;
  private popcornGroup!: Phaser.Physics.Arcade.Group;

  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;

  // Timers
  private gameTimer!: Phaser.Time.TimerEvent;
  private popcornSpawnTimer!: Phaser.Time.TimerEvent;

  // Particles
  private catchParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Network sync
  private positionSyncDelay: number = 0;
  private lastSentPosition: number = 0;
  private positionFetchDelay: number = 0;
  private consecutiveFailedFetches: number = 0;

  // Mobile controls
  private touchLeft: boolean = false;
  private touchRight: boolean = false;

  constructor() {
    super('MultiplayerGame');
  }

  shutdown() {
    // Clean up intervals when scene is destroyed
    console.log('[MultiplayerGame] Shutdown called');
    if (this.waitingCheckInterval) {
      clearInterval(this.waitingCheckInterval);
      this.waitingCheckInterval = null;
    }

    // CRITICAL: Leave game on shutdown to clean up Redis keys
    if (this.gameId) {
      console.log(`[MultiplayerGame] Leaving game ${this.gameId} on shutdown`);
      void fetch(`/api/multiplayer/leave?gameId=${this.gameId}`, {
        method: 'POST',
      }).catch((err) => {
        console.error('[MultiplayerGame] Error leaving game on shutdown:', err);
      });
    }
  }

  create(data: MultiplayerGameData) {
    this.gameId = data.gameId;
    this.playerRole = data.playerRole;

    const { width, height } = this.scale;

    // Background
    this.background = this.add.image(width / 2, height / 2, 'kitchen');
    this.background.setDisplaySize(width, height);

    // Kitchen counter
    this.counter = this.add.image(width / 2, height - 50, 'counter');
    this.counter.setDisplaySize(width, 100);

    // Cooking pot on top of counter
    this.pot = this.physics.add.image(width / 2, height - 120, 'pot'); this.pot.setDisplaySize(300, 300); const potBody = this.pot.body as Phaser.Physics.Arcade.Body; potBody.setImmovable(true);
    // So it blocks other objects
    potBody.setAllowGravity(false);
    // So it doesn't fall
    potBody.setSize(this.pot.width * 0.9, this.pot.height * 0.6);
    potBody.setOffset(this.pot.width * 0.05, this.pot.height * 0.4);



    this.tweens.add({
      targets: this.pot,
      y: height - 125,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: this.pot,
      angle: -1,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });


    // Player 1 (left side)
    this.player1 = this.add.image(150, height - 120, 'cup');
    this.player1.setDisplaySize(100, 100); // Same as solo
    this.player1.setTint(0xff6b6b);
    this.physics.add.existing(this.player1);
    (this.player1.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    (this.player1.body as Phaser.Physics.Arcade.Body).setImmovable(false);
    (this.player1.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (this.player1.body as Phaser.Physics.Arcade.Body).setSize(
      this.player1.width * 0.8,
      this.player1.height * 0.6
    );
    this.physics.add.collider(this.player1, this.pot);
    // Player 2 (right side)
    this.player2 = this.add.image(width - 150, height - 120, 'cup');
    this.player2.setDisplaySize(100, 100); // Same as solo
    this.player2.setTint(0x4ecdc4);
    this.physics.add.existing(this.player2);
    (this.player2.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    (this.player2.body as Phaser.Physics.Arcade.Body).setImmovable(false);
    (this.player2.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (this.player2.body as Phaser.Physics.Arcade.Body).setSize(
      this.player2.width * 0.8,
      this.player2.height * 0.6
    );
    this.physics.add.collider(this.player2, this.pot);
    // Idle animations
    this.tweens.add({
      targets: this.player1,
      y: height - 118,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: this.player2,
      y: height - 118,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 400,
    });

    // Popcorn group
    this.popcornGroup = this.physics.add.group({
      defaultKey: 'popcorn',
      maxSize: 50,
    });

    // Particle emitter
    const particles = this.add.particles(0, 0, 'popcorn', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.15, end: 0 },
      lifespan: 400,
      gravityY: 200,
      emitting: false,
    });
    this.catchParticles = particles;

    // UI - Timer
    this.timerText = this.add
      .text(width / 2, 30, this.formatTime(this.gameTime), {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // UI - Player 1 Score
    this.player1ScoreText = this.add
      .text(20, 30, `P1: ${this.player1Score}`, {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#FF6B6B',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0, 0.5);

    // UI - Player 2 Score
    this.player2ScoreText = this.add
      .text(width - 20, 30, `P2: ${this.player2Score}`, {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#4ECDC4',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(1, 0.5);

    // Setup controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Add mobile touch controls
    this.addMobileControls();

    // Collision detection
    this.physics.add.overlap(
      this.player1,
      this.popcornGroup,
      (p, pop) => {
        if (p && pop) {
          this.catchPopcorn(
            p as Phaser.GameObjects.GameObject,
            pop as Phaser.GameObjects.GameObject,
            1
          );
        }
      },
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player2,
      this.popcornGroup,
      (p, pop) => {
        if (p && pop) {
          this.catchPopcorn(
            p as Phaser.GameObjects.GameObject,
            pop as Phaser.GameObjects.GameObject,
            2
          );
        }
      },
      undefined,
      this
    );



    // Don't start game yet - wait for both players
    this.waitForBothPlayers();
  }

  private gameStartTime: number = 0;

  private waitingCheckInterval: number | null = null;
  private waitingStartTime: number = 0;

  private async waitForBothPlayers(): Promise<void> {
    this.waitingStartTime = Date.now();
    const MAX_WAIT_TIME = 60000; // 60 seconds timeout

    // Show waiting message
    const waitingText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Waiting for opponent...', {
        fontFamily: 'Arial Black',
        fontSize: '32px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Poll until game status is 'playing'
    this.waitingCheckInterval = window.setInterval(async () => {
      try {
        // Check for timeout
        if (Date.now() - this.waitingStartTime > MAX_WAIT_TIME) {
          if (this.waitingCheckInterval) {
            clearInterval(this.waitingCheckInterval);
            this.waitingCheckInterval = null;
          }
          waitingText.setText('No opponent found.\nReturning to menu...');
          this.time.delayedCall(2000, () => {
            this.scene.start('ModeSelect');
          });
          return;
        }

        const response = await fetch(`/api/multiplayer/state?gameId=${this.gameId}`);
        if (response.ok) {
          const data = await response.json();
          // CRITICAL: Only start if status is 'playing' AND both players exist
          if (
            data.success &&
            data.gameState &&
            data.gameState.status === 'playing' &&
            data.gameState.player1Id !== null &&
            data.gameState.player2Id !== null
          ) {
            if (this.waitingCheckInterval) {
              clearInterval(this.waitingCheckInterval);
              this.waitingCheckInterval = null;
            }
            waitingText.destroy();
            // Use server's start time for synchronization
            this.gameStartTime = data.gameState.startTime || Date.now();
            void this.startGame();
          }
        } else {
          // Server error - stop waiting
          if (this.waitingCheckInterval) {
            clearInterval(this.waitingCheckInterval);
            this.waitingCheckInterval = null;
          }
          waitingText.setText('Connection lost.\nReturning to menu...');
          this.time.delayedCall(2000, () => {
            this.scene.start('ModeSelect');
          });
        }
      } catch (error) {
        console.error('Error checking game status:', error);
        // Connection error - stop waiting
        if (this.waitingCheckInterval) {
          clearInterval(this.waitingCheckInterval);
          this.waitingCheckInterval = null;
        }
        waitingText.setText('Connection lost.\nReturning to menu...');
        this.time.delayedCall(2000, () => {
          this.scene.start('ModeSelect');
        });
      }
    }, 500); // Check every 500ms
  }

  private async startGame(): Promise<void> {
    console.log('[MultiplayerGame] Starting game - verifying both players...');

    // CRITICAL: Double-check that both players are actually present before starting
    try {
      const response = await fetch(`/api/multiplayer/state?gameId=${this.gameId}`);
      if (!response.ok) {
        console.error('[MultiplayerGame] Cannot verify game state, returning to menu');
        this.scene.start('ModeSelect');
        return;
      }

      const data = await response.json();
      if (
        !data.success ||
        !data.gameState ||
        data.gameState.player1Id === null ||
        data.gameState.player2Id === null
      ) {
        console.error('[MultiplayerGame] Both players not present, returning to menu');
        this.scene.start('ModeSelect');
        return;
      }

      console.log('[MultiplayerGame] Both players verified! Starting game...');
    } catch (error) {
      console.error('[MultiplayerGame] Error verifying players:', error);
      this.scene.start('ModeSelect');
      return;
    }

    this.isGameActive = true;

    // Calculate time remaining based on server start time
    const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
    this.gameTime = Math.max(0, 60 - elapsed);

    // Reset scores to 0
    this.player1Score = 0;
    this.player2Score = 0;

    // Update UI to show 0-0 scores
    this.player1ScoreText.setText(`P1: ${this.player1Score}`);
    this.player2ScoreText.setText(`P2: ${this.player2Score}`);

    // Update timer display immediately
    this.timerText.setText(this.formatTime(this.gameTime));

    // Countdown timer
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Spawn popcorn with random intervals
    this.scheduleNextPopcorn();
  }

  private scheduleNextPopcorn(): void {
    if (!this.isGameActive) return;

    // Faster spawn rate for more fun (400-700ms instead of 800-1200ms)
    const delay = Phaser.Math.Between(400, 700);
    this.popcornSpawnTimer = this.time.addEvent({
      delay,
      callback: () => {
        this.spawnPopcorn();
        this.scheduleNextPopcorn();
      },
      callbackScope: this,
    });
  }

  private updateTimer(): void {
    // Calculate time based on server start time for accuracy
    if (this.gameStartTime > 0) {
      const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
      this.gameTime = Math.max(0, 60 - elapsed);
    } else {
      // Fallback to local countdown
      this.gameTime--;
    }

    this.timerText.setText(this.formatTime(this.gameTime));

    if (this.gameTime <= 0) {
      console.log('[MultiplayerGame] Time is up! Ending game...');
      this.endGame().catch((err) => console.error('Error ending game:', err));
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private spawnChaosPopcorn(): void {
    if (!this.isGameActive) return;

    const { width } = this.scale;
    // Spawn from random side (left or right edge)
    const spawnFromLeft = Math.random() < 0.5;
    const spawnX = spawnFromLeft ? 50 : width - 50;
    const spawnY = 100; // Top of screen

    const popcorn = this.popcornGroup.get(spawnX, spawnY, 'popcorn') as Phaser.Physics.Arcade.Sprite;

    if (popcorn) {
      popcorn.setActive(true);
      popcorn.setVisible(true);
      popcorn.setDisplaySize(40, 40);

      // Chaos popcorn is always normal (white)
      popcorn.clearTint();
      popcorn.setData('value', 1);
      popcorn.setData('type', 'normal');

      // Launch toward center with high speed
      const horizontalSpeed = Phaser.Math.Between(200, 350);
      const horizontalDirection = spawnFromLeft ? 1 : -1;
      const verticalSpeed = Phaser.Math.Between(100, 300);

      popcorn.setVelocity(horizontalSpeed * horizontalDirection, verticalSpeed);
      popcorn.setAngularVelocity(Phaser.Math.Between(-300, 300));
      popcorn.setBounce(0.3);
      popcorn.setCollideWorldBounds(false);

      // Destroy when off-screen
      const checkOffScreen = this.time.addEvent({
        delay: 100,
        callback: () => {
          if (
            popcorn.active &&
            (popcorn.y > this.scale.height + 50 ||
              popcorn.x < -50 ||
              popcorn.x > this.scale.width + 50)
          ) {
            popcorn.setActive(false);
            popcorn.setVisible(false);
            checkOffScreen.remove();
          }
        },
        loop: true,
      });
    }
  }

  private spawnPopcorn(): void {
    if (!this.isGameActive) return;

    const { width, height } = this.scale;
    const potX = width / 2;
    const potY = height - 120;

    // Spawn 2-3 popcorn pieces at once for more excitement
    const spawnCount = Phaser.Math.Between(2, 3);

    for (let i = 0; i < spawnCount; i++) {
      // Slight delay between spawns for visual effect
      this.time.delayedCall(i * 50, () => {
        const popcorn = this.popcornGroup.get(potX, potY, 'popcorn') as Phaser.Physics.Arcade.Sprite;

        if (popcorn) {
          popcorn.setActive(true);
          popcorn.setVisible(true);
          popcorn.setDisplaySize(40, 40);

          // Determine popcorn type: 70% normal (white), 20% red (-10 penalty), 10% blue (+20)
          const rand = Math.random();
          let popcornType: 'normal' | 'red' | 'blue';
          let popcornValue: number;

          if (rand < 0.7) {
            popcornType = 'normal';
            popcornValue = 1;
            popcorn.clearTint();
          } else if (rand < 0.9) {
            popcornType = 'red';
            popcornValue = -10; // PENALTY: Red popcorn now subtracts points
            popcorn.setTint(0xff0000); // Red tint
          } else {
            popcornType = 'blue';
            popcornValue = 20;
            popcorn.setTint(0x0088ff); // Blue tint
          }

          // Store the value in the popcorn's data
          popcorn.setData('value', popcornValue);
          popcorn.setData('type', popcornType);

          // Random launch velocity with wider spread
          const horizontalSpeed = Phaser.Math.Between(150, 300);
          const horizontalDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
          const verticalSpeed = Phaser.Math.Between(-450, -300);

          popcorn.setVelocity(horizontalSpeed * horizontalDirection, verticalSpeed);
          popcorn.setAngularVelocity(Phaser.Math.Between(-200, 200));
          popcorn.setBounce(0.3);
          popcorn.setCollideWorldBounds(false);

          // Screen shake
          this.cameras.main.shake(50, 0.002);

          // Destroy when off-screen
          const checkOffScreen = this.time.addEvent({
            delay: 100,
            callback: () => {
              if (
                popcorn.active &&
                (popcorn.y > this.scale.height + 50 ||
                  popcorn.x < -50 ||
                  popcorn.x > this.scale.width + 50)
              ) {
                popcorn.setActive(false);
                popcorn.setVisible(false);
                checkOffScreen.remove();
              }
            },
            loop: true,
          });
        }
      });
    }
  }

  private catchPopcorn(
    _playerObj: Phaser.GameObjects.GameObject,
    popcornObj: Phaser.GameObjects.GameObject,
    playerNum: number
  ): void {
    const popcornSprite = popcornObj as Phaser.Physics.Arcade.Sprite;

    // Check if already caught (prevent multiple triggers)
    if (!popcornSprite.active) {
      return;
    }

    // Get the popcorn value and type
    const popcornValue = popcornSprite.getData('value') || 1;
    const popcornType = popcornSprite.getData('type') || 'normal';

    // Immediately deactivate to prevent multiple collisions
    popcornSprite.setActive(false);
    popcornSprite.setVisible(false);

    // Only count score if it's MY player catching
    const isMyPlayer =
      (playerNum === 1 && this.playerRole === 'player1') ||
      (playerNum === 2 && this.playerRole === 'player2');

    if (!isMyPlayer) {
      // Not my player, ignore this catch
      return;
    }

    // Update score locally and send to server
    if (playerNum === 1) {
      this.player1Score += popcornValue;
      // Prevent negative scores
      if (this.player1Score < 0) this.player1Score = 0;
      this.player1ScoreText.setText(`P1: ${this.player1Score}`);
      console.log(`[MultiplayerGame] P1 caught ${popcornType} popcorn (${popcornValue > 0 ? '+' : ''}${popcornValue}), score now: ${this.player1Score}`);
      void this.sendScore(this.player1Score);
    } else {
      this.player2Score += popcornValue;
      // Prevent negative scores
      if (this.player2Score < 0) this.player2Score = 0;
      this.player2ScoreText.setText(`P2: ${this.player2Score}`);
      console.log(`[MultiplayerGame] P2 caught ${popcornType} popcorn (${popcornValue > 0 ? '+' : ''}${popcornValue}), score now: ${this.player2Score}`);
      void this.sendScore(this.player2Score);
    }

    // Red popcorn penalty: spawn extra popcorn chaos!
    if (popcornType === 'red') {
      // Spawn 5 extra popcorn pieces from both sides
      for (let i = 0; i < 5; i++) {
        this.time.delayedCall(i * 100, () => {
          this.spawnChaosPopcorn();
        });
      }
    }

    // Show score popup for special popcorn
    if (popcornType !== 'normal') {
      const scorePopup = this.add
        .text(popcornSprite.x, popcornSprite.y, popcornValue > 0 ? `+${popcornValue}` : `${popcornValue}`, {
          fontFamily: 'Arial Black',
          fontSize: '32px',
          color: popcornType === 'red' ? '#ff0000' : '#0088ff',
          stroke: '#000000',
          strokeThickness: 4,
        })
        .setOrigin(0.5);

      this.tweens.add({
        targets: scorePopup,
        y: popcornSprite.y - 50,
        alpha: 0,
        duration: 800,
        onComplete: () => scorePopup.destroy(),
      });
    }

    // Particle burst
    this.catchParticles.explode(8, popcornSprite.x, popcornSprite.y);

    // Flash effect with color based on popcorn type
    const flashColor =
      popcornType === 'red' ? 0xff0000 : popcornType === 'blue' ? 0x0088ff : 0xffff00;
    const flash = this.add.circle(popcornSprite.x, popcornSprite.y, 20, flashColor, 0.6);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }

  private async endGame(): Promise<void> {
    // Prevent multiple calls
    if (!this.isGameActive) {
      console.log('[MultiplayerGame] endGame already called, ignoring');
      return;
    }

    console.log('[MultiplayerGame] endGame called');
    this.isGameActive = false;

    // Stop all timers
    if (this.gameTimer) {
      this.gameTimer.remove();
    }
    if (this.popcornSpawnTimer) {
      this.popcornSpawnTimer.remove();
    }

    // Show loading UI
    const loadingBg = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.7
    );
    loadingBg.setDepth(2000);

    const loadingText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Calculating final scores...', {
        fontFamily: 'Arial Black',
        fontSize: '32px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(2001);

    // Animated dots
    let dotCount = 0;
    const dotAnimation = this.time.addEvent({
      delay: 500,
      callback: () => {
        dotCount = (dotCount + 1) % 4;
        const dots = '.'.repeat(dotCount);
        loadingText.setText(`Calculating final scores${dots}`);
      },
      loop: true,
    });

    // CRITICAL: Send final score update FIRST before fetching
    console.log('[MultiplayerGame] Sending final score update...');
    try {
      await fetch(`/api/multiplayer/score?gameId=${this.gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: this.playerRole === 'player1' ? this.player1Score : this.player2Score }),
      });
      console.log(`[MultiplayerGame] Final score sent: ${this.playerRole === 'player1' ? this.player1Score : this.player2Score}`);
    } catch (error) {
      console.error('[MultiplayerGame] Error sending final score:', error);
    }

    // Wait 1.5 seconds to ensure BOTH players' final scores reach the server
    console.log('[MultiplayerGame] Waiting for all scores to sync...');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Fetch final scores from server - this is the authoritative source
    let finalP1Score = 0;
    let finalP2Score = 0;

    try {
      console.log('[MultiplayerGame] Fetching authoritative final scores from server...');
      const response = await fetch(`/api/multiplayer/state?gameId=${this.gameId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.gameState) {
          // Use server scores as the ONLY source of truth
          finalP1Score = data.gameState.player1Score;
          finalP2Score = data.gameState.player2Score;
          console.log(
            `[MultiplayerGame] Server authoritative scores: P1=${finalP1Score}, P2=${finalP2Score}`
          );
        } else {
          console.warn('[MultiplayerGame] Game state not found, using local scores');
          finalP1Score = this.player1Score;
          finalP2Score = this.player2Score;
        }
      } else {
        console.warn('[MultiplayerGame] Failed to fetch game state, using local scores');
        finalP1Score = this.player1Score;
        finalP2Score = this.player2Score;
      }
    } catch (error) {
      console.error('Error fetching final scores:', error);
      // Fallback to local scores if server fetch fails
      finalP1Score = this.player1Score;
      finalP2Score = this.player2Score;
    }

    this.player1Score = finalP1Score;
    this.player2Score = finalP2Score;
    console.log(`[MultiplayerGame] Final scores: P1=${this.player1Score}, P2=${this.player2Score}`);

    const winner =
      this.player1Score > this.player2Score
        ? 'Player 1'
        : this.player2Score > this.player1Score
          ? 'Player 2'
          : 'Tie';

    console.log(`[MultiplayerGame] Winner: ${winner}, starting GameOver scene`);

    // DON'T clean up game immediately - let it expire naturally
    // This ensures both players can fetch final scores
    // The game will be cleaned up by TTL (2 minutes) or when players leave
    console.log(`[MultiplayerGame] Leaving game cleanup to TTL or player leave`)

    // Stop loading animation
    if (dotAnimation) {
      dotAnimation.remove();
    }

    this.scene.start('MultiplayerGameOver', {
      winner,
      player1Score: this.player1Score,
      player2Score: this.player2Score,
      gameId: this.gameId,
      reason: 'completed',
    });
  }

  private async sendPosition(position: number): Promise<void> {
    try {
      const body: UpdatePositionRequest = { position };
      await fetch(`/api/multiplayer/position?gameId=${this.gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      // Silently fail - position sync is not critical
    }
  }

  private async sendScore(score: number): Promise<void> {
    try {
      const response = await fetch(`/api/multiplayer/score?gameId=${this.gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });

      if (response.ok) {
        console.log(`[MultiplayerGame] Score sent successfully: ${score}`);
      }
    } catch (error) {
      console.error('[MultiplayerGame] Failed to send score:', error);
    }
  }

  private async fetchOpponentPosition(): Promise<void> {
    try {
      const response = await fetch(`/api/multiplayer/state?gameId=${this.gameId}`);
      if (!response.ok) {
        this.consecutiveFailedFetches++;
        // If opponent disconnected (3 failed fetches = ~0.5 seconds)
        if (this.consecutiveFailedFetches >= 3 && this.isGameActive) {
          console.log('[MultiplayerGame] Opponent disconnected, showing message...');
          this.handleDisconnect();
        }
        return;
      }

      this.consecutiveFailedFetches = 0; // Reset on successful fetch

      const data = await response.json();
      if (data.success && data.gameState) {
        // Check for server-detected disconnect
        if (data.disconnected && this.isGameActive) {
          console.log('[MultiplayerGame] Server detected disconnect:', data.disconnectedPlayerId);
          this.handleDisconnect();
          return;
        }

        // CRITICAL: Verify both players exist - if not, game shouldn't have started
        if (data.gameState.player1Id === null || data.gameState.player2Id === null) {
          console.error(
            '[MultiplayerGame] Game started without both players! P1:',
            data.gameState.player1Id,
            'P2:',
            data.gameState.player2Id
          );
          if (this.isGameActive) {
            this.isGameActive = false;
            this.scene.start('ModeSelect');
          }
          return;
        }

        // CRITICAL: Only update opponent if they actually exist
        const opponentExists =
          this.playerRole === 'player1'
            ? data.gameState.player2Id !== null
            : data.gameState.player1Id !== null;

        if (!opponentExists) {
          console.log('[MultiplayerGame] Opponent does not exist, not updating position');
          return;
        }

        // Update opponent's position with smooth interpolation
        const opponentPlayer = this.playerRole === 'player1' ? this.player2 : this.player1;
        const targetX =
          this.playerRole === 'player1'
            ? data.gameState.player2Position
            : data.gameState.player1Position;

        // Smooth interpolation instead of instant jump (longer duration for less frequent updates)
        this.tweens.add({
          targets: opponentPlayer,
          x: targetX,
          duration: 150,
          ease: 'Linear',
        });

        // Update scores from server (only if server score is higher to prevent decrements)
        if (data.gameState.player1Score > this.player1Score) {
          this.player1Score = data.gameState.player1Score;
          this.player1ScoreText.setText(`P1: ${this.player1Score}`);
        }
        if (data.gameState.player2Score > this.player2Score) {
          this.player2Score = data.gameState.player2Score;
          this.player2ScoreText.setText(`P2: ${this.player2Score}`);
        }
      }
    } catch (error) {
      this.consecutiveFailedFetches++;
      // If opponent disconnected (3 failed fetches = ~0.5 seconds)
      if (this.consecutiveFailedFetches >= 3 && this.isGameActive) {
        console.log('[MultiplayerGame] Opponent disconnected (error), showing message...');
        this.handleDisconnect();
      }
    }
  }

  private handleDisconnect(): void {
    if (!this.isGameActive) return;

    this.isGameActive = false;

    // Stop all timers
    if (this.gameTimer) {
      this.gameTimer.remove();
    }
    if (this.popcornSpawnTimer) {
      this.popcornSpawnTimer.remove();
    }

    // Show disconnect message
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'OPPONENT LEFT\n\nReturning to menu...', {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: '#FF6B6B',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1000);

    // Clean up game from server
    fetch(`/api/multiplayer/end?gameId=${this.gameId}`, {
      method: 'POST',
    }).catch((error) => {
      console.error('[MultiplayerGame] Failed to clean up game after disconnect:', error);
    });

    // Return to menu after 3 seconds
    this.time.delayedCall(3000, () => {
      this.scene.start('MultiplayerGameOver', {
        winner: 'Disconnect',
        player1Score: this.player1Score,
        player2Score: this.player2Score,
        reason: 'disconnect',
        gameId: this.gameId,
      });
    });
  }

  private addMobileControls(): void {
    const { width, height } = this.scale;
    const buttonSize = 80;
    const buttonY = height - 150;

    // Left button
    const leftButton = this.add.circle(100, buttonY, buttonSize / 2, 0x000000, 0.3);
    leftButton.setStrokeStyle(4, 0xffffff);
    leftButton.setInteractive();
    leftButton.setScrollFactor(0);
    leftButton.setDepth(1000);

    const leftText = this.add
      .text(100, buttonY, '◄', {
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    leftText.setScrollFactor(0);
    leftText.setDepth(1001);

    leftButton.on('pointerdown', () => {
      this.touchLeft = true;
    });
    leftButton.on('pointerup', () => {
      this.touchLeft = false;
    });
    leftButton.on('pointerout', () => {
      this.touchLeft = false;
    });

    // Right button
    const rightButton = this.add.circle(width - 100, buttonY, buttonSize / 2, 0x000000, 0.3);
    rightButton.setStrokeStyle(4, 0xffffff);
    rightButton.setInteractive();
    rightButton.setScrollFactor(0);
    rightButton.setDepth(1000);

    const rightText = this.add
      .text(width - 100, buttonY, '►', {
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    rightText.setScrollFactor(0);
    rightText.setDepth(1001);

    rightButton.on('pointerdown', () => {
      this.touchRight = true;
    });
    rightButton.on('pointerup', () => {
      this.touchRight = false;
    });
    rightButton.on('pointerout', () => {
      this.touchRight = false;
    });
  }

  override update(): void {
    if (!this.isGameActive) return;

    const speed = 300;
    const { width } = this.scale;

    // Determine which player this client controls
    const myPlayer = this.playerRole === 'player1' ? this.player1 : this.player2;
    const myPlayerBody = myPlayer.body as Phaser.Physics.Arcade.Body;
    const minX = this.playerRole === 'player1' ? 50 : width / 2 + 50;
    const maxX = this.playerRole === 'player1' ? width / 2 - 50 : width - 50;

    // Handle input for MY player only (keyboard or touch)
    if (this.keyA.isDown || this.cursors.left!.isDown || this.touchLeft) {
      myPlayerBody.setVelocityX(-speed);
      if (myPlayer.x < minX) {
        myPlayer.x = minX;
      }
    } else if (this.keyD.isDown || this.cursors.right!.isDown || this.touchRight) {
      myPlayerBody.setVelocityX(speed);
      if (myPlayer.x > maxX) {
        myPlayer.x = maxX;
      }
    } else {
      myPlayerBody.setVelocityX(0);
    }

    // Send position update to server (throttled)
    this.positionSyncDelay++;
    if (this.positionSyncDelay >= 10 && Math.abs(myPlayer.x - this.lastSentPosition) > 2) {
      this.lastSentPosition = myPlayer.x;
      this.positionSyncDelay = 0;
      void this.sendPosition(myPlayer.x);
    }

    // Fetch opponent's position (throttled) - every 10 frames (~166ms) to reduce server load
    this.positionFetchDelay++;
    if (this.positionFetchDelay >= 10) {
      this.positionFetchDelay = 0;
      void this.fetchOpponentPosition();
    }
  }
}