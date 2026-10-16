import { GRID_COLS, GRID_ROWS, TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "@/game/config/constants";
import type { GridPosition, Vector2 } from "@/game/types/game";

/** Retângulo em pixels CSS, no formato de `getBoundingClientRect()`. */
export type ScreenRect = { left: number; top: number; width: number; height: number };

/**
 * Converte um ponto em coordenadas de tela (CSS px, ex.: `clientX/clientY`)
 * para o espaço lógico do mundo (320×192), usando o retângulo real do canvas.
 * Retorna `null` fora do canvas ou com retângulo degenerado.
 */
export function screenToWorld(clientX: number, clientY: number, rect: ScreenRect): Vector2 | null {
  if (rect.width <= 0 || rect.height <= 0) return null;

  const x = ((clientX - rect.left) / rect.width) * WORLD_WIDTH;
  const y = ((clientY - rect.top) / rect.height) * WORLD_HEIGHT;
  if (x < 0 || y < 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) return null;

  return { x, y };
}

/** Célula da grade que contém o ponto do mundo, ou `null` fora da grade. */
export function worldToCell(point: Vector2): GridPosition | null {
  const col = Math.floor(point.x / TILE_SIZE);
  const row = Math.floor(point.y / TILE_SIZE);
  if (col < 0 || row < 0 || col >= GRID_COLS || row >= GRID_ROWS) return null;

  return { col, row };
}
