"use client";

import { FeedbackToast } from "@/components/game/FeedbackToast";
import { GameCanvas } from "@/components/game/GameCanvas";
import { GameHUD } from "@/components/game/GameHUD";
import { PauseOverlay } from "@/components/game/PauseOverlay";
import { SceneLoading } from "@/components/game/SceneLoading";
import { TowerDetails } from "@/components/game/TowerDetails";
import { TowerSelector } from "@/components/game/TowerSelector";
import { WaveControls } from "@/components/game/WaveControls";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { LEVEL_1 } from "@/game/data/levels";
import type { CommandResult } from "@/game/engine/GameEngine";
import { getLevelSprites } from "@/game/engine/GameRenderer";
import { createMapLayout } from "@/game/systems/MapLayout";
import { useFeedback } from "@/hooks/useFeedback";
import { useGameController } from "@/hooks/useGameController";
import { useSpriteLoader } from "@/hooks/useSpriteLoader";
import { GAME_SCENE_SPRITES } from "@/lib/assets";

const LEVEL = LEVEL_1;
const LAYOUT = createMapLayout(LEVEL);
/** Lista estável (constante de módulo), sem duplicatas, para o carregador. */
const SCENE_SPRITES = [...new Set([...GAME_SCENE_SPRITES, ...getLevelSprites(LEVEL)])];

/**
 * Tela da partida. Desktop: HUD no topo, mapa ao centro e painel lateral.
 * Mobile: HUD compacto, mapa na largura total e painéis abaixo, com rolagem vertical.
 */
export function GameShell() {
  const { engine, snapshot } = useGameController(LAYOUT);
  const { state: loadState, retry } = useSpriteLoader(SCENE_SPRITES);
  const { message, notify } = useFeedback();
  const warn = (reason: string) => notify(reason, "warning");
  const ready = loadState.status === "ready";

  /** Executa um comando da engine e mostra o motivo quando ela o recusa. */
  const run = (command: () => CommandResult) => {
    const result = command();
    if (!result.ok) warn(result.reason);
  };
  const togglePause = () => run(() => (snapshot.paused ? engine.resume() : engine.pause()));

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <GameHUD snapshot={snapshot} />

      <div className="flex flex-1 flex-col gap-3 p-3 lg:min-h-0 lg:flex-row lg:gap-4 lg:p-4">
        <main className="game-stage-area flex min-w-0 flex-col items-center lg:flex-1 lg:justify-center">
          <PixelPanel skin="slot" className="game-stage relative">
            <GameCanvas
              images={ready ? loadState.images : null}
              engine={engine}
              level={LEVEL}
              layout={LAYOUT}
            />
            {!ready && <SceneLoading state={loadState} onRetry={retry} />}
            {ready && snapshot.paused && <PauseOverlay onResume={togglePause} />}
            <FeedbackToast message={message} />
          </PixelPanel>
        </main>

        <aside
          aria-label="Controles da partida"
          className="flex flex-col gap-3 lg:w-96 lg:shrink-0 lg:overflow-y-auto"
        >
          <WaveControls
            snapshot={snapshot}
            // Sem sprites prontos o laço não roda: comandos de tempo ficam desativados.
            onStartWave={ready ? () => run(() => engine.startWave()) : undefined}
            onTogglePause={ready ? togglePause : undefined}
            onUnavailable={warn}
          />
          <TowerSelector snapshot={snapshot} onUnavailable={warn} />
          <TowerDetails snapshot={snapshot} />
        </aside>
      </div>
    </div>
  );
}
