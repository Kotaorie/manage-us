import EasyStar from 'easystarjs';

let easystar = new EasyStar.js();
let tileWidth = 32;  // Largeur d'une tuile
let tileHeight = 32; // Hauteur d'une tuile

let grid = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Fonction pour déplacer le joueur automatiquement
// Fonction pour déplacer le joueur automatiquement
export function autoMovePlayer(player, targetX, targetY) {
    const startX = Math.floor(player.x / tileWidth);
    const startY = Math.floor(player.y / tileHeight);
    const endX = Math.floor(targetX / tileWidth);
    const endY = Math.floor(targetY / tileHeight);

    easystar.setGrid(grid);
    easystar.setAcceptableTiles([0]); // Les tuiles traversables (0)

    // Calcul du chemin
    easystar.findPath(startX, startY, endX, endY, path => {
        if (path === null) {
            console.log("No path found.");
        } else {
            moveAlongPath(player, path, 80, tileWidth, tileHeight); // Passer aussi les dimensions des tuiles
        }
    });

    easystar.calculate(); // Lance le calcul du chemin
}


function moveAlongPath(player, path, speed, tileWidth, tileHeight) {
    if (path && path.length > 1) {
        const nextPoint = path[1];  // Aller au premier point suivant dans le chemin

        // Calculer la direction vers le prochain point
        const deltaX = (nextPoint.x * tileWidth) - player.x;
        const deltaY = (nextPoint.y * tileHeight) - player.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 0) {
            // Normaliser la direction et appliquer la vitesse
            const velocityX = (deltaX / distance) * speed;
            const velocityY = (deltaY / distance) * speed;

            // Appliquer la vitesse au joueur avec setVelocity
            player.setVelocity(velocityX, velocityY);

            // Vérifier si le joueur est proche du point suivant
            if (distance <= 2) {  // Si la distance est suffisamment petite
                path.shift();  // Enlever le point actuel du chemin
            }
        }
    }
}
