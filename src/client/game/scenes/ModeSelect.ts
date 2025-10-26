import { Scene, GameObjects } from 'phaser';

export class ModeSelect extends Scene {
  private background!: GameObjects.Image;
  private title!: GameObjects.Text;
  private soloButton!: GameObjects.Text;
  private multiplayerButton!: GameObjects.Text;

  constructor() {
    super('ModeSelect');
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.background = this.add.image(width / 2, height / 2, 'kitchen');
    this.background.setDisplaySize(width, height);
    this.background.setAlpha(0.7);

    // Title
    this.title = this.add
      .text(width / 2, height * 0.2, 'POPCORN CATCH!', {
        fontFamily: 'Arial Black',
        fontSize: '56px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 10,
        align: 'center',
      })
      .setOrigin(0.5);

    // Solo Mode Button
    this.soloButton = this.add
      .text(width / 2, height * 0.45, 'SOLO MODE', {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: '#FFFFFF',
        backgroundColor: '#FF6B6B',
        stroke: '#000000',
        strokeThickness: 6,
        padding: { x: 40, y: 20 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Solo description
    this.add
      .text(width / 2, height * 0.53, 'Play alone and beat your high score!', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5);

    // Multiplayer Mode Button
    this.multiplayerButton = this.add
      .text(width / 2, height * 0.65, 'MULTIPLAYER', {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: '#FFFFFF',
        backgroundColor: '#4ECDC4',
        stroke: '#000000',
        strokeThickness: 6,
        padding: { x: 40, y: 20 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Multiplayer description
    this.add
      .text(width / 2, height * 0.73, 'Compete against another player online!', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5);

    // Button hover effects
    this.soloButton
      .on('pointerover', () => {
        this.soloButton.setScale(1.05);
      })
      .on('pointerout', () => {
        this.soloButton.setScale(1);
      })
      .on('pointerdown', () => {
        this.scene.start('SoloGame');
      });

    this.multiplayerButton
      .on('pointerover', () => {
        this.multiplayerButton.setScale(1.05);
      })
      .on('pointerout', () => {
        this.multiplayerButton.setScale(1);
      })
      .on('pointerdown', () => {
        this.scene.start('MultiplayerLobby');
      });
  }
}
