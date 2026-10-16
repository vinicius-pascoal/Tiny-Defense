import { GRID_COLS, GRID_ROWS } from "@/game/config/constants";
import type { LevelDefinition } from "@/game/data/levels";
import type { GridPosition } from "@/game/types/game";
import { expandWaypoints } from "./PathSystem";

export type CellKind = "grass" | "path" | "castle" | "decoration";

type Direction = "up" | "down" | "left" | "right";

/** Célula do caminho com as duas direções de conexão (entrada e saída). */
export type PathTile = GridPosition & {
  connects: readonly [Direction, Direction];
  paved: boolean;
};

/**
 * Leitura derivada de um nível: caminho em células e o tipo de cada célula.
 * Renderização e construção usam a mesma fonte, mantendo caminho visual e lógico iguais.
 */
export type MapLayout = {
  pathCells: readonly GridPosition[];
  pathTiles: readonly PathTile[];
  /** `cells[row][col]` */
  cells: readonly (readonly CellKind[])[];
};

const OPPOSITE: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };

function directionBetween(from: GridPosition, to: GridPosition): Direction {
  if (to.col > from.col) return "right";
  if (to.col < from.col) return "left";
  return to.row > from.row ? "down" : "up";
}

export function createMapLayout(level: LevelDefinition): MapLayout {
  const pathCells = expandWaypoints(level.pathWaypoints);
  const cells: CellKind[][] = Array.from({ length: GRID_ROWS }, () =>
    Array<CellKind>(GRID_COLS).fill("grass"),
  );

  const { area } = level.castle;
  for (let row = area.row; row < area.row + area.rows; row++) {
    for (let col = area.col; col < area.col + area.cols; col++) cells[row][col] = "castle";
  }
  for (const decoration of level.decorations) cells[decoration.row][decoration.col] = "decoration";
  // O caminho prevalece: a última célula entra sob o portão do castelo.
  for (const { col, row } of pathCells) cells[row][col] = "path";

  const pavedFrom = pathCells.length - level.pavedCells;
  const pathTiles = pathCells.map((cell, index): PathTile => {
    const prev = pathCells[index - 1];
    const next = pathCells[index + 1];
    // Nas pontas, a estrada continua na direção do percurso (entrada pela borda, saída no portão).
    const travelIn = prev ? directionBetween(prev, cell) : directionBetween(cell, next);
    const travelOut = next ? directionBetween(cell, next) : travelIn;

    return { ...cell, connects: [OPPOSITE[travelIn], travelOut], paved: index >= pavedFrom };
  });

  return { pathCells, pathTiles, cells };
}
