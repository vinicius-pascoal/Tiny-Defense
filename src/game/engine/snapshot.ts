import { INITIAL_GOLD, INITIAL_LIVES, TOTAL_WAVES } from "@/game/config/balance";
import type { GameSnapshot } from "@/game/types/game";

/** Estado de uma partida nova (ROADMAP §6.4, regra 1): preparação, onda 0/10. */
export function createInitialSnapshot(): GameSnapshot {
  return {
    phase: "preparing",
    paused: false,
    speed: 1,
    lives: INITIAL_LIVES,
    gold: INITIAL_GOLD,
    currentWave: 0,
    totalWaves: TOTAL_WAVES,
    activeEnemies: 0,
    pendingEnemies: 0,
    selectedTowerId: null,
    selectedBuildType: null,
  };
}
