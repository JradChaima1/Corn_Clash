import { Scene, GameObjects } from 'phaser';
import { ButtonFactory } from '../utils/ButtonFactory';

export class ModeSelect extends Scene {
  private background!: GameObjects.Image;
  private soloButton!: GameObjects.Container;
  private multiplayerButton!: GameObjects.Container;

  constructor() {
    super('ModeSelect');
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.background = this.add.image(width / 2, height / 2, 'kitchen');
    this.background.setDisplaySize(width, height);
    this.background.setAlpha(0.7);



    // Solo Mode Button
    this.soloButton = ButtonFactory.createButton(
      this,
      width / 2,
      height * 0.45,
      'SOLO MODE',
      0xff6b6b,
      0xcc5555,
      260
    );
    this.soloButton.setInteractive(
      new Phaser.Geom.Rectangle(-130, -35, 260, 70),
      Phaser.Geom.Rectangle.Contains
    );

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
    this.multiplayerButton = ButtonFactory.createButton(
      this,
      width / 2,
      height * 0.65,
      'MULTIPLAYER',
      0x4ecdc4,
      0x3da39d,
      280
    );
    this.multiplayerButton.setInteractive(
      new Phaser.Geom.Rectangle(-140, -35, 280, 70),
      Phaser.Geom.Rectangle.Contains
    );

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

    // Add button effects
    ButtonFactory.addHoverEffect(this, this.soloButton);
    ButtonFactory.addHoverEffect(this, this.multiplayerButton);

    ButtonFactory.addClickEffect(this, this.soloButton, () => {
      this.scene.start('SoloGame');
    });

    ButtonFactory.addClickEffect(this, this.multiplayerButton, () => {
      this.scene.start('MultiplayerLobby');
    });

    // Floating animations
    ButtonFactory.addFloatingEffect(this, this.soloButton, height * 0.45, 1000);
    ButtonFactory.addFloatingEffect(this, this.multiplayerButton, height * 0.65, 1200);

    // Main Menu button (back to main menu)
    const mainMenuButton = ButtonFactory.createButton(
      this,
      width / 2,
      height * 0.9,
      'Main Menu',
      0x22c55e,
      0x16a34a,
      220
    );
    mainMenuButton.setInteractive(
      new Phaser.Geom.Rectangle(-110, -30, 220, 60),
      Phaser.Geom.Rectangle.Contains
    );

    ButtonFactory.addHoverEffect(this, mainMenuButton);
    ButtonFactory.addClickEffect(this, mainMenuButton, () => {
      this.scene.start('MainMenu');
    });
  }
}
