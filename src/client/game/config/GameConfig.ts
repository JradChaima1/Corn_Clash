// Game configuration constants
// Centralized location for all game balance and tuning values

export const GameConfig = {
  // Game duration
  GAME_DURATION: 60, // seconds

  // Popcorn spawning
  POPCORN: {
    SPAWN_DELAY_MIN: 400, // ms
    SPAWN_DELAY_MAX: 700, // ms
    MAX_ACTIVE: 50, // maximum popcorn on screen
    SIZE: 40, // pixels
    VELOCITY_X_MIN: 100, // pixels per second
    VELOCITY_X_MAX: 250,
    VELOCITY_Y_MIN: -450, // negative = upward
    VELOCITY_Y_MAX: -300,
    ROTATION_MIN: -200, // degrees per second
    ROTATION_MAX: 200,
  },

  // Popcorn types and their properties
  POPCORN_TYPES: {
    NORMAL: {
      value: 1,
      spawnRate: 0.7, // 70% chance
      tint: null, // no tint
    },
    RED: {
      value: -10, // penalty
      spawnRate: 0.2, // 20% chance
      tint: 0xff0000,
      chaosKernels: 5, // spawn 5 extra kernels
    },
    BLUE: {
      value: 20, // bonus
      spawnRate: 0.1, // 10% chance
      tint: 0x0088ff,
    },
  },

  // Chaos mode (triggered by red popcorn)
  CHAOS: {
    KERNEL_COUNT: 5,
    SPAWN_DELAY: 100, // ms between each kernel
    VELOCITY_X_MIN: 200,
    VELOCITY_X_MAX: 350,
    SPAWN_POSITIONS: {
      LEFT: 50,
      RIGHT: 750,
    },
  },

  // Player (cup) properties
  PLAYER: {
    SPEED: 300, // pixels per second
    SIZE: 100, // pixels
    COLLISION_WIDTH_RATIO: 0.8, // 80% of sprite width
    COLLISION_HEIGHT_RATIO: 0.6, // 60% of sprite height
  },

  // Pot properties
  POT: {
    SIZE: 300, // pixels
    SIZE_MULTIPLAYER: 0.3, // scale factor for multiplayer
    WOBBLE: {
      HORIZONTAL: {
        AMOUNT: 5, // pixels
        DURATION: 1200, // ms
      },
      VERTICAL: {
        AMOUNT: 28, // pixels
        DURATION: 100, // ms
      },
      ROTATION: {
        AMOUNT: 2, // degrees
        DURATION: 120, // ms
      },
    },
    WOBBLE_MULTIPLAYER: {
      HORIZONTAL: {
        AMOUNT: 4,
        DURATION: 80,
      },
      VERTICAL: {
        AMOUNT: 2,
        DURATION: 100,
      },
      ROTATION: {
        AMOUNT: 2,
        DURATION: 120,
      },
    },
    COLLISION_WIDTH_RATIO: 0.9,
    COLLISION_HEIGHT_RATIO: 0.6,
  },

  // Physics settings
  PHYSICS: {
    GRAVITY: 300, // pixels per second squared
    BOUNCE: 0.3, // bounce coefficient
  },

  // Visual effects
  EFFECTS: {
    SCREEN_SHAKE: {
      INTENSITY: 0.002,
      DURATION: 50, // ms
    },
    PARTICLE_BURST: {
      COUNT: 8,
      SPEED_MIN: 50,
      SPEED_MAX: 150,
      SCALE_START: 0.15,
      SCALE_END: 0,
      LIFESPAN: 400, // ms
      GRAVITY: 200,
    },
    FLASH: {
      RADIUS_START: 20,
      RADIUS_END: 40,
      ALPHA_START: 0.6,
      ALPHA_END: 0,
      DURATION: 200, // ms
      COLORS: {
        NORMAL: 0xffff00,
        RED: 0xff0000,
        BLUE: 0x0088ff,
      },
    },
    SCORE_POPUP: {
      RISE_DISTANCE: 50, // pixels
      DURATION: 800, // ms
      FONT_SIZE: '32px',
    },
    IDLE_ANIMATION: {
      AMOUNT: 2, // pixels
      DURATION: 800, // ms
    },
  },

  // Multiplayer network settings
  NETWORK: {
    POLL_INTERVAL_FRAMES: 10, // poll every 10 frames (~166ms at 60fps)
    DISCONNECT_THRESHOLD: 10, // failed fetches before disconnect
    POSITION_SYNC_THROTTLE_FRAMES: 10, // send position every 10 frames
    POSITION_CHANGE_THRESHOLD: 2, // pixels - only send if moved more than this
    DISCONNECT_TIMEOUT: 5000, // ms - server-side inactivity timeout
    FINAL_SCORE_DELAY: 500, // ms - wait before fetching final scores
    POSITION_INTERPOLATION_DURATION: 150, // ms - smooth opponent movement
  },

  // Multiplayer territory boundaries
  MULTIPLAYER: {
    PLAYER1: {
      MIN_X: 50,
      MAX_X: 350,
      START_X: 150,
      START_Y_OFFSET: 120, // from bottom
      COLOR: 0xff6b6b, // red tint
    },
    PLAYER2: {
      MIN_X: 450,
      MAX_X: 750,
      START_X: 650,
      START_Y_OFFSET: 120, // from bottom
      COLOR: 0x4ecdc4, // cyan tint
    },
    IDLE_ANIMATION_OFFSET: 400, // ms - offset between player animations
  },

  // UI settings
  UI: {
    TIMER_FORMAT: 'MM:SS',
    SCORE_TEXT: {
      FONT_SIZE: '32px',
      FONT_FAMILY: 'Arial Black',
      COLOR: '#FFD700',
      STROKE_COLOR: '#000000',
      STROKE_THICKNESS: 6,
    },
  },

  // Mobile controls
  MOBILE: {
    BUTTON_SIZE: 80, // pixels (diameter)
    BUTTON_Y_OFFSET: 150, // pixels from bottom
    BUTTON_LEFT_X: 100,
    BUTTON_RIGHT_X_OFFSET: 100, // from right edge
    BUTTON_ALPHA: 0.3,
    BUTTON_STROKE: 4,
  },
};
