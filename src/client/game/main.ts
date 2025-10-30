import { Boot } from './scenes/Boot';
import { MainMenu } from './scenes/MainMenu';
import { ModeSelect } from './scenes/ModeSelect';
import { HowToPlay } from './scenes/HowToPlay';
import { SoloGame } from './scenes/SoloGame';
import { SoloGameOver } from './scenes/SoloGameOver';
import { MultiplayerLobby } from './scenes/MultiplayerLobby';
import { MultiplayerGame } from './scenes/MultiplayerGame';
import { MultiplayerGameOver } from './scenes/MultiplayerGameOver';
import { Leaderboard } from './scenes/Leaderboard';
import { Challenge } from './scenes/Challenge';
import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: '#FFF8DC',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: false,
    },
  },
  scene: [
    Boot,
    Preloader,
    MainMenu,
    ModeSelect,
    HowToPlay,
    Leaderboard,
    Challenge,
    SoloGame,
    SoloGameOver,
    MultiplayerLobby,
    MultiplayerGame,
    MultiplayerGameOver,
  ],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
