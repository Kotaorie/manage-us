<template>
    <div class="memory-game">
      <h1>Memory Game</h1>
      <div class="memory-board">
        <div
          v-for="(card, index) in cards"
          :key="index"
          class="card"
          :class="{ flipped: card.flipped || card.matched }"
          @click="flipCard(card)"
        >
          <div class="front">{{ card.key }}</div>
          <div class="back"></div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { EventBus } from '@/game/EventBus';
  
  const totalPairs = 6;
  const matchedPairs = ref(0);
  const flippedCards = ref([]);
  const cards = ref([]);
  
  function initializeGame() {
    const cardKeys = ['✨', '💣', '💻', '🛋', '💎', '🕊']; // Icons for cards
    const shuffledCards = [...cardKeys, ...cardKeys]
      .map((key) => ({ key, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5);
    cards.value = shuffledCards;
    matchedPairs.value = 0;
    flippedCards.value = [];
  }
  
  function flipCard(card) {
    if (card.flipped || card.matched || flippedCards.value.length === 2) return;
  
    card.flipped = true;
    flippedCards.value.push(card);
  
    if (flippedCards.value.length === 2) {
      checkMatch();
    }
  }
  
  function checkMatch() {
    const [card1, card2] = flippedCards.value;
  
    if (card1.key === card2.key) {
      card1.matched = true;
      card2.matched = true;
      matchedPairs.value++;
  
      if (matchedPairs.value === totalPairs) {
        setTimeout(() => {
          EventBus.emit('game-complete', { success: true });
        }, 500);
      }
    } else {
      setTimeout(() => {
        card1.flipped = false;
        card2.flipped = false;
      }, 1000);
    }
  
    flippedCards.value = [];
  }
  
  initializeGame();
  </script>
  
  <style scoped>
  .memory-game {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: Arial, sans-serif;
    color: white;
    background-color: #333;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  .memory-board {
    display: grid;
    grid-template-columns: repeat(4, 80px);
    gap: 10px;
  }
  
  .card {
    width: 80px;
    height: 80px;
    perspective: 1000px;
    cursor: pointer;
  }
  
  .card.flipped .front,
  .card.matched .front {
    transform: rotateY(0);
  }
  
  .card.flipped .back,
  .card.matched .back {
    transform: rotateY(180deg);
  }
  
  .card .front,
  .card .back {
    width: 100%;
    height: 100%;
    position: absolute;
    backface-visibility: hidden;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }
  
  .card .front {
    background-color: #4caf50;
    color: white;
    transform: rotateY(180deg);
  }
  
  .card .back {
    background-color: #ff5722;
    transform: rotateY(0);
  }
  </style>
  