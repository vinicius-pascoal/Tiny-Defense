"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { GameEngine } from "@/game/engine/GameEngine";
import type { MapLayout } from "@/game/systems/MapLayout";

/**
 * Cria uma engine por montagem da tela e expõe o snapshot para o React.
 * O HUD só re-renderiza quando a engine publica uma mudança (não a cada quadro).
 */
export function useGameController(layout: MapLayout) {
  const [engine] = useState(() => new GameEngine({ layout }));
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);

  // Pausa automática ao ocultar a aba, trocar de app ou perder o foco durante uma onda;
  // a retomada é sempre explícita.
  useEffect(() => {
    const autoPause = () => {
      if (engine.getSnapshot().phase === "running" && !engine.getSnapshot().paused) engine.pause();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") autoPause();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", autoPause);
    window.addEventListener("pagehide", autoPause);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", autoPause);
      window.removeEventListener("pagehide", autoPause);
      // Com Cache Components, sair de /play esconde a tela (<Activity>) em vez de desmontá-la:
      // a partida é preservada e volta pausada.
      autoPause();
    };
  }, [engine]);

  return { engine, snapshot };
}
