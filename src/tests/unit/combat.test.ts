import { describe, expect, it } from "vitest";
import { INITIAL_GOLD, INITIAL_LIVES } from "@/game/config/balance";
import { SIM_STEP } from "@/game/config/constants";
import { ENEMIES } from "@/game/data/enemies";
import { LEVEL_1 } from "@/game/data/levels";
import { TOWERS, TOWER_ORDER } from "@/game/data/towers";
import { GameEngine } from "@/game/engine/GameEngine";
import { advanceEnemy, createEnemy } from "@/game/entities/Enemy";
import { createTower } from "@/game/entities/Tower";
import {
  damageEnemy,
  selectTarget,
  updateProjectiles,
  updateTowers,
  type CombatHooks,
} from "@/game/systems/CombatSystem";
import { createMapLayout } from "@/game/systems/MapLayout";
import { createWorldPath } from "@/game/systems/PathSystem";
import type { Enemy, Projectile } from "@/game/types/entities";

const layout = createMapLayout(LEVEL_1);
const path = createWorldPath(layout.pathCells);
let ids = 0;

/** Inimigo parado numa posição arbitrária (para testes de combate isolados). */
function enemyAt(x: number, y: number, distance = 0, health = 32): Enemy {
  const enemy = createEnemy(`e${ids++}`, "normalSlime", path);
  enemy.position = { x, y };
  enemy.distance = distance;
  enemy.health = health;
  return enemy;
}

function recordingHooks() {
  const kills: Enemy[] = [];
  let projectileIds = 0;
  const hooks: CombatHooks = {
    onKill: (enemy) => kills.push(enemy),
    onEffect: () => {},
    nextProjectileId: () => `p${projectileIds++}`,
  };
  return { hooks, kills };
}

/** Roda torres + projéteis por `seconds` com inimigos parados. */
function simulate(towers: ReturnType<typeof createTower>[], enemies: Enemy[], seconds: number, hooks: CombatHooks) {
  let projectiles: Projectile[] = [];
  let fired = 0;
  const steps = Math.round(seconds / SIM_STEP);
  for (let i = 0; i < steps; i++) {
    const before = projectiles.length;
    updateTowers(towers, enemies, SIM_STEP, projectiles, hooks);
    fired += projectiles.length - before;
    projectiles = updateProjectiles(projectiles, enemies, SIM_STEP, hooks);
  }
  return { projectiles, fired };
}

describe("dados das torres", () => {
  it("não têm NaN, dano negativo, intervalo zero nem multiplicadores inválidos", () => {
    for (const type of TOWER_ORDER) {
      const t = TOWERS[type];
      for (const value of [t.cost, t.damage, t.attackInterval, t.range, t.projectile.speed]) {
        expect(Number.isFinite(value) && value > 0).toBe(true);
      }
      if (t.effect.kind === "slow") {
        expect(t.effect.factor).toBeGreaterThan(0);
        expect(t.effect.factor).toBeLessThan(1);
        expect(t.effect.duration).toBeGreaterThan(0);
      }
      if (t.effect.kind === "splash") expect(t.effect.radius).toBeGreaterThan(0);
    }
  });
});

describe("selectTarget", () => {
  const tower = createTower("t", "archer", { col: 6, row: 6 }); // centro (104, 104), alcance 66

  it("escolhe o inimigo vivo mais avançado dentro do alcance", () => {
    const near = enemyAt(110, 104, 100);
    const ahead = enemyAt(130, 120, 150);
    const outOfRange = enemyAt(300, 20, 400);
    expect(selectTarget(tower, [near, ahead, outOfRange])).toBe(ahead);
  });

  it("ignora mortos e escapados", () => {
    const dead = enemyAt(110, 104, 200);
    dead.state = "dead";
    const escaped = enemyAt(112, 104, 300);
    escaped.state = "escaped";
    const alive = enemyAt(114, 104, 50);
    expect(selectTarget(tower, [dead, escaped, alive])).toBe(alive);
    expect(selectTarget(tower, [dead, escaped])).toBeNull();
  });

  it("não ataca fora do alcance", () => {
    const { hooks } = recordingHooks();
    const far = enemyAt(104 + 67, 104);
    const { fired } = simulate([createTower("a", "archer", { col: 6, row: 6 })], [far], 2, hooks);
    expect(fired).toBe(0);
  });
});

describe("torres", () => {
  it("Archer: um projétil acerta apenas o alvo", () => {
    const { hooks } = recordingHooks();
    const tower = createTower("a", "archer", { col: 6, row: 6 });
    const target = enemyAt(120, 104, 200, 100);
    const neighbour = enemyAt(122, 104, 10, 100);
    simulate([tower], [target, neighbour], 0.5, hooks); // um disparo (intervalo 0,8 s)
    expect(target.health).toBe(100 - TOWERS.archer.damage);
    expect(neighbour.health).toBe(100);
  });

  it("respeita o intervalo de ataque", () => {
    const { hooks } = recordingHooks();
    const target = enemyAt(110, 104, 0, 10_000);
    const { fired } = simulate([createTower("a", "archer", { col: 6, row: 6 })], [target], 4, hooks);
    expect(fired).toBe(5); // t = 0; 0,8; 1,6; 2,4; 3,2
  });

  it("T07: Cannon atinge todos no raio, uma vez cada; quem está fora não sofre dano", () => {
    const { hooks } = recordingHooks();
    const tower = createTower("c", "cannon", { col: 6, row: 6 });
    const target = enemyAt(130, 120, 300, 100);
    const inRadius = [enemyAt(140, 120, 1, 100), enemyAt(130, 135, 2, 100)];
    const outside = enemyAt(130 + 30, 120, 3, 100);
    simulate([tower], [target, ...inRadius, outside], 1, hooks); // um disparo (intervalo 1,8 s)
    for (const enemy of [target, ...inRadius]) expect(enemy.health).toBe(100 - TOWERS.cannon.damage);
    expect(outside.health).toBe(100);
  });

  it("T08: Ice não acumula lentidão, renova a duração e o efeito expira", () => {
    const { hooks } = recordingHooks();
    const target = enemyAt(110, 104, 0, 1000);
    const tower = createTower("i", "iceWizard", { col: 6, row: 6 });
    simulate([tower], [target], 0.3, hooks);
    expect(target.slowFactor).toBe(0.4);
    simulate([tower], [target], 1.0, hooks); // segundo acerto
    expect(target.slowFactor).toBe(0.4);
    expect(target.slowTimer).toBeCloseTo(1.7, 1);

    // Velocidade reduzida enquanto dura, normal depois.
    const walker = createEnemy("w", "normalSlime", path);
    walker.slowFactor = 0.4;
    walker.slowTimer = 1;
    advanceEnemy(walker, 0.5, path);
    expect(walker.distance).toBeCloseTo(16 * 0.6 * 0.5, 5);
    advanceEnemy(walker, 1, path); // expira no meio do passo
    expect(walker.slowTimer).toBe(0);
    expect(walker.slowFactor).toBe(0);
    const before = walker.distance;
    advanceEnemy(walker, 1, path);
    expect(walker.distance - before).toBeCloseTo(16, 5);
  });
});

describe("morte e recompensa", () => {
  it("T05: vários acertos no mesmo passo matam e pagam uma única vez", () => {
    const { hooks, kills } = recordingHooks();
    const enemy = enemyAt(100, 100, 0, 10);
    expect(damageEnemy(enemy, 9, hooks)).toBe(false);
    expect(damageEnemy(enemy, 9, hooks)).toBe(true);
    expect(damageEnemy(enemy, 9, hooks)).toBe(false);
    expect(kills).toEqual([enemy]);
    expect(enemy).toMatchObject({ state: "dead", health: 0 });
  });

  it("recusa dano inválido (NaN, negativo, zero)", () => {
    const { hooks } = recordingHooks();
    const enemy = enemyAt(100, 100, 0, 10);
    for (const amount of [NaN, -5, 0, Infinity]) damageEnemy(enemy, amount, hooks);
    expect(enemy.health).toBe(10);
  });

  it("projétil de alvo único some se o alvo morrer no voo; o do canhão explode no último destino", () => {
    const { hooks } = recordingHooks();
    const target = enemyAt(150, 104, 0, 100);
    const bystander = enemyAt(150, 110, 0, 100);
    const arrows: Projectile[] = [];
    const balls: Projectile[] = [];
    updateTowers([createTower("a", "archer", { col: 6, row: 6 })], [target], SIM_STEP, arrows, hooks);
    updateTowers([createTower("c", "cannon", { col: 6, row: 6 })], [target], SIM_STEP, balls, hooks);
    target.state = "dead";

    expect(updateProjectiles(arrows, [target, bystander], SIM_STEP, hooks)).toHaveLength(0);
    let flying = balls;
    for (let i = 0; i < 120 && flying.length > 0; i++) flying = updateProjectiles(flying, [target, bystander], SIM_STEP, hooks);
    expect(bystander.health).toBe(100 - TOWERS.cannon.damage);
  });

  it("dezenas de inimigos e torres: sem NaN, vida nunca negativa, mortes contadas uma vez", () => {
    const { hooks, kills } = recordingHooks();
    const towers = [
      createTower("a1", "archer", { col: 6, row: 6 }),
      createTower("a2", "archer", { col: 7, row: 8 }),
      createTower("c1", "cannon", { col: 8, row: 6 }),
      createTower("c2", "cannon", { col: 10, row: 8 }),
      createTower("i1", "iceWizard", { col: 9, row: 6 }),
    ];
    const enemies = Array.from({ length: 40 }, (_, i) => enemyAt(90 + (i % 10) * 6, 112 + Math.floor(i / 10) * 3, i, 60));
    simulate(towers, enemies, 30, hooks);
    for (const enemy of enemies) {
      expect(Number.isFinite(enemy.health)).toBe(true);
      expect(enemy.health).toBeGreaterThanOrEqual(0);
    }
    const dead = enemies.filter((e) => e.state === "dead");
    expect(dead.length).toBe(40);
    expect(kills.length).toBe(dead.length);
    expect(new Set(kills).size).toBe(kills.length);
  });
});

describe("GameEngine — combate integrado", () => {
  it("mortes pagam recompensa, escapes não; ouro e vidas fecham a conta", () => {
    const engine = new GameEngine({ layout });
    engine.selectBuildType("archer");
    engine.placeTower({ col: 6, row: 6 });
    engine.selectBuildType("cannon");
    engine.placeTower({ col: 9, row: 6 });
    engine.startWave();
    for (let i = 0; i < 60 / SIM_STEP && engine.getSnapshot().phase === "running"; i++) engine.step(SIM_STEP);

    const s = engine.getSnapshot();
    const escaped = INITIAL_LIVES - s.lives;
    const killed = (s.gold - (INITIAL_GOLD - TOWERS.archer.cost - TOWERS.cannon.cost)) / ENEMIES.normalSlime.reward;
    expect(s.phase).toBe("preparing");
    expect(Number.isInteger(killed)).toBe(true);
    expect(killed + escaped).toBe(6);
    expect(killed).toBeGreaterThan(0);
    expect(engine.getProjectiles()).toHaveLength(0);
  });

  it("pausa congela recarga e projéteis", () => {
    const engine = new GameEngine({ layout });
    engine.selectBuildType("archer");
    engine.placeTower({ col: 1, row: 3 });
    engine.startWave();
    for (let i = 0; i < 90; i++) engine.step(SIM_STEP);
    const tower = engine.getTowers()[0];
    const cooldown = tower.cooldown;
    const projectile = engine.getProjectiles()[0];
    const position = projectile ? { ...projectile.position } : null;

    engine.pause();
    engine.advance(0.1);
    engine.step(SIM_STEP);
    expect(tower.cooldown).toBe(cooldown);
    if (projectile) expect(projectile.position).toEqual(position);
  });
});
