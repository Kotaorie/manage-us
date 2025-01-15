import { Scene } from 'phaser';

export class HangmanMiniGame {
    constructor(scene) {
        this.scene = scene;
        this.name = 'Hangman';
        this.wordList = ['phaser', 'javascript', 'pendu', 'jeu', 'code'];
        this.selectedWord = '';
        this.displayedWord = [];
        this.remainingLives = 7;
        this.guessedLetters = [];
        this.onEndCallback = null;
    }

    start(onEndCallback) {
        this.onEndCallback = onEndCallback;

        this.initGame();
    }

    initGame() {
        // Choisir un mot aléatoire
        this.selectedWord = Phaser.Utils.Array.GetRandom(this.wordList);
        this.displayedWord = Array(this.selectedWord.length).fill('_');
        this.remainingLives = 7;
        this.guessedLetters = [];

        // Nettoyer la scène
        this.scene.children.removeAll();

        const { width, height } = this.scene.scale;

        // Ajouter le fond noir
        this.scene.add.rectangle(width / 2, height / 2, width * 0.25, height * 0.30, 0x000000).setOrigin(0.5);

        this.livesText = this.scene.add.text(width * 0.38, height * 0.40, `Jeu du pendu :`, {
            fontSize: Math.max(12, width * 0.008),
            fill: '#fff',
            resolution : 1
        });

        // Afficher les vies tout en haut
        this.livesText = this.scene.add.text(width * 0.38, height * 0.43, `Vies : ❤️ x ${this.remainingLives}`, {
            fontSize: Math.max(12, width * 0.008),
            fill: '#fff',
            resolution : 1
        });

        // Afficher le mot sous forme de tirets, descendu légèrement
        this.wordText = this.scene.add.text(
            width * 0.50,
            height * 0.46,
            this.displayedWord.join(' '),
            { fontSize: Math.max(18, width * 0.012), fill: '#fff' }
        ).setOrigin(0.5);

        // Créer les lettres interactives (clavier) plus bas
        this.createLetterButtons();
    }

    createLetterButtons() {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const { width, height } = this.scene.scale;
        const buttonSize = Math.max(16, width * 0.02);
        const spacing = buttonSize + 8;
        const rows = Math.ceil(letters.length / 10);
        const keyboardHeight = rows * spacing;

        const startX = width * 0.38;
        const startY = height * 0.5;

        letters.split('').forEach((letter, index) => {
            const x = startX + (index % 10) * spacing;
            const y = startY + Math.floor(index / 10) * spacing;

            const letterButton = this.scene.add.text(x, y, letter, {
                fontSize: `${buttonSize}px`,
                fill: '#fff'
            }).setInteractive({ useHandCursor: true });

            letterButton.on('pointerdown', () => this.handleGuess(letter, letterButton));
        });
    }

    handleGuess(letter, button) {
        if (this.guessedLetters.includes(letter)) return; // Ignorer les lettres déjà devinées
        this.guessedLetters.push(letter);
        button.setInteractive(false).setFill('#888'); // Désactiver le bouton

        if (this.selectedWord.includes(letter)) {
            // Mettre à jour le mot affiché
            this.selectedWord.split('').forEach((char, index) => {
                if (char === letter) {
                    this.displayedWord[index] = letter;
                }
            });

            this.wordText.setText(this.displayedWord.join(' '));

            // Vérifier si le joueur a gagné
            if (!this.displayedWord.includes('_')) {
                this.onEndCallback(true); // Fin avec succès
            }
        } else {
            // Mauvaise lettre, réduire les vies
            this.remainingLives--;
            this.livesText.setText(`Vies : ❤️ x ${this.remainingLives}`);

            if (this.remainingLives === 0) {
                this.onEndCallback(false); // Fin sans succès
            }
        }
    }
}
