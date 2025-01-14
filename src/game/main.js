import { Game as MainGame } from './scenes/Game';
import { AUTO, Game } from 'phaser';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: AUTO,
    width: 336,
    height: 336,
    parent: 'game-container',
    backgroundColor: '#028af8',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        MainGame
    ],
    scale: {
        zoom: 5
    }
};

const StartGame = (parent) => {
    return new Game({ ...config, parent });
}

export default StartGame;

