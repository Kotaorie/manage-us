<script setup>
import {onMounted, onUnmounted, ref, defineProps, computed} from 'vue';
import {EventBus} from './EventBus';
import StartGame from './main';
import {io} from "socket.io-client";

// Save the current scene instance
const scene = ref();
const game = ref();
const stateRoom = ref({})

const emit = defineEmits(['current-active-scene']);
const props = defineProps({
    user: {
        type: Object,
        required: true
    },
    socket: {
        type: Object,
        required: true
    },
    missions: {
        type: Object,
        required: true
    },
    roomKey: {
        type: String,
        required: true
    }
})

const isPause = ref(false)
const isResultVote = ref(false)
const result = ref(undefined)
const minute = ref('10')
const second = ref('00')
const burnOut = ref(0)
const isBurnOut = ref(false)
const isVired = ref(false)
const roomName = ref('')
const remainingTime = ref(50)
const isTimeEnd = ref(false)
const isLaxativeEffectActive = ref(false)
const timeLaxatif = ref(30)
const isAlertBurnout = ref(false)

onMounted(() => {

    game.value = StartGame('game-container', props.user, props.socket, props.missions);

    EventBus.on('current-scene-ready', (currentScene) => {

        emit('current-active-scene', currentScene);

        scene.value = currentScene;

    });
    
    props.socket.on('finishGame', (state) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        };

        // Faire l'appel API
        fetch(`${import.meta.env.VITE_URL_API}/api/game/finish/${state.roomKey}`, options)
            .then((res) => res.json())
            .then((data) => {
                window.location.href = `${import.meta.env.VITE_URL_FRONT}/result/${state.roomKey}/${props.user.token}`;
            })
            .catch((error) => {
                console.error('Erreur lors de l\'appel API:', error);
            });
    })

    EventBus.on('pauseGame', (value) => {
        isPause.value = value.status
        if (value.status) {
            console.log('on fait le dayli')
            stateRoom.value = value.stateRoom
            startCountdown(50)
            setTimeout(() => {
                console.log("récupération résultat");
                props.socket.emit('closeVote', stateRoom.value.roomKey)
            }, 50000)
        }
    });
    
    EventBus.on('time-end', (state) => {
        isTimeEnd.value = true
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Définir le type de contenu comme JSON
            },
            body: JSON.stringify(state) // Convertir l'objet state en JSON
        };

        // Faire l'appel API
        fetch(`${import.meta.env.VITE_URL_API}/api/game/finish/${state.roomKey}`, options)
            .then((res) => res.json()) // Traiter la réponse en tant que JSON (selon l'API)
            .then((data) => {
                setTimeout(() => {
                    window.location.href =  `${import.meta.env.VITE_URL_FRONT}/result/${state.roomKey}/${props.user.token}`; // Redirection après 3 secondes
                }, 3000);
            })
            .catch((error) => {
                console.error('Erreur lors de l\'appel API:', error); // Gestion des erreurs
            });
    })

    EventBus.on('time', (data) => {
        const {minutes, seconds} = data
        minute.value = minutes
        second.value = seconds
    });

    EventBus.on('alert-burn-out', (data) => {
        isAlertBurnout.value = data
    });

    EventBus.on('room', (data) => {
        roomName.value = data
    });

    EventBus.on('burn-out', (data) => {
        burnOut.value = data.value
    });
    EventBus.on('burn-out-max', (data) => {
        isBurnOut.value = data
    });

    EventBus.on('vired', (data) => {
        isVired.value = data
    });

    props.socket.on('setStateDayli', (data) => {
        console.log('setStateDayli : ', data)
        stateRoom.value = data
    })

    props.socket.on('resultVote', (data) => {
        console.log('resulVote : ', data)
        isResultVote.value = true
        result.value = data
    })

    EventBus.on('laxative-effect-start', (data) => {
        isLaxativeEffectActive.value = data;
    });

    EventBus.on('laxative-effect-end', (data) => {
        isLaxativeEffectActive.value = data;
    });

    EventBus.on('laxative-effect-update', (data) => {
        timeLaxatif.value = data;
    })

});

const isVote = ref(false)

async function vote(key) {
    console.log('je vote : ', key)
    props.socket.emit('vote', {userKey: key, roomKey: stateRoom.value.roomKey})
    isVote.value = true
}
function startCountdown(duration) {
    remainingTime.value = duration;
    const interval = setInterval(() => {
        if (remainingTime.value > 0) {
            remainingTime.value--;
        } else {
            clearInterval(interval);
        }
    }, 1000);
}
onUnmounted(() => {

    if (game.value) {
        game.value.destroy(true);
        game.value = null;
    }

});

//piège début
const isTrapped = ref(false);
const trapCooldownRemaining = ref(20);
const canPlaceTrap = ref(true);
EventBus.on('trap-cooldown-update', (cooldown) => {
    trapCooldownRemaining.value = cooldown;
});
EventBus.on('trap-ready', () => {
    canPlaceTrap.value = true;
});

EventBus.on('isTrapped', (data) => {
    isTrapped.value = data;
});
function placeTrap() {
    canPlaceTrap.value = false;
    setTimeout(() => {
        isTrapped.value = false;
    }, 20000);
    EventBus.emit('place-trap');
}
//piège fin

defineExpose({scene, game});
</script>

<template>
    <div id="game-container"></div>
    <div class="mission-map">
        <h2>Mission {{ !user.is_impostor ? 'Map' : 'Stagiaire' }}</h2>
        <ul v-if="!user.is_impostor">
            <li v-for="(mission, index) in missions" :key="index">
                <span v-if="mission.isFinish">✔</span>
                <span v-if="mission.isTour">> </span>
                {{ mission.name }}
                <span v-if="mission.isTour"> <</span>
            </li>
        </ul>
        <ul v-else>
            <li>Mettre du laxatif dans l'eau</li>
            <li>Casser lévier</li>
            <li>Eteindre la lumière</li>
        </ul>
    </div>
    <div v-if="isPause" class="div-pause" style="z-index: 9999">
        <div class="project">
            <p>Avancement projet</p>
            <div class="progress-container">
                <div class="progress-bar"
                     :style="{ width:  stateRoom.gameScore / stateRoom.victoryScore * 100 + '%' }"></div>
            </div>
            <div class="pourcentage">{{ Math.round(stateRoom.gameScore / stateRoom.victoryScore * 100) }}%</div>
        </div>
        <div class="text-pause">
            <p>Temps restant pour voter : {{ Math.floor(remainingTime / 60) }}:{{ String(remainingTime % 60).padStart(2, '0') }}</p>
            <p>Temps de Daily ! Vous avez une minute</p>
        </div>
        <div class="card-content">
            <h1>Un stagiaire sabote l'équipe !</h1>
            <h2>C’est l’heure du jugement : qui est le stagiaire à renvoyer ?</h2>
            <div v-if="!isResultVote" class="avatars">
                <div v-if="!isVote" v-for="(player, index) in stateRoom.players" :key="index" @click="vote(player.playerId)"
                     class="avatar">
                    <p>{{ player.pseudo }}</p>
                </div>
            </div>
            <div v-else>
                <span v-if="typeof result === 'string'">Aucun joueur éliminé</span>
                <span v-else>Joueur éliminé{{ result.pseudo }}</span>
            </div>
            <p>
                Nombre de vote : {{ stateRoom.numVote }} / {{ stateRoom.numPlayers }}
            </p>
        </div>
    </div>
    <div class="chrono">
        <span class="time">{{ minute }}:{{ second }}</span>
    </div>
    <div v-if="!props.user.is_impostor" class="burnout-container">
        <div class="burnout-bar">
            <div class="burnout-fill" :style="{ width: burnOut + '%' }"></div>
        </div>
        <p class="burnout-text">Burnout: {{ Math.round(burnOut) }}% <span v-if="isAlertBurnout" style="color: red">Burnout proche attention</span></p>
    </div>
    <div v-if="isBurnOut" class="gif-container">
        <p class="gif-text">Vous avez succombé au burnout... RIP votre motivation 😵</p>
        <img
            src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZXJsZ2prN24zb2dxNjYyazY5dnhidzNweWZkcWYyempuMndqczl5dSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/c6DIpCp1922KQ/giphy.gif"
            alt="Loading GIF" class="gif">
    </div>
    <div v-if="isVired" class="gif-container">
        <p class="gif-text">Vous avez été viré... sans pot de départ 😱</p>
        <img src="https://i.makeagif.com/media/4-01-2016/Jcq-nJ.gif" class="gif" alt="vous etes le maillon faible">
    </div>
    <div class="div-room">
        <p>{{ roomName }}</p>
    </div>
    <div v-if="isTimeEnd" class="game-over-card">
        <h1>⏰ Le temps est écoulé !</h1>
        <p>Malheureusement, le projet n'a pas pu être terminé à temps...</p>
        <p>Réunion post-mortem prévue à la machine à café ☕.</p>
    </div>
    <div class="trap-container" v-if="props.user.is_impostor">
        <button
            :disabled="!canPlaceTrap"
            @click="placeTrap"
            class="trap-button"
        >
            Poser un piège
        </button>
        <p v-if="!canPlaceTrap">
            Recharge du piège : {{ trapCooldownRemaining }}s
        </p>
        <div class="trap-cooldown-bar">
            <div
                class="trap-cooldown-fill"
                :style="{ width: `${(trapCooldownRemaining / 20) * 100}%` }"
            ></div>
        </div>
    </div>
    <div v-if="isTrapped" class="gif-container">
        <p class="gif-text">
            Vous êtes pris dans un piège !
            <br />
            Temps restant : {{ trapCooldownRemaining }}s
        </p>
        <img
            src="https://www.photofunky.net/output/image/d/6/6/b/d66b36/photofunky.gif"
            alt="Piège activé"
            class="trap-gif"
        />
    </div>
    <div v-if="isLaxativeEffectActive" class="gif-container">
        <p class="laxative-effect-text">
            Vous avez été piégé par des laxatifs ! <br />
            Temps restant : {{timeLaxatif}}s
        </p>
        <img
            src="https://media.tenor.com/1UPEsShuPpkAAAAM/thumbs-up-toilet.gif"
            alt="Laxative effect"
            class="gif"
        />
    </div>
</template>

<style>
.mission-map {
    position: absolute;
    top: 1rem;
    left: 1rem;
    width: 300px;
    padding: 1rem;
    background-color: rgba(0, 0, 0, 0.4);
    color: #fff;
    border: 2px solid #4caf50;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    font-family: Arial, sans-serif;
}

.mission-map h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    text-align: center;
    color: #4caf50;
}

.mission-map ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.mission-map li {
    margin: 0.5rem 0;
    font-size: 1rem;
    display: flex;
    align-items: center;
}

.div-pause {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    background-color: rgba(0, 0, 0, 0.9);
    color: #fff;
    border: 2px solid #ff5722;
    border-radius: 15px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
    text-align: center;
    padding: 2rem;
    font-family: Arial, sans-serif;
}

.project {
    margin-bottom: 1.5rem;
}

.project p {
    margin: 0 0 0.5rem;
    font-size: 1.2rem;
    color: #ffab91;
}

.progress-container {
    width: 100%;
    height: 20px;
    background-color: #444;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 0.5rem;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}

.progress-bar {
    height: 100%;
    background-color: #4caf50;
    transition: width 0.3s ease;
}

.pourcentage {
    font-size: 1rem;
    color: #ffccbc;
}

.text-pause {
    background-color: #ff5722;
    padding: 1rem;
    border-radius: 10px;
    margin-bottom: 1.5rem;
}

.text-pause p {
    margin: 0;
    font-size: 1.25rem;
    color: #fff;
}

.card-content h1 {
    font-size: 1.5rem;
    margin: 1rem 0;
    color: #ffab91;
}

.card-content h2 {
    font-size: 1.2rem;
    margin: 0.5rem 0 2rem;
    color: #ffccbc;
}

.avatars {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.avatar {
    width: 60px;
    height: 60px;
    background-color: #444;
    border: 2px solid #ffab91;
    border-radius: 10%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    transition: transform 0.3s ease, background-color 0.3s ease;
}

.avatar:hover {
    transform: scale(1.1);
    background-color: #ff5722;
}

.chrono {
    position: fixed;
    top: 10px; /* Un peu de marge depuis le haut */
    right: 10px; /* Un peu de marge depuis la droite */
    background-color: rgba(0, 0, 0, 0.7); /* Fond sombre avec opacité */
    color: #fff; /* Texte blanc */
    font-family: 'Arial', sans-serif;
    font-size: 2rem; /* Taille du texte */
    padding: 5px 15px; /* Espacement autour du texte */
    border-radius: 10px; /* Coins arrondis */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5); /* Ombre discrète */
}

.time {
    font-weight: bold; /* Mettre en gras le texte du chrono */
}

/* Conteneur de la jauge, centré à l'écran */
.burnout-container {
    position: fixed;
    top: 1%;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    font-family: Arial, sans-serif;
}

/* Barre de la jauge */
.burnout-bar {
    width: 80%; /* Largeur de la jauge (modifiable) */
    height: 30px; /* Hauteur de la jauge */
    background-color: #e0e0e0; /* Fond gris clair */
    border-radius: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); /* Ombre discrète */
    margin-bottom: 10px;
    overflow: hidden;
}

/* Remplissage de la jauge */
.burnout-fill {
    width: 60%; /* Pourcentage de burnout (modifiable dynamiquement) */
    height: 100%;
    background-color: #ff5722; /* Couleur de la jauge (orange-rouge) */
    transition: width 0.5s ease-out; /* Transition fluide pour l'animation */
}

/* Texte indiquant le pourcentage */
.burnout-text {
    font-size: 1.5rem;
    font-weight: bold;
    color: #6b6a6a;
}

/* Conteneur pour le GIF, centré au milieu de la page */
/* Conteneur pour le GIF et le texte, centré à l'écran */
.gif-container {
    position: fixed; /* Fixer le conteneur à la fenêtre */
    top: 50%; /* Centré verticalement */
    left: 50%; /* Centré horizontalement */
    transform: translate(-50%, -50%); /* Ajuster pour un véritable centrage */
    text-align: center; /* Centrer le texte à l'intérieur du conteneur */
    z-index: 9999; /* S'assurer que le contenu est au-dessus des autres éléments */
    background-color: rgba(0, 0, 0, 0.8); /* Fond semi-transparent pour plus de visibilité */
    padding: 20px;
    border-radius: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); /* Ombre discrète */
    color: white; /* Texte blanc pour le contraste */
}

/* Style pour le texte */
.gif-text {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 15px;
    color: #ffeb3b; /* Jaune vif pour le texte humoristique */
}

/* Taille du GIF */
.gif {
    width: 50vw; /* Largeur du GIF */
    height: auto; /* Garder les proportions du GIF */
    border-radius: 10px; /* Coins arrondis pour le GIF */
    border: 4px solid #ff5722; /* Bordure colorée pour le GIF */
}

.div-room {
    position: absolute;
    left: 50%;
    top: 10%;
    transform: translateX(-50%);
}
.div-room p {
    font-size: 1.5rem;
    color: white;
    font-weight: bold;
    text-transform: uppercase;
}

/* Conteneur centré pour la carte de fin de jeu */
.game-over-card {
    position: fixed; /* Fixe la carte au milieu de l'écran */
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%); /* Centrage parfait */
    background-color: rgba(0, 0, 0, 0.85); /* Fond sombre et semi-transparent */
    padding: 30px 40px; /* Espace interne pour un confort visuel */
    border-radius: 15px; /* Coins arrondis pour un design plus doux */
    text-align: center; /* Centrer le texte */
    z-index: 10000; /* S'assurer que la carte est bien au-dessus de tout */
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3); /* Ombre pour donner de la profondeur */
    color: white; /* Texte blanc pour le contraste */
    max-width: 500px; /* Limiter la largeur de la carte */
    font-family: 'Arial', sans-serif; /* Police classique et lisible */
}

/* Style pour le titre */
.game-over-card h1 {
    font-size: 2.5rem; /* Titre bien visible */
    margin-bottom: 20px; /* Espacement sous le titre */
    color: #ff5252; /* Rouge vif pour un impact dramatique */
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7); /* Légère ombre pour faire ressortir le texte */
}

/* Style pour les paragraphes */
.game-over-card p {
    font-size: 1.3rem; /* Texte légèrement plus grand pour une meilleure lecture */
    margin-bottom: 15px; /* Espacement entre les paragraphes */
    line-height: 1.6; /* Espacement des lignes pour plus de lisibilité */
    color: #ffcccb; /* Rouge clair pour adoucir les phrases secondaires */
}

.trap-container {
    position: fixed;
    bottom : 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.8);
    padding: 10px;
    border-radius: 8px;
    color: white;
    text-align: center;
}
.trap-button {
    background-color: #ff5722;
    color: white;
    border: none;
    padding: 10px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}
.trap-button:disabled {
    background-color: #777;
    cursor: not-allowed;
}
.trap-cooldown-bar {
    width: 100%;
    height: 10px;
    background-color: #e0e0e0;
    border-radius: 5px;
    margin-top: 5px;
    position: relative;
}
.trap-cooldown-fill {
    height: 100%;
    background-color: #ff5722;
    width: 0%; /* Ajusté dynamiquement */
    transition: width 1s linear;
    border-radius: 5px;
}
.gif-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.7); /* Fond semi-transparent */
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    color: white;
}
.gif-text {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 15px;
    color: #ff5722;
}
.trap-gif {
    width: 300px; /* Ajustez la taille selon vos besoins */
    height: auto;
    border-radius: 10px;
    border: 3px solid #ff5722;
}

</style>