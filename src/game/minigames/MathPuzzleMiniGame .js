import { Scene } from 'phaser';

export class MathPuzzleMiniGame {
    constructor(scene) {
        this.scene = scene;
        this.name = 'MathPuzzle';
        this.timer = null;
        this.timeLeft = 10; // Temps limite (en secondes) par calcul
        this.currentEquation = null; // L'équation actuelle
        this.answer = null; // Réponse correcte
        this.currentRound = 1; // Calcul actuel
        this.totalRounds = 5; // Nombre total de calculs
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
        
        // Titre
        this.scene.add.text(this.scene.scale.width / 2.25, this.scene.scale.height / 2.5, 'Calcul mental.', {
            fontSize: `20px`,
            fill: '#ffffff',
            resolution : 1
        }).setOrigin(0.5);

        // Indicateur de round
        this.roundText = this.scene.add.text(width / 2, height * 0.2, `Calcul ${this.currentRound} / ${this.totalRounds}`, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Afficher l'équation
        this.equationText = this.scene.add.text(width / 2, height / 2, '', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Zone d'entrée utilisateur
        this.inputField = this.scene.add.text(width / 2, height * 0.6, '_', {
            fontSize: '28px',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        this.scene.input.keyboard.on('keydown', this.handleInput, this);

        // Timer
        this.timerText = this.scene.add.text(width / 2, height * 0.8, `Temps restant : ${this.timeLeft}s`, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Générer une équation
        this.generateEquation();

        // Début du timer
        this.startTimer();
    }

    generateEquation() {
        let equation, result;
    
        do {
            // Générer 3 nombres et 2 opérations aléatoires
            const num1 = Phaser.Math.Between(1, 10);
            const num2 = Phaser.Math.Between(1, 10);
            const num3 = Phaser.Math.Between(1, 10);
            const operations = ['+', '-', '*'];
            const op1 = operations[Phaser.Math.Between(0, operations.length - 1)];
            const op2 = operations[Phaser.Math.Between(0, operations.length - 1)];
    
            // Construire l'équation
            equation = `${num1} ${op1} ${num2} ${op2} ${num3}`;
    
            // Calculer la réponse
            result = eval(equation);
    
        } while (result < 0 || !Number.isInteger(result)); // Répéter jusqu'à ce que le résultat soit positif et entier
    
        this.answer = result; // Stocker la réponse correcte
        this.currentEquation = equation; // Stocker l'équation
        this.equationText.setText(this.currentEquation); // Afficher l'équation
    }
    

    handleInput(event) {
        const key = event.key;

        // Si l'utilisateur appuie sur "Enter", vérifier la réponse
        if (key === 'Enter') {
            const userAnswer = parseFloat(this.inputField.text);
            if (userAnswer === this.answer) {
                this.onCorrectAnswer();
            } else {
                this.onLose();
            }
        }
        // Si l'utilisateur appuie sur "Backspace", effacer un caractère
        else if (key === 'Backspace') {
            this.inputField.setText(this.inputField.text.slice(0, -1) || '_');
        }
        // Si l'utilisateur tape un chiffre ou un point pour les décimaux
        else if (!isNaN(key) || key === '.') {
            if (this.inputField.text === '_') {
                this.inputField.setText(key);
            } else {
                this.inputField.setText(this.inputField.text + key);
            }
        }
    }

    startTimer() {
        this.timer = this.scene.time.addEvent({
            delay: 1000, // Une seconde
            callback: () => {
                this.timeLeft -= 1;
                this.timerText.setText(`Temps restant : ${this.timeLeft}s`);

                if (this.timeLeft <= 0) {
                    this.onLose();
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    stopTimer() {
        if (this.timer) {
            this.timer.remove();
        }
    }

    onCorrectAnswer() {
        this.stopTimer();

        if (this.currentRound < this.totalRounds) {
            // Passer au calcul suivant
            this.currentRound++;
            this.timeLeft = 15;
            this.roundText.setText(`Calcul ${this.currentRound} / ${this.totalRounds}`);
            this.inputField.setText('_');
            this.generateEquation();
            this.startTimer();
        } else {
            // Victoire après avoir répondu aux 5 calculs
            this.onWin();
        }
    }

    onWin() {
        this.stopTimer();
        this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height * 0.7, 'Bravo ! Vous avez gagné !', {
            fontSize: '24px',
            fill: '#00ff00'
        }).setOrigin(0.5);

        this.scene.time.delayedCall(2000, () => {
            if (this.onEndCallback) this.onEndCallback(true); // Fin avec succès
        });
    }

    onLose() {
        this.stopTimer();
        this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height * 0.7, 'Dommage ! Mauvaise réponse ou temps écoulé.', {
            fontSize: '24px',
            fill: '#ff0000'
        }).setOrigin(0.5);

        this.scene.time.delayedCall(2000, () => {
            if (this.onEndCallback) this.onEndCallback(false); // Fin avec échec
        });
    }
}
