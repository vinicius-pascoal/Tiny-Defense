import { TILE_SIZE } from "@/game/config/constants";
import type { GridPosition, Vector2 } from "@/game/types/game";

/**
 * Percurso em coordenadas do mundo: centros das células do caminho, mais um ponto de entrada
 * uma célula antes da primeira (fora do mapa) e a saída na borda da última célula (portão).
 * `cumulative[i]` é a distância do início até `points[i]`.
 */
export type WorldPath = {
  points: readonly Vector2[];
  cumulative: readonly number[];
  length: number;
};

function cellCenter({ col, row }: GridPosition): Vector2 {
  return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
}

/** Constrói o percurso a partir das células expandidas (ao menos duas). */
export function createWorldPath(cells: readonly GridPosition[]): WorldPath {
  if (cells.length < 2) throw new Error("O caminho precisa de ao menos duas células.");

  const centers = cells.map(cellCenter);
  const first = centers[0];
  const second = centers[1];
  const beforeLast = centers[centers.length - 2];
  const last = centers[centers.length - 1];

  // Entrada: uma célula inteira antes da primeira, na direção oposta ao percurso.
  const entry = { x: first.x - (second.x - first.x), y: first.y - (second.y - first.y) };
  // Saída: meia célula além do último centro (borda da célula, sob o portão do castelo).
  const exit = { x: last.x + (last.x - beforeLast.x) / 2, y: last.y + (last.y - beforeLast.y) / 2 };

  // Só os cantos interessam para a interpolação; pontos alinhados são descartados.
  const raw = [entry, ...centers, exit];
  const points: Vector2[] = [raw[0]];
  for (let i = 1; i < raw.length - 1; i++) {
    const prev = raw[i - 1];
    const next = raw[i + 1];
    const collinear = (prev.x === raw[i].x && raw[i].x === next.x) || (prev.y === raw[i].y && raw[i].y === next.y);
    if (!collinear) points.push(raw[i]);
  }
  points.push(raw[raw.length - 1]);

  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    cumulative.push(cumulative[i - 1] + Math.hypot(dx, dy));
  }

  return { points, cumulative, length: cumulative[cumulative.length - 1] };
}

/** Posição no percurso após `distance` unidades, limitada ao início e ao fim. Escreve em `out`. */
export function positionAt(path: WorldPath, distance: number, out: Vector2 = { x: 0, y: 0 }): Vector2 {
  const { points, cumulative, length } = path;
  const d = Math.min(Math.max(distance, 0), length);

  let segment = 1;
  while (segment < points.length - 1 && cumulative[segment] < d) segment++;

  const from = points[segment - 1];
  const to = points[segment];
  const span = cumulative[segment] - cumulative[segment - 1];
  const t = span > 0 ? (d - cumulative[segment - 1]) / span : 0;
  out.x = from.x + (to.x - from.x) * t;
  out.y = from.y + (to.y - from.y) * t;
  return out;
}

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
