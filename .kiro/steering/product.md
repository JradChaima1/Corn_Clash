# Product Overview

**CornClash** (corn-clash) is a fast-paced arcade game built with Phaser.js that runs natively on Reddit via the Devvit platform.

## Core Concept

Players control a popcorn cup to catch flying kernels launching from an animated cooking pot. The game features realistic physics with randomized trajectories, gravity, and rotation for each popcorn piece.

## Game Modes

- **Solo Mode**: Single-player arcade challenge with 60-second time limit and high-score tracking
- **Multiplayer Mode**: Real-time online PvP with automatic matchmaking, split-screen territories, and server-authoritative gameplay

## Key Features

- **Reddit-Native**: Runs entirely within Reddit posts - no downloads or external websites needed
- **Instant Matchmaking**: Zero-friction multiplayer entry with automatic pairing via Redis queue
- **Physics-Based Gameplay**: Phaser's Arcade Physics with realistic trajectories, gravity (300 px/s²), and bounce effects
- **Bonus System**: Three popcorn types with different point values (normal +1, red +10, blue +20)
- **Visual Feedback**: Particle bursts, flash effects, score popups, and screen shake on catches
- **Mobile-Friendly**: Touch controls with on-screen buttons for mobile devices

## Platform Integration

- Creates posts automatically on app installation
- Provides moderator menu actions for post creation
- Seamlessly integrated into Reddit browsing experience
- Built for Reddit's Devvit ecosystem with zero external dependencies

## Target Audience

Reddit users looking for quick, engaging arcade gameplay directly within their feed. Designed for both casual solo play and competitive multiplayer sessions.
