import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor (user, socket)
    {
        super('Game');
        this.user = user
        this.countdown = '3'
        this.isGameStarted = false
        this.state = {}
        this.socket = socket
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
        const scene = this


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
        this.otherPlayers = this.physics.add.group()

        this.socket.on("setState", function (state) {
            console.log('state : ', state)
            const { roomKey, players, numPlayers } = state;

            scene.state.roomKey = roomKey;
            scene.state.players = players;
            scene.state.numPlayers = numPlayers;
            console.log(scene.state)
        });
        
        this.socket.on("currentPlayers", function (arg) {
            const { players, numPlayers } = arg;
            console.log('currentPlayers')
            scene.state.numPlayers = numPlayers;
            Object.keys(players).forEach(function (id) {
                console.log('player : ', players[id])
                if (players[id].playerId === scene.user.token) {
                    //scene.addPlayer(scene, players[id]);
                } else {
                    scene.addOtherPlayers(scene, players[id]);
                }
            });
        })

        this.socket.on("playerMoved", function (playerInfo) {
            console.log('Player Moved')
            scene.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    scene.movePlayer(playerInfo, otherPlayer)
                }
            });
        });
        
        this.player = this.physics.add.sprite(200, 50, 'perso');
        this.player.setScale(0.8) 
        this.player.setSize(15, 15);
        this.player.setOffset(4, 13);

        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, wallsLayer);

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

        // Compteur du début du jeu
        this.countdownText = this.add.text(200, 50, this.countdown, {
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
    }

    update() {
        if (!this.isGameStarted) {
            // Si le jeu n'a pas commencé, empêcher le mouvement du joueur
            return;
        }
        const scene = this
        this.player.setVelocity(0);
        
        let velocityX = 0;
        let velocityY = 0;
        
        if (this.cursors.left.isDown) {
            velocityX = -80;
        }
        if (this.cursors.right.isDown) {
            velocityX = 80;
        }
        if (this.cursors.up.isDown) {
            velocityY = -80;
        }
        if (this.cursors.down.isDown) {
            velocityY = 80;
        }
        
        if (velocityX !== 0 && velocityY !== 0) {
            const diagonalSpeed = 80 / Math.sqrt(2);
            velocityX *= diagonalSpeed / 80;
            velocityY *= diagonalSpeed / 80;
        }

        this.player.setVelocity(velocityX, velocityY);

        if (velocityX < 0) {
            this.player.anims.play('left', true);
        } else if (velocityX > 0) {
            this.player.anims.play('right', true);
        } else if (velocityY < 0) {
            this.player.anims.play('up', true);
        } else if (velocityY > 0) {
            this.player.anims.play('down', true);
        } else {
            this.player.anims.play('turn', true);
        }

        if (this.playerNameText) {
            this.playerNameText.setPosition(this.player.x, this.player.y - 30);
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
    
}
