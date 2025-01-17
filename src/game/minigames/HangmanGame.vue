<script setup>
import { ref, onMounted } from 'vue';
import { EventBus } from '../EventBus';

const wordList = [
  'plan',
  'risque',
  'budget',
  'tache',
  'equipe',
  'client',
  'priorite',
  'objectif',
  'livrable',
  'planning',
  'ressource',
  'qualite',
];
const selectedWord = ref('');
const displayedWord = ref([]);
const remainingLives = ref(7);
const guessedLetters = ref([]);
const isGameOver = ref(false);
const message = ref('');

const initGame = () => {
  selectedWord.value = wordList[Math.floor(Math.random() * wordList.length)];
  displayedWord.value = Array(selectedWord.value.length).fill('_');
  remainingLives.value = 7;
  guessedLetters.value = [];
  isGameOver.value = false;
  message.value = '';
};

const handleGuess = (letter) => {
  if (isGameOver.value || guessedLetters.value.includes(letter)) return;

  guessedLetters.value.push(letter);

  if (selectedWord.value.includes(letter)) {
    selectedWord.value.split('').forEach((char, index) => {
      if (char === letter) {
        displayedWord.value[index] = letter;
      }
    });

    if (!displayedWord.value.includes('_')) {
      isGameOver.value = true;
      message.value = 'Bravo, vous avez gagné !';
      EventBus.emit('game-complete', { success: true }); // Émettre un événement pour indiquer la victoire
    }
  } else {
    remainingLives.value--;

    if (remainingLives.value === 0) {
      isGameOver.value = true;
      message.value = `Dommage, vous avez perdu. Le mot était : ${selectedWord.value}`;
      EventBus.emit('game-complete', { success: false }); // Émettre un événement pour indiquer la défaite
    }
  }
};

onMounted(() => {
  initGame();
});
</script>

<template>
  <div class="hangman-game">
    <h1>Jeu du Pendu</h1>
    <div class="lives">Vies restantes : ❤️ x {{ remainingLives }}</div>
    <div class="word">
      <span v-for="(char, index) in displayedWord" :key="index">{{ char }}</span>
    </div>
    <div class="keyboard">
      <button
        v-for="letter in 'abcdefghijklmnopqrstuvwxyz'.split('')"
        :key="letter"
        :disabled="guessedLetters.includes(letter) || isGameOver"
        @click="handleGuess(letter)"
      >
        {{ letter }}
      </button>
    </div>
    <div v-if="isGameOver" class="message">
      {{ message }}
    </div>
  </div>
</template>

<style scoped>
.hangman-game {
  text-align: center;
  font-family: Arial, sans-serif;
  margin: 20px auto;
  max-width: 600px;
}

.lives {
  font-size: 1.5rem;
  margin: 10px 0;
}

.word {
  font-size: 2rem;
  margin: 20px 0;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.keyboard {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.keyboard button {
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  transition: background-color 0.2s;
}

.keyboard button:disabled {
  background-color: #888;
  cursor: not-allowed;
}

.message {
  margin-top: 20px;
  font-size: 1.5rem;
  color: #f44336;
}
</style>
