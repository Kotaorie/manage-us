import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    preload ()
    {
       this.load.image('tiles', 'assets/tiles/wall_1.png');
    }

    create ()
    {
    }

    update() {
    }
    
}
