import * as Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { PopcornType } from './PopcornManager';

/**
 * Manages visual effects like particles, flashes, and screen shake
 */
export class EffectsManager {
  private scene: Phaser.Scene;
  private particleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupParticles();
  }

  /**
   * Create catch effect (particles + flash)
   */
  createCatchEffect(x: number, y: number, type: PopcornType): void {
    this.createParticleBurst(x, y);
    this.createFlash(x, y, type);
  }

  /**
   * Show score popup text
   */
  showScorePopup(x: number, y: number, value: number, type: PopcornType): void {
    if (type === 'normal') return; // Only show for special popcorn

    const color = type === 'blue' ? '#00FFFF' : '#FF0000';
    const text = this.scene.add.text(x, y, `${value > 0 ? '+' : ''}${value}`, {
      fontFamily: 'Arial Black',
      fontSize: GameConfig.EFFECTS.SCORE_POPUP.FONT_SIZE,
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
    });
    text.setOrigin(0.5);
    text.setDepth(100);

    this.scene.tweens.add({
      targets: text,
      y: y - GameConfig.EFFECTS.SCORE_POPUP.RISE_DISTANCE,
      alpha: 0,
      duration: GameConfig.EFFECTS.SCORE_POPUP.DURATION,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      },
    });
  }

  /**
   * Trigger screen shake
   */
  screenShake(): void {
    this.scene.cameras.main.shake(
      GameConfig.EFFECTS.SCREEN_SHAKE.DURATION,
      GameConfig.EFFECTS.SCREEN_SHAKE.INTENSITY
    );
  }

  /**
   * Create idle floating animation for a game object
   */
  createIdleAnimation(
    target: Phaser.GameObjects.GameObject,
    baseY: number,
    delay: number = 0
  ): void {
    this.scene.tweens.add({
      targets: target,
      y: baseY + GameConfig.EFFECTS.IDLE_ANIMATION.AMOUNT,
      duration: GameConfig.EFFECTS.IDLE_ANIMATION.DURATION,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: delay,
    });
  }

  /**
   * Setup particle emitter for catch effects
   */
  private setupParticles(): void {
    this.particleEmitter = this.scene.add.particles(0, 0, 'popcorn', {
      speed: {
        min: GameConfig.EFFECTS.PARTICLE_BURST.SPEED_MIN,
        max: GameConfig.EFFECTS.PARTICLE_BURST.SPEED_MAX,
      },
      scale: {
        start: GameConfig.EFFECTS.PARTICLE_BURST.SCALE_START,
        end: GameConfig.EFFECTS.PARTICLE_BURST.SCALE_END,
      },
      lifespan: GameConfig.EFFECTS.PARTICLE_BURST.LIFESPAN,
      gravityY: GameConfig.EFFECTS.PARTICLE_BURST.GRAVITY,
      emitting: false,
    });
  }

  /**
   * Create particle burst at position
   */
  private createParticleBurst(x: number, y: number): void {
    if (!this.particleEmitter) return;

    this.particleEmitter.setPosition(x, y);
    this.particleEmitter.explode(GameConfig.EFFECTS.PARTICLE_BURST.COUNT);
  }

  /**
   * Create flash effect at position
   */
  private createFlash(x: number, y: number, type: PopcornType): void {
    const colorKey = type.toUpperCase() as keyof typeof GameConfig.EFFECTS.FLASH.COLORS;
    const flashColor = GameConfig.EFFECTS.FLASH.COLORS[colorKey];

    const flash = this.scene.add.circle(
      x,
      y,
      GameConfig.EFFECTS.FLASH.RADIUS_START,
      flashColor,
      GameConfig.EFFECTS.FLASH.ALPHA_START
    );
    flash.setDepth(50);

    this.scene.tweens.add({
      targets: flash,
      scale: GameConfig.EFFECTS.FLASH.RADIUS_END / GameConfig.EFFECTS.FLASH.RADIUS_START,
      alpha: GameConfig.EFFECTS.FLASH.ALPHA_END,
      duration: GameConfig.EFFECTS.FLASH.DURATION,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      },
    });
  }
}
