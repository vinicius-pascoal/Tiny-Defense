import { GRID_COLS, GRID_ROWS } from "@/game/config/constants";
import { TOWERS } from "@/game/data/towers";
import type { GamePhase, GridPosition, TowerType } from "@/game/types/game";
import type { CellKind } from "./MapLayout";

export type PlacementBlock =
  | "outOfBounds"
  | "path"
  | "castle"
  | "decoration"
  | "occupied"
  | "gold"
  | "paused"
  | "phase";

export type PlacementCheck = { ok: true } | { ok: false; block: PlacementBlock; reason: string };

export type PlacementContext = {
  cells: readonly (readonly CellKind[])[];
  /** Células ocupadas por torres, com chave `cellKey`. */
  occupied: ReadonlySet<string> | ReadonlyMap<string, unknown>;
  gold: number;
  phase: GamePhase;
  paused: boolean;
};

export const cellKey = ({ col, row }: GridPosition) => `${col},${row}`;

const blocked = (block: PlacementBlock, reason: string): PlacementCheck => ({ ok: false, block, reason });

/**
 * Valida a construção de uma torre numa célula (ROADMAP §5.3). Não altera estado:
 * a engine só gasta ouro e cria a torre se a verificação passar.
 */
export function checkPlacement(
  context: PlacementContext,
  type: TowerType,
  cell: GridPosition,
): PlacementCheck {
  if (context.phase === "victory" || context.phase === "defeat") {
    return blocked("phase", "A partida terminou: não é possível construir.");
  }
  if (context.paused) return blocked("paused", "Retome o jogo para construir.");

  const { col, row } = cell;
  if (!Number.isInteger(col) || !Number.isInteger(row) || col < 0 || row < 0 || col >= GRID_COLS || row >= GRID_ROWS) {
    return blocked("outOfBounds", "Escolha uma casa dentro do mapa.");
  }

  switch (context.cells[row][col]) {
    case "path":
      return blocked("path", "Não dá para construir na estrada.");
    case "castle":
      return blocked("castle", "Essa área é do castelo.");
    case "decoration":
      return blocked("decoration", "Há uma decoração nessa casa.");
  }

  if (context.occupied.has(cellKey(cell))) return blocked("occupied", "Já existe uma torre aqui.");

  const missing = TOWERS[type].cost - context.gold;
  if (missing > 0) {
    return blocked("gold", `Moedas insuficientes: faltam ${missing} para ${TOWERS[type].name}.`);
  }

  return { ok: true };
}
