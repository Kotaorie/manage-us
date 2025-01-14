import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.image('tiles', 'assets/tiles/wall.png');
        this.load.image('object', 'assets/tiles/object.png');
        this.load.tilemapTiledJSON('map', 'assets/tiles/map.json');
        this.load.spritesheet('perso', 'assets/perso1.png', { frameWidth: 44, frameHeight: 44, margin: 20, spacing: 20  });
    }

    create ()
    {
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('wall_1', 'tiles');
        const objectset = map.addTilesetImage('exterieur', 'object');
        map.createLayer('Grounds', tileset);
        map.createLayer('Objects', objectset);
        const wallsLayer = map.createLayer('Walls', tileset);
        wallsLayer.setCollisionByProperty({ collides: true });  

        // debug des collisions
        // const debugGraphics = this.add.graphics().setAlpha(0.75);
        // wallsLayer.renderDebug(debugGraphics, {
        //     tileColor: null,
        //     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
        //     faceColor: new Phaser.Display.Color(40, 39, 37, 255)

        // });

        const platforms = this.physics.add.staticGroup();
        this.player = this.physics.add.sprite(100, 450, 'perso');
        this.player.setScale(0.8) 
        this.player.setSize(15, 15);
        this.player.setOffset(4, 13);

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, wallsLayer);

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

        this.cursors = this.input.keyboard.createCursorKeys();
        this.physics.add.collider(this.player, platforms);


        this.cameras.main.setBounds(-160, -102, 1920, 1080);
        this.cameras.main.startFollow(this.player);
    }

    update() {
        this.player.setVelocity(0);
    
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-80);
            this.player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(80);
            this.player.anims.play('right', true);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(80);
            this.player.anims.play('down', true);
        } else if (this.cursors.up.isDown) {
            this.player.setVelocityY(-80);
            this.player.anims.play('up', true);
        } else {
            this.player.anims.play('turn', true);
        }
    }
    
}
