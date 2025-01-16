import { Scene } from 'phaser';
import { OddOneOutMiniGame } from '../minigames/OddOneOutMiniGame';
import { MemoryGameMiniGame } from '../minigames/MemoryGameMiniGame';
import { HangmanMiniGame } from '../minigames/HangmanMiniGame';
import { SwitchPuzzleMiniGame } from '../minigames/SwitchPuzzleMiniGame';
import { MathPuzzleMiniGame } from '../minigames/MathPuzzleMiniGame ';

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
        this.completedMissions = {};
        this.roomLighting = {};
        this.currentRoomName = null;
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
        this.load.spritesheet('animated_sink', 'assets/Objects/sink_animated.png', { frameWidth: 32, frameHeight: 32 });
        this.load.tilemapTiledJSON('map', 'assets/tiles/map1.json');
        this.load.spritesheet('perso', 'assets/perso1.png', { frameWidth: 44, frameHeight: 44, margin: 20, spacing: 20  });

        this.load.image('mission', 'assets/minigames/memory/mission.png');
        this.load.image('pc', 'assets/minigames/memory/pc.png');
        this.load.image('chaise', 'assets/minigames/memory/chair.png');
        this.load.image('object', 'assets/minigames/memory/object.png');
        this.load.image('star', 'assets/minigames/memory/star.png');
        this.load.image('bomb', 'assets/minigames/memory/bomb.png');
        this.load.image('papillon', 'assets/minigames/memory/papillon.png');
    }

    create ()
    {
        const map = this.make.tilemap({ key: 'map' });
        const button = this.add.image('interupteurOnTexture').setInteractive();
        const computer = this.add.image('computerOn').setInteractive();
        const bottle = this.add.image('bottle').setInteractive();
        const sink = this.add.image('sink').setInteractive();
        const sink_water = this.add.sprite(100, 100, 'animated_sink').setInteractive();
        const roomZones = map.getObjectLayer('RoomZones');
        const bathroom =  map.addTilesetImage('bathroom', 'bathroom');
        const generic =  map.addTilesetImage('generic', 'generic');
        const jail =  map.addTilesetImage('jail', 'jail');
        const kitchen =  map.addTilesetImage('kitchen', 'kitchen');
        const builder =  map.addTilesetImage('room_builder', 'room_builder');
        map.createLayer('Grounds', builder);
        map.createLayer('ObjetCachet', [bathroom, generic, jail, kitchen]);
        const wallsLayer = map.createLayer('Walls', builder);
        wallsLayer.setCollisionByProperty({ collides: true });  
        map.createLayer('ObjetVisible2', [bathroom, generic, jail, kitchen]);
        map.createLayer('ObjetVisible', [bathroom, generic, jail, kitchen]);
        const interupteurLayer = map.getObjectLayer('Interupteur');
        const bottleLayer = map.getObjectLayer('Bottle');
        const computerLayer = map.getObjectLayer('Computer');
        const sinkLayer = map.getObjectLayer('Sink');
        this.miniGames = [SwitchPuzzleMiniGame, MathPuzzleMiniGame, HangmanMiniGame, MemoryGameMiniGame, OddOneOutMiniGame];

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
                this.currentRoomName = roomName;
                this.zoneLabels.setText(roomName);
                console.log(`Joueur est maintenant dans la zone : ${roomName}`);

            });
        });

        // Afficher les hitboxes des interrupteurs
        //this.physics.world.createDebugGraphic();

        let currentInteractable = null;  // Stocke l'objet avec lequel le joueur peut interagir

        this.input.keyboard.on('keydown-E', () => {
            if (currentInteractable) {
                const { sprite, type } = currentInteractable;
        
                if (type === 'interupteur') {
                    if (!this.currentRoomName) {
                        console.warn('Aucune pièce détectée pour le joueur.');
                        return;
                    }
        
                    const room = this.roomLighting[this.currentRoomName];
        
                    if (!room) {
                        console.warn(`La pièce ${this.currentRoomName} n'est pas définie dans roomLighting.`);
                        return;
                    }
        
                    // Inverser l'état de l'interrupteur
                    room.isOn = !room.isOn;
                    const newTexture = room.isOn ? 'interupteurOnTexture' : 'interupteurOffTexture';
                    sprite.setTexture(newTexture);
        
                    // Mettre à jour l'éclairage
                    this.updateRoomLighting(this.currentRoomName);
                } else if (type === 'bottle') {
                    this.interactionText.setText('Laxatif ajouté');
                } else if (type === 'computer') {
                    if (sprite.texture.key === 'computerOn') {
                        const availableMiniGames = this.miniGames.filter(
                            miniGame => !this.completedMissions[miniGame.name]
                        );
        
                        if (availableMiniGames.length === 0) {
                            this.interactionText.setText('Toutes les missions ont été terminées !');
                            return;
                        }
        
                        const randomIndex = Phaser.Math.Between(0, availableMiniGames.length - 1);
                        const selectedMiniGame = availableMiniGames[randomIndex];
                        this.startMiniGame(selectedMiniGame, sprite);
                    }
                }
        
                currentInteractable = null;
            }
        });                      
        
        // Définir les couches interactives
        interupteurLayer.objects.forEach(obj => {
            // Assurez-vous de récupérer la propriété `room_name` en vérifiant son existence
            const roomName = obj.properties?.find(p => p.name === 'room_name')?.value || 'unknown';
        
            const isOn = obj.properties?.find(p => p.name === 'check')?.value || false;
            const textureKey = isOn ? 'interupteurOnTexture' : 'interupteurOffTexture';
            const sprite = this.add.sprite(obj.x, obj.y, textureKey).setOrigin(0, 1).setInteractive();
        
            this.physics.add.existing(sprite, true);
            this.physics.add.overlap(this.player, sprite, () => {
                this.setInteraction(sprite, 'interupteur', 'Appuyez sur E pour interagir');
            });
        
            // Si la pièce est inconnue, on ne fait rien
            if (roomName === 'unknown') return;
        
            // Stocker l'état et la zone associée dans `this.roomLighting`
            if (!this.roomLighting[roomName]) {
                this.roomLighting[roomName] = { interupteur: sprite, isOn, zone: null };
            }
        
            // Associer l'interrupteur à la zone correspondante
            this.roomLighting[roomName].zone = roomZones.objects.find(zone => 
                zone.properties?.find(p => p.name === 'room_name')?.value === roomName
            );
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
            const textureKey = 'computerOn';
            const sprite = this.add.sprite(obj.x, obj.y, textureKey).setOrigin(0, 1).setInteractive();
            this.physics.add.existing(sprite, true);
            this.physics.add.overlap(this.player, sprite, () => {
                if (sprite.texture.key === 'computerOn') { 
                    this.setInteraction(sprite, 'computer', 'Appuyez sur E pour jouer au mini-jeu');
                }
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
                    const currentTexture = sprite.texture.key;
                    const newTexture = currentTexture === 'sink' ? 'animated_sink' : 'sink';
                    this.interactionText.setText('Innondation en cours');
                    sprite.setTexture(newTexture);
                });
            });
        }
        );

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

        //lumières

        // Calque noir global couvrant toute la carte
        this.darknessOverlay = this.add.graphics();
        this.darknessOverlay.fillStyle(0x000000, 1); // Noir opaque
        this.darknessOverlay.fillRect(0, 0, map.widthInPixels, map.heightInPixels);

        // Masque dynamique pour le cercle de lumière autour du joueur
        this.lightMask = this.make.graphics(); // Masque pour découper la lumière

        // Appliquer le masque normal (pas inversé)
        const mask = new Phaser.Display.Masks.GeometryMask(this, this.lightMask);
        mask.setInvertAlpha(true); // Inversion du masque pour cacher tout sauf le cercle de lumière
        this.darknessOverlay.setMask(mask);


    }

    startMiniGame(miniGameClass, computerSprite) {
        this.scene.launch('MiniGameLauncher', {
            miniGameClass: miniGameClass,
            onEnd: (success) => {
                if (success) {
                    console.log('Mini-jeu réussi !');
                    this.completedMissions[miniGameClass.name] = true;  // Marquer la mission comme terminée
    
                    // Éteindre l'écran
                    computerSprite.setTexture('computerOff');
                    computerSprite.disableInteractive();  // Désactiver l'interaction avec cet écran
                } else {
                    const loseText = this.add.text(
                        this.cameras.main.centerX,
                        this.cameras.main.centerY,
                        'Vous avez perdu ! Réessayez...',
                        {
                            fontSize: '24px',
                            fill: '#ff0000',
                            backgroundColor: '#000000',
                            padding: { x: 10, y: 5 }
                        }
                    ).setOrigin(0.5).setScrollFactor(0);
                    

                    this.time.delayedCall(3000, () => {
                        loseText.destroy();
                    });

                    console.log('Mini-jeu échoué.');
                }
    
            }
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
        
        //lumières
        this.lightMask.clear();

        // Rayon du cercle de lumière
        const gradientRadius = 75;

        // Dessiner un cercle avec un dégradé pour simuler la lumière
        for (let r = gradientRadius; r > 0; r -= 10) {
            const alpha = r / gradientRadius; // Alpha décroissant
            this.lightMask.fillStyle(0xffffff, alpha); // Blanc avec transparence
            this.lightMask.fillCircle(this.player.x - 13, this.player.y -3, r); // Centrer le cercle sur le joueur
        }
    }
    
    updateRoomLighting(roomName) {
        const room = this.roomLighting[roomName];
    
        if (!room || !room.zone) {
            console.warn(`Zone introuvable pour la pièce : ${roomName}`);
            return;
        }
    
        const { x, y, width, height } = room.zone;
    
        if (room.isOn) {
            // Éclairer la pièce
            this.darknessOverlay.clear();
            this.darknessOverlay.fillStyle(0x000000, 0); // Transparence
            this.darknessOverlay.fillRect(x, y, width, height);
        } else {
            // Assombrir la pièce
            this.darknessOverlay.fillStyle(0x000000, 1); // Noir opaque
            this.darknessOverlay.fillRect(x, y, width, height);
        }
    }
    
}
