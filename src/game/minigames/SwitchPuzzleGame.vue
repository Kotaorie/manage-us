<template>
    <div class="switch-puzzle">
      <h1>Jeu des interrupteurs : Allumez tous les voyants.</h1>
      <div class="lights">
        <div
          v-for="(light, index) in lights"
          :key="index"
          :class="['light', light.state ? 'on' : 'off']"
        ></div>
      </div>
      <div class="switches">
        <button
          v-for="(switchState, index) in switches"
          :key="index"
          :class="['switch', switchState ? 'active' : 'inactive']"
          @click="toggleSwitch(index)"
        >
          {{ switchState ? '1' : 'O' }}
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import { EventBus } from '../EventBus';
  
  export default {
    name: "SwitchPuzzleMiniGame",
    data() {
      return {
        lights: [
          { state: false },
          { state: false },
          { state: false },
          { state: false },
        ],
        switches: [false, false, false, false],
        interrupterEffects: [
          [0, 1], // Interrupteur 0 contrôle les ampoules 0 et 1
          [1],    // Interrupteur 1 contrôle uniquement l'ampoule 1
          [2],    // Interrupteur 2 contrôle uniquement l'ampoule 2
          [2, 3], // Interrupteur 3 contrôle les ampoules 2 et 3
        ],
        solution: [0, 3], // La combinaison gagnante
      };
    },
    methods: {
      toggleSwitch(index) {
        // Inverser l'état de l'interrupteur
        this.switches[index] = !this.switches[index];
  
        // Appliquer les effets sur les ampoules
        this.interrupterEffects[index].forEach((lightIndex) => {
          this.toggleLight(lightIndex);
        });
  
        // Vérifier la condition de victoire
        if (this.isWinningCombination()) {
          EventBus.emit("game-complete", { success: true });
        }
      },
      toggleLight(index) {
        this.lights[index].state = !this.lights[index].state;
      },
      isWinningCombination() {
        // Vérifier si les interrupteurs actifs correspondent à la solution
        const activeSwitches = this.switches
          .map((state, index) => (state ? index : null))
          .filter((index) => index !== null);
  
        return JSON.stringify(activeSwitches) === JSON.stringify(this.solution);
      },
    },
    mounted() {
      // Démarrer le jeu avec un timer si nécessaire
      setTimeout(() => {
        if (!this.isWinningCombination()) {
          EventBus.emit("game-complete", { success: false });
        }
      }, 30000); // Par exemple, 30 secondes pour résoudre
    },
  };
  </script>
  
  <style scoped>
  .switch-puzzle {
    text-align: center;
    color: #fff;
    background-color: #000;
    padding: 20px;
  }
  
  .lights {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }
  
  .light {
    width: 60px;
    height: 60px;
    margin: 0 10px;
    border-radius: 50%;
    background-color: red;
    transition: background-color 0.3s ease;
  }
  
  .light.on {
    background-color: green;
  }
  
  .switches {
    display: flex;
    justify-content: center;
  }
  
  .switch {
    width: 60px;
    height: 60px;
    margin: 0 10px;
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    background-color: #333;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .switch.active {
    background-color: #555;
  }
  
  .switch.inactive {
    background-color: #111;
  }
  </style>
  