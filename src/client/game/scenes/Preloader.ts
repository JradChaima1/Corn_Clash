import { Scene } from 'phaser';

export class Preloader extends Scene {
  private loadingTimeout: Phaser.Time.TimerEvent | null = null;
  private iconLoadFailed: boolean = false;

  constructor() {
    super('Preloader');
  }

  init() {
    //  Create a pure black background
    this.cameras.main.setBackgroundColor('#000000');

    //  Check if the loading icon exists, if not, set flag for fallback
    if (!this.textures.exists('loadingIcon')) {
      console.error('Loading icon not found, using fallback text');
      this.iconLoadFailed = true;
    }

    //  Display the loading icon centered at (400, 250) or fallback text
    let loadingIcon: Phaser.GameObjects.Image | undefined;
    let glowIcon: Phaser.GameObjects.Image | undefined;
    let fallbackText: Phaser.GameObjects.Text | undefined;

    if (!this.iconLoadFailed) {
      loadingIcon = this.add.image(400, 250, 'loadingIcon');

      //  Scale the icon to 128x128 pixels while maintaining aspect ratio
      const targetSize = 128;
      const scaleX = targetSize / loadingIcon.width;
      const scaleY = targetSize / loadingIcon.height;
      const scale = Math.min(scaleX, scaleY);
      loadingIcon.setScale(scale);

      //  Create a duplicate glow layer behind the main icon
      glowIcon = this.add.image(400, 250, 'loadingIcon');
      glowIcon.setScale(scale * 1.1); // Scale slightly larger (1.1x)
      glowIcon.setAlpha(0.4); // Reduced alpha
      glowIcon.setDepth(-1); // Position behind the main icon

      //  Add pulsing animation to the glow layer
      this.tweens.add({
        targets: glowIcon,
        scaleX: scale * 1.1 * 1.05, // Scale from 1.0 → 1.05
        scaleY: scale * 1.1 * 1.05,
        alpha: 0.4 * 0.8, // Alpha from 1.0 → 0.8 (relative to base alpha of 0.4)
        duration: 1000, // Half of 2000ms for one direction
        yoyo: true, // Return to original values
        repeat: -1, // Repeat infinitely
        ease: 'Sine.easeInOut'
      });
    } else {
      //  Display fallback text if icon failed to load
      fallbackText = this.add.text(400, 250, 'LOADING...', {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#FFFFFF',
        align: 'center'
      });
      fallbackText.setOrigin(0.5, 0.5);

      //  Add pulsing animation to the fallback text
      this.tweens.add({
        targets: fallbackText,
        alpha: 0.5,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    //  Create modern progress bar with neon glow effect
    //  Progress bar background at position (400, 380) with size 400x20
    const progressBarBg = this.add.rectangle(400, 380, 400, 20, 0x333333);
    progressBarBg.setStrokeStyle(2, 0x666666);

    //  Add rounded corners to the progress bar background
    //  Note: Phaser rectangles don't support rounded corners directly,
    //  but we can use Graphics for this
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x333333, 1);
    bgGraphics.lineStyle(2, 0x666666, 1);
    bgGraphics.fillRoundedRect(200, 370, 400, 20, 10); // x, y, width, height, radius
    bgGraphics.strokeRoundedRect(200, 370, 400, 20, 10);

    //  Remove the rectangle background since we're using graphics instead
    progressBarBg.destroy();

    //  Create glow layer 2 (outermost, +8px padding, alpha 0.3)
    const glowLayer2 = this.add.rectangle(202, 380, 4, 32, 0x00FFFF); // height: 16 + 8*2 = 32
    glowLayer2.setOrigin(0, 0.5);
    glowLayer2.setAlpha(0.3);
    glowLayer2.setDepth(-2); // Behind everything

    //  Create glow layer 1 (middle, +4px padding, alpha 0.6)
    const glowLayer1 = this.add.rectangle(202, 380, 4, 24, 0x00FFFF); // height: 16 + 4*2 = 24
    glowLayer1.setOrigin(0, 0.5);
    glowLayer1.setAlpha(0.6);
    glowLayer1.setDepth(-1); // Behind the main fill bar

    //  Create the main fill bar with gradient using Graphics
    //  We'll simulate a gradient by drawing multiple segments with interpolated colors
    const progressBarGraphics = this.add.graphics();
    progressBarGraphics.setDepth(0); // In front of glow layers

    //  Function to interpolate between two colors
    const interpolateColor = (color1: number, color2: number, factor: number): number => {
      const r1 = (color1 >> 16) & 0xFF;
      const g1 = (color1 >> 8) & 0xFF;
      const b1 = color1 & 0xFF;

      const r2 = (color2 >> 16) & 0xFF;
      const g2 = (color2 >> 8) & 0xFF;
      const b2 = color2 & 0xFF;

      const r = Math.round(r1 + (r2 - r1) * factor);
      const g = Math.round(g1 + (g2 - g1) * factor);
      const b = Math.round(b1 + (b2 - b1) * factor);

      return (r << 16) | (g << 8) | b;
    };

    //  Function to draw the progress bar with gradient effect
    const drawProgressBar = (width: number) => {
      progressBarGraphics.clear();

      if (width > 0) {
        const segments = 20; // Number of segments for smooth gradient
        const segmentWidth = width / segments;
        const cyan = 0x00FFFF;
        const blue = 0x0080FF;

        for (let i = 0; i < segments; i++) {
          const factor = i / (segments - 1);
          const color = interpolateColor(cyan, blue, factor);

          progressBarGraphics.fillStyle(color, 1);
          progressBarGraphics.fillRoundedRect(
            202 + i * segmentWidth,
            372, // y: 380 - 8 (half height)
            segmentWidth + 1, // +1 to avoid gaps
            16,
            i === 0 ? 8 : 0 // Only round the left edge
          );
        }
      }
    };

    //  Initial draw
    drawProgressBar(4);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on('progress', (progress: number) => {
      //  Calculate new width (4px minimum + 392px maximum for 400px total width with padding)
      const newWidth = 4 + 392 * progress;

      //  Update all layers
      glowLayer2.width = newWidth;
      glowLayer1.width = newWidth;
      drawProgressBar(newWidth);
    });
  }

  preload() {
    //  Load the assets for the game
    this.load.setPath('assets');

    // Load game images with correct filenames
    this.load.image('kitchen', 'kitchen_background.png');
    this.load.image('mainmenubg', 'mybgimage.png')
    this.load.image('pot', 'large_pot.png');
    this.load.image('popcorn', 'single_corn.png');
    this.load.image('cup', 'empty_popcorn_cup.png');
    this.load.image('counter', 'counter1.png');

    // Load audio files
    this.load.audio('menu_music', 'mainmenusong.mp3');
    this.load.audio('game_music', 'gameplaysong.mp3');

    // Handle loading errors gracefully
    this.load.on('loaderror', (file: any) => {
      console.error(`Failed to load asset: ${file.key} from ${file.url}`);
      // Continue loading other assets even if one fails
    });

    //  Add 30-second timeout to force transition to MainMenu if loading stalls
    this.loadingTimeout = this.time.delayedCall(30000, () => {
      console.warn('Loading timeout reached (30 seconds), forcing transition to MainMenu');
      this.transitionToMainMenu();
    });
  }

  private transitionToMainMenu() {
    //  Clean up the timeout if it exists
    if (this.loadingTimeout) {
      this.loadingTimeout.remove();
      this.loadingTimeout = null;
    }

    //  Transition to MainMenu
    this.scene.start('MainMenu');
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.transitionToMainMenu();
  }
}
