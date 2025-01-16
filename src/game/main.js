import { Game as MainGame } from './scenes/Game';
import { AUTO, Game } from 'phaser';
import { MiniGameLauncher } from './scenes/MiniGameLauncher';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        MainGame, MiniGameLauncher
    ],
    scale: {
        zoom: 3
    }
};

const StartGame = (parent) => {
    return new Game({ ...config, parent });
}

export default StartGame;

