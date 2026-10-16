"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { WORLD_HEIGHT, WORLD_WIDTH } from "@/game/config/constants";
import type { LevelDefinition } from "@/game/data/levels";
import { GameRenderer } from "@/game/engine/GameRenderer";
import type { MapLayout } from "@/game/systems/MapLayout";
import type { GridPosition } from "@/game/types/game";
import { screenToWorld, worldToCell } from "@/game/utils/geometry";

type GameCanvasProps = {
  /** Sprites já carregados; `null` enquanto a cena carrega. */
  images: ReadonlyMap<string, HTMLImageElement> | null;
  level: LevelDefinition;
  layout: MapLayout;
};

/**
 * Canvas do mapa com proporção lógica 320:192. Mantém a resolução interna igual ao tamanho
 * CSS × `devicePixelRatio`, converte mouse/toque em células e delega o desenho ao `GameRenderer`.
 *
 * O laço de quadros daqui só desenha; na Etapa 05 ele passa a ser o laço único da engine.
 */
export function GameCanvas({ images, level, layout }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerCell = useRef<GridPosition | null>(null);

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

    let frameId = requestAnimationFrame(function frame(time) {
      renderer.render(
        time,
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
  }, [images, level, layout]);

  const setPointerCell = (canvas: HTMLCanvasElement, cell: GridPosition | null) => {
    pointerCell.current = cell;
    // Exposto para testes manuais/automatizados do mapeamento de ponteiro.
    canvas.dataset.pointerCell = cell ? `${cell.col},${cell.row}` : "";
  };

  const updatePointer = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const point = screenToWorld(event.clientX, event.clientY, canvas.getBoundingClientRect());
    setPointerCell(canvas, point ? worldToCell(point) : null);
  };

  const clearHover = (event: PointerEvent<HTMLCanvasElement>) => {
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
      onPointerMove={updatePointer}
      onPointerDown={updatePointer}
      onPointerLeave={clearHover}
      className="pixelated block aspect-[320/192] w-full touch-manipulation bg-grass-700"
    />
  );
}
