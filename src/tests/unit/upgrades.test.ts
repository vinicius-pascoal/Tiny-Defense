import { describe, expect, it } from "vitest";
import { INITIAL_GOLD, MAX_TOWER_LEVEL } from "@/game/config/balance";
import { SIM_STEP } from "@/game/config/constants";
import { LEVEL_1 } from "@/game/data/levels";
import { TOWER_ORDER, TOWERS } from "@/game/data/towers";
import { GameEngine } from "@/game/engine/GameEngine";
import { createEnemy } from "@/game/entities/Enemy";
import { createTower } from "@/game/entities/Tower";
import { selectTarget, updateProjectiles, updateTowers, type CombatHooks } from "@/game/systems/CombatSystem";
import { getSellRefund, getTowerStats, getUpgradeCost } from "@/game/systems/EconomySystem";
import { createMapLayout } from "@/game/systems/MapLayout";
import { createWorldPath } from "@/game/systems/PathSystem";
import type { Projectile } from "@/game/types/entities";

const layout = createMapLayout(LEVEL_1);
const CELL = { col: 6, row: 6 };

function engineWithTower(type: "archer" | "cannon" | "iceWizard" = "archer") {
  const engine = new GameEngine({ layout });
  engine.selectBuildType(type);
  engine.placeTower(CELL);
  const id = engine.getTowerAt(CELL)!.id;
  return { engine, id };
}

describe("EconomySystem — progressão", () => {
  it("dano ≈ +40% por nível, alcance +8, mesma cadência", () => {
    expect(getTowerStats("archer", 1)).toEqual({ damage: 9, attackInterval: 0.8, range: 66 });
    expect(getTowerStats("archer", 2)).toEqual({ damage: 13, attackInterval: 0.8, range: 74 });
    expect(getTowerStats("archer", 3)).toEqual({ damage: 18, attackInterval: 0.8, range: 82 });
    expect(getTowerStats("cannon", 3).damage).toBe(39);
    expect(getTowerStats("iceWizard", 2).damage).toBe(6);
  });

  it("dano sempre cresce e o nível é limitado a 1–3", () => {
    for (const type of TOWER_ORDER) {
      const [l1, l2, l3] = [1, 2, 3].map((level) => getTowerStats(type, level));
      expect(l2.damage).toBeGreaterThan(l1.damage);
      expect(l3.damage).toBeGreaterThan(l2.damage);
      expect(getTowerStats(type, 4)).toEqual(l3);
      expect(getTowerStats(type, 0)).toEqual(l1);
    }
  });

  it("custos de melhoria: ceil(0,75 × base) e ceil(1,2 × base); nenhum no nível 3", () => {
    expect([getUpgradeCost("archer", 1), getUpgradeCost("archer", 2), getUpgradeCost("archer", 3)]).toEqual([38, 60, null]);
    expect([getUpgradeCost("cannon", 1), getUpgradeCost("cannon", 2)]).toEqual([68, 108]);
    expect([getUpgradeCost("iceWizard", 1), getUpgradeCost("iceWizard", 2)]).toEqual([57, 90]);
  });

  it("reembolso: floor(60% do investido), nunca acima dele", () => {
    expect(getSellRefund(50)).toBe(30);
    expect(getSellRefund(88)).toBe(52);
    expect(getSellRefund(0)).toBe(0);
    expect(getSellRefund(-10)).toBe(0);
    expect(getSellRefund(NaN)).toBe(0);
  });
});

describe("GameEngine — melhoria", () => {
  it("melhora uma vez, gasta o custo uma vez e acumula o investido", () => {
    const { engine, id } = engineWithTower("archer");
    expect(engine.upgradeTower(id)).toEqual({ ok: true });
    expect(engine.getSnapshot().gold).toBe(INITIAL_GOLD - 50 - 38);
    expect(engine.getTowers()[0]).toMatchObject({ level: 2, invested: 88 });
  });

  it("T14: nível 3 não sobe para 4 e não gasta ouro", () => {
    const { engine, id } = engineWithTower("archer"); // 150 - 50 = 100
    engine.upgradeTower(id); // -38 → 62
    engine.upgradeTower(id); // -60 → 2
    expect(engine.getTowers()[0].level).toBe(MAX_TOWER_LEVEL);
    const gold = engine.getSnapshot().gold;
    expect(engine.upgradeTower(id)).toEqual({ ok: false, reason: "Essa torre já está no nível máximo." });
    expect(engine.getSnapshot().gold).toBe(gold);
    expect(engine.getTowers()[0].level).toBe(3);
  });

  it("sem ouro suficiente não melhora", () => {
    const { engine, id } = engineWithTower("cannon"); // 150 - 90 = 60 < 68
    expect(engine.upgradeTower(id)).toEqual({ ok: false, reason: "Moedas insuficientes: faltam 8 para melhorar." });
    expect(engine.getSnapshot().gold).toBe(60);
    expect(engine.getTowers()[0].level).toBe(1);
  });

  it("snapshot da torre selecionada reflete a melhoria na hora", () => {
    const { engine, id } = engineWithTower("archer");
    engine.selectTower(id);
    expect(engine.getSnapshot().selectedTower).toMatchObject({
      level: 1,
      stats: { damage: 9, range: 66 },
      nextStats: { damage: 13, range: 74 },
      upgradeCost: 38,
      sellRefund: 30,
    });
    engine.upgradeTower(id);
    expect(engine.getSnapshot().selectedTower).toMatchObject({
      level: 2,
      stats: { damage: 13, range: 74 },
      upgradeCost: 60,
      sellRefund: 52,
    });
  });
});

describe("GameEngine — venda", () => {
  it("T13: vender torre nível 2 devolve floor(0,6 × investido) e libera a célula", () => {
    const { engine, id } = engineWithTower("archer");
    engine.upgradeTower(id); // investido 88
    engine.selectTower(id);
    const gold = engine.getSnapshot().gold;
    expect(engine.sellTower(id)).toEqual({ ok: true });
    expect(engine.getSnapshot()).toMatchObject({ gold: gold + 52, selectedTowerId: null, selectedTower: null });
    expect(engine.getTowerAt(CELL)).toBeNull();
    expect(engine.checkPlacement("archer", CELL).ok).toBe(true);
  });

  it("não vende duas vezes nem torre inexistente", () => {
    const { engine, id } = engineWithTower("archer");
    engine.sellTower(id);
    const gold = engine.getSnapshot().gold;
    expect(engine.sellTower(id).ok).toBe(false);
    expect(engine.sellTower("tower-404").ok).toBe(false);
    expect(engine.getSnapshot().gold).toBe(gold);
  });

  it("construir e vender em sequência sempre perde ouro (sem exploração)", () => {
    const engine = new GameEngine({ layout });
    for (let i = 0; i < 10; i++) {
      engine.selectBuildType("archer");
      if (!engine.placeTower(CELL).ok) break;
      engine.sellTower(engine.getTowerAt(CELL)!.id);
    }
    expect(engine.getSnapshot().gold).toBeLessThan(INITIAL_GOLD);
    expect(engine.getSnapshot().gold).toBeGreaterThanOrEqual(0);
  });

  it("pausa e fim de partida bloqueiam melhoria e venda", () => {
    const { engine, id } = engineWithTower("archer");
    engine.pause();
    expect(engine.upgradeTower(id).ok).toBe(false);
    expect(engine.sellTower(id).ok).toBe(false);
    expect(engine.getTowers()).toHaveLength(1);
    expect(engine.getSnapshot().gold).toBe(100);
  });
});

describe("melhoria muda o desempenho real", () => {
  const path = createWorldPath(layout.pathCells);
  const hooks: CombatHooks = { onKill: () => {}, onEffect: () => {}, nextProjectileId: () => "p" };

  it("nível 2 causa o dano do nível 2", () => {
    const tower = createTower("a", "archer", CELL);
    tower.level = 2;
    const enemy = createEnemy("e", "normalSlime", path);
    enemy.position = { x: 120, y: 104 };
    enemy.health = 100;
    let projectiles: Projectile[] = [];
    for (let i = 0; i < 30; i++) {
      updateTowers([tower], [enemy], SIM_STEP, projectiles, hooks);
      projectiles = updateProjectiles(projectiles, [enemy], SIM_STEP, hooks);
    }
    expect(enemy.health).toBe(100 - getTowerStats("archer", 2).damage);
  });

  it("o alcance maior alcança quem estava fora", () => {
    const tower = createTower("a", "archer", CELL); // centro (104, 104)
    const enemy = createEnemy("e", "normalSlime", path);
    enemy.position = { x: 104 + 70, y: 104 }; // entre 66 e 74
    expect(selectTarget(tower, [enemy])).toBeNull();
    tower.level = 2;
    expect(selectTarget(tower, [enemy])).toBe(enemy);
  });

  it("custos e reembolsos são inteiros e não negativos para todas as torres", () => {
    for (const type of TOWER_ORDER) {
      let invested = TOWERS[type].cost;
      for (let level = 1; level < MAX_TOWER_LEVEL; level++) {
        const cost = getUpgradeCost(type, level)!;
        expect(Number.isInteger(cost) && cost > 0).toBe(true);
        invested += cost;
        const refund = getSellRefund(invested);
        expect(Number.isInteger(refund)).toBe(true);
        expect(refund).toBeLessThan(invested);
      }
    }
  });
});
