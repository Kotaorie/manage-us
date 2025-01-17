<template>
    <div class="odd-one-out-game">
      <h1>Trouvez l'intrus</h1>
      <p>Manches : {{ currentRound }} / {{ totalRounds }}</p>
      <div class="words">
        <button
          v-for="(word, index) in shuffledWords"
          :key="index"
          @click="handleWordClick(word)"
          class="word-button"
        >
          {{ word }}
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import {EventBus} from '../EventBus';

  const currentRound = ref(1);
  const totalRounds = 5;
  
  const wordSets = [
    { category: 'Méthodes', words: ['Scrum', 'Kanban', 'Football'] },
    { category: 'Outils', words: ['Jira', 'Trello', 'Figma'] },
    { category: 'Rôles', words: ['Scrum Master', 'Product Owner', 'Pilote'] },
    { category: 'Agile', words: ['Sprint', 'Backlog', 'Écran'] },
    { category: 'Planning', words: ['Planning Poker', 'Daily', 'Bicyclette'] },
    { category: 'Tests', words: ['Test unitaire', 'Test de régression', 'pause café'] },
    { category: 'Livraison', words: ['Démo', 'Release', 'Avion'] },
    { category: 'Communication', words: ['Slack', 'Email', 'Kanban'] },
    { category: 'Stratégie', words: ['Roadmap', 'Vision', 'Orange'] },
    { category: 'Collaboration', words: ['Pair programming', 'Code review', 'Cuisine'] },
  ];
  
  const selectedSet = ref({});
  const intruderWord = ref('');
  const shuffledWords = ref([]);
  
  function startGame() {
    selectedSet.value = wordSets[Math.floor(Math.random() * wordSets.length)];
    intruderWord.value = selectedSet.value.words[2]; // L'intrus est toujours le 3e mot
    shuffledWords.value = [...selectedSet.value.words].sort(() => Math.random() - 0.5);
  }
  
  function handleWordClick(word) {
    if (word === intruderWord.value) {
      if (currentRound.value === totalRounds) {
        EventBus.emit('game-complete', { success: true });
      } else {
        currentRound.value++;
        startGame();
      }
    } else {
      EventBus.emit('game-complete', { success: false });
    }
  }
  
  // Initialise le jeu au démarrage
  startGame();
  </script>
  
  <style scoped>
  .odd-one-out-game {
    text-align: center;
    background-color: #000;
    color: #fff;
    padding: 20px;
    border-radius: 10px;
  }
  
  .words {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .word-button {
    font-size: 1.2rem;
    background-color: #333;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  
  .word-button:hover {
    background-color: #555;
  }
  </style>
  