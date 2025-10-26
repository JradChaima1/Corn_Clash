import { Scene } from 'phaser';
import * as Phaser from 'phaser';

interface SoloGameOverData {
  score: number;
}

export class SoloGameOver extends Scene {
  private background!: Phaser.GameObjects.Image;
  private gameOverText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private restartText!: Phaser.GameObjects.Text;
  private menuText!: Phaser.GameObjects.Text;

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
    this.gameOverText = this.add
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
    this.scoreText = this.add
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

    // Menu button
    this.menuText = this.add
      .text(width / 2, height * 0.78, 'Main Menu', {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#FFFFFF',
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

    this.menuText
      .on('pointerover', () => {
        this.menuText.setScale(1.1);
      })
      .on('pointerout', () => {
        this.menuText.setScale(1);
      })
      .on('pointerdown', () => {
        this.scene.start('ModeSelect');
      });

    // Blinking animation on restart text
    this.tweens.add({
      targets: this.restartText,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }
}
