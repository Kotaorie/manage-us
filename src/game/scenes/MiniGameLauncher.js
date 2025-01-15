import { Scene } from 'phaser';

export class MiniGameLauncher extends Scene {
    constructor() {
        super('MiniGameLauncher');
        this.currentMiniGame = null;
        this.onEndCallback = null;
    }

    init(data) {
        this.currentMiniGameClass = data.miniGameClass; 
        this.onEndCallback = data.onEnd;
    }

    create() {
        if (!this.currentMiniGameClass) {
            return;
        }

        this.cameras.main.setZoom(0.7);
        this.cameras.main.setScroll(0, 0);

        const canvasWidth = this.scale.width;
        const canvasHeight = this.scale.height;
        this.cameras.main.centerOn(canvasWidth / 2, canvasHeight / 2);

        // Créer une instance du mini-jeu
        this.currentMiniGame = new this.currentMiniGameClass(this);

        // Lancer le mini-jeu
        this.currentMiniGame.start((success) => {
            this.scene.stop();
            if (this.onEndCallback) this.onEndCallback(success);
        });
    }
}
