import { Scene } from 'phaser';

export class MemoryGameMiniGame {
    constructor(scene) {
        this.scene = scene;
        this.name = 'MemoryGame';
        this.score = 0;
        this.flippedCards = []; 
        this.matchedPairs = 0;  
        this.totalPairs = 6;    
    }

    start(onEndCallback) {

        const miniGameWidth = 200;
        const miniGameHeight = 200;

        this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            miniGameWidth,
            miniGameHeight,
            0x000000
        ).setOrigin(0.5);

        const cardKeys = ['star', 'bomb', 'pc', 'chaise', 'mission', 'papillon'];
        const cards = Phaser.Utils.Array.Shuffle([...cardKeys, ...cardKeys]); 

        const cardWidth = 40;
        const cardHeight = 40;
        const cardSpacing = 10;
        const columns = 4;
        const rows = Math.ceil(cards.length / columns);

        const startX = (this.scene.scale.width - (columns * (cardWidth + cardSpacing))) / 2;
        const startY = (this.scene.scale.height - (rows * (cardHeight + cardSpacing))) / 2;

        cards.forEach((key, index) => {
            const x = startX + (index % columns) * (cardWidth + cardSpacing);
            const y = startY + Math.floor(index / columns) * (cardHeight + cardSpacing);

            const card = this.scene.add.image(x, y, 'back') 
                .setDisplaySize(cardWidth, cardHeight)
                .setInteractive();

            card.setData('key', key);       
            card.setData('flipped', false);

            card.on('pointerdown', () => this.flipCard(card, onEndCallback));
        });
    }

    flipCard(card, onEndCallback) {
        if (this.flippedCards.length < 2 && !card.getData('flipped')) {
            card.setData('flipped', true);
            card.setTexture(card.getData('key')) 
                .setDisplaySize(40, 40); 
            this.flippedCards.push(card);

            if (this.flippedCards.length === 2) {
                this.checkMatch(onEndCallback);
            }
        }
    }

    checkMatch(onEndCallback) {
        const [card1, card2] = this.flippedCards;
    
        if (card1.getData('key') === card2.getData('key')) {
            this.matchedPairs++;
            this.score += 10;
            this.flippedCards = [];
    
            if (this.matchedPairs === this.totalPairs) {
                onEndCallback(true); 
            }
        } else {
            this.scene.time.delayedCall(1000, () => {
                card1.setData('flipped', false);
                card2.setData('flipped', false);
                card1.setTexture('back').setDisplaySize(40, 40);
                card2.setTexture('back').setDisplaySize(40, 40);
                this.flippedCards = [];
            });
        }
    }
}
