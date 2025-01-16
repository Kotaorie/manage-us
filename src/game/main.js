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
    scale: {
        zoom: 3
    }
};

const StartGame = (parent, user, socket, missions) => {
    return new Game({ ...config, parent, scene: [ new MainGame(user, socket, missions), new MiniGameLauncher() ] });
}

export default StartGame;

