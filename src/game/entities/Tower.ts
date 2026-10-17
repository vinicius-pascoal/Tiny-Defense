import { TOWERS } from "@/game/data/towers";
import type { Tower } from "@/game/types/entities";
import type { GridPosition, TowerType } from "@/game/types/game";

export function createTower(id: string, type: TowerType, cell: GridPosition): Tower {
  return { id, type, col: cell.col, row: cell.row, level: 1, invested: TOWERS[type].cost, cooldown: 0 };
}
