import { Scene } from 'phaser';

export class SwitchPuzzleMiniGame {
    constructor(scene) {
        this.scene = scene;
        this.name = 'SwitchPuzzle';
        this.lights = [];   // Liste des ampoules
        this.switches = []; // Liste des interrupteurs
        this.onEndCallback = null;
        this.tileSize = 60; // Taille fixe des ampoules et interrupteurs
        this.textSize = 20; // Taille fixe des textes

        // Relations interrupteur => ampoules (Solution : 0 et 3)
        this.interrupterEffects = [
            [0, 1], // Interrupteur 0 contrôle les ampoules 0 et 1
            [1],    // Interrupteur 1 contrôle uniquement l'ampoule 1
            [2],    // Interrupteur 2 contrôle uniquement l'ampoule 2
            [2, 3]  // Interrupteur 3 contrôle les ampoules 2 et 3
        ];

        // Solution unique (combinaison des interrupteurs activés)
        this.solution = [0, 3]; // Solution exacte : interrupteurs 0 et 3
    }

    start(onEndCallback) {
        this.onEndCallback = onEndCallback;
        this.initGame();
    }

    initGame() {
        const { width, height } = this.scene.scale;

        // Nettoyer la scène
        this.scene.children.removeAll();

        // Ajouter le fond noir
        this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            this.scene.scale.width,
            this.scene.scale.height,
            0x000000
        ).setOrigin(0.5);
        
        // Titre du jeu
        this.scene.add.text(this.scene.scale.width / 2.15, this.scene.scale.height / 2.5, 'Jeu des interrupteurs : Allumez tous les voyants.', {
            fontSize: `${this.textSize}px`,
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Créer la configuration des ampoules et interrupteurs
        this.createPuzzle(width, height);
    }

    createPuzzle(width, height) {
        const startX = width / 2 - 1.5 * this.tileSize;
        const startY = height / 2 - this.tileSize;

        // Créer 4 ampoules
        for (let i = 0; i < 4; i++) {
            const light = this.scene.add.rectangle(
                startX + i * this.tileSize * 1.5,
                startY,
                this.tileSize,
                this.tileSize,
                0xff0000 // Rouge (éteint) par défaut
            ).setOrigin(0.5);

            this.lights.push({ rect: light, state: false });
        }

        // Créer 4 interrupteurs
        for (let i = 0; i < 4; i++) {
            const switchText = this.scene.add.text(
                startX + i * this.tileSize * 1.5,
                startY + this.tileSize * 1.5,
                'O', // Éteint par défaut
                { fontSize: `${this.textSize}px`, fill: '#ffffff' }
            ).setOrigin(0.5).setInteractive({ useHandCursor: true });

            switchText.on('pointerdown', () => this.toggleSwitch(i));
            this.switches.push(switchText);
        }
    }

    toggleSwitch(index) {
        const switchText = this.switches[index];

        // Inverser l'état du switch
        const newState = switchText.text === 'O' ? '1' : 'O';
        switchText.setText(newState);

        // Appliquer les effets sur les ampoules
        this.interrupterEffects[index].forEach((lightIndex) => {
            this.toggleLight(lightIndex);
        });

        // Vérifier si toutes les ampoules sont allumées
        if (this.isWinningCombination()) {
            this.scene.time.delayedCall(500, () => {
                this.onEndCallback(true); // Victoire
            });
        }
    }

    toggleLight(index) {
        const light = this.lights[index];
        light.state = !light.state;

        // Changer la couleur de l'ampoule
        light.rect.setFillStyle(light.state ? 0x00ff00 : 0xff0000); // Vert pour allumé, rouge pour éteint
    }

    isWinningCombination() {
        // Vérifie si l'état des interrupteurs correspond à la solution unique
        const activeSwitches = this.switches
            .map((switchText, index) => (switchText.text === '1' ? index : null))
            .filter(index => index !== null);

        return JSON.stringify(activeSwitches) === JSON.stringify(this.solution);
    }
}
