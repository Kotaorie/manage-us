<script setup>
import PhaserGame from './game/PhaserGame.vue'
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import { io } from 'socket.io-client'
import HangmanGame from "./game/minigames/HangmanGame.vue";
import OddOneOutGame from './game/minigames/OddOneOutGame.vue';
import MemoryGame from './game/minigames/MemoryGame.vue';
import SwitchPuzzleMiniGame from "./game/minigames/SwitchPuzzleGame.vue";
import MathPuzzleGame from './game/minigames/MathPuzzleGame.vue';

import {EventBus} from "@/game/EventBus.js";
 
const route = useRoute();
const token_room = route.params.token_room;
const token_player = route.query.player
const user = ref({})
const missions = ref({})
const minigames = [OddOneOutGame, MemoryGame, HangmanGame, MathPuzzleGame, SwitchPuzzleMiniGame]
let socket;
async function loadDataUser() {
    const options = {
        method: 'GET',
    }

    fetch(`${import.meta.env.VITE_URL_API}/api/player/info/${token_player}`, options)
        .then(response => response.json())
        .then(response => {
            socket = io(import.meta.env.VITE_URL_WS)

            console.log(response)
            socket.on('connect', () => {
                console.log('Connected to WebSocket server with ID:', socket.id)
                setTimeout(() => {
                    socket.emit("startRoom", {token_room: token_room, token_player: token_player, is_impostor: response.is_impostor})
                }, 1000)
            });
            user.value = response
            user.value.token = token_player
            missions.value = response.room?.theme?.missions;
            if (!user.value.is_impostor) {
                missions.value = missions.value.map((item, index) => {
                    const randomIndex = Math.floor(Math.random() * minigames.length);
                    return {
                        name: item.name,
                        miniGame: minigames[randomIndex] ?? minigames[0],
                        isFinish: false,
                        isTour: index === 0
                    };
                });
            }
            console.log(missions.value);

        })
        .catch(err => console.error(err))
}

onMounted(async () => {
    await loadDataUser()

    EventBus.on('missionCompleted', (indexMission) => {
        if (missions.value[indexMission]) {
            missions.value[indexMission].isFinish = true;
            missions.value[indexMission].isTour = false
            console.log(`Mission ${missions.value[indexMission].name} terminée !`);
            if (missions.value[indexMission + 1]) {
                missions.value[indexMission + 1].isTour = true
            }
        }
    });
});
</script>

<template>
    <PhaserGame v-if="user.pseudo" ref="phaserRef" :user="user" :socket="socket" :missions="missions" :roomKey="token_room" />
</template>
