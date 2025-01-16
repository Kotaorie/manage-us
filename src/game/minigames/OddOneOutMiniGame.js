import { Scene } from 'phaser';

export class OddOneOutMiniGame {
    constructor(scene) {
        this.scene = scene;
        this.name = 'OddOneOut';
        this.currentRound = 1;
        this.totalRounds = 5;
        this.onEndCallback = null;
    }

    start(onEndCallback) {
        this.onEndCallback = onEndCallback;
        this.launchRound();
    }

    launchRound() {

        this.scene.children.removeAll();

        this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            this.scene.scale.width,
            this.scene.scale.height,
            0x000000
        ).setOrigin(0.5);

        this.scene.add.text(10, 10, `Manches : ${this.currentRound} / ${this.totalRounds}`, {
            fontSize: '16px',
            fill: '#fff'
        }).setOrigin(0, 0);

        const wordSets = [
            { category: 'Méthodes', words: ['Scrum', 'Kanban', 'Football'] },
            { category: 'Outils', words: ['Jira', 'Trello', 'Figma'] },
            { category: 'Rôles', words: ['Scrum Master', 'Product Owner', 'Pilote'] },
            { category: 'Agile', words: ['Sprint', 'Backlog', 'Écran'] },
            { category: 'Planning', words: ['Planning Poker', 'Daily', 'Bicyclette'] },
            { category: 'Tests', words: ['Test unitaire', 'Test de régression', 'pause café'] },
            { category: 'Livraison', words: ['Démo', 'Release', 'Avion'] },
            { category: 'Communication', words: ['Slack', 'Email', 'Kanban'] },
            { category: 'Stratégie', words: ['Roadmap', 'Vision', 'Orange'] },
            { category: 'Collaboration', words: ['Pair programming', 'Code review', 'Cuisine'] }
        ];

        const selectedSet = Phaser.Utils.Array.GetRandom(wordSets);
        const intruderIndex = 2; // L'intrus est toujours le 3e mot de la liste
        const intruderWord = selectedSet.words[intruderIndex];

        const shuffledWords = Phaser.Utils.Array.Shuffle([...selectedSet.words]);

        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;

        this.scene.add.text(centerX, centerY - 80, `Trouvez l'intrus :`, {
            fontSize: '20px',
            fill: '#fff'
        }).setOrigin(0.5);

        const spacing = 40;
        const startY = centerY - (shuffledWords.length - 1) * spacing / 2;

        shuffledWords.forEach((word, index) => {
            const x = centerX;
            const y = startY + index * spacing;
            const text = this.scene.add.text(x, y, word, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
            text.setInteractive({ useHandCursor: true });


            text.on('pointerdown', () => {
                if (word === intruderWord) {
                    
                    if (this.currentRound === this.totalRounds) {
                        this.onEndCallback(true);
                    } else {
                        this.currentRound++;
                        this.launchRound();  
                    }
                } else {
                    this.onEndCallback(false);
                }
            });
        });
    }
}
