import { Scene } from 'phaser';
import { AudioManager } from '../utils/AudioManager';
import { ButtonFactory } from '../utils/ButtonFactory';

export class HowToPlay extends Scene {
  constructor() {
    super('HowToPlay');
  }

  create() {
    const { width, height } = this.scale;

    // Ensure menu music is playing
    AudioManager.getInstance().init(this);
    AudioManager.getInstance().playMusic('menu_music', 0.3);

    // Background
    const background = this.add.image(width / 2, height / 2, 'kitchen');
    background.setDisplaySize(width, height);
    background.setAlpha(0.5);

    // Dark overlay for better text readability
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

    // Title
    this.add
      .text(width / 2, 50, 'HOW TO PLAY', {
        fontFamily: 'Arial Black',
        fontSize: '48px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5);

    // Game Objective
    this.add
      .text(width / 2, 120, 'OBJECTIVE', {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 155, 'Catch flying popcorn with your cup!\nAvoid the red popcorn - it\'s a penalty!', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
      })
      .setOrigin(0.5);

    // Controls Section
    this.add
      .text(width / 2, 220, 'CONTROLS', {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Keyboard controls
    this.add
      .text(80, 265, '🖥️ KEYBOARD:', {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: '#4ECDC4',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5);

    this.add
      .text(100, 295, '← → Arrow Keys  or  A / D Keys', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5);

    // Mobile controls
    this.add
      .text(80, 335, '📱 MOBILE:', {
        fontFamily: 'Arial Black',
        fontSize: '20px',
        color: '#4ECDC4',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5);

    this.add
      .text(100, 365, 'Tap ◄ and ► buttons at bottom of screen', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5);

    // Scoring Section
    this.add
      .text(width / 2, 420, 'SCORING', {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Normal popcorn
    this.add.circle(100, 465, 15, 0xFFFFFF);
    this.add
      .text(130, 465, 'White Popcorn = +1 point', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5);

    // Red popcorn (penalty)
    this.add.circle(100, 495, 15, 0xFF0000);
    this.add
      .text(130, 495, 'Red Popcorn = -10 points + Extra Chaos!', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#FF6B6B',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5);

    // Blue popcorn
    this.add.circle(100, 525, 15, 0x0088FF);
    this.add
      .text(130, 525, 'Blue Popcorn = +20 points', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#4ECDC4',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5);

    // Back to Main Menu button
    const backButton = ButtonFactory.createButton(
      this,
      width / 2,
      height - 40,
      'Main Menu',
      0x22c55e,
      0x16a34a,
      280
    );
    backButton.setInteractive(
      new Phaser.Geom.Rectangle(-140, -30, 280, 60),
      Phaser.Geom.Rectangle.Contains
    );

    ButtonFactory.addHoverEffect(this, backButton);
    ButtonFactory.addClickEffect(this, backButton, () => {
      this.scene.start('MainMenu');
    });
  }
}
