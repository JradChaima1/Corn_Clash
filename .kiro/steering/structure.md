# Project Structure

## Root Configuration

- `devvit.json`: Devvit app configuration with post/server entry points, menu items, triggers, and dev subreddit
- `package.json`: Dependencies, build scripts, and project metadata
- `tsconfig.json`: TypeScript project references (build-only, no files)
- `eslint.config.js`: ESLint configuration with environment-specific rules
- `.prettierrc`: Prettier code formatting configuration
- `.editorconfig`: Editor configuration for consistent coding styles
- `.env.template`: Template for environment variables
- `.gitignore`: Git ignore patterns
- `.cursorignore`: Cursor IDE ignore patterns

## Source Organization

### `/src/client/`

Client-side Phaser.js application that runs in the browser

- `main.ts`: Entry point that initializes Phaser game
- `game/main.ts`: Phaser game configuration and scene setup
- `game/scenes/`: Phaser scene classes
  - `Boot.ts`: Initial boot scene
  - `Preloader.ts`: Asset loading scene
  - `MainMenu.ts`: Main menu scene
  - `ModeSelect.ts`: Game mode selection scene
  - `SoloGame.ts`: Solo gameplay scene
  - `MultiplayerLobby.ts`: Multiplayer matchmaking lobby
  - `MultiplayerGame.ts`: Multiplayer gameplay scene
  - `SoloGameOver.ts`: Solo game over scene
  - `MultiplayerGameOver.ts`: Multiplayer game over scene
- `index.html`: HTML template with canvas and UI elements
- `index.css`: Styling for the web interface
- `vite.config.ts`: Client build configuration
- `tsconfig.json`: Client-specific TypeScript config

### `/src/server/`

Express server that handles Reddit integration and multiplayer game logic

- `index.ts`: Main server with Express routes and Devvit integration
- `core/`: Business logic modules
  - `post.ts`: Post creation functionality
  - `multiplayer.ts`: Multiplayer game state manager (singleton pattern)
  - `multiplayer.test.ts`: Unit tests for multiplayer logic
- `vite.config.ts`: Server build configuration (SSR, CommonJS output)
- `tsconfig.json`: Server-specific TypeScript config

### `/src/shared/`

Shared types and utilities between client and server

- `types/api.ts`: API request/response type definitions
- `tsconfig.json`: Shared code TypeScript config

## Build Output

- `dist/client/`: Built client assets (HTML, JS, CSS)
- `dist/server/`: Built server bundle (`index.cjs`)

## Assets

- `/assets/`: Game assets (images, sprites)
  - Background images (kitchen, splash screens)
  - Game sprites (popcorn, pot, cup)
  - Icons and UI elements

## Documentation

- `README.md`: Comprehensive game documentation and development guide
- `GAME_INFO.md`: Game mechanics and technical details
- `GAME_MECHANICS.md`: Detailed gameplay mechanics
- `IMPLEMENTATION_SUMMARY.md`: Implementation notes and summaries
- `MULTIPLAYER_SETUP.md`: Multiplayer system documentation
- `MULTIPLAYER_DEBUG.md`: Multiplayer debugging guide
- `LICENSE`: Project license (BSD-3-Clause)

## Tools

- `/tools/`: Build tool configurations
  - `tsconfig-base.json`: Base TypeScript configuration

## Configuration Files

- `.vscode/`: VS Code workspace settings
- `.cursor/`: Cursor IDE settings and MCP configuration
- `.kiro/`: Kiro AI assistant settings
  - `steering/`: AI assistant steering documents
  - `specs/`: Feature specifications and design documents

## Architecture Patterns

- **Monorepo**: Multiple TypeScript projects with project references
- **Client-Server Split**: Clear separation with shared types for type safety
- **API-First**: RESTful endpoints for client-server communication (all start with `/api/`)
- **Devvit Integration**: Server handles Reddit context and Redis operations
- **Scene-Based Architecture**: Phaser scenes for different game states
- **Singleton Pattern**: MultiplayerGameManager for centralized game state
- **Server-Authoritative**: Multiplayer game logic runs on server to prevent cheating

## API Endpoints

### Core Endpoints

- `GET /api/init`: Initialize app with post context
- `POST /api/increment`: Increment counter (example)
- `POST /api/decrement`: Decrement counter (example)

### Multiplayer Endpoints

- `POST /api/multiplayer/join`: Join or create a multiplayer game
- `POST /api/multiplayer/ready`: Signal player ready status
- `GET /api/multiplayer/state`: Get current game state
- `POST /api/multiplayer/position`: Update player position
- `POST /api/multiplayer/score`: Update player score
- `POST /api/multiplayer/leave`: Leave current game
- `POST /api/multiplayer/end`: End game session

### Internal Endpoints

- `POST /internal/on-app-install`: Triggered on app installation
- `POST /internal/menu/post-create`: Moderator menu action for post creation

## Data Flow

1. **Client** makes fetch requests to `/api/*` endpoints
2. **Server** processes requests using Express routes
3. **Server** accesses Redis via Devvit SDK for persistence
4. **Server** returns JSON responses to client
5. **Client** updates Phaser game state based on responses

## Development Environment

- Test subreddit: `r/corn_clash_dev` (configured in `devvit.json`)
- Playtest URL provided by `npm run dev`
- Hot reloading for both client and server during development
