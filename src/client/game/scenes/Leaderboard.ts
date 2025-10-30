import { Scene } from 'phaser';
import { ButtonFactory } from '../utils/ButtonFactory';

interface LeaderboardEntry {
  username: string;
  score: number;
  rank: number;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank: number | null;
  userScore: number | null;
  totalPlayers: number;
}

export class Leaderboard extends Scene {
  private currentPeriod: 'daily' | 'weekly' | 'alltime' = 'daily';
  private leaderboardData: LeaderboardData | null = null;
  private challengeContributors: Set<string> = new Set();
  private entriesContainer!: Phaser.GameObjects.Container;
  private loadingText!: Phaser.GameObjects.Text;

  constructor() {
    super('Leaderboard');
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
      .text(width / 2, 50, '🏆 LEADERBOARD', {
        fontFamily: 'Arial Black',
        fontSize: '48px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    // Period tabs
    this.createPeriodTabs();

    // Entries container
    this.entriesContainer = this.add.container(0, 0);

    // Loading text
    this.loadingText = this.add
      .text(width / 2, height / 2, 'Loading...', {
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
      this.scene.start('MainMenu');
    });

    // Load initial data
    this.loadLeaderboard(this.currentPeriod);
    this.loadChallengeContributors();
  }

  private createPeriodTabs(): void {
    const { width } = this.scale;
    const tabY = 120;
    const tabWidth = 150;
    const spacing = 20;

    const periods: Array<{ key: 'daily' | 'weekly' | 'alltime'; label: string }> = [
      { key: 'daily', label: 'Daily' },
      { key: 'weekly', label: 'Weekly' },
      { key: 'alltime', label: 'All-Time' },
    ];

    const totalWidth = periods.length * tabWidth + (periods.length - 1) * spacing;
    const startX = width / 2 - totalWidth / 2;

    periods.forEach((period, index) => {
      const x = startX + index * (tabWidth + spacing) + tabWidth / 2;

      const isActive = this.currentPeriod === period.key;
      const bgColor = isActive ? 0x2563eb : 0x374151;
      const hoverColor = isActive ? 0x1e40af : 0x4b5563;

      const tab = ButtonFactory.createButton(
        this,
        x,
        tabY,
        period.label,
        bgColor,
        hoverColor,
        tabWidth
      );

      tab.setInteractive(
        new Phaser.Geom.Rectangle(
          -tabWidth / 2,
          -30,
          tabWidth,
          60
        ) as unknown as Phaser.Types.Input.InputConfiguration,
        Phaser.Geom.Rectangle.Contains
      );

      ButtonFactory.addHoverEffect(this, tab);
      ButtonFactory.addClickEffect(this, tab, () => {
        if (this.currentPeriod !== period.key) {
          this.currentPeriod = period.key;
          this.scene.restart();
        }
      });
    });
  }

  private async loadChallengeContributors(): Promise<void> {
    try {
      const response = await fetch('/api/challenge/contributors');
      const result = await response.json();
      
      if (result.success && result.data && result.data.contributors) {
        this.challengeContributors = new Set(result.data.contributors);
      }
    } catch (error) {
      console.error('Error loading challenge contributors:', error);
    }
  }

  private async loadLeaderboard(period: 'daily' | 'weekly' | 'alltime'): Promise<void> {
    try {
      this.loadingText.setVisible(true);

      const response = await fetch(`/api/leaderboard/${period}`);
      const result = await response.json();

      if (result.success && result.data) {
        this.leaderboardData = result.data;
        this.displayLeaderboard();
      } else {
        this.showError('Failed to load leaderboard');
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      this.showError('Error loading leaderboard');
    } finally {
      this.loadingText.setVisible(false);
    }
  }

  private displayLeaderboard(): void {
    if (!this.leaderboardData) return;

    const { width } = this.scale;

    // Clear previous entries
    this.entriesContainer.removeAll(true);

    // User stats panel
    if (this.leaderboardData.userRank !== null) {
      const statsY = 180;
      const statsPanel = this.add.rectangle(width / 2, statsY, width - 100, 80, 0x1f2937, 0.9);
      statsPanel.setStrokeStyle(2, 0xfbbf24);

      const rankText = this.add
        .text(
          width / 2 - 150,
          statsY,
          `Your Rank: #${this.leaderboardData.userRank}`,
          {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#FBBF24',
            fontStyle: 'bold',
          }
        )
        .setOrigin(0.5);

      const scoreText = this.add
        .text(
          width / 2 + 150,
          statsY,
          `Your Score: ${this.leaderboardData.userScore}`,
          {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#FBBF24',
            fontStyle: 'bold',
          }
        )
        .setOrigin(0.5);

      this.entriesContainer.add([statsPanel, rankText, scoreText]);
    }

    // Total players
    const totalPlayersY = this.leaderboardData.userRank !== null ? 240 : 180;
    const totalPlayersText = this.add
      .text(
        width / 2,
        totalPlayersY,
        `Total Players: ${this.leaderboardData.totalPlayers}`,
        {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: '#9CA3AF',
        }
      )
      .setOrigin(0.5);
    this.entriesContainer.add(totalPlayersText);

    // Leaderboard entries
    const startY = totalPlayersY + 50;
    const entryHeight = 40;
    const maxEntries = Math.min(10, this.leaderboardData.entries.length);

    for (let i = 0; i < maxEntries; i++) {
      const entry = this.leaderboardData.entries[i];
      if (!entry) continue;

      const y = startY + i * entryHeight;

      // Background for entry
      const bgColor = i % 2 === 0 ? 0x1f2937 : 0x111827;
      const entryBg = this.add.rectangle(width / 2, y, width - 100, entryHeight - 5, bgColor, 0.8);

      // Rank
      let rankColor = '#FFFFFF';
      if (entry.rank === 1) rankColor = '#FFD700'; // Gold
      else if (entry.rank === 2) rankColor = '#C0C0C0'; // Silver
      else if (entry.rank === 3) rankColor = '#CD7F32'; // Bronze

      const rankText = this.add
        .text(width / 2 - 300, y, `#${entry.rank}`, {
          fontFamily: 'Arial',
          fontSize: '20px',
          color: rankColor,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);

      // Username - clean display (remove t2_ prefix if present)
      const displayName = entry.username.startsWith('t2_')
        ? entry.username.substring(3)
        : entry.username.startsWith('user_t2_')
          ? entry.username.substring(8)
          : entry.username;

      // Check if user contributed to challenge
      const isContributor = this.challengeContributors.has(entry.username);
      const usernameWithTag = isContributor ? `${displayName} 🎯` : displayName;

      const usernameText = this.add
        .text(width / 2 - 250, y, usernameWithTag, {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: '#FFFFFF',
        })
        .setOrigin(0, 0.5);

      // Score
      const scoreText = this.add
        .text(width / 2 + 280, y, entry.score.toString(), {
          fontFamily: 'Arial',
          fontSize: '20px',
          color: '#10B981',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5);

      this.entriesContainer.add([entryBg, rankText, usernameText, scoreText]);
    }

    // Show message if no entries
    if (this.leaderboardData.entries.length === 0) {
      const { height } = this.scale;
      const noDataText = this.add
        .text(width / 2, height / 2, 'No scores yet. Be the first!', {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#9CA3AF',
        })
        .setOrigin(0.5);
      this.entriesContainer.add(noDataText);
    }
  }

  private showError(message: string): void {
    const { width, height } = this.scale;
    this.entriesContainer.removeAll(true);

    const errorText = this.add
      .text(width / 2, height / 2, message, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#EF4444',
      })
      .setOrigin(0.5);

    this.entriesContainer.add(errorText);
  }
}
