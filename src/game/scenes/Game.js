import {Scene} from 'phaser';
import {OddOneOutMiniGame} from '../minigames/OddOneOutMiniGame';
import {MemoryGameMiniGame} from '../minigames/MemoryGameMiniGame';
import {HangmanMiniGame} from '../minigames/HangmanMiniGame';
import {EventBus} from "@/game/EventBus.js";
import { SwitchPuzzleMiniGame } from '../minigames/SwitchPuzzleMiniGame';
import { MathPuzzleMiniGame } from '../minigames/MathPuzzleMiniGame ';

export class Game extends Scene
{
    constructor (user, socket, missions)
    {
        super('Game');
        this.state = {}
        this.missions = missions
        this.socket = socket
        this.lastDirection = 'down';
        this.burnout = 0;
        this.burnoutMax = 100;
        this.timeLimit = 600;  // 15 minutes en secondes
        this.timeRemaining = this.timeLimit;  // Temps restant
        this.completedMissions = {};
        this.user = user
        this.countdown = '3'
        this.isGameStarted = false
        this.computers = []
        this.isBlocked = false

        //piège début
        this.canPlaceTrap = true; // Vérifie si un imposteur peut poser un piège
        this.trapCooldown = 20000; // Temps de recharge en ms (20 secondes)
        this.trapDuration = 20000; // Durée de l'effet du piège en ms
        this.piegeIndex = null
        //piège fin
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
        const scene = this

        const platforms = this.physics.add.staticGroup();
        this.otherPlayers = this.physics.add.group()

        scene.socket.on("setState", function (state) {
            scene.state = state
            console.log(scene.state)
        });

        this.socket.on("currentPlayers", function (arg) {
            const { players, numPlayers } = arg;
            scene.state.numPlayers = numPlayers;
            Object.keys(players).forEach(function (id) {
                if (players[id].playerId === scene.user.token) {
                    //scene.addPlayer(scene, players[id]);
                } else {
                    scene.addOtherPlayers(scene, players[id]);
                }
            });
        })

        this.socket.on("playerMoved", function (playerInfo) {
            scene.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    scene.movePlayer(playerInfo, otherPlayer)
                }
            });
        });

        this.socket.on(this.user.token, function (data) {
            EventBus.emit('vired', true)
            this.isBlocked = true
        });

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
        this.miniGames = [HangmanMiniGame, OddOneOutMiniGame, MemoryGameMiniGame, SwitchPuzzleMiniGame, MathPuzzleMiniGame];

        this.interactionText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY , '', {
            fontSize: '15px',
            fill: '#ffffff',
            backgroundColor: 'transparent',
            padding: { x: 10, y: 5 },
            align: 'center',
            resolution: 1
        }).setOrigin(0.5, 0).setScrollFactor(0);

        

        // debug des collisions
        // const debugGraphics = this.add.graphics().setAlpha(0.75);
        // wallsLayer.renderDebug(debugGraphics, {
        //     tileColor: null,
        //     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
        //     faceColor: new Phaser.Display.Color(40, 39, 37, 255)

        // });

        this.player = this.physics.add.sprite(160, 160, 'perso');
        this.player.body.setSize(this.player.width /4 , this.player.height / 4); // Adapte la taille à la moitié si besoin
        this.player.body.setOffset(7,15);
        this.player.setScale(1.5)

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, wallsLayer);

        this.physics.add.existing(this.player);


        this.playerNameText = this.add.text(this.player.x, this.player.y - 30, this.user.pseudo, {
            font: '5px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            resolution: 1
        }).setOrigin(1, 0);

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
                this.zoneLabels.setText(roomName)
                EventBus.emit('room', roomName)
            });
        });

        // Afficher les hitboxes des interrupteurs
        //this.physics.world.createDebugGraphic();

        let currentInteractable = null;  // Stocke l'objet avec lequel le joueur peut interagir

        this.input.keyboard.on('keydown-E', () => {
            if (currentInteractable) {
                const { sprite, type } = currentInteractable;

                if (type === 'interupteur') {
                    const newTexture = sprite.texture.key === 'interupteurOnTexture' ? 'interupteurOffTexture' : 'interupteurOnTexture';
                    sprite.setTexture(newTexture);
                    this.interactionText.setText('');
                } else if (type === 'bottle') {
                    if (this.user.is_impostor) {
                        if (!this.state.isLaxatif) {
                            this.socket.emit('setWater', {roomKey: this.state.roomKey, value: true})
                        }
                        this.infectedBottles = true;
                        EventBus.emit('laxative-added', { bottle: sprite }); // Notifie que la bouteille est infectée
                        this.interactionText.setText('Laxatif ajouté avec succès.');
                    } else {
                        if (this.state.isLaxatif) {
                            this.socket.emit('setWater', {roomKey: this.state.roomKey, value: false})
                            this.handleLaxativeEffect(); // Applique l'effet au joueur
                            this.interactionText.setText('Vous avez été affecté par les laxatifs !');
                            this.burnout = this.burnout / 2;
                        } else {
                            // Un innocent consomme une bouteille saine
                            this.interactionText.setText('Vous avez bu de l’eau saine.');
                            this.burnout = 0;
                        }
                        EventBus.emit('burn-out', {value: (this.burnout / this.burnoutMax) * 100})
                    }
                } else if (type === 'computer') {
                    if (sprite.texture.key === 'computerOn') {
                        // Filtrer les missions non terminées
                        const availableMiniGames = this.miniGames.filter(
                            (miniGame) => !this.completedMissions[miniGame.name]
                        );

                        let filteredMissions = this.missions
                            .map((item, index) => ({ item, index }))
                            .filter(({ item }) => item.isTour)
                        console.log(filteredMissions)
                        if (filteredMissions.length === 0) {
                            this.interactionText.setText('Toutes les missions ont été terminées !');
                            return;
                        }
                        filteredMissions = filteredMissions[0]
                        
                        this.startMiniGame(this, filteredMissions.item.miniGame, sprite, filteredMissions.index); // Passer le sprite de l’ordinateur
                    }
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
                if (this.user.is_impostor) {
                    if (this.state.isLaxatif) {
                        this.setInteraction(sprite, 'bottle', 'Bouteille déjà contaminée');
                    } else {
                        this.setInteraction(sprite, 'bottle', 'Appuyez sur E pour ajouter laxatif');
                    }
                } else {
                    const message = 'Appuyez sur E pour consommer la bouteille';
                    this.setInteraction(sprite, 'bottle', message);
                }
            });
        });

        const randomIndex = Phaser.Math.Between(0, computerLayer.objects.length - 1);

        computerLayer.objects.forEach((obj, index) => {
            const isOn = index === randomIndex;
            const textureKey = isOn ? 'computerOn' : 'computerOff';

            const sprite = this.add.sprite(obj.x, obj.y, textureKey).setOrigin(0, 1).setInteractive();
            this.computers.push({
                sprite,
                isOn
            })
            this.physics.add.existing(sprite, true);

            if (isOn && !this.user.is_impostor) {
                this.physics.add.overlap(this.player, sprite, () => {
                    this.setInteraction(sprite, 'computer', 'Appuyez sur E pour jouer au mini-jeu');
                });
            }
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

        // Compteur du début du jeu
        this.countdownText = this.add.text(150, 150, this.countdown, {
            font: '32px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5, 0.5);

        this.time.delayedCall(1000, () => {
            this.countdown = '2';
            this.countdownText.setText(this.countdown);
        });

        this.time.delayedCall(2000, () => {
            this.countdown = '1';
            this.countdownText.setText(this.countdown);
        });

        this.time.delayedCall(3000, () => {
            this.countdown = 'GO';
            this.countdownText.setText(this.countdown);
            this.isGameStarted = true;
            this.time.delayedCall(500, () => {
                this.countdownText.setAlpha(0);
            });
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

        //piège début
        this.traps = this.physics.add.group();
        this.trapCooldownRemaining = 0;
        EventBus.on('place-trap', () => {
            // mettre event socket en emit
            const data = {
                roomKey: this.state.roomKey,
                piege: {
                    x: this.player.x,
                    y: this.player.y
                }
            }
            this.socket.emit('addPiege', (data))
        });
        
        // socket .on => this.placeTrap
        this.socket.on('refreshPiege', (state) => {
            this.state = state
            this.state.pieges.forEach((piege, index) => {
                this.piegeIndex = index
                this.placeTrap(piege);
            });
        });

        //piège fin
    }

    startMiniGame(scene, miniGameClass, computerSprite, indexMission) {
        this.scene.launch('MiniGameLauncher', {
            miniGameClass: miniGameClass,
            onEnd: (success) => {
                if (success) {
                    console.log('Mini-jeu réussi !');
                    this.completedMissions[miniGameClass.name] = true;
                    EventBus.emit('missionCompleted', indexMission);
                    this.socket.emit("successMission", {roomKey: this.state.roomKey, playerKey: this.user.token})
                    
                    const offComputers = this.computers.filter(computer => !computer.isOn)
                    
                    const onComputerIndex = this.computers.findIndex(computer => computer.isOn)
                    this.computers[onComputerIndex].isOn = false

                    const randomIndex = Math.floor(Math.random() * offComputers.length);
                    const indexNewComputer = this.computers.findIndex(computer => computer === offComputers[randomIndex] )
                    this.computers[indexNewComputer].sprite.setTexture('computerOn')
                    this.physics.add.overlap(this.player, this.computers[indexNewComputer].sprite, () => {
                        this.setInteraction(this.computers[indexNewComputer].sprite, 'computer', 'Appuyez sur E pour jouer au mini-jeu');
                    });
                    
                    this.computers[indexNewComputer].isOn = true
                    
                    computerSprite.setTexture('computerOff');
                    computerSprite.disableInteractive();
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
                        this.scene.resume();
                    });

                    console.log('Mini-jeu échoué.');
                }
            }
        });
    }

    update() {
        this.lightMask.clear();

        // Rayon du cercle de lumière
        const gradientRadius = 75;

        // Dessiner un cercle avec un dégradé pour simuler la lumière
        for (let r = gradientRadius; r > 0; r -= 10) {
            const alpha = r / gradientRadius; // Alpha décroissant
            this.lightMask.fillStyle(0xffffff, alpha); // Blanc avec transparence
            this.lightMask.fillCircle(this.player.x - 13, this.player.y -3, r); // Centrer le cercle sur le joueur
        }
        
        if (!this.isGameStarted) {
            // Si le jeu n'a pas commencé, empêcher le mouvement du joueur
            return;
        }
        const scene = this

        if (this.timeRemaining > 0) {
            this.timeRemaining -= 1 / 60; // Décrémenter de 1/60e chaque frame
        }

        if (isNaN(this.timeRemaining)) {
            this.timeRemaining = 0;  // Remise à zéro si NaN
        }

        const minutes = Math.floor(this.timeRemaining / 60);  // Extraire les minutes
        const seconds = Math.floor(this.timeRemaining % 60);  // Extraire les secondes

        EventBus.emit('time', {minutes: String(minutes).padStart(2, '0'), seconds: String(seconds).padStart(2, '0')})

        if ((this.timeRemaining <= 590 || this.timeRemaining <= 250) && !this.pauseTriggered) { // Exemple : à 4 minutes restantes
            this.pauseTriggered = true; // Empêcher la pause d’être déclenchée plusieurs fois
            this.handleGamePause(); // Appeler la fonction de pause
        }
        
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;  // On fixe le timer à 0 quand il est écoulé
            // Vous pouvez ajouter ici une action pour la fin du jeu, comme arrêter les mouvements ou afficher un message
            this.player.setVelocity(0, 0);
            EventBus.emit('time-end', this.state)
            this.scene.pause()
        }

        if (this.burnout < this.burnoutMax) {
            this.burnout += 0.005; // Augmenter le burnout progressivement avec le temps
        }

        this.player.setVelocity(0);
        let velocityX = 0;
        let velocityY = 0;
        let lastAnim = 'stop';

        if (this.zoneLabels.text === 'Fun Room' && this.burnout > 0) {
            this.burnout -= 0.01;
        }
        
        if (!this.isBlocked) {
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
        }

        if (velocityX !== 0 && velocityY !== 0) {
            const diagonalSpeed = 80 / Math.sqrt(2);
            velocityX *= diagonalSpeed / 80;
            velocityY *= diagonalSpeed / 80;
        }

        if (this.playerNameText) {
            this.playerNameText.setPosition(this.player.x, this.player.y - 30);
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
        
        // burn out
        if (!this.user.is_impostor) {
            if (!this.isBlocked) {
                if (this.burnout >= this.burnoutMax) {
                    EventBus.emit('burn-out-max', true)
                    this.socket.emit('userBurnOut', {roomKey: this.state.roomKey, playerKey: this.user.token})
                    this.isBlocked = true
                }
                EventBus.emit('burn-out', {value: (this.burnout / this.burnoutMax) * 100})
            }
        }
        
        
        
        // logique de mouvement en ws
        var x = this.player.x;
        var y = this.player.y;
        if (
            this.player.oldPosition &&
            (x !== this.player.oldPosition.x ||
                y !== this.player.oldPosition.y)
        ) {
            this.moving = true;
            this.socket.emit("playerMovement", {
                x: this.player.x,
                y: this.player.y,
                roomKey: scene.state.roomKey,
                playerKey: scene.user.token,
                velocityX,
                velocityY
            });
        }
        // save old position data
        this.player.oldPosition = {
            x: this.player.x,
            y: this.player.y,
            rotation: this.player.rotation,
        };
        
        //piège début
        this.physics.add.overlap(this.player, this.traps, (player, trap) => {
            if (!trap.active) return;
            if (this.user.is_impostor) {
                return;
            }
            EventBus.emit('isTrapped', true);
            this.socket.emit('usePiege', {roomKey: this.state.roomKey, index: this.piegeIndex})
            // Désactive le piège pour éviter les collisions répétées
            trap.destroy();

            // Immobilise le joueur
            player.setVelocity(0);
            this.isBlocked = true;

            // Affiche un message temporaire d'immobilisation
            const immobilizedText = this.add.text(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                'Vous êtes pris dans un piège !',
                {
                    fontSize: '24px',
                    fill: '#ff0000',
                    backgroundColor: '#000000',
                    padding: { x: 10, y: 5 },
                }
            ).setOrigin(0.5);
            this.piegeIndex = null
            this.startTrapCooldown()

            // Délai pour libérer le joueur après la durée du piège
            let remainingTime = this.trapDuration / 1000; // Convertir en secondes
            const timer = this.time.addEvent({
                delay: 1000,
                callback: () => {
                    remainingTime--;
                    immobilizedText.setText(`Vous êtes pris dans un piège !\nTemps restant : ${remainingTime}s`);

                    if (remainingTime <= 0) {
                        timer.remove(false);
                        immobilizedText.destroy();
                        this.isBlocked = false; // Libère le joueur
                    }
                },
                loop: true,
            });
        });
        //piège fin     
    }

    addPlayer(scene, playerInfo) {
        scene.joined = true;
        scene.player = scene.physics.add
            .sprite(playerInfo.x, playerInfo.y, "perso")
            .setOrigin(0.5, 0.5)
            .setSize(30, 40)
            .setOffset(0, 24);
    }
    addOtherPlayers(scene, playerInfo) {
        const otherPlayer = scene.physics.add.sprite(
            playerInfo.x + 40,
            playerInfo.y + 40,
            "perso"
        ).setOrigin(0.5, 0.5)
            .setSize(30, 40)
            .setOffset(0, 24);
        otherPlayer.playerId = playerInfo.playerId;
        scene.otherPlayers.add(otherPlayer);
    }

    movePlayer (playerInfo, otherPlayer) {
        const oldX = otherPlayer.x;
        const oldY = otherPlayer.y;
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);

        if (playerInfo.velocityX < 0) {
            otherPlayer.anims.play('left', true);
        } else if (playerInfo.velocityX > 0) {
            otherPlayer.anims.play('right', true);
        } else if (playerInfo.velocityY < 0) {
            otherPlayer.anims.play('up', true);
        } else if (playerInfo.velocityY > 0) {
            otherPlayer.anims.play('down', true);
        } else {
            otherPlayer.anims.play('turn', true);
        }
    }

    handleGamePause() {
        EventBus.emit('pauseGame', {status: true, stateRoom: this.state})
        this.scene.pause()
        setTimeout(() => {
            EventBus.emit('pauseGame', {status: false})
            this.scene.resume()
        }, 60000);
    }

    //piège début
    placeTrap(piege) {
        if (piege.isUse) {
            return
        }
        if (this.user.is_impostor) {
            this.startCoolDownImpostor()
            return
        }
        if (this.canPlaceTrap) {
            const trap = this.add.rectangle(piege.x, piege.y, 32, 32, 0x000000);
            this.physics.add.existing(trap); // Active la physique sur cet objet
            trap.body.setAllowGravity(false); // Pas de gravité sur le piège
            trap.body.setImmovable(true); // Le piège ne bouge pas
            trap.active = true; // Marque le piège comme actif
            this.traps.add(trap);

            EventBus.emit('trap-placed', { x: trap.x, y: trap.y });

            this.canPlaceTrap = false;
            this.trapCooldownRemaining = this.trapCooldown / 1000; // Initialisez le cooldown en secondes
        }
    }
    
    startCoolDownImpostor () {
        console.log('toto imposteur')
        let trapCooldownTimer
        let trapCooldownRemaining = 20
        trapCooldownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (trapCooldownRemaining > 0) {
                    trapCooldownRemaining--;
                    EventBus.emit('trap-cooldown-update', trapCooldownRemaining);

                    if (trapCooldownRemaining <= 0) {
                        EventBus.emit('trap-ready');
                    }
                }
            },
            loop: true,
        });
    }
    startTrapCooldown() {
        console.log('toto player')
        if (this.trapCooldownTimer) {
            this.trapCooldownTimer.remove(false); // Évitez les doublons
        }
        this.trapCooldownRemaining = this.trapDuration / 1000
        this.trapCooldownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.trapCooldownRemaining > 0) {
                    this.trapCooldownRemaining--;
                    EventBus.emit('trap-cooldown-update', this.trapCooldownRemaining);

                    if (this.trapCooldownRemaining <= 0) {
                        this.canPlaceTrap = true;
                        EventBus.emit('isTrapped', false);
                        this.trapCooldownTimer.remove(false);
                        this.trapCooldownTimer = null; // Nettoie la référence
                    }
                }
            },
            loop: true,
        });
    }

    handleLaxativeEffect() {
        const innocentPlayer = this.player;

        // Immobilise le joueur
        innocentPlayer.setVelocity(0);
        this.isBlocked = true;

        // Déclenche l'effet visuel
        EventBus.emit('laxative-effect-start', true);

        // Téléportation après l'effet
        const teleportPosition = { x: 250, y: 550 };
        innocentPlayer.setPosition(teleportPosition.x, teleportPosition.y);
        let remainingTime = 30;
        const countdownTimer = this.time.addEvent({
            delay: 1000, // 1 seconde
            callback: () => {
                remainingTime--;

                EventBus.emit('laxative-effect-update', remainingTime);
                // Vérifie si le temps est écoulé
                if (remainingTime <= 0) {
                    countdownTimer.remove(false); // Arrête le timer
                    EventBus.emit('laxative-effect-end', false); // Fin de l'effet
                    this.isBlocked = false; // Libère le joueur
                }
            },
            loop: true,
        });
    }
}
