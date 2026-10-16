"use client";

import { useState } from "react";
import { FeedbackToast } from "@/components/game/FeedbackToast";
import { GameCanvas } from "@/components/game/GameCanvas";
import { GameHUD } from "@/components/game/GameHUD";
import { SceneLoading } from "@/components/game/SceneLoading";
import { TowerDetails } from "@/components/game/TowerDetails";
import { TowerSelector } from "@/components/game/TowerSelector";
import { WaveControls } from "@/components/game/WaveControls";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { LEVEL_1 } from "@/game/data/levels";
import { getLevelSprites } from "@/game/engine/GameRenderer";
import { createInitialSnapshot } from "@/game/engine/snapshot";
import { createMapLayout } from "@/game/systems/MapLayout";
import { useFeedback } from "@/hooks/useFeedback";
import { useSpriteLoader } from "@/hooks/useSpriteLoader";
import { GAME_SCENE_SPRITES } from "@/lib/assets";

const LEVEL = LEVEL_1;
const LAYOUT = createMapLayout(LEVEL);
/** Lista estável (constante de módulo), sem duplicatas, para o carregador. */
const SCENE_SPRITES = [...new Set([...GAME_SCENE_SPRITES, ...getLevelSprites(LEVEL)])];

/**
 * Tela da partida. Desktop: HUD no topo, mapa ao centro e painel lateral.
 * Mobile: HUD compacto, mapa na largura total e painéis abaixo, com rolagem vertical.
 *
 * O snapshot ainda é o estado inicial fixo; a engine passa a publicá-lo na Etapa 05.
 */
export function GameShell() {
  const [snapshot] = useState(createInitialSnapshot);
  const { state: loadState, retry } = useSpriteLoader(SCENE_SPRITES);
  const { message, notify } = useFeedback();
  const warn = (reason: string) => notify(reason, "warning");

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <GameHUD snapshot={snapshot} />

      <div className="flex flex-1 flex-col gap-3 p-3 lg:min-h-0 lg:flex-row lg:gap-4 lg:p-4">
        <main className="game-stage-area flex min-w-0 flex-col items-center lg:flex-1 lg:justify-center">
          <PixelPanel skin="slot" className="game-stage relative">
            <GameCanvas
              images={loadState.status === "ready" ? loadState.images : null}
              level={LEVEL}
              layout={LAYOUT}
            />
            {loadState.status !== "ready" && <SceneLoading state={loadState} onRetry={retry} />}
            <FeedbackToast message={message} />
          </PixelPanel>
        </main>

        <aside
          aria-label="Controles da partida"
          className="flex flex-col gap-3 lg:w-96 lg:shrink-0 lg:overflow-y-auto"
        >
          <WaveControls snapshot={snapshot} onUnavailable={warn} />
          <TowerSelector snapshot={snapshot} onUnavailable={warn} />
          <TowerDetails snapshot={snapshot} />
        </aside>
      </div>
    </div>
  );
}
