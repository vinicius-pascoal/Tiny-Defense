import type { GridPosition } from "@/game/types/game";

/**
 * Expande os vértices de um caminho ortogonal em células contíguas, na ordem do percurso,
 * sem repetir as células dos cantos. Lança erro para segmentos diagonais (dado de nível inválido).
 */
export function expandWaypoints(waypoints: readonly GridPosition[]): GridPosition[] {
  if (waypoints.length === 0) return [];

  const cells: GridPosition[] = [{ ...waypoints[0] }];
  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1];
    const to = waypoints[i];
    if (from.col !== to.col && from.row !== to.row) {
      throw new Error(`Segmento diagonal no caminho: (${from.col},${from.row}) → (${to.col},${to.row})`);
    }

    const stepCol = Math.sign(to.col - from.col);
    const stepRow = Math.sign(to.row - from.row);
    let { col, row } = from;
    while (col !== to.col || row !== to.row) {
      col += stepCol;
      row += stepRow;
      cells.push({ col, row });
    }
  }

  return cells;
}
