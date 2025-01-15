<script setup>
import { onMounted, onUnmounted, ref, defineProps } from 'vue';
import { EventBus } from './EventBus';
import StartGame from './main';

// Save the current scene instance
const scene = ref();
const game = ref();

const emit = defineEmits(['current-active-scene']);
const props = defineProps({
    user: {
        type: Object,
        required: true
    },
    socket: {
        type: Object,
        required: true
    }
})

onMounted(() => {

    game.value = StartGame('game-container', props.user, props.socket);

    EventBus.on('current-scene-ready', (currentScene) => {

        emit('current-active-scene', currentScene);

        scene.value = currentScene;

    });

});

onUnmounted(() => {

    if (game.value)
    {
        game.value.destroy(true);
        game.value = null;
    }
    
});

defineExpose({ scene, game });
</script>

<template>
    <div id="game-container"></div>
</template>