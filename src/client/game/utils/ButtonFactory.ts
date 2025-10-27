import { Scene, GameObjects } from 'phaser';

export class ButtonFactory {
  /**
   * Creates a modern cartoon-style 2D button with glossy effect
   * @param scene - The Phaser scene to create the button in
   * @param x - X position
   * @param y - Y position
   * @param text - Button text
   * @param mainColor - Main button color (hex number)
   * @param borderColor - Border color (hex number)
   * @param width - Optional custom width (auto-calculated if not provided)
   * @returns Container with button graphics and text
   */
  static createButton(
    scene: Scene,
    x: number,
    y: number,
    text: string,
    mainColor: number,
    borderColor: number,
    width?: number
  ): GameObjects.Container {
    const container = scene.add.container(x, y);

    // Button dimensions
    const buttonWidth = width || text.length * 20 + 40;
    const buttonHeight = 60;
    const borderRadius = 15;

    // Create button graphics
    const button = scene.add.graphics();

    // Shadow
    button.fillStyle(0x000000, 0.3);
    button.fillRoundedRect(
      -buttonWidth / 2 + 4,
      -buttonHeight / 2 + 4,
      buttonWidth,
      buttonHeight,
      borderRadius
    );

    // Border
    button.fillStyle(borderColor, 1);
    button.fillRoundedRect(
      -buttonWidth / 2,
      -buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      borderRadius
    );

    // Main button body
    button.fillStyle(mainColor, 1);
    button.fillRoundedRect(
      -buttonWidth / 2 + 3,
      -buttonHeight / 2 + 3,
      buttonWidth - 6,
      buttonHeight - 6,
      borderRadius - 2
    );

    // Glossy highlight on top
    button.fillStyle(0xffffff, 0.3);
    button.fillRoundedRect(
      -buttonWidth / 2 + 8,
      -buttonHeight / 2 + 8,
      buttonWidth - 16,
      buttonHeight / 3,
      borderRadius - 4
    );

    // Button text
    const buttonText = scene.add
      .text(0, 0, text, {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5);

    container.add([button, buttonText]);

    return container;
  }

  /**
   * Adds standard hover effect to a button
   * @param scene - The Phaser scene
   * @param button - The button container
   */
  static addHoverEffect(scene: Scene, button: GameObjects.Container): void {
    button.on('pointerover', () => {
      scene.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    button.on('pointerout', () => {
      scene.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });
  }

  /**
   * Adds click animation and callback to a button
   * @param scene - The Phaser scene
   * @param button - The button container
   * @param callback - Function to call after click animation
   */
  static addClickEffect(
    scene: Scene,
    button: GameObjects.Container,
    callback: () => void
  ): void {
    button.on('pointerdown', () => {
      scene.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: callback,
      });
    });
  }

  /**
   * Adds floating animation to a button
   * @param scene - The Phaser scene
   * @param button - The button container
   * @param baseY - Base Y position
   * @param duration - Animation duration (default 1000ms)
   */
  static addFloatingEffect(
    scene: Scene,
    button: GameObjects.Container,
    baseY: number,
    duration: number = 1000
  ): void {
    scene.tweens.add({
      targets: button,
      y: baseY - 5,
      duration: duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
