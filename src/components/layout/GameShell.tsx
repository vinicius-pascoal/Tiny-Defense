"use client";

import { useEffect } from "react";
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
import { TOWERS } from "@/game/data/towers";
import type { CommandResult } from "@/game/engine/GameEngine";
import { getLevelSprites } from "@/game/engine/GameRenderer";
import { createMapLayout } from "@/game/systems/MapLayout";
import type { GridPosition, TowerType } from "@/game/types/game";
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

  // Tocar no mesmo cartão sai do modo de construção; outro cartão troca o tipo.
  const toggleBuildType = (type: TowerType) =>
    run(() => engine.selectBuildType(engine.getSnapshot().selectedBuildType === type ? null : type));
  const cancelSelection = () => {
    engine.selectBuildType(null);
    engine.selectTower(null);
  };

  /**
   * Toque no mapa: torre existente → seleciona (nunca constrói por cima); modo de construção →
   * tenta construir; casa vazia fora do modo → limpa a seleção.
   */
  const handleCellTap = (cell: GridPosition) => {
    const tower = engine.getTowerAt(cell);
    if (tower) return run(() => engine.selectTower(tower.id));

    const buildType = engine.getSnapshot().selectedBuildType;
    if (!buildType) return run(() => engine.selectTower(null));

    const result = engine.placeTower(cell);
    if (result.ok) notify(`${TOWERS[buildType].name} construída por ${TOWERS[buildType].cost} moedas.`);
    else warn(result.reason);
  };

  const upgradeTower = (id: string) => {
    const before = engine.getSnapshot().selectedTower;
    const result = engine.upgradeTower(id);
    if (!result.ok) return warn(result.reason);
    if (before) notify(`${TOWERS[before.type].name} melhorada para o nível ${before.level + 1}.`);
  };

  const sellTower = (id: string) => {
    const before = engine.getSnapshot().selectedTower;
    const result = engine.sellTower(id);
    if (!result.ok) return warn(result.reason);
    if (before) notify(`${TOWERS[before.type].name} vendida: +${before.sellRefund} moedas.`);
  };

  // Esc cancela o modo de construção ou a seleção.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const { selectedBuildType, selectedTowerId } = engine.getSnapshot();
      if (selectedBuildType || selectedTowerId) {
        engine.selectBuildType(null);
        engine.selectTower(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [engine]);

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
              onCellTap={handleCellTap}
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
          {/*
            Painel contextual: com uma torre selecionada, os detalhes ocupam o lugar dos cartões
            (a engine já trata seleção e modo de construção como exclusivos). ✗, Esc ou tocar numa
            casa vazia trazem os cartões de volta.
          */}
          {!snapshot.selectedTower && (
            <TowerSelector
              snapshot={snapshot}
              onSelect={ready ? toggleBuildType : undefined}
              onCancel={cancelSelection}
              onUnavailable={warn}
            />
          )}
          <TowerDetails
            snapshot={snapshot}
            onDeselect={cancelSelection}
            onUpgrade={upgradeTower}
            onSell={sellTower}
            onUnavailable={warn}
          />
        </aside>
      </div>
    </div>
  );
}
