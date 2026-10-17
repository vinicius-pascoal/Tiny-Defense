"use client";

import { useEffect } from "react";
import type { GameEngine } from "@/game/engine/GameEngine";
import { readSave, updateSave, withMatchResult, withSpeed, withWaveReached } from "@/lib/storage";

/**
 * Liga a partida ao armazenamento local: aplica a velocidade preferida ao abrir a tela e grava a
 * maior onda alcançada, vitórias/derrotas (uma vez por partida) e trocas de velocidade.
 */
export function useMatchRecords(engine: GameEngine) {
  useEffect(() => {
    engine.setSpeed(readSave().preferences.speed);

    let last = engine.getSnapshot();
    return engine.subscribe(() => {
      const snapshot = engine.getSnapshot();
      const previous = last;
      last = snapshot;

      if (snapshot.currentWave > previous.currentWave) {
        updateSave((save) => withWaveReached(save, snapshot.currentWave));
      }
      const ended = snapshot.phase === "victory" || snapshot.phase === "defeat";
      if (ended && snapshot.phase !== previous.phase) {
        updateSave((save) => withMatchResult(save, snapshot.phase as "victory" | "defeat", snapshot.currentWave));
      }
      if (snapshot.speed !== previous.speed) updateSave((save) => withSpeed(save, snapshot.speed));
    });
  }, [engine]);
}
