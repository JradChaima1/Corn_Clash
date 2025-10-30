import { Scene } from 'phaser';
import { ButtonFactory } from '../utils/ButtonFactory';

interface ChallengeData {
  currentMatches: number;
  goalMatches: number;
  isCompleted: boolean;
  contributorCount: number;
  userContributed: boolean;
}

export class Challenge extends Scene {
  private challengeData: ChallengeData | null = null;
  private loadingText!: Phaser.GameObjects.Text;

  constructor() {
    super('Challenge');
  }

  create() {
    const { width, height } = this.scale;

    // Background
    const background = this.add.image(width / 2, height / 2, 'kitchen');
    background.setDisplaySize(width, height);
    background.setAlpha(0.3);

    // Dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Title
    this.add
      .text(width / 2, 50, '🎯 DAILY CHALLENGE', {
        fontFamily: 'Arial Black',
        fontSize: '48px',
        color: '#60A5FA',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    // Loading text
    this.loadingText = this.add
      .text(width / 2, height / 2, 'Loading challenge...', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#FFFFFF',
      })
      .setOrigin(0.5);

    // Back button
    const backButton = ButtonFactory.createButton(
      this,
      width / 2,
      height - 50,
      'Back',
      0xdc2626,
      0x991b1b,
      200
    );
    backButton.setInteractive(
      new Phaser.Geom.Rectangle(
        -100,
        -30,
        200,
        60
      ) as unknown as Phaser.Types.Input.InputConfiguration,
      Phaser.Geom.Rectangle.Contains
    );
    ButtonFactory.addHoverEffect(this, backButton);
    ButtonFactory.addClickEffect(this, backButton, () => {
      this.scene.start('ModeSelect');
    });

    // Load challenge data
    this.loadChallenge();
  }

  private async loadChallenge(): Promise<void> {
    try {
      const response = await fetch('/api/challenge/status');
      const result = await response.json();

      if (result.success && result.data) {
        this.challengeData = result.data;
        this.loadingText.setVisible(false);
        this.displayChallenge();
      } else {
        this.showError('Failed to load challenge');
      }
    } catch (error) {
      console.error('Error loading challenge:', error);
      this.showError('Error loading challenge');
    }
  }

  private displayChallenge(): void {
    if (!this.challengeData) return;

    const { width, height } = this.scale;

    // Main challenge panel
    const panelY = height * 0.35;
    const panelHeight = 200;
    const panel = this.add.rectangle(
      width / 2,
      panelY,
      width - 100,
      panelHeight,
      0x1e3a8a,
      0.95
    );
    panel.setStrokeStyle(4, this.challengeData.isCompleted ? 0x10b981 : 0x3b82f6);

    // Challenge description
    this.add
      .text(width / 2, panelY - 75, 'COMMUNITY GOAL', {
        fontFamily: 'Arial Black',
        fontSize: '24px',
        color: '#FFFFFF',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        panelY - 40,
        `Complete ${this.challengeData.goalMatches} matches together!`,
        {
          fontFamily: 'Arial',
          fontSize: '20px',
          color: '#9CA3AF',
        }
      )
      .setOrigin(0.5);

    // Progress bar background
    const barWidth = width - 200;
    const barHeight = 30;
    const barBg = this.add.rectangle(width / 2, panelY, barWidth, barHeight, 0x1f2937);
    barBg.setStrokeStyle(3, 0x374151);

    // Progress bar fill
    const progress = Math.min(
      this.challengeData.currentMatches / this.challengeData.goalMatches,
      1
    );
    const fillWidth = barWidth * progress;
    this.add.rectangle(
      width / 2 - barWidth / 2 + fillWidth / 2,
      panelY,
      fillWidth,
      barHeight,
      this.challengeData.isCompleted ? 0x10b981 : 0x3b82f6
    );

    // Progress numbers (cap display at goal)
    const displayMatches = Math.min(this.challengeData.currentMatches, this.challengeData.goalMatches);
    this.add
      .text(
        width / 2,
        panelY,
        `${displayMatches} / ${this.challengeData.goalMatches}`,
        {
          fontFamily: 'Arial Black',
          fontSize: '20px',
          color: '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 5,
        }
      )
      .setOrigin(0.5);

    // Status text
    let statusText: string;
    let statusColor: string;
    if (this.challengeData.isCompleted) {
      statusText = `✅ CHALLENGE COMPLETED!`;
      statusColor = '#10B981';
    } else {
      const remaining = this.challengeData.goalMatches - this.challengeData.currentMatches;
      statusText = `${remaining} more ${remaining === 1 ? 'match' : 'matches'} needed`;
      statusColor = '#60A5FA';
    }

    this.add
      .text(width / 2, panelY + 40, statusText, {
        fontFamily: 'Arial Black',
        fontSize: '22px',
        color: statusColor,
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Contributors info
    const contributorY = panelY + 75;
    this.add
      .text(
        width / 2,
        contributorY,
        `👥 ${this.challengeData.contributorCount} ${this.challengeData.contributorCount === 1 ? 'player' : 'players'} contributing`,
        {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: '#FBBF24',
          fontStyle: 'bold',
        }
      )
      .setOrigin(0.5);

    // User contribution status
    if (this.challengeData.userContributed) {
      this.add
        .text(width / 2, contributorY + 30, '✓ You helped with this challenge!', {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: '#10B981',
        })
        .setOrigin(0.5);
    }

    // Info box
    const infoY = height * 0.7;
    const infoBox = this.add.rectangle(width / 2, infoY, width - 100, 120, 0x1f2937, 0.9);
    infoBox.setStrokeStyle(2, 0x374151);

    this.add
      .text(width / 2, infoY - 40, 'HOW IT WORKS', {
        fontFamily: 'Arial Black',
        fontSize: '18px',
        color: '#FFFFFF',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        infoY + 10,
        'Play any game mode (Solo or Multiplayer)\nEach completed match counts toward the goal\nWork together with the community!\nChallenge resets daily',
        {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#9CA3AF',
          align: 'center',
          lineSpacing: 5,
        }
      )
      .setOrigin(0.5);

    // Add confetti if completed AND user contributed
    if (this.challengeData.isCompleted && this.challengeData.userContributed) {
      this.addCelebration(width / 2, panelY);
    }
  }

  private addCelebration(x: number, y: number): void {
    // Confetti particles
    const colors = [0xffd700, 0xff6b6b, 0x4ecdc4, 0xfbbf24, 0x10b981];

    for (let i = 0; i < 30; i++) {
      const particle = this.add.circle(x, y, 5, colors[i % colors.length]);

      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-150, 150),
        y: y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        scale: 0,
        duration: 1500,
        ease: 'Cubic.easeOut',
        delay: i * 30,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private showError(message: string): void {
    this.loadingText.setText(message);
    this.loadingText.setColor('#EF4444');
  }
}
