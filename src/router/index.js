import { createRouter, createWebHistory } from 'vue-router'
import GamePage from '@/GamePage.vue'

const routes = [
    {
        path: '/:token_room',
        name: 'Home',
        component: GamePage
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
