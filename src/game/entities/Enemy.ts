import { ENEMIES } from "@/game/data/enemies";
import type { Enemy, EnemyType } from "@/game/types/entities";
import { positionAt, type WorldPath } from "@/game/systems/PathSystem";

export function createEnemy(id: string, type: EnemyType, path: WorldPath): Enemy {
  const definition = ENEMIES[type];
  return {
    id,
    type,
    state: "alive",
    distance: 0,
    position: positionAt(path, 0),
    health: definition.health,
    maxHealth: definition.health,
    speed: definition.speed,
    slowFactor: 0,
    slowTimer: 0,
    age: 0,
  };
}

/** Velocidade atual, considerando a lentidão ativa. */
export function currentSpeed(enemy: Enemy): number {
  return enemy.slowTimer > 0 ? enemy.speed * (1 - enemy.slowFactor) : enemy.speed;
}

/**
 * Avança o inimigo `dt` segundos de simulação ao longo do caminho.
 * Retorna `true` quando ele alcança o fim (portão do castelo) neste passo.
 */
export function advanceEnemy(enemy: Enemy, dt: number, path: WorldPath): boolean {
  enemy.age += dt;
  enemy.distance = Math.min(enemy.distance + currentSpeed(enemy) * dt, path.length);
  if (enemy.slowTimer > 0) {
    enemy.slowTimer = Math.max(enemy.slowTimer - dt, 0);
    if (enemy.slowTimer === 0) enemy.slowFactor = 0;
  }
  positionAt(path, enemy.distance, enemy.position);
  return enemy.distance >= path.length;
}
