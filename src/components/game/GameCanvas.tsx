"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { GRID_COLS, GRID_ROWS, TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "@/game/config/constants";
import type { GridPosition } from "@/game/types/game";
import { screenToWorld, worldToCell } from "@/game/utils/geometry";
import { GRASS_SPRITES } from "@/lib/assets";

type GameCanvasProps = {
  /** Sprites já carregados; `null` enquanto a cena carrega. */
  images: ReadonlyMap<string, HTMLImageElement> | null;
};

/**
 * Canvas do mapa com proporção lógica 320:192. Ajusta a resolução interna ao tamanho
 * CSS × `devicePixelRatio` e converte mouse/toque em células da grade.
 *
 * Desenho provisório da Etapa 03 (grama + grade + célula apontada); o `GameRenderer`
 * da Etapa 04 assume o desenho do mapa real.
 */
export function GameCanvas({ images }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerCell = useRef<GridPosition | null>(null);
  const drawRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const grass = images?.get(GRASS_SPRITES.grass01);
    const grassPattern = grass ? ctx.createPattern(grass, "repeat") : null;

    const draw = () => {
      // Mundo lógico → pixels do backing store; tudo abaixo é desenhado em unidades do mundo.
      ctx.setTransform(canvas.width / WORLD_WIDTH, 0, 0, canvas.height / WORLD_HEIGHT, 0, 0);
      ctx.imageSmoothingEnabled = false;

      ctx.fillStyle = grassPattern ?? "#5f9e3a";
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // Grade auxiliar, só como referência de células até o mapa real existir.
      ctx.strokeStyle = "rgb(19 76 76 / 0.25)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let col = 1; col < GRID_COLS; col++) {
        ctx.moveTo(col * TILE_SIZE, 0);
        ctx.lineTo(col * TILE_SIZE, WORLD_HEIGHT);
      }
      for (let row = 1; row < GRID_ROWS; row++) {
        ctx.moveTo(0, row * TILE_SIZE);
        ctx.lineTo(WORLD_WIDTH, row * TILE_SIZE);
      }
      ctx.stroke();

      const cell = pointerCell.current;
      if (cell) {
        ctx.fillStyle = "rgb(251 243 223 / 0.3)";
        ctx.fillRect(cell.col * TILE_SIZE, cell.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = "#fbf3df";
        ctx.lineWidth = 1;
        ctx.strokeRect(cell.col * TILE_SIZE + 0.5, cell.row * TILE_SIZE + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    };
    drawRef.current = draw;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      draw();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    return () => {
      observer.disconnect();
      drawRef.current = () => {};
    };
  }, [images]);

  const setPointerCell = (canvas: HTMLCanvasElement, cell: GridPosition | null) => {
    const previous = pointerCell.current;
    if (previous?.col === cell?.col && previous?.row === cell?.row) return;

    pointerCell.current = cell;
    // Exposto para testes manuais/automatizados do mapeamento de ponteiro.
    canvas.dataset.pointerCell = cell ? `${cell.col},${cell.row}` : "";
    drawRef.current();
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
      aria-label="Mapa da partida"
      width={WORLD_WIDTH}
      height={WORLD_HEIGHT}
      onPointerMove={updatePointer}
      onPointerDown={updatePointer}
      onPointerLeave={clearHover}
      className="pixelated block aspect-[320/192] w-full touch-manipulation"
    />
  );
}
