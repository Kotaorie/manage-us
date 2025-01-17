<script setup>
import { ref, onMounted, watch } from 'vue';
import { EventBus } from '../EventBus';

const timer = ref(null);
const timeLeft = ref(10);
const currentEquation = ref('');
const answer = ref(null);
const inputField = ref('_');
const currentRound = ref(1);
const totalRounds = 5;
const isGameOver = ref(false);
const message = ref('');

const generateEquation = () => {
  let equation, result;
  const operations = ['+', '-', '*'];

  do {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const num3 = Math.floor(Math.random() * 10) + 1;
    const op1 = operations[Math.floor(Math.random() * operations.length)];
    const op2 = operations[Math.floor(Math.random() * operations.length)];

    equation = `${num1} ${op1} ${num2} ${op2} ${num3}`;
    result = eval(equation);
  } while (result < 0 || !Number.isInteger(result));

  currentEquation.value = equation;
  answer.value = result;
};

const handleInput = (event) => {
  const key = event.key;

  if (key === 'Enter') {
    const userAnswer = parseFloat(inputField.value);
    if (userAnswer === answer.value) {
      onCorrectAnswer();
    } else {
      onLose();
    }
  } else if (key === 'Backspace') {
    inputField.value = inputField.value.slice(0, -1) || '_';
  } else if (!isNaN(key) || key === '.') {
    if (inputField.value === '_') {
      inputField.value = key;
    } else {
      inputField.value += key;
    }
  }
};

const startTimer = () => {
  stopTimer();
  timer.value = setInterval(() => {
    timeLeft.value--;

    if (timeLeft.value <= 0) {
      onLose();
    }
  }, 1000);
};

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
};

const onCorrectAnswer = () => {
  stopTimer();

  if (currentRound.value < totalRounds) {
    currentRound.value++;
    timeLeft.value = 10;
    inputField.value = '_';
    generateEquation();
    startTimer();
  } else {
    onWin();
  }
};

const onWin = () => {
  stopTimer();
  isGameOver.value = true;
  message.value = 'Bravo ! Vous avez gagné !';
  EventBus.emit('game-complete', { success: true });
};

const onLose = () => {
  stopTimer();
  isGameOver.value = true;
  message.value = 'Dommage ! Mauvaise réponse ou temps écoulé.';
  EventBus.emit('game-complete', { success: false });
};

onMounted(() => {
  generateEquation();
  startTimer();
  window.addEventListener('keydown', handleInput);
});

watch(isGameOver, (newVal) => {
  if (newVal) {
    stopTimer();
  }
});
</script>

<template>
  <div class="math-puzzle">
    <h1>Calcul Mental</h1>
    <div v-if="!isGameOver">
      <div class="timer">Temps restant : {{ timeLeft }}s</div>
      <div class="round">Calcul {{ currentRound }} / {{ totalRounds }}</div>
      <div class="equation">{{ currentEquation }}</div>
      <div class="input">Réponse : {{ inputField }}</div>
    </div>

    <div v-else class="message">
      {{ message }}
    </div>
  </div>
</template>

<style scoped>
.math-puzzle {
  text-align: center;
  font-family: Arial, sans-serif;
  margin: 20px auto;
  max-width: 600px;
}

.timer {
  font-size: 1.5rem;
  margin: 10px 0;
}

.round {
  font-size: 1.2rem;
  margin: 10px 0;
}

.equation {
  font-size: 2rem;
  margin: 20px 0;
}

.input {
  font-size: 1.5rem;
  margin: 20px 0;
}

.message {
  font-size: 1.8rem;
  color: #4caf50;
}
</style>
