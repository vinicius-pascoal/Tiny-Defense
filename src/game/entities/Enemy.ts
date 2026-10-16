import { ENEMIES } from "@/game/data/enemies";
import type { Enemy, EnemyType } from "@/game/types/entities";
import { positionAt, type WorldPath } from "@/game/systems/PathSystem";

export function createEnemy(id: string, type: EnemyType, path: WorldPath): Enemy {
  const definition = ENEMIES[type];
  return {
    id,
    type,
    distance: 0,
    position: positionAt(path, 0),
    health: definition.health,
    maxHealth: definition.health,
    speed: definition.speed,
    age: 0,
  };
}

/**
 * Avança o inimigo `dt` segundos de simulação ao longo do caminho.
 * Retorna `true` quando ele alcança o fim (portão do castelo) neste passo.
 */
export function advanceEnemy(enemy: Enemy, dt: number, path: WorldPath): boolean {
  enemy.age += dt;
  enemy.distance = Math.min(enemy.distance + enemy.speed * dt, path.length);
  positionAt(path, enemy.distance, enemy.position);
  return enemy.distance >= path.length;
}
