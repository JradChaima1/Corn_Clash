import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { ButtonFactory } from '../utils/ButtonFactory';

interface SoloGameOverData {
  score: number;
}

export class SoloGameOver extends Scene {
  private background!: Phaser.GameObjects.Image;
  private restartText!: Phaser.GameObjects.Text;

  constructor() {
    super('SoloGameOver');
  }

  create(data: SoloGameOverData) {
    const { width, height } = this.scale;

    // Background
    this.background = this.add.image(width / 2, height / 2, 'kitchen');
    this.background.setDisplaySize(width, height);
    this.background.setAlpha(0.5);

    // Semi-transparent overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Game Over text
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

    // Score
    this.add
      .text(width / 2, height * 0.45, `Final Score: ${data.score}`, {
        fontFamily: 'Arial Black',
        fontSize: '40px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5);

    // Restart button
    this.restartText = this.add
      .text(width / 2, height * 0.65, 'Play Again', {
        fontFamily: 'Arial Black',
        fontSize: '32px',
        color: '#00FF00',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });



    // Button interactions
    this.restartText
      .on('pointerover', () => {
        this.restartText.setScale(1.1);
      })
      .on('pointerout', () => {
        this.restartText.setScale(1);
      })
      .on('pointerdown', () => {
        this.scene.start('SoloGame');
      });



    // Blinking animation on restart text
    this.tweens.add({
      targets: this.restartText,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Main Menu button using ButtonFactory
    const mainMenuButton = ButtonFactory.createButton(
      this,
      width / 2,
      height * 0.88,
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
