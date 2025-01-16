import { Scene } from 'phaser';
import { autoMovePlayer } from '../autoMove';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
        this.lastDirection = 'down';
        this.burnout = 1;
        this.burnoutMax = 60;
        this.timeLimit = 610;  // 15 minutes en secondes
        this.timeRemaining = this.timeLimit;  // Temps restant
        this.timerText = null; // Texte qui affichera le timer
        this.stopTime = false;  // Arrêter le temps à la fin du jeu
        this.positionSuicie = [352, 64]
        this.lastRoom = '';
    }

    preload ()
    {
        this.load.image('room_builder', 'assets/tiles/Room_Builder_32x32.png');
        this.load.image('bathroom', 'assets/tiles/bathroom.png');
        this.load.image('generic', 'assets/tiles/generic.png');
        this.load.image('jail', 'assets/tiles/jail.png');
        this.load.image('kitchen', 'assets/tiles/kitchen.png');
        this.load.image('interupteurOnTexture', 'assets/Objects/Interupteur_2.png');
        this.load.image('interupteurOffTexture', 'assets/Objects/Interupteur_1.png');
        this.load.image('computerOn', 'assets/Objects/Computer_1.png');
        this.load.image('computerOff', 'assets/Objects/Computer_2.png');
        this.load.image('bottle', 'assets/Objects/bottle.png');
        this.load.image('sink', 'assets/Objects/sink.png');
        this.load.spritesheet('water', 'assets/tiles/animated_water.png', { frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('animated_sink', 'assets/Objects/sink_animated.png', { frameWidth: 64, frameHeight: 32 });
        this.load.tilemapTiledJSON('map', 'assets/tiles/map1.json');
        this.load.spritesheet('perso', 'assets/perso1.png', { frameWidth: 44, frameHeight: 44, margin: 20, spacing: 20  });
    }

    create ()
    {
        const map = this.make.tilemap({ key: 'map' });
        const roomZones = map.getObjectLayer('RoomZones');
        const bathroom =  map.addTilesetImage('bathroom', 'bathroom');
        const generic =  map.addTilesetImage('generic', 'generic');
        const jail =  map.addTilesetImage('jail', 'jail');
        const kitchen =  map.addTilesetImage('kitchen', 'kitchen');
        const builder =  map.addTilesetImage('room_builder', 'room_builder');
        const groundsLayer = map.createLayer('Grounds', builder);
        map.createLayer('ObjetCachet', [bathroom, generic, jail, kitchen]);
        const wallsLayer = map.createLayer('Walls', builder);
        wallsLayer.setCollisionByProperty({ collides: true });  
        map.createLayer('ObjetVisible2', [bathroom, generic, jail, kitchen]);
        map.createLayer('ObjetVisible', [bathroom, generic, jail, kitchen]);
        const interupteurLayer = map.getObjectLayer('Interupteur');
        const bottleLayer = map.getObjectLayer('Bottle');
        const computerLayer = map.getObjectLayer('Computer');
        const sinkLayer = map.getObjectLayer('Sink');

         this.interactionText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY , '', {
            fontSize: '15px',
            fill: '#ffffff',
            backgroundColor: 'transparent',
            padding: { x: 10, y: 5 },
            align: 'center',
            resolution: 1
        }).setOrigin(0.5, 0).setScrollFactor(0);
         

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
        this.player.body.setSize(this.player.width /4 , this.player.height / 4); // Adapte la taille à la moitié si besoin
        this.player.body.setOffset(7,15);
        this.player.setScale(1.5) 

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, wallsLayer);

        this.physics.add.existing(this.player);
        

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

        this.anims.create({
            key: 'sink',
            frames: this.anims.generateFrameNumbers('animated_sink', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'animated_water',
            frames: this.anims.generateFrameNumbers('water', { start: 0, end: 7 }),
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
        let isInteracting = false;

        roomZones.objects.forEach(zone => {
            const zoneArea = this.add.rectangle(zone.x, zone.y, zone.width, zone.height)
                .setOrigin(0)
                .setVisible(false);
    
            this.physics.add.existing(zoneArea, true);
            this.physics.add.overlap(this.player, zoneArea, () => {
                isInZone = true;
                const roomName = zone.properties.find(p => p.name === 'room_name')?.value || 'Zone inconnue';
                if (this.lastRoom !== roomName) {
                    if(this.lastRoom === 'Meeting Room' && this.stopTime) {
                        this.stopTime = false;
                        this.timeRemaining = this.timeRemaining - 10;
                    }
                    this.lastRoom = roomName;
                }
                this.zoneLabels.setText(roomName);
            });
        });

        // Afficher les hitboxes des interrupteurs
        this.physics.world.createDebugGraphic();

        let currentInteractable = null;  // Stocke l'objet avec lequel le joueur peut interagir

        this.input.keyboard.on('keydown-E', () => {
            if (currentInteractable) {
                const { sprite, type } = currentInteractable;
        
                if (type === 'interupteur') {
                    const newTexture = sprite.texture.key === 'interupteurOnTexture' ? 'interupteurOffTexture' : 'interupteurOnTexture';
                    sprite.setTexture(newTexture);
                    this.interactionText.setText('');
                } else if (type === 'bottle') {
                    this.interactionText.setText('Laxatif ajouté');
                } else if (type === 'computer') {
                    const newTexture = sprite.texture.key === 'computerOn' ? 'computerOff' : 'computerOn';
                    sprite.setTexture(newTexture);
                    this.interactionText.setText('Ordinateur allumé');
                }
                currentInteractable = null;  // Réinitialiser après interaction
            }
        });
        
        // Définir les couches interactives
        interupteurLayer.objects.forEach(obj => {
            const isOn = obj.properties.find(p => p.name === 'check')?.value || false;
            const textureKey = isOn ? 'interupteurOnTexture' : 'interupteurOffTexture';
            const sprite = this.add.sprite(obj.x, obj.y, textureKey).setOrigin(0, 1).setInteractive();
            this.physics.add.existing(sprite, true);
            this.physics.add.overlap(this.player, sprite, () => {
                this.setInteraction(sprite, 'interupteur', 'Appuyez sur E pour interagir');
            });
        });
        
        bottleLayer.objects.forEach(obj => {
            const sprite = this.add.sprite(obj.x, obj.y, 'bottle').setOrigin(0, 1).setInteractive();
            this.physics.add.existing(sprite, true);
            this.physics.add.overlap(this.player, sprite, () => {
                this.setInteraction(sprite, 'bottle', 'Appuyez sur E pour ajouter le laxatif');
            });
        });
        
        computerLayer.objects.forEach(obj => {
            const isOn = obj.properties.find(p => p.name === 'play')?.value || false;
            const textureKey = isOn ? 'computerOn' : 'computerOff';
            const sprite = this.add.sprite(obj.x, obj.y, textureKey).setOrigin(0, 1).setInteractive();
            this.physics.add.existing(sprite, true);
            this.physics.add.overlap(this.player, sprite, () => {
                this.setInteraction(sprite, 'computer', 'Appuyez sur E pour allumer');
            });
        });
        
        // Fonction utilitaire pour définir une interaction
        this.setInteraction = (sprite, type, text) => {
            currentInteractable = { sprite, type };
            this.interactionText.setText(text);
        };
        

        sinkLayer.objects.forEach(obj => {
            const isOn = obj.properties.find(p => p.name === 'water')?.value || false;
            const textureKey = 'sink';
            const sprite = this.add.sprite(obj.x, obj.y, textureKey).setOrigin(0, 1).setInteractive();
            sprite.setSize(obj.width, obj.height);
            this.physics.add.existing(sprite, true);
            this.physics.add.overlap(this.player, sprite, () => {
            isInteracting = true;
            this.interactionText.setText('Appuyez sur E pour casser le lavabo');
            this.input.keyboard.on('keydown-E', () => {
                if (sprite.texture.key === 'sink') {
                console.log('Casser le lavabo');
                sprite.setTexture('animated_sink');
                sprite.play('sink');
                
                // Start flooding from bottom left to top right
                const floodTiles = groundsLayer.filterTiles(tile => tile.properties.flood);
                let floodIndex = 0;
                const floodStart = 298;
                const textureKey2 = 'water';
                console.log(groundsLayer.depth);
                const floodInterval = setInterval(() => {
                    let tileIndex = floodStart - floodIndex;
                    if (tileIndex >= 0 && tileIndex < floodTiles.length) {
                        const tile = floodTiles[tileIndex];
                        if (tile) {
                            console.log('Flood tile', tile.x, tile.y);
                            const sprite = this.add.sprite(tile.getCenterX(), tile.getCenterY(), textureKey2).setOrigin(0.5, 0.5).setInteractive();
                            sprite.setSize(tile.width, tile.height);
                            sprite.setScale(0.5); // Change the size of the texture
                            this.physics.add.existing(sprite, true);
                            sprite.setTexture('water');
                            sprite.play('animated_water');
                            sprite.setDepth(groundsLayer.depth + 1); // Set the depth to be above the ground layer
                        }
                        floodIndex++;
                    } else {
                        clearInterval(floodInterval);
                    }
                }, 100); // Adjust the interval time as needed

                groundsLayer.setCollisionByProperty({ collides: true });
                this.interactionText.setText('Innondation en cours');
                }
            });
            });
        });

        this.time.addEvent({
            delay: 100,
            callback: () => {
                if (!isInZone) {
                    this.zoneLabels.setText('');
                }
                isInZone = false;

                if (!isInteracting) {
                    this.interactionText.setText('');
                }
                isInteracting = false;
            },
            loop: true
        });
    }

    update() {

        if (this.timeRemaining > 0 && !this.stopTime) {
            this.timeRemaining -= 1 / 60;  // Décrémenter le temps
        }
    
        if (Math.round(this.timeRemaining) === 300 || Math.round(this.timeRemaining) === 600) {
            this.stopTime = true;
            this.interactionText.setText(`Il reste ${Math.round(this.timeRemaining / 60)} minutes\n réunion daily dans la meeting room`);
        } else if (Math.round(this.timeRemaining) === 0) {
            this.stopTime = true;
            this.interactionText.setText(`Il reste ${Math.round(this.timeRemaining / 60)} minutes\n dernière réunion (retro) dans la meeting room`);
        }
    
        if (isNaN(this.timeRemaining)) {
            this.timeRemaining = 0;  // Remise à zéro si NaN
        }
    
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        this.timerText.setText(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.timerText.setText('00:00');
            this.player.setVelocity(0, 0);
        }
        
       // Dans la méthode update() de votre jeu :
        if (this.burnout < this.burnoutMax) {
            this.burnout += 0.005;
        } else {
            const dx = this.positionSuicie[0] - this.player.x;
            const dy = this.positionSuicie[1] - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 5) {  // Vérification pour arrêter le mouvement
                // Continuez à appeler autoMovePlayer chaque frame
                autoMovePlayer(this.player, this.positionSuicie[0], this.positionSuicie[1]);
            } else {
                this.player.setVelocity(0, 0);  // Arrêter le joueur une fois la destination atteinte
                console.log('Vous avez atteint votre destination');
            }
            return;  // Ignorez les contrôles manuels lors du burnout max
        }

        // Gestion de la zone Fun Room
        if (this.zoneLabels.text === 'Fun Room' && Math.round(this.burnout) > 1) {
            this.burnout -= 0.1;
        }
    
        // Gestion des commandes du joueur
        let velocityX = 0;
        let velocityY = 0;
        let lastAnim = 'stop';
    
        if (this.cursors.left.isDown) {
            velocityX = -80;
            lastAnim = 'left';
            this.burnout = Math.min(this.burnout + 0.01, this.burnoutMax);
        }
        if (this.cursors.right.isDown) {
            velocityX = 80;
            lastAnim = 'right';
            this.burnout = Math.min(this.burnout + 0.01, this.burnoutMax);
        }
        if (this.cursors.up.isDown) {
            velocityY = -80;
            lastAnim = 'up';
            this.burnout = Math.min(this.burnout + 0.01, this.burnoutMax);
        }
        if (this.cursors.down.isDown) {
            velocityY = 80;
            lastAnim = 'down';
            this.burnout = Math.min(this.burnout + 0.01, this.burnoutMax);
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
            const stopFrame = { left: 11, right: 17, up: 23, down: 5 };
            this.player.setFrame(stopFrame[this.lastDirection]);
        }
    
        // Mise à jour de l'interface burnout
        this.graphics.clear();
        this.graphics.fillStyle(0x808080);
        this.graphics.fillRoundedRect(10, 10, 100, 12, 5);
        this.graphics.fillStyle(0xffa500);
        this.graphics.fillRoundedRect(10, 10, (this.burnout / this.burnoutMax) * 100, 12, 5);
    }
}
    