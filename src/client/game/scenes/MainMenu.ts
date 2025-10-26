import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene {
  background: GameObjects.Image | null = null;
  title: GameObjects.Text | null = null;
  instructions: GameObjects.Text | null = null;
  startText: GameObjects.Text | null = null;

  constructor() {
    super('MainMenu');
  }

  init(): void {
    this.background = null;
    this.title = null;
    this.instructions = null;
    this.startText = null;
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.background = this.add.image(width / 2, height / 2, 'kitchen');
    this.background.setDisplaySize(width, height);

    // Title
    this.title = this.add
      .text(width / 2, height * 0.25, 'POPCORN CATCH!', {
        fontFamily: 'Arial Black',
        fontSize: '56px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 10,
        align: 'center',
      })
      .setOrigin(0.5);

    // Instructions
    this.instructions = this.add
      .text(
        width / 2,
        height * 0.5,
        'Player 1: A/D to move\nPlayer 2: Arrow Keys to move\n\nCatch the popcorn!\n60 seconds - Most popcorn wins!',
        {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 6,
          align: 'center',
        }
      )
      .setOrigin(0.5);

    // Start text
    this.startText = this.add
      .text(width / 2, height * 0.8, 'Click to Start!', {
        fontFamily: 'Arial Black',
        fontSize: '32px',
        color: '#00FF00',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5);

    // Blinking animation
    this.tweens.add({
      targets: this.startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.once('pointerdown', () => {
      this.scene.start('ModeSelect');
    });
  }
}
