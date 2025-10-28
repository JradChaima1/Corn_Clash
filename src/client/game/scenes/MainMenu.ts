import { Scene, GameObjects } from 'phaser';
import { ButtonFactory } from '../utils/ButtonFactory';
import { AudioManager } from '../utils/AudioManager';

export class MainMenu extends Scene {
  background: GameObjects.Image | null = null;
  title: GameObjects.Text | null = null;
  instructions: GameObjects.Text | null = null;
  playButton: GameObjects.Container | null = null;
  howToPlayButton: GameObjects.Container | null = null;

  constructor() {
    super('MainMenu');
  }

  init(): void {
    this.background = null;
    this.title = null;
    this.instructions = null;
    this.playButton = null;
    this.howToPlayButton = null;
  }

  create() {
    const { width, height } = this.scale;

    // Initialize AudioManager and start menu music
    AudioManager.getInstance().init(this);
    AudioManager.getInstance().playMusic('menu_music', 0.3);

    // Background
    this.background = this.add.image(width / 2, height / 2, 'mainmenubg');
    this.background.setDisplaySize(width, height);

    // Create menu buttons
    this.createMenuButtons();
  }

  private createMenuButtons(): void {
    const { width, height } = this.scale;

    // Title
    this.title = this.add
      .text(width / 2, height * 0.25, '', {
        fontFamily: 'Arial Black',
        fontSize: '56px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 10,
        align: 'center',
      })
      .setOrigin(0.5);

    // Create Play button
    this.playButton = ButtonFactory.createButton(
      this,
      width / 2,
      height * 0.65,
      'Play',
      0x2563eb,
      0x1e40af,
      200
    );
    this.playButton.setInteractive(
      new Phaser.Geom.Rectangle(-100, -30, 200, 60),
      Phaser.Geom.Rectangle.Contains
    );

    // Create How to Play button
    this.howToPlayButton = ButtonFactory.createButton(
      this,
      width / 2,
      height * 0.8,
      'How to Play',
      0xdc2626,
      0x991b1b,
      240
    );
    this.howToPlayButton.setInteractive(
      new Phaser.Geom.Rectangle(-120, -30, 240, 60),
      Phaser.Geom.Rectangle.Contains
    );

    // Add button effects
    ButtonFactory.addHoverEffect(this, this.playButton);
    ButtonFactory.addHoverEffect(this, this.howToPlayButton);

    ButtonFactory.addClickEffect(this, this.playButton, () => {
      this.scene.start('ModeSelect');
    });

    ButtonFactory.addClickEffect(this, this.howToPlayButton, () => {
      this.scene.start('HowToPlay');
    });

    // Floating animations
    ButtonFactory.addFloatingEffect(this, this.playButton, height * 0.65, 1000);
    ButtonFactory.addFloatingEffect(this, this.howToPlayButton, height * 0.8, 1200);
  }
}
