import { describe, expect, it } from "vitest";
import { SIM_STEP } from "@/game/config/constants";
import { LEVEL_1 } from "@/game/data/levels";
import type { WaveDefinition } from "@/game/data/waves";
import { GameEngine } from "@/game/engine/GameEngine";
import { createMapLayout } from "@/game/systems/MapLayout";

const layout = createMapLayout(LEVEL_1);
const FRAME = 1 / 60;

/** Quadros de RAF a 60 Hz até o fim da onda (ou limite). */
function playFrames(engine: GameEngine, maxFrames = 60 * 400, onFrame?: (frame: number) => void) {
  let frame = 0;
  for (; frame < maxFrames && engine.getSnapshot().phase === "running"; frame++) {
    onFrame?.(frame);
    engine.advance(FRAME);
  }
  return frame;
}

function defendedEngine() {
  const engine = new GameEngine({ layout });
  engine.selectBuildType("archer");
  engine.placeTower({ col: 6, row: 6 });
  engine.selectBuildType("iceWizard");
  engine.placeTower({ col: 13, row: 5 });
  return engine;
}

/** Resultado de regra (sem posições), para comparar partidas. */
const outcome = (engine: GameEngine) => {
  const { phase, lives, gold, enemiesDefeated, currentWave, waveReward } = engine.getSnapshot();
  return { phase, lives, gold, enemiesDefeated, currentWave, waveReward };
};

describe("Velocidade 1×/2×", () => {
  it("setSpeed valida o valor e publica só quando muda", () => {
    const engine = new GameEngine({ layout });
    let calls = 0;
    engine.subscribe(() => calls++);
    expect(engine.setSpeed(2)).toEqual({ ok: true });
    expect(engine.setSpeed(2)).toEqual({ ok: true });
    expect(engine.setSpeed(3 as 1)).toEqual({ ok: false, reason: "Velocidade inválida." });
    expect(engine.getSnapshot().speed).toBe(2);
    expect(calls).toBe(1);
  });

  it("T10: em 2× o movimento e o relógio da onda andam o dobro no mesmo tempo real", () => {
    const slow = new GameEngine({ layout });
    const fast = new GameEngine({ layout });
    fast.setSpeed(2);
    slow.startWave();
    fast.startWave();
    for (let i = 0; i < 60 * 3; i++) {
      slow.advance(FRAME);
      fast.advance(FRAME);
    }
    // 3 s reais: 1× = 3 s de simulação (3 slimes a 1,1 s), 2× = 6 s (6 slimes).
    expect(slow.getSnapshot().activeEnemies).toBe(3);
    expect(fast.getSnapshot().activeEnemies).toBe(6);
    const lead = (engine: GameEngine) => engine.getEnemies()[0].distance;
    expect(lead(fast)).toBeCloseTo(lead(slow) * 2, 0);
  });

  it("2× acelera as recargas na mesma proporção (mesmos disparos por tempo de simulação)", () => {
    const slow = defendedEngine();
    const fast = defendedEngine();
    fast.setSpeed(2);
    slow.startWave();
    fast.startWave();
    for (let i = 0; i < 60 * 10; i++) slow.advance(FRAME);
    for (let i = 0; i < 60 * 5; i++) fast.advance(FRAME);
    expect(fast.getSnapshot().enemiesDefeated).toBe(slow.getSnapshot().enemiesDefeated);
    expect(fast.getSnapshot().gold).toBe(slow.getSnapshot().gold);
  });

  it("a mesma onda em 1× e 2× tem o mesmo resultado, em metade dos quadros (sem eventos duplicados)", () => {
    const slow = defendedEngine();
    const fast = defendedEngine();
    fast.setSpeed(2);
    slow.startWave();
    fast.startWave();
    const slowFrames = playFrames(slow);
    const fastFrames = playFrames(fast);
    expect(outcome(fast)).toEqual(outcome(slow));
    expect(outcome(fast).phase).toBe("preparing");
    expect(fastFrames).toBeLessThanOrEqual(Math.ceil(slowFrames / 2) + 1);
  });

  it("delta enorme em 2× continua limitado (sem salto de unidades)", () => {
    const engine = new GameEngine({ layout });
    engine.setSpeed(2);
    engine.startWave();
    engine.advance(FRAME);
    const enemy = engine.getEnemies()[0];
    const before = enemy.distance;
    engine.advance(10);
    expect(enemy.distance - before).toBeLessThanOrEqual(16 * 0.1 * 2 + 1e-9);
  });

  it("não troca de velocidade depois do fim; reiniciar volta a 1×", () => {
    const many: WaveDefinition[] = [{ groups: [{ enemy: "goblin", count: 30, delay: 0, interval: 0.8 }] }];
    const engine = new GameEngine({ layout, waves: many });
    engine.setSpeed(2);
    engine.startWave();
    playFrames(engine);
    expect(engine.getSnapshot().phase).toBe("defeat");
    expect(engine.setSpeed(1).ok).toBe(false);
    engine.restart();
    expect(engine.getSnapshot().speed).toBe(1);
  });
});

describe("Pausa", () => {
  it("pausa não concede ouro, não gera inimigos nem avança a onda", () => {
    const engine = defendedEngine();
    engine.startWave();
    for (let i = 0; i < 60 * 4; i++) engine.advance(FRAME);
    engine.pause();
    const before = engine.getSnapshot();
    const distances = engine.getEnemies().map((enemy) => enemy.distance);
    const cooldowns = engine.getTowers().map((tower) => tower.cooldown);
    for (let i = 0; i < 60 * 30; i++) engine.advance(FRAME);
    engine.setSpeed(2);
    for (let i = 0; i < 60 * 30; i++) engine.advance(FRAME);
    expect(engine.getSnapshot()).toMatchObject({
      gold: before.gold,
      lives: before.lives,
      currentWave: before.currentWave,
      activeEnemies: before.activeEnemies,
      pendingEnemies: before.pendingEnemies,
      enemiesDefeated: before.enemiesDefeated,
      phase: "running",
      paused: true,
    });
    expect(engine.getEnemies().map((enemy) => enemy.distance)).toEqual(distances);
    expect(engine.getTowers().map((tower) => tower.cooldown)).toEqual(cooldowns);
  });

  it("alternar 1×/2× e pausar/retomar muitas vezes não muda o resultado da onda", () => {
    const reference = defendedEngine();
    reference.startWave();
    playFrames(reference);

    const engine = defendedEngine();
    engine.startWave();
    playFrames(engine, 60 * 400, (frame) => {
      if (frame % 7 === 0) engine.setSpeed(engine.getSnapshot().speed === 1 ? 2 : 1);
      if (frame % 11 === 0) engine.pause();
      if (frame % 11 === 3) engine.resume();
    });
    expect(outcome(engine)).toEqual(outcome(reference));
    expect(outcome(engine).enemiesDefeated).toBeGreaterThan(0);
  });

  it("partida inteira com trocas constantes termina e pode ser reiniciada e jogada de novo", () => {
    const engine = new GameEngine({ layout });
    for (let round = 0; round < 2; round++) {
      engine.selectBuildType("archer");
      engine.placeTower({ col: 6, row: 6 });
      engine.selectBuildType("archer");
      engine.placeTower({ col: 13, row: 5 });
      engine.selectBuildType("cannon");
      engine.placeTower({ col: 13, row: 6 });
      let guard = 0;
      while (engine.getSnapshot().phase === "preparing" && guard++ < 20) {
        expect(engine.startWave().ok).toBe(true);
        playFrames(engine, 60 * 400, (frame) => {
          if (frame % 13 === 0) engine.setSpeed(engine.getSnapshot().speed === 1 ? 2 : 1);
          if (frame % 17 === 0) engine.pause();
          if (frame % 17 === 5) engine.resume();
        });
        if (engine.getSnapshot().paused) engine.resume();
      }
      expect(["victory", "defeat"]).toContain(engine.getSnapshot().phase);
      expect(engine.getSnapshot().currentWave).toBeGreaterThan(0);
      engine.restart();
      expect(engine.getSnapshot()).toMatchObject({ phase: "preparing", currentWave: 0, speed: 1, paused: false });
    }
  });
});

it("T09 com advance: pausa mantém posições e recargas, mesmo com quadros chegando", () => {
  const engine = defendedEngine();
  engine.startWave();
  for (let i = 0; i < 90; i++) engine.advance(SIM_STEP);
  engine.pause();
  const enemy = engine.getEnemies()[0];
  const { x, y } = enemy.position;
  for (let i = 0; i < 600; i++) engine.advance(FRAME);
  expect(enemy.position).toEqual({ x, y });
});
