# Technology Stack

## Core Technologies

- **Devvit**: Reddit's developer platform for building apps (v0.12.1)
- **Phaser.js**: 2D game engine with Arcade Physics system (v3.88.2)
- **TypeScript**: Primary language with strict type checking (v5.8.2)
- **Vite**: Build tool for both client and server bundles (v6.2.4)
- **Express**: Server-side HTTP framework (v5.1.0)
- **Redis**: Data persistence layer (via Devvit)
- **Node.js**: Required runtime version 22.2.0 or higher

## Build System

- **Vite** handles compilation for both client and server
- **TypeScript** project references for modular compilation (client, server, shared)
- **ESLint** with TypeScript rules for code quality
- **Prettier** for consistent code formatting
- **Vitest** for testing (v3.1.1)
- **Concurrently** for parallel development processes

## Common Commands

```bash
# Development (runs client, server, and devvit in parallel)
npm run dev

# Build for production
npm run build

# Deploy to Reddit
npm run deploy

# Publish for review
npm run launch

# Code quality checks
npm run check

# Individual builds
npm run build:client
npm run build:server

# Development processes (individual)
npm run dev:client    # Client watch mode
npm run dev:server    # Server watch mode
npm run dev:devvit    # Devvit playtest

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Formatting
npm run prettier
```

## Development Workflow

- Use `npm run dev` for live development with hot reloading
- Client builds to `dist/client` with HTML entry point
- Server builds to `dist/server` as CommonJS module (`index.cjs`)
- Devvit playtest provides live Reddit integration testing at `r/corn_clash_dev`
- Environment variables loaded via `dotenv-cli` from `.env` file

## Build Configuration

- **Client**: Vite config in `src/client/vite.config.ts` - builds to HTML/JS/CSS
- **Server**: Vite config in `src/server/vite.config.ts` - SSR mode, CommonJS output
- **TypeScript**: Root `tsconfig.json` uses project references for modular compilation

## Dependencies

### Runtime

- `@devvit/web`: Devvit web framework
- `phaser`: Game engine
- `express`: HTTP server
- `devvit`: Devvit CLI and SDK

### Development

- `typescript`: Type checking
- `eslint` + `@eslint/js` + `typescript-eslint`: Linting
- `prettier` + `prettier-package-json`: Code formatting
- `vite`: Build tool
- `vitest`: Testing framework
- `concurrently`: Parallel process execution
- `dotenv-cli`: Environment variable management
- `terser`: Code minification
- `@types/express`: TypeScript definitions

## Platform Requirements

- **Node.js**: 22.2.0 or higher (required by Devvit)
- **Package Manager**: npm (lockfile present)
- **Project Name**: `corn-clash` (must not be changed - required for Devvit deployment)
