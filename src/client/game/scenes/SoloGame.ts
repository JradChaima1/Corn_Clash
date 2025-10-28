import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { ButtonFactory } from '../utils/ButtonFactory';

export class SoloGame extends Scene {
  // Game state
  private gameTime: number = 60;
  private score: number = 0;
  private isGameActive: boolean = false;

  // UI elements
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;

  // Game objects
  private background!: Phaser.GameObjects.Image;
  private counter!: Phaser.GameObjects.Image;

  private pot!: Phaser.GameObjects.Image;



  private player!: Phaser.GameObjects.Image;
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

  constructor() {
    super('SoloGame');
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.background = this.add.image(width / 2, height / 2, 'kitchen');
    this.background.setDisplaySize(width, height);

    // Kitchen counter
    this.counter = this.add.image(width / 2, height - 50, 'counter');
    this.counter.setDisplaySize(width, 100);

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

    // Player (popcorn cup) - smaller size
    this.player = this.physics.add.image(width - 100, height - 120, 'cup');

    this.player.setDisplaySize(100, 100);

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setCollideWorldBounds(true);
    playerBody.setImmovable(false);
    playerBody.setAllowGravity(false);
    playerBody.setSize(this.player.width * 0.8, this.player.height * 0.6);

    // Add collision so the cup cannot pass through the pot
    this.physics.add.collider(this.player, this.pot);


    // Idle animation for player (subtle bounce)
    this.tweens.add({
      targets: this.player,
      y: height - 118,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Popcorn group with physics
    this.popcornGroup = this.physics.add.group({
      defaultKey: 'popcorn',
      maxSize: 50,
    });

    // Particle emitter for catch effects
    const particles = this.add.particles(0, 0, 'popcorn', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.15, end: 0 }, // Match popcorn size
      lifespan: 400,
      gravityY: 200,
      emitting: false,
    });
    this.catchParticles = particles;

    // UI - Timer (top center) in MM:SS format
    this.timerText = this.add
      .text(width / 2, 30, this.formatTime(this.gameTime), {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // UI - Score (top left)
    this.scoreText = this.add
      .text(20, 30, `Score: ${this.score}`, {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0, 0.5);

    // Setup controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Add mobile touch controls
    this.addMobileControls();

    // Collision detection
    this.physics.add.overlap(
      this.player,
      this.popcornGroup,
      this.catchPopcorn as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );



    // Main Menu button (top-right corner, smaller)
    const mainMenuButton = ButtonFactory.createButton(
      this,
      width - 80,
      30,
      'Menu',
      0x22c55e,
      0x16a34a,
      120
    );
    mainMenuButton.setInteractive(
      new Phaser.Geom.Rectangle(-60, -25, 120, 50),
      Phaser.Geom.Rectangle.Contains
    );
    mainMenuButton.setDepth(1000);

    ButtonFactory.addHoverEffect(this, mainMenuButton);
    ButtonFactory.addClickEffect(this, mainMenuButton, () => {
      // Pause game and return to main menu
      this.isGameActive = false;
      if (this.gameTimer) this.gameTimer.remove();
      if (this.popcornSpawnTimer) this.popcornSpawnTimer.remove();
      this.scene.start('MainMenu');
    });

    // Start game
    this.startGame();
  }

  private startGame(): void {
    this.isGameActive = true;
    this.gameTime = 60;
    this.score = 0;

    // Countdown timer (every second)
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Spawn popcorn with random intervals (0.8-1.2 seconds)
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
    this.gameTime--;
    this.timerText.setText(this.formatTime(this.gameTime));

    if (this.gameTime <= 0) {
      this.endGame();
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

    const { width } = this.scale;
    const potX = width / 2;
    const potY = this.scale.height - 120; // Match pot position

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

          // Subtle screen shake on launch
          this.cameras.main.shake(50, 0.002);

          // Destroy popcorn when off-screen
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
    popcornObj: Phaser.GameObjects.GameObject
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

    // Add score based on popcorn type
    this.score += popcornValue;
    // Prevent negative scores
    if (this.score < 0) this.score = 0;
    this.scoreText.setText(`Score: ${this.score}`);

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

    // Particle burst effect
    this.catchParticles.explode(8, popcornSprite.x, popcornSprite.y);

    // Brief flash effect with color based on popcorn type
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

  private endGame(): void {
    this.isGameActive = false;
    this.gameTimer.remove();
    if (this.popcornSpawnTimer) {
      this.popcornSpawnTimer.remove();
    }

    this.scene.start('SoloGameOver', {
      score: this.score,
    });
  }

  private touchLeft: boolean = false;
  private touchRight: boolean = false;

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

    // Player controls (A/D or Arrow keys or Touch)
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.keyA.isDown || this.cursors.left!.isDown || this.touchLeft) {
      playerBody.setVelocityX(-speed);
      if (this.player.x < 50) {
        this.player.x = 50;
      }
    } else if (this.keyD.isDown || this.cursors.right!.isDown || this.touchRight) {
      playerBody.setVelocityX(speed);
      if (this.player.x > width - 50) {
        this.player.x = width - 50;
      }
    } else {
      playerBody.setVelocityX(0);
    }
  }
}
