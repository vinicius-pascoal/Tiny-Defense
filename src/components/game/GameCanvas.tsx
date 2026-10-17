"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { WORLD_HEIGHT, WORLD_WIDTH } from "@/game/config/constants";
import type { LevelDefinition } from "@/game/data/levels";
import type { GameEngine } from "@/game/engine/GameEngine";
import { GameRenderer, type RenderScene } from "@/game/engine/GameRenderer";
import type { MapLayout } from "@/game/systems/MapLayout";
import type { GridPosition, TowerType } from "@/game/types/game";
import { screenToWorld, worldToCell } from "@/game/utils/geometry";

type GameCanvasProps = {
  /** Sprites já carregados; `null` enquanto a cena carrega. */
  images: ReadonlyMap<string, HTMLImageElement> | null;
  engine: GameEngine;
  level: LevelDefinition;
  layout: MapLayout;
  /** Toque/clique curto numa célula (arrastar para rolar a página não conta). */
  onCellTap: (cell: GridPosition) => void;
};

/** Deslocamento máximo, em px CSS, para um toque ainda contar como toque (e não rolagem). */
const TAP_SLOP = 10;

type PressState = { pointerId: number; x: number; y: number };

/**
 * Canvas do mapa com proporção lógica 320:192. Mantém a resolução interna igual ao tamanho
 * CSS × `devicePixelRatio`, converte mouse/toque em células e roda o laço único do jogo:
 * a cada quadro, avança a engine pelo tempo real decorrido e desenha o estado com o `GameRenderer`.
 */
export function GameCanvas({ images, engine, level, layout, onCellTap }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerCell = useRef<GridPosition | null>(null);
  const pointerType = useRef<string>("mouse");
  const press = useRef<PressState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !images) return;

    let renderer: GameRenderer;
    try {
      renderer = new GameRenderer(canvas, images, level, layout);
    } catch (error) {
      console.error(error);
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.resize(rect.width, rect.height, window.devicePixelRatio || 1);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    // Mudança de zoom/monitor altera o DPR sem alterar o tamanho CSS.
    window.addEventListener("resize", resize);
    resize();

    const scene: RenderScene = { enemies: [], towers: [], selectedTowerId: null, buildPreview: null };
    let lastBuildType: TowerType | null = null;
    let lastTime: number | null = null;
    let frameId = requestAnimationFrame(function frame(time) {
      // A engine limita o delta: voltar de uma aba inativa não teletransporta unidades.
      if (lastTime !== null) engine.advance((time - lastTime) / 1000);
      lastTime = time;

      const { selectedBuildType, selectedTowerId } = engine.getSnapshot();
      // No toque não há "hover": ao trocar de modo, a última casa tocada deixa de ser a prévia.
      if (selectedBuildType !== lastBuildType && pointerType.current !== "mouse") {
        pointerCell.current = null;
      }
      lastBuildType = selectedBuildType;

      const cell = pointerCell.current;
      scene.enemies = engine.getEnemies();
      scene.towers = engine.getTowers();
      scene.selectedTowerId = selectedTowerId;
      scene.buildPreview =
        selectedBuildType && cell
          ? { type: selectedBuildType, cell, valid: engine.checkPlacement(selectedBuildType, cell).ok }
          : null;
      renderer.render(
        time,
        scene,
        { pointerCell: pointerCell.current },
        { reducedMotion: motionQuery.matches },
      );
      frameId = requestAnimationFrame(frame);
    });

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      renderer.destroy();
    };
  }, [images, engine, level, layout]);

  const setPointerCell = (canvas: HTMLCanvasElement, cell: GridPosition | null) => {
    pointerCell.current = cell;
    // Exposto para testes manuais/automatizados do mapeamento de ponteiro.
    canvas.dataset.pointerCell = cell ? `${cell.col},${cell.row}` : "";
  };

  const cellAt = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const point = screenToWorld(clientX, clientY, canvas.getBoundingClientRect());
    return point ? worldToCell(point) : null;
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    pointerType.current = event.pointerType;
    setPointerCell(event.currentTarget, cellAt(event.currentTarget, event.clientX, event.clientY));
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    handlePointerMove(event);
    press.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const start = press.current;
    press.current = null;
    if (!start || start.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP) return;

    const cell = cellAt(event.currentTarget, event.clientX, event.clientY);
    if (cell) onCellTap(cell);
  };

  // Rolagem/gesto do navegador cancela o ponteiro: nada é construído.
  const handlePointerCancel = () => {
    press.current = null;
  };

  const handlePointerLeave = (event: PointerEvent<HTMLCanvasElement>) => {
    // No toque, a célula tocada permanece marcada; só o mouse "sai" do mapa.
    if (event.pointerType === "mouse") setPointerCell(event.currentTarget, null);
  };

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Mapa da partida: estrada da esquerda até o castelo, à direita"
      width={WORLD_WIDTH}
      height={WORLD_HEIGHT}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
      className="pixelated block aspect-320/192 w-full touch-manipulation bg-grass-700"
    />
  );
}
