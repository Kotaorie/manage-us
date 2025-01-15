<script setup>
import PhaserGame from './game/PhaserGame.vue'
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import { io } from 'socket.io-client'

const route = useRoute();
const token_room = route.params.token_room;
const token_player = route.query.player
const user = ref({})

console.log(token_room, token_player)
let socket;
async function loadDataUser() {
    const options = {
        method: 'GET',
    }

    fetch(`https://localhost/api/player/info/${token_player}`, options)
        .then(response => response.json())
        .then(response => {
            socket = io('http://localhost:3001')

            socket.on('connect', () => {
                console.log('Connected to WebSocket server with ID:', socket.id)
                socket.emit("startRoom", token_room)
            });
            user.value = response
            user.value.token = token_player
        })
        .catch(err => console.error(err))
}

onMounted(async () => {
    await loadDataUser()
});
</script>

<template>
    <PhaserGame v-if="user.pseudo" ref="phaserRef" :user="user" :socket="socket" />
</template>
