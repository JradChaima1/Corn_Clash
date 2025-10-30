# CornClash 🍿

A fast-paced arcade game where you catch flying popcorn kernels! Built with Phaser.js and running natively on Reddit via Devvit.

**Play on Reddit** - No downloads needed. Just click and play!

---

## 🎮 Game Modes

### Solo Mode

- 60-second time challenge
- Catch popcorn for points
- Avoid red popcorn (-10 points + chaos!)
- Prioritize blue popcorn (+20 points)
- Compete on global leaderboards

### Multiplayer Mode

- Real-time PvP battles
- Automatic matchmaking
- Split-screen territories
- Server-authoritative gameplay
- 1v1 competitive matches

### Daily Community Challenge 🎯

- **Asynchronous multiplayer** - Work together with the community
- **Daily goal** - Complete matches together (resets every 24 hours)
- **Contributor recognition** - Get credit for helping achieve the goal
- **Both modes count** - Solo and multiplayer matches both contribute
- **Celebration rewards** - Contributors see special effects when goal is reached

---

## 🕹️ Controls

**Keyboard**: A/D or Arrow Keys  
**Mobile**: On-screen touch buttons

---

## 🍿 Popcorn Types

- **White**: +1 point (70% spawn rate)
- **Red**: -10 points + spawns 5 chaos kernels (20%) - AVOID!
- **Blue**: +20 points (10%) - High priority!

---

## 🚀 Quick Start

### Play the Game

1. Find CornClash on Reddit
2. Click "Play"
3. Choose your mode:
   - **Solo** - Beat your high score
   - **Multiplayer** - Challenge another player
   - **Challenges** - Join the daily community goal
4. Start catching popcorn!

### Development

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run deploy       # Deploy to Reddit
```

---

## 🛠️ Tech Stack

- **Phaser.js** - Game engine
- **Reddit Devvit** - Platform
- **TypeScript** - Language
- **Vite** - Build tool
- **Express** - Server
- **Redis** - Data storage

---

## 📁 Project Structure

```
src/
├── client/          # Phaser game (frontend)
├── server/          # Express API (backend)
└── shared/          # Shared types
```

---

## 🎨 Credits

### Visual Assets

Some visual assets generated using **[Craiyon](https://www.craiyon.com/)** - AI image generation tool

### Music

Background music from **[FreePD.com – Comedy Collection](https://freepd.com/comedy.php)**

### Technologies

- **Phaser.js** (v3.88.2) - MIT License
- **Reddit Devvit** (v0.12.1) - © Reddit, Inc.
- **TypeScript** (v5.8.2) - Apache 2.0

**[View Full Credits →](CREDITS.md)**

---

## 🏆 Community Features

### Leaderboards

Track your progress and compete globally:

- **Daily** - Today's top players
- **Weekly** - This week's champions
- **All-Time** - Legendary high scores

Features:
- Automatic score tracking
- Best score only (no score spam)
- Reddit username integration
- Personal rank display

### Daily Community Challenge

Work together with all players to achieve a shared goal:

- **Goal**: Complete matches as a community
- **Resets**: Every 24 hours automatically
- **Rewards**: Contributor recognition + celebration effects
- **Fair**: Only contributors before completion get credit
- **Inclusive**: Both solo and multiplayer matches count

---

## 📄 License

BSD-3-Clause License - See [LICENSE](LICENSE) file

---

## 📚 Documentation

- [Full Game Guide](docs/) - Detailed gameplay mechanics
- [Leaderboard System](LEADERBOARD_IMPLEMENTATION.md) - Global rankings
- [Daily Challenge](DAILY_CHALLENGE_IMPLEMENTATION.md) - Community goals
- [Multiplayer Debug](MULTIPLAYER_DEBUG.md) - Troubleshooting guide

---

## 🎯 Features

✅ Reddit-native gameplay  
✅ Solo & multiplayer modes  
✅ Real-time matchmaking  
✅ Daily community challenges  
✅ Global leaderboards (daily/weekly/all-time)  
✅ Mobile-friendly controls  
✅ Physics-based mechanics  
✅ Server-authoritative multiplayer  
✅ Automatic disconnect recovery  
✅ Asynchronous community goals

---

**Made with ❤️ for Reddit**
