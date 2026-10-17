import { describe, expect, it } from "vitest";
import { INITIAL_GOLD, INITIAL_LIVES, TOTAL_WAVES } from "@/game/config/balance";
import { SIM_STEP } from "@/game/config/constants";
import { ENEMIES } from "@/game/data/enemies";
import { LEVEL_1 } from "@/game/data/levels";
import { TOWERS } from "@/game/data/towers";
import { WAVES, type WaveDefinition } from "@/game/data/waves";
import { GameEngine } from "@/game/engine/GameEngine";
import { createMapLayout } from "@/game/systems/MapLayout";
import { buildSpawnQueue, getWaveBonus, startWaveRun, takeDueSpawns } from "@/game/systems/WaveSystem";
import type { EnemyType } from "@/game/types/entities";
import type { TowerType } from "@/game/types/game";

const layout = createMapLayout(LEVEL_1);

/** Avança até a onda acabar (ou o limite de segundos). */
function runWave(engine: GameEngine, maxSeconds = 400) {
  for (let i = 0; i < maxSeconds / SIM_STEP && engine.getSnapshot().phase === "running"; i++) {
    engine.step(SIM_STEP);
  }
}

function runSeconds(engine: GameEngine, seconds: number) {
  for (let i = 0; i < Math.round(seconds / SIM_STEP); i++) engine.step(SIM_STEP);
}

const wave = (enemy: EnemyType, count = 1, interval = 1): WaveDefinition => ({
  groups: [{ enemy, count, delay: 0, interval }],
});

function build(engine: GameEngine, type: TowerType, col: number, row: number) {
  engine.selectBuildType(type);
  return engine.placeTower({ col, row });
}

function countByType(definition: WaveDefinition) {
  const counts: Partial<Record<EnemyType, number>> = {};
  for (const group of definition.groups) counts[group.enemy] = (counts[group.enemy] ?? 0) + group.count;
  return counts;
}

describe("Configuração das 10 ondas (§6.3)", () => {
  it("composição de cada onda", () => {
    expect(WAVES).toHaveLength(TOTAL_WAVES);
    expect(WAVES.map(countByType)).toEqual([
      { normalSlime: 6 },
      { normalSlime: 8 },
      { normalSlime: 6, goblin: 4 },
      { goblin: 7, normalSlime: 5 },
      { normalSlime: 6, skeleton: 5 },
      { skeleton: 6, goblin: 5 },
      { normalSlime: 8, bigSlime: 4 },
      { bigSlime: 5, goblin: 7 },
      { bigSlime: 6, skeleton: 6, goblin: 6 },
      { goblin: 8, bigSlime: 6, kingSlime: 1 },
    ]);
  });

  it("só a onda 10 tem chefe; intervalos 0,8–1,4 s; nunca todos de uma vez", () => {
    WAVES.forEach((definition, index) => {
      const hasBoss = definition.groups.some((group) => ENEMIES[group.enemy].boss);
      expect(hasBoss).toBe(index === TOTAL_WAVES - 1);
      for (const group of definition.groups) {
        if (group.count > 1) {
          expect(group.interval).toBeGreaterThanOrEqual(0.8);
          expect(group.interval).toBeLessThanOrEqual(1.4);
        }
      }
      const queue = buildSpawnQueue(definition);
      const atStart = queue.filter((event) => event.time === 0).length;
      expect(atStart).toBe(1);
    });
  });

  it("atributos dos inimigos (§6.2)", () => {
    const stats = (type: EnemyType) => {
      const { health, speed, reward, castleDamage } = ENEMIES[type];
      return [health, speed, reward, castleDamage];
    };
    expect(stats("normalSlime")).toEqual([32, 16, 10, 1]);
    expect(stats("goblin")).toEqual([22, 25, 12, 1]);
    expect(stats("skeleton")).toEqual([50, 17, 15, 1]);
    expect(stats("bigSlime")).toEqual([95, 12, 22, 1]);
    expect(stats("kingSlime")).toEqual([420, 9, 120, 3]);
  });
});

describe("WaveSystem", () => {
  it("fila ordenada por tempo, intercalando os grupos", () => {
    const queue = buildSpawnQueue({
      groups: [
        { enemy: "normalSlime", count: 3, delay: 0, interval: 1 },
        { enemy: "goblin", count: 2, delay: 0.5, interval: 1 },
      ],
    });
    expect(queue.map((event) => [event.time, event.enemy])).toEqual([
      [0, "normalSlime"],
      [0.5, "goblin"],
      [1, "normalSlime"],
      [1.5, "goblin"],
      [2, "normalSlime"],
    ]);
  });

  it("libera cada inimigo uma única vez, no tempo certo", () => {
    const run = startWaveRun(wave("goblin", 3, 1));
    expect(takeDueSpawns(run, 0.01)).toEqual(["goblin"]);
    expect(takeDueSpawns(run, 0.5)).toEqual([]);
    expect(takeDueSpawns(run, 0.5)).toEqual(["goblin"]);
    expect(takeDueSpawns(run, 10)).toEqual(["goblin"]);
    expect(takeDueSpawns(run, 10)).toEqual([]);
  });

  it("bônus 20 + 5 × onda nas ondas 1–9; nenhum na 10 nem em valores inválidos", () => {
    expect(getWaveBonus(1)).toBe(25);
    expect(getWaveBonus(9)).toBe(65);
    expect(getWaveBonus(10)).toBe(0);
    expect(getWaveBonus(0)).toBe(0);
    expect(getWaveBonus(1.5)).toBe(0);
  });
});

describe("GameEngine — transições de onda", () => {
  it("T12: concluir a onda 1 paga o bônus uma vez e habilita a onda 2", () => {
    const engine = new GameEngine({ layout, waves: [wave("normalSlime"), wave("normalSlime")] });
    engine.startWave();
    runWave(engine); // o slime escapa: −1 vida, sem recompensa
    expect(engine.getSnapshot()).toMatchObject({
      phase: "preparing",
      currentWave: 1,
      gold: INITIAL_GOLD + 25,
      waveReward: { wave: 1, bonus: 25 },
    });
    runSeconds(engine, 5);
    expect(engine.getSnapshot().gold).toBe(INITIAL_GOLD + 25);
    expect(engine.startWave()).toEqual({ ok: true });
    expect(engine.getSnapshot()).toMatchObject({ currentWave: 2, waveReward: null });
  });

  it("T11: último inimigo morre com spawn pendente — a onda continua, sem bônus antecipado", () => {
    const engine = new GameEngine({ layout, waves: [wave("normalSlime", 2, 60)] });
    build(engine, "archer", 1, 3);
    engine.startWave();
    runSeconds(engine, 30);
    expect(engine.getSnapshot()).toMatchObject({
      phase: "running",
      activeEnemies: 0,
      pendingEnemies: 1,
      enemiesDefeated: 1,
      waveReward: null,
      gold: INITIAL_GOLD - TOWERS.archer.cost + ENEMIES.normalSlime.reward,
    });
  });

  it("não inicia outra onda durante a atual nem em pausa", () => {
    const engine = new GameEngine({ layout });
    engine.startWave();
    expect(engine.startWave()).toEqual({ ok: false, reason: "Termine a onda atual antes de iniciar outra." });
    runWave(engine);
    engine.pause();
    expect(engine.startWave().ok).toBe(false);
    expect(engine.getSnapshot().currentWave).toBe(1);
  });

  it("T16: limpar a onda 10 com vidas vence, sem bônus nem onda 11", () => {
    const engine = new GameEngine({ layout, waves: Array.from({ length: TOTAL_WAVES }, () => wave("normalSlime")) });
    for (let n = 1; n <= TOTAL_WAVES; n++) {
      expect(engine.startWave()).toEqual({ ok: true });
      runWave(engine);
    }
    const bonuses = Array.from({ length: TOTAL_WAVES - 1 }, (_, i) => getWaveBonus(i + 1)).reduce((a, b) => a + b);
    expect(engine.getSnapshot()).toMatchObject({
      phase: "victory",
      currentWave: TOTAL_WAVES,
      lives: INITIAL_LIVES - TOTAL_WAVES,
      gold: INITIAL_GOLD + bonuses,
      waveReward: null,
    });
    expect(engine.startWave()).toEqual({ ok: false, reason: "A partida terminou." });
    expect(engine.getSnapshot().currentWave).toBe(TOTAL_WAVES);
  });

  it("T15: vidas em zero derrotam e interrompem spawns, combate e construção", () => {
    const engine = new GameEngine({ layout, waves: [wave("goblin", 40, 0.8)] });
    build(engine, "archer", 1, 3);
    engine.startWave();
    runWave(engine);
    const s = engine.getSnapshot();
    expect(s).toMatchObject({ phase: "defeat", lives: 0, pendingEnemies: 0, waveReward: null, selectedBuildType: null });
    expect(engine.getProjectiles()).toHaveLength(0);

    const tower = engine.getTowers()[0];
    const enemies = engine.getEnemies().map((enemy) => ({ ...enemy, position: { ...enemy.position } }));
    runSeconds(engine, 5);
    engine.advance(0.1);
    expect(engine.getSnapshot()).toBe(s);
    expect(engine.getEnemies().map((enemy) => ({ ...enemy, position: { ...enemy.position } }))).toEqual(enemies);
    expect(engine.getProjectiles()).toHaveLength(0);
    expect(engine.startWave().ok).toBe(false);
    expect(engine.upgradeTower(tower.id).ok).toBe(false);
    expect(engine.selectBuildType("archer").ok).toBe(false);
  });

  it("derrota tem precedência: a onda 10 esvaziada com vidas em zero não vence", () => {
    // Ondas 1–9 tiram 2 vidas cada (restam 2); o chefe da 10 tira 3 ao escapar.
    const waves = [
      ...Array.from({ length: TOTAL_WAVES - 1 }, () => wave("goblin", 2)),
      wave("kingSlime"),
    ];
    const engine = new GameEngine({ layout, waves });
    for (let n = 1; n < TOTAL_WAVES; n++) {
      engine.startWave();
      runWave(engine);
    }
    expect(engine.getSnapshot()).toMatchObject({ phase: "preparing", lives: 2 });
    engine.startWave();
    runWave(engine);
    // No passo final a fila e o campo ficaram vazios E as vidas zeraram: derrota, não vitória.
    expect(engine.getSnapshot()).toMatchObject({ phase: "defeat", lives: 0, activeEnemies: 0, pendingEnemies: 0 });
  });

  it("chefe tira 3 vidas ao escapar, uma única vez", () => {
    const engine = new GameEngine({ layout, waves: [wave("kingSlime")] });
    engine.startWave();
    runWave(engine);
    expect(engine.getSnapshot()).toMatchObject({ phase: "preparing", lives: INITIAL_LIVES - 3 });
  });

  it("T17: reiniciar depois do fim repõe tudo e permite outra partida", () => {
    const engine = new GameEngine({ layout, waves: [wave("goblin", 40, 0.8), wave("normalSlime")] });
    build(engine, "cannon", 6, 6);
    engine.startWave();
    runWave(engine);
    expect(engine.getSnapshot().phase).toBe("defeat");

    let published = 0;
    engine.subscribe(() => published++);
    expect(engine.restart()).toEqual({ ok: true });
    expect(published).toBe(1);
    expect(engine.getSnapshot()).toMatchObject({
      phase: "preparing",
      paused: false,
      lives: INITIAL_LIVES,
      gold: INITIAL_GOLD,
      currentWave: 0,
      activeEnemies: 0,
      pendingEnemies: 0,
      enemiesDefeated: 0,
      waveReward: null,
      selectedTowerId: null,
      selectedBuildType: null,
    });
    expect(engine.getTowers()).toHaveLength(0);
    expect(engine.getEnemies()).toHaveLength(0);
    expect(engine.getEffects()).toHaveLength(0);
    expect(engine.getTowerAt({ col: 6, row: 6 })).toBeNull();
    expect(build(engine, "cannon", 6, 6).ok).toBe(true);
    expect(engine.startWave()).toEqual({ ok: true });
  });
});

describe("Partida completa com as ondas reais", () => {
  type Action = { build: TowerType; col: number; row: number } | { upgrade: { col: number; row: number } };

  /** Entre as ondas, executa o plano na ordem enquanto houver moedas; depois inicia a próxima onda. */
  function playMatch(plan: Action[]) {
    const engine = new GameEngine({ layout });
    let next = 0;
    while (engine.getSnapshot().phase === "preparing") {
      for (; next < plan.length; next++) {
        const action = plan[next];
        const tower = "upgrade" in action ? engine.getTowerAt(action.upgrade) : null;
        const result =
          "build" in action ? build(engine, action.build, action.col, action.row) : engine.upgradeTower(tower!.id);
        if (!result.ok) break;
      }
      engine.selectBuildType(null);
      expect(engine.startWave()).toEqual({ ok: true });
      runWave(engine);
    }
    return engine.getSnapshot();
  }

  const at = (col: number, row: number) => ({ upgrade: { col, row } });

  it("uma defesa razoável (4 torres bem posicionadas, todas no nível 3) vence, chefe incluído", () => {
    const s = playMatch([
      { build: "archer", col: 6, row: 6 },
      { build: "archer", col: 13, row: 5 },
      { build: "iceWizard", col: 11, row: 6 },
      { build: "cannon", col: 13, row: 6 },
      at(13, 5), at(6, 6), at(13, 6), at(11, 6),
      at(13, 5), at(6, 6), at(13, 6), at(11, 6),
    ]);
    expect(s).toMatchObject({ phase: "victory", currentWave: TOTAL_WAVES });
    expect(s.lives).toBeGreaterThan(0);
    const total = WAVES.flatMap((definition) => definition.groups).reduce((sum, group) => sum + group.count, 0);
    // Cada inimigo morre ou escapa (escapes tiram ≥ 1 vida; o chefe tira 3).
    expect(s.enemiesDefeated).toBeLessThanOrEqual(total);
    expect(s.enemiesDefeated + (INITIAL_LIVES - s.lives)).toBeGreaterThanOrEqual(total);
  });

  it("não é trivial: três torres nível 1 não seguram as ondas finais", () => {
    const s = playMatch([
      { build: "archer", col: 6, row: 6 },
      { build: "archer", col: 13, row: 5 },
      { build: "cannon", col: 13, row: 6 },
    ]);
    expect(s.phase).toBe("defeat");
    expect(s.currentWave).toBeGreaterThanOrEqual(5);
  });

  it("sem torres, o castelo cai antes do fim", () => {
    const s = playMatch([]);
    expect(s.phase).toBe("defeat");
    expect(s.currentWave).toBeLessThan(TOTAL_WAVES);
  });

  it("a vida dos inimigos cresce com a onda", () => {
    const multipliers = WAVES.map((definition) => definition.healthMultiplier ?? 1);
    expect(multipliers[0]).toBe(1);
    for (let i = 1; i < multipliers.length; i++) expect(multipliers[i]).toBeGreaterThan(multipliers[i - 1]);
    const engine = new GameEngine({ layout, waves: [{ ...wave("bigSlime"), healthMultiplier: 2 }] });
    engine.startWave();
    engine.step(SIM_STEP);
    expect(engine.getEnemies()[0]).toMatchObject({ health: 190, maxHealth: 190 });
  });
});
