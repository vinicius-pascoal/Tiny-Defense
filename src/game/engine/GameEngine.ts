import { INITIAL_GOLD, INITIAL_LIVES, TOTAL_WAVES } from "@/game/config/balance";
import { MAX_FRAME_DELTA, MAX_STEPS_PER_FRAME, SIM_STEP } from "@/game/config/constants";
import { ENEMIES } from "@/game/data/enemies";
import { WAVES, type WaveDefinition } from "@/game/data/waves";
import { advanceEnemy, createEnemy } from "@/game/entities/Enemy";
import type { MapLayout } from "@/game/systems/MapLayout";
import { createWorldPath, type WorldPath } from "@/game/systems/PathSystem";
import type { Enemy, EnemyType } from "@/game/types/entities";
import type { GamePhase, GameSnapshot, SpeedMultiplier } from "@/game/types/game";

/** Resultado estruturado de um comando: a engine valida tudo, não só a interface. */
export type CommandResult = { ok: true } | { ok: false; reason: string };

type SpawnEvent = { time: number; enemy: EnemyType };

type EngineOptions = {
  layout: MapLayout;
  waves?: readonly WaveDefinition[];
};

const OK: CommandResult = { ok: true };
const fail = (reason: string): CommandResult => ({ ok: false, reason });

/**
 * Simulação da partida em TypeScript puro: única fonte de verdade para vidas, ouro, ondas e
 * entidades. Avança em passos fixos de `SIM_STEP`; não conhece React, DOM nem Canvas.
 */
export class GameEngine {
  readonly path: WorldPath;
  private readonly waves: readonly WaveDefinition[];

  private phase: GamePhase = "preparing";
  private paused = false;
  private speed: SpeedMultiplier = 1;
  private lives = INITIAL_LIVES;
  private gold = INITIAL_GOLD;
  private currentWave = 0;
  private enemies: Enemy[] = [];
  private spawnQueue: SpawnEvent[] = [];
  private waveTime = 0;
  private nextEnemyId = 1;
  private accumulator = 0;

  private snapshot: GameSnapshot;
  private readonly listeners = new Set<() => void>();

  constructor({ layout, waves = WAVES }: EngineOptions) {
    this.path = createWorldPath(layout.pathCells);
    this.waves = waves;
    this.snapshot = this.buildSnapshot();
  }

  // --- Leitura -------------------------------------------------------------------------------

  /** Snapshot imutável; a mesma referência enquanto nada visível mudar (`useSyncExternalStore`). */
  readonly getSnapshot = (): GameSnapshot => this.snapshot;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Inimigos ativos, somente para leitura (renderer). */
  getEnemies(): readonly Enemy[] {
    return this.enemies;
  }

  // --- Tempo ---------------------------------------------------------------------------------

  /**
   * Avança a simulação pelo tempo real decorrido (segundos), em passos fixos.
   * O delta é limitado e o excedente de passos é descartado para evitar saltos.
   */
  advance(realDeltaSeconds: number) {
    if (this.paused || this.phase !== "running" || !(realDeltaSeconds > 0)) {
      this.accumulator = 0;
      return;
    }

    this.accumulator += Math.min(realDeltaSeconds, MAX_FRAME_DELTA) * this.speed;
    let steps = 0;
    while (this.accumulator >= SIM_STEP && steps < MAX_STEPS_PER_FRAME) {
      this.step(SIM_STEP);
      this.accumulator -= SIM_STEP;
      steps += 1;
      if (this.phase !== "running") break;
    }
    if (steps >= MAX_STEPS_PER_FRAME) this.accumulator = 0;
  }

  /** Um passo da simulação. Público para testes determinísticos. */
  step(dt: number) {
    if (this.paused || this.phase !== "running") return;
    let changed = false;

    this.waveTime += dt;
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].time <= this.waveTime) {
      const event = this.spawnQueue.shift()!;
      this.enemies.push(createEnemy(`enemy-${this.nextEnemyId++}`, event.enemy, this.path));
      changed = true;
    }

    // Movimento e escapes; a lista é reconstruída em vez de mutada durante a iteração.
    const remaining: Enemy[] = [];
    for (const enemy of this.enemies) {
      if (advanceEnemy(enemy, dt, this.path)) {
        this.lives = Math.max(this.lives - ENEMIES[enemy.type].castleDamage, 0);
        changed = true;
      } else {
        remaining.push(enemy);
      }
    }
    this.enemies = remaining;

    if (this.lives <= 0) {
      // Derrota tem precedência: cancela gerações pendentes e congela a partida.
      this.phase = "defeat";
      this.spawnQueue = [];
      changed = true;
    } else if (this.spawnQueue.length === 0 && this.enemies.length === 0) {
      // Só conclui com todos os grupos gerados e o campo vazio (ROADMAP §6.4, regra 4).
      this.phase = this.currentWave >= TOTAL_WAVES ? "victory" : "preparing";
      changed = true;
    }

    if (changed) this.publish();
  }

  // --- Comandos ------------------------------------------------------------------------------

  startWave(): CommandResult {
    if (this.phase === "running") return fail("Termine a onda atual antes de iniciar outra.");
    if (this.phase !== "preparing") return fail("A partida terminou.");
    if (this.paused) return fail("Retome o jogo para iniciar a onda.");
    if (this.currentWave >= TOTAL_WAVES) return fail("Não há mais ondas.");

    const wave = this.waves[this.currentWave];
    if (!wave) return fail(`A onda ${this.currentWave + 1} ainda não está disponível.`);

    const queue: SpawnEvent[] = [];
    for (const group of wave.groups) {
      for (let i = 0; i < group.count; i++) {
        queue.push({ time: group.delay + i * group.interval, enemy: group.enemy });
      }
    }
    if (queue.length === 0) return fail("A onda está vazia.");

    this.spawnQueue = queue.sort((a, b) => a.time - b.time);
    this.currentWave += 1;
    this.waveTime = 0;
    this.accumulator = 0;
    this.phase = "running";
    this.publish();
    return OK;
  }

  pause(): CommandResult {
    if (this.phase === "victory" || this.phase === "defeat") return fail("A partida terminou.");
    if (this.paused) return fail("O jogo já está pausado.");
    this.paused = true;
    this.accumulator = 0;
    this.publish();
    return OK;
  }

  resume(): CommandResult {
    if (!this.paused) return fail("O jogo não está pausado.");
    this.paused = false;
    this.accumulator = 0;
    this.publish();
    return OK;
  }

  /** Restaura o estado inicial, descartando entidades e filas anteriores. */
  restart(): CommandResult {
    this.phase = "preparing";
    this.paused = false;
    this.speed = 1;
    this.lives = INITIAL_LIVES;
    this.gold = INITIAL_GOLD;
    this.currentWave = 0;
    this.enemies = [];
    this.spawnQueue = [];
    this.waveTime = 0;
    this.accumulator = 0;
    this.publish();
    return OK;
  }

  // --- Interno -------------------------------------------------------------------------------

  private buildSnapshot(): GameSnapshot {
    return {
      phase: this.phase,
      paused: this.paused,
      speed: this.speed,
      lives: this.lives,
      gold: this.gold,
      currentWave: this.currentWave,
      totalWaves: TOTAL_WAVES,
      activeEnemies: this.enemies.length,
      pendingEnemies: this.spawnQueue.length,
      selectedTowerId: null,
      selectedBuildType: null,
    };
  }

  private publish() {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) listener();
  }
}
