import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.spritesheet('perso', 'assets/perso1.png', { frameWidth: 44, frameHeight: 44, margin: 20, spacing: 20  });
    }

    create ()
    {
        this.add.image(400, 300, 'sky');

        const platforms = this.physics.add.staticGroup();
        this.player = this.physics.add.sprite(100, 450, 'perso');
        this.player.setScale(2.0) 
        this.player.setSize(20, 27);
        this.player.setOffset(0, 0);

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true); 

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('perso', { start: 6, end: 11 }),
            frameRate: 10,  // Ajustez pour une vitesse d'animation confortable
            repeat: -1     // Répéter indéfiniment pendant que le joueur se déplace
        });
        
        this.anims.create({
            key: 'turn',
            frames: [ { key: 'perso', frame: 6 } ],
            frameRate: 20
        });
        
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('perso', { start: 12, end: 17 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers('perso', { start: 18, end: 23 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers('perso', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        platforms.create(600, 400, 'ground');
        platforms.create(50, 250, 'ground');
        platforms.create(750, 220, 'ground');

        this.cursors = this.input.keyboard.createCursorKeys();
        this.physics.add.collider(this.player, platforms);

        this.cameras.main.setBounds(0, 0, 1600, 1200);  // Remplacez par la taille de votre carte
        this.cameras.main.startFollow(this.player);
    }

    update() {
        this.player.setVelocity(0);
    
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(160);
            this.player.anims.play('down', true);
        } else if (this.cursors.up.isDown) {
            this.player.setVelocityY(-160);
            this.player.anims.play('up', true);
        } else {
            this.player.anims.play('turn', true);
        }
    }
    
}
