import { describe, expect, it } from "vitest";
import { INITIAL_LIVES } from "@/game/config/balance";
import { SIM_STEP } from "@/game/config/constants";
import { LEVEL_1 } from "@/game/data/levels";
import type { WaveDefinition } from "@/game/data/waves";
import { GameEngine } from "@/game/engine/GameEngine";
import { createMapLayout } from "@/game/systems/MapLayout";

const layout = createMapLayout(LEVEL_1);
const singleSlime: WaveDefinition[] = [
  { groups: [{ enemy: "normalSlime", count: 1, delay: 0, interval: 1 }] },
];

function runSeconds(engine: GameEngine, seconds: number) {
  const steps = Math.round(seconds / SIM_STEP);
  for (let i = 0; i < steps; i++) engine.step(SIM_STEP);
}

describe("GameEngine — onda e movimento", () => {
  it("começa em preparação com os valores iniciais", () => {
    const s = new GameEngine({ layout }).getSnapshot();
    expect(s).toMatchObject({ phase: "preparing", currentWave: 0, totalWaves: 10, lives: 20, gold: 150 });
  });

  it("não gera todos os inimigos de uma vez", () => {
    const engine = new GameEngine({ layout });
    expect(engine.startWave()).toEqual({ ok: true });
    engine.step(SIM_STEP);
    expect(engine.getSnapshot()).toMatchObject({ phase: "running", currentWave: 1, activeEnemies: 1, pendingEnemies: 5 });
    runSeconds(engine, 1.2);
    expect(engine.getSnapshot().activeEnemies).toBe(2);
  });

  it("avança o inimigo velocidade × delta ao longo do caminho", () => {
    const engine = new GameEngine({ layout, waves: singleSlime });
    engine.startWave();
    engine.step(SIM_STEP); // surge e dá o primeiro passo
    const enemy = engine.getEnemies()[0];
    const before = enemy.distance;
    runSeconds(engine, 2);
    expect(enemy.distance - before).toBeCloseTo(16 * 2, 5);
    expect(enemy.position.y).toBe(40); // ainda na linha 2
  });

  it("chegar ao castelo tira a vida exatamente uma vez e conclui a onda", () => {
    const engine = new GameEngine({ layout, waves: singleSlime });
    engine.startWave();
    runSeconds(engine, 584 / 16 - 0.1);
    expect(engine.getSnapshot().lives).toBe(INITIAL_LIVES);
    runSeconds(engine, 0.2);
    expect(engine.getSnapshot()).toMatchObject({ lives: INITIAL_LIVES - 1, activeEnemies: 0, phase: "preparing" });
    runSeconds(engine, 5);
    expect(engine.getSnapshot().lives).toBe(INITIAL_LIVES - 1);
  });

  it("onda 1 completa: 6 escapes = 6 vidas", () => {
    const engine = new GameEngine({ layout });
    engine.startWave();
    runSeconds(engine, 60);
    expect(engine.getSnapshot()).toMatchObject({ lives: INITIAL_LIVES - 6, phase: "preparing", pendingEnemies: 0 });
  });

  it("não termina a onda cedo entre dois spawns", () => {
    const gap: WaveDefinition[] = [
      { groups: [{ enemy: "normalSlime", count: 2, delay: 0, interval: 50 }] },
    ];
    const engine = new GameEngine({ layout, waves: gap });
    engine.startWave();
    runSeconds(engine, 40); // o primeiro já escapou, o segundo ainda não surgiu
    expect(engine.getSnapshot()).toMatchObject({ phase: "running", activeEnemies: 0, pendingEnemies: 1 });
  });

  it("vidas em zero levam à derrota e cancelam spawns pendentes", () => {
    const many: WaveDefinition[] = [
      { groups: [{ enemy: "normalSlime", count: 30, delay: 0, interval: 0.5 }] },
    ];
    const engine = new GameEngine({ layout, waves: many });
    engine.startWave();
    runSeconds(engine, 80);
    expect(engine.getSnapshot()).toMatchObject({ phase: "defeat", lives: 0, pendingEnemies: 0 });
  });
});

describe("GameEngine — comandos e tempo", () => {
  it("recusa iniciar onda durante outra ou sem onda configurada", () => {
    const engine = new GameEngine({ layout, waves: singleSlime });
    engine.startWave();
    expect(engine.startWave().ok).toBe(false);
    runSeconds(engine, 40);
    const result = engine.startWave();
    expect(result).toEqual({ ok: false, reason: "A onda 2 ainda não está disponível." });
    expect(engine.getSnapshot().currentWave).toBe(1);
  });

  it("pausa congela posição e animação; retomar não teletransporta", () => {
    const engine = new GameEngine({ layout, waves: singleSlime });
    engine.startWave();
    runSeconds(engine, 3);
    const enemy = engine.getEnemies()[0];
    const { distance, age } = enemy;

    engine.pause();
    engine.advance(0.05);
    engine.step(SIM_STEP);
    expect(enemy.distance).toBe(distance);
    expect(enemy.age).toBe(age);

    engine.resume();
    engine.advance(5); // delta enorme (aba inativa) é limitado
    expect(enemy.distance - distance).toBeLessThanOrEqual(16 * 0.1 + 1e-9);
  });

  it("advance acumula frações de passo sem perder tempo", () => {
    const engine = new GameEngine({ layout, waves: singleSlime });
    engine.startWave();
    for (let i = 0; i < 120; i++) engine.advance(1 / 120); // 1 s em quadros de 120 Hz
    const enemy = engine.getEnemies()[0];
    expect(enemy.distance).toBeCloseTo(16, 0);
  });

  it("reiniciar restaura o estado inicial", () => {
    const engine = new GameEngine({ layout });
    engine.startWave();
    runSeconds(engine, 45);
    engine.restart();
    expect(engine.getEnemies()).toHaveLength(0);
    expect(engine.getSnapshot()).toMatchObject({ phase: "preparing", currentWave: 0, lives: 20, paused: false });
  });

  it("publica snapshots só quando algo visível muda", () => {
    const engine = new GameEngine({ layout, waves: singleSlime });
    let calls = 0;
    engine.subscribe(() => calls++);
    engine.startWave(); // 1
    runSeconds(engine, 10); // spawn = 2; movimento não publica
    expect(calls).toBe(2);
  });
});
