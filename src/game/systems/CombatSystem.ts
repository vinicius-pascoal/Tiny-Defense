import { TILE_SIZE } from "@/game/config/constants";
import { TOWERS } from "@/game/data/towers";
import type { Enemy, Projectile, Tower, VisualEffect } from "@/game/types/entities";
import type { Vector2 } from "@/game/types/game";
import { getTowerStats } from "./EconomySystem";

/** Ganchos da engine: o sistema decide o combate, a engine guarda ouro e efeitos. */
export type CombatHooks = {
  /** Chamado uma única vez por inimigo, no passo em que a vida chega a zero. */
  onKill: (enemy: Enemy) => void;
  onEffect: (effect: Omit<VisualEffect, "age">) => void;
  nextProjectileId: () => string;
};

/** Centro da célula da torre: origem do alcance. */
export function towerCenter(tower: Pick<Tower, "col" | "row">): Vector2 {
  return { x: (tower.col + 0.5) * TILE_SIZE, y: (tower.row + 0.5) * TILE_SIZE };
}

const distanceSq = (a: Vector2, b: Vector2) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/** Inimigo vivo e dentro do alcance mais avançado no caminho (ROADMAP §6.1), ou `null`. */
export function selectTarget(tower: Tower, enemies: readonly Enemy[]): Enemy | null {
  const center = towerCenter(tower);
  const rangeSq = getTowerStats(tower.type, tower.level).range ** 2;
  let best: Enemy | null = null;
  for (const enemy of enemies) {
    if (enemy.state !== "alive" || distanceSq(center, enemy.position) > rangeSq) continue;
    if (!best || enemy.distance > best.distance) best = enemy;
  }
  return best;
}

/**
 * Aplica dano. Só afeta inimigos vivos e valores finitos e positivos; a morte (e a recompensa,
 * via `onKill`) acontece no máximo uma vez, mesmo com vários projéteis no mesmo passo.
 */
export function damageEnemy(enemy: Enemy, amount: number, hooks: CombatHooks): boolean {
  if (enemy.state !== "alive" || !Number.isFinite(amount) || amount <= 0) return false;
  enemy.health = Math.max(enemy.health - amount, 0);
  if (enemy.health > 0) return false;

  enemy.state = "dead";
  hooks.onKill(enemy);
  hooks.onEffect({ kind: "death", x: enemy.position.x, y: enemy.position.y, radius: 7, duration: 0.35 });
  return true;
}

/** Recarga das torres e disparos contra o alvo prioritário; novos projéteis vão para `out`. */
export function updateTowers(
  towers: readonly Tower[],
  enemies: readonly Enemy[],
  dt: number,
  out: Projectile[],
  hooks: CombatHooks,
) {
  for (const tower of towers) {
    tower.cooldown = Math.max(tower.cooldown - dt, 0);
    if (tower.cooldown > 0) continue;

    const target = selectTarget(tower, enemies);
    if (!target) continue; // pronta: dispara assim que alguém entrar no alcance

    const definition = TOWERS[tower.type];
    const stats = getTowerStats(tower.type, tower.level);
    const origin = {
      x: (tower.col + 0.5) * TILE_SIZE,
      y: (tower.row + 1) * TILE_SIZE - definition.muzzleHeight,
    };
    out.push({
      id: hooks.nextProjectileId(),
      towerType: tower.type,
      damage: stats.damage,
      position: origin,
      target,
      destination: { ...target.position },
      angle: Math.atan2(target.position.y - origin.y, target.position.x - origin.x),
    });
    tower.cooldown = stats.attackInterval;
  }
}

function impact(projectile: Projectile, enemies: readonly Enemy[], hooks: CombatHooks) {
  const definition = TOWERS[projectile.towerType];
  const { effect } = definition;
  const point = projectile.destination;

  if (effect.kind === "splash") {
    // Alvos coletados antes de aplicar o dano: cada inimigo no raio sofre um único acerto.
    const radiusSq = effect.radius ** 2;
    const hit = enemies.filter((e) => e.state === "alive" && distanceSq(point, e.position) <= radiusSq);
    for (const enemy of hit) damageEnemy(enemy, projectile.damage, hooks);
    hooks.onEffect({ kind: "explosion", x: point.x, y: point.y, radius: effect.radius, duration: 0.4 });
    return;
  }

  const target = projectile.target;
  if (!target || target.state !== "alive") return;
  const killed = damageEnemy(target, projectile.damage, hooks);

  if (effect.kind === "slow") {
    if (!killed) {
      // Não acumula: mantém a mesma redução e só renova a duração.
      target.slowFactor = effect.factor;
      target.slowTimer = Math.max(target.slowTimer, effect.duration);
    }
    hooks.onEffect({ kind: "frost", x: point.x, y: point.y, radius: 6, duration: 0.35 });
  } else {
    hooks.onEffect({ kind: "hit", x: point.x, y: point.y, radius: 4, duration: 0.18 });
  }
}

/**
 * Move os projéteis em direção ao alvo (que é perseguido enquanto vivo). Se o alvo some, projéteis
 * de alvo único são descartados e o do canhão explode no último destino conhecido.
 * Retorna os projéteis ainda em voo.
 */
export function updateProjectiles(
  projectiles: readonly Projectile[],
  enemies: readonly Enemy[],
  dt: number,
  hooks: CombatHooks,
): Projectile[] {
  const flying: Projectile[] = [];

  for (const projectile of projectiles) {
    const definition = TOWERS[projectile.towerType];
    if (projectile.target && projectile.target.state !== "alive") projectile.target = null;
    if (projectile.target) {
      projectile.destination.x = projectile.target.position.x;
      projectile.destination.y = projectile.target.position.y;
    } else if (definition.effect.kind !== "splash") {
      continue;
    }

    const dx = projectile.destination.x - projectile.position.x;
    const dy = projectile.destination.y - projectile.position.y;
    const remaining = Math.hypot(dx, dy);
    const travel = definition.projectile.speed * dt;

    if (remaining <= travel) {
      projectile.position.x = projectile.destination.x;
      projectile.position.y = projectile.destination.y;
      impact(projectile, enemies, hooks);
      continue;
    }

    projectile.position.x += (dx / remaining) * travel;
    projectile.position.y += (dy / remaining) * travel;
    projectile.angle = Math.atan2(dy, dx);
    flying.push(projectile);
  }

  return flying;
}
