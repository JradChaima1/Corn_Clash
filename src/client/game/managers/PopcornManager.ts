import * as Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export type PopcornType = 'normal' | 'red' | 'blue';

export interface PopcornData {
  type: PopcornType;
  value: number;
}

/**
 * Manages popcorn spawning, physics, and lifecycle
 */
export class PopcornManager {
  private scene: Phaser.Scene;
  private popcornGroup: Phaser.Physics.Arcade.Group;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private potX: number;
  private potY: number;

  constructor(scene: Phaser.Scene, potX: number, potY: number) {
    this.scene = scene;
    this.potX = potX;
    this.potY = potY;

    // Create popcorn group with object pooling
    this.popcornGroup = this.scene.physics.add.group({
      defaultKey: 'popcorn',
      maxSize: GameConfig.POPCORN.MAX_ACTIVE,
      createCallback: (gameObject) => {
        const sprite = gameObject as Phaser.Physics.Arcade.Sprite;
        sprite.setDisplaySize(GameConfig.POPCORN.SIZE, GameConfig.POPCORN.SIZE);
        sprite.setBounce(GameConfig.PHYSICS.BOUNCE);
        sprite.setCollideWorldBounds(true);
      },
    });
  }

  /**
   * Spawn a single popcorn kernel from the pot
   */
  spawn(): void {
    const popcorn = this.popcornGroup.get(
      this.potX,
      this.potY,
      'popcorn'
    ) as Phaser.Physics.Arcade.Sprite;
    if (!popcorn) return;

    // Determine popcorn type
    const type = this.determineType();
    const value = this.getValueForType(type);

    // Apply visual styling
    this.applyType(popcorn, type);

    // Store data on the sprite
    popcorn.setData('type', type);
    popcorn.setData('value', value);
    popcorn.setData('active', true);

    // Apply physics
    this.applyPhysics(popcorn);

    // Screen shake effect
    this.scene.cameras.main.shake(
      GameConfig.EFFECTS.SCREEN_SHAKE.DURATION,
      GameConfig.EFFECTS.SCREEN_SHAKE.INTENSITY
    );
  }

  /**
   * Spawn chaos popcorn from screen edges (triggered by red popcorn)
   */
  spawnChaos(): void {
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const x =
      side === 'left'
        ? GameConfig.CHAOS.SPAWN_POSITIONS.LEFT
        : GameConfig.CHAOS.SPAWN_POSITIONS.RIGHT;
    const y = Phaser.Math.Between(100, 300);

    const popcorn = this.popcornGroup.get(x, y, 'popcorn') as Phaser.Physics.Arcade.Sprite;
    if (!popcorn) return;

    // Chaos popcorn is always normal type
    const type = 'normal';
    this.applyType(popcorn, type);

    popcorn.setData('type', type);
    popcorn.setData('value', GameConfig.POPCORN_TYPES.NORMAL.value);
    popcorn.setData('active', true);

    // Apply chaos physics (horizontal velocity toward center)
    const body = popcorn.body as Phaser.Physics.Arcade.Body;
    const velocityX =
      side === 'left'
        ? Phaser.Math.Between(GameConfig.CHAOS.VELOCITY_X_MIN, GameConfig.CHAOS.VELOCITY_X_MAX)
        : -Phaser.Math.Between(GameConfig.CHAOS.VELOCITY_X_MIN, GameConfig.CHAOS.VELOCITY_X_MAX);

    body.setVelocity(
      velocityX,
      Phaser.Math.Between(GameConfig.POPCORN.VELOCITY_Y_MIN, GameConfig.POPCORN.VELOCITY_Y_MAX)
    );
    body.setAngularVelocity(
      Phaser.Math.Between(GameConfig.POPCORN.ROTATION_MIN, GameConfig.POPCORN.ROTATION_MAX)
    );
  }

  /**
   * Start automatic popcorn spawning
   */
  startSpawning(): void {
    this.scheduleNext();
  }

  /**
   * Stop automatic popcorn spawning
   */
  stopSpawning(): void {
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }
  }

  /**
   * Clear all active popcorn
   */
  clearAll(): void {
    this.popcornGroup.clear(true, true);
  }

  /**
   * Get the popcorn group for collision detection
   */
  getGroup(): Phaser.Physics.Arcade.Group {
    return this.popcornGroup;
  }

  /**
   * Deactivate a popcorn sprite (after being caught)
   */
  deactivate(popcorn: Phaser.GameObjects.GameObject): void {
    const sprite = popcorn as Phaser.Physics.Arcade.Sprite;
    sprite.setData('active', false);
    sprite.setActive(false);
    sprite.setVisible(false);
  }

  /**
   * Get popcorn data from a sprite
   */
  getData(popcorn: Phaser.GameObjects.GameObject): PopcornData {
    const sprite = popcorn as Phaser.Physics.Arcade.Sprite;
    return {
      type: sprite.getData('type') as PopcornType,
      value: sprite.getData('value') as number,
    };
  }

  /**
   * Check if popcorn is active (not already caught)
   */
  isActive(popcorn: Phaser.GameObjects.GameObject): boolean {
    const sprite = popcorn as Phaser.Physics.Arcade.Sprite;
    return sprite.getData('active') === true;
  }

  /**
   * Update method - clean up off-screen popcorn
   */
  update(): void {
    const { width, height } = this.scene.scale;

    this.popcornGroup.children.entries.forEach((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (!sprite.active) return;

      // Despawn if off-screen
      if (sprite.y > height + 50 || sprite.x < -50 || sprite.x > width + 50) {
        sprite.setActive(false);
        sprite.setVisible(false);
      }
    });
  }

  /**
   * Determine popcorn type based on spawn rates
   */
  private determineType(): PopcornType {
    const rand = Math.random();
    const { NORMAL, RED } = GameConfig.POPCORN_TYPES;

    if (rand < NORMAL.spawnRate) {
      return 'normal';
    } else if (rand < NORMAL.spawnRate + RED.spawnRate) {
      return 'red';
    } else {
      return 'blue';
    }
  }

  /**
   * Get point value for popcorn type
   */
  private getValueForType(type: PopcornType): number {
    return GameConfig.POPCORN_TYPES[type.toUpperCase() as keyof typeof GameConfig.POPCORN_TYPES]
      .value;
  }

  /**
   * Apply visual styling based on type
   */
  private applyType(popcorn: Phaser.Physics.Arcade.Sprite, type: PopcornType): void {
    const tint =
      GameConfig.POPCORN_TYPES[type.toUpperCase() as keyof typeof GameConfig.POPCORN_TYPES].tint;
    if (tint) {
      popcorn.setTint(tint);
    } else {
      popcorn.clearTint();
    }
  }

  /**
   * Apply physics to popcorn sprite
   */
  private applyPhysics(popcorn: Phaser.Physics.Arcade.Sprite): void {
    const body = popcorn.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(
      Phaser.Math.Between(GameConfig.POPCORN.VELOCITY_X_MIN, GameConfig.POPCORN.VELOCITY_X_MAX),
      Phaser.Math.Between(GameConfig.POPCORN.VELOCITY_Y_MIN, GameConfig.POPCORN.VELOCITY_Y_MAX)
    );

    body.setAngularVelocity(
      Phaser.Math.Between(GameConfig.POPCORN.ROTATION_MIN, GameConfig.POPCORN.ROTATION_MAX)
    );
  }

  /**
   * Schedule next popcorn spawn
   */
  private scheduleNext(): void {
    const delay = Phaser.Math.Between(
      GameConfig.POPCORN.SPAWN_DELAY_MIN,
      GameConfig.POPCORN.SPAWN_DELAY_MAX
    );

    this.spawnTimer = this.scene.time.delayedCall(delay, () => {
      this.spawn();
      this.scheduleNext();
    });
  }
}
