import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
        this.lastDirection = 'down';
        this.burnout = 0;
        this.burnoutMax = 100;
        this.timeLimit = 900;  // 15 minutes en secondes
        this.timeRemaining = this.timeLimit;  // Temps restant
        this.timerText = null; // Texte qui affichera le timer
    }

    preload ()
    {
        this.load.image('tiles', 'assets/tiles/wall_32.png');
        this.load.image('object', 'assets/tiles/object_32.png');
        this.load.tilemapTiledJSON('map', 'assets/tiles/map1.json');
        this.load.spritesheet('perso', 'assets/perso1.png', { frameWidth: 44, frameHeight: 44, margin: 20, spacing: 20  });
    }

    create ()
    {
        const map = this.make.tilemap({ key: 'map' });
        const roomZones = map.getObjectLayer('RoomZones');
        const tileset = map.addTilesetImage('wall_32', 'tiles');
        const objectset = map.addTilesetImage('object_32', 'object');
        map.createLayer('Grounds', tileset);
        map.createLayer('Objects', objectset);
        const wallsLayer = map.createLayer('Walls', tileset);
        wallsLayer.setCollisionByProperty({ collides: true });  

        this.graphics = this.add.graphics();
        this.graphics.fillStyle(0x000000);
        this.graphics.fillRoundedRect(10, 10, 100, 12, 5); // Position et taille de la barre
        this.hpBar = this.graphics.fillRoundedRect(10, 10, (this.burnout / this.burnoutMax) * 100, 12, 5);
        this.graphics.setPosition(this.cameras.main.centerX -300, this.cameras.main.centerY - 150).setScrollFactor(0);

        // debug des collisions
        // const debugGraphics = this.add.graphics().setAlpha(0.75);
        // wallsLayer.renderDebug(debugGraphics, {
        //     tileColor: null,
        //     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
        //     faceColor: new Phaser.Display.Color(40, 39, 37, 255)

        // });

        const platforms = this.physics.add.staticGroup();
        this.player = this.physics.add.sprite(200, 50, 'perso');
        this.player.setScale(1) 
        this.player.setSize(15, 15);
        this.player.setOffset(4, 13);

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, wallsLayer);
        

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('perso', { start: 6, end: 11 }),
            frameRate: 10, 
            repeat: -1
        });
        
        this.anims.create({
            key: 'stop',
            frames: [ { key: 'perso', frame: 4 } ],
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
        this.cameras.main.startFollow(this.player);

        this.zoneLabels = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 150, '', {
            fontSize: '15px',
            fill: '#ffffff',
            backgroundColor: 'transparent',
            padding: { x: 10, y: 5 },
            align: 'center',
            resolution: 1
        }).setOrigin(0.5, 0).setScrollFactor(0);

        this.timerText = this.add.text(this.cameras.main.centerX + 250, this.cameras.main.centerY - 150, '15:00', {
            fontSize: '15px',
            fill: '#ffffff',
            backgroundColor: 'transparent',	
            padding: { x: 10, y: 5 },
            align: 'center',
            resolution: 1
        }).setOrigin(0.5, 0).setScrollFactor(0);

        let isInZone = false;

        roomZones.objects.forEach(zone => {
            const zoneArea = this.add.rectangle(zone.x, zone.y, zone.width, zone.height)
                .setOrigin(0)
                .setVisible(false);
    
            this.physics.add.existing(zoneArea, true);
            this.physics.add.overlap(this.player, zoneArea, () => {
                isInZone = true;
                const roomName = zone.properties.find(p => p.name === 'room_name')?.value || 'Zone inconnue';
                this.zoneLabels.setText(roomName);
            });
        });
    
        this.time.addEvent({
            delay: 100,
            callback: () => {
                if (!isInZone) {
                    this.zoneLabels.setText('');
                }
                isInZone = false;
            },
            loop: true
        });
    }

    update() {

        if (this.timeRemaining > 0) {
            this.timeRemaining -= 1 / 60; // Décrémenter de 1/60e chaque frame
        }

        if (isNaN(this.timeRemaining)) {
            this.timeRemaining = 0;  // Remise à zéro si NaN
        }

        const minutes = Math.floor(this.timeRemaining / 60);  // Extraire les minutes
        const seconds = Math.floor(this.timeRemaining % 60);  // Extraire les secondes

        this.timerText.setText(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);

        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;  // On fixe le timer à 0 quand il est écoulé
            this.timerText.setText('00:00');  // Afficher "00:00"
            // Vous pouvez ajouter ici une action pour la fin du jeu, comme arrêter les mouvements ou afficher un message
            this.player.setVelocity(0, 0);
        }
        
        if (this.burnout < this.burnoutMax) {
            this.burnout += 0.005; // Augmenter le burnout progressivement avec le temps
        }
        
        this.player.setVelocity(0);
        let velocityX = 0;
        let velocityY = 0;
        let lastAnim = 'stop';

        if (this.zoneLabels.text === 'Fun Room' && this.burnout > 0) {
            this.burnout -= 0.3;
        }


        
        if (this.cursors.left.isDown) {
            velocityX = -80;
            lastAnim = 'left';
            if(this.burnout < this.burnoutMax) {
                this.burnout += 0.01;
            }
        }
        if (this.cursors.right.isDown) {
            velocityX = 80;
            lastAnim = 'right';
            if(this.burnout < this.burnoutMax) {
                this.burnout += 0.01;
            }
        }
        if (this.cursors.up.isDown) {
            velocityY = -80;
            lastAnim = 'up';
            if(this.burnout < this.burnoutMax) {
                this.burnout += 0.01;
            }
        }
        if (this.cursors.down.isDown) {
            velocityY = 80;
            lastAnim = 'down';
            if(this.burnout < this.burnoutMax) {
                this.burnout += 0.01;
            }
        }
        
        if (velocityX !== 0 && velocityY !== 0) {
            const diagonalSpeed = 80 / Math.sqrt(2);
            velocityX *= diagonalSpeed / 80;
            velocityY *= diagonalSpeed / 80;
        }

        this.player.setVelocity(velocityX, velocityY);

        if (velocityX !== 0 || velocityY !== 0) {
            this.player.anims.play(lastAnim, true);
            this.lastDirection = lastAnim;
        } else {
            const stopFrame = {
                left: 11,
                right: 17,
                up: 23,
                down: 5
            };
            this.player.setFrame(stopFrame[this.lastDirection]);
        }

        this.graphics.clear(); // Effacer le dessin précédent
        this.graphics.fillStyle(0x808080); // Fond gris
        this.graphics.fillRoundedRect(10, 10, 100, 12, 5); // Redessiner le fond
        
        // Redessiner la barre de burnout avec la nouvelle largeur en fonction des points de burnout restants
        this.graphics.fillStyle(0xffa500);
        this.graphics.fillRoundedRect(10, 10, (this.burnout / this.burnoutMax) * 100, 12, 5);
        
    }
    
}
