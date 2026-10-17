import { INITIAL_GOLD, INITIAL_LIVES, TOTAL_WAVES } from "@/game/config/balance";
import { MAX_FRAME_DELTA, MAX_STEPS_PER_FRAME, SIM_STEP } from "@/game/config/constants";
import { ENEMIES } from "@/game/data/enemies";
import { TOWERS } from "@/game/data/towers";
import { WAVES, type WaveDefinition } from "@/game/data/waves";
import { advanceEnemy, createEnemy } from "@/game/entities/Enemy";
import { createTower } from "@/game/entities/Tower";
import type { MapLayout } from "@/game/systems/MapLayout";
import { createWorldPath, type WorldPath } from "@/game/systems/PathSystem";
import { cellKey, checkPlacement, type PlacementCheck } from "@/game/systems/PlacementSystem";
import type { Enemy, EnemyType, Tower } from "@/game/types/entities";
import type {
  GamePhase,
  GameSnapshot,
  GridPosition,
  SpeedMultiplier,
  TowerType,
} from "@/game/types/game";

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
  private readonly layout: MapLayout;
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

  private towers: Tower[] = [];
  /** Ocupação da grade: `cellKey` → torre. */
  private occupancy = new Map<string, Tower>();
  private nextTowerId = 1;
  private selectedBuildType: TowerType | null = null;
  private selectedTowerId: string | null = null;

  private snapshot: GameSnapshot;
  private readonly listeners = new Set<() => void>();

  constructor({ layout, waves = WAVES }: EngineOptions) {
    this.path = createWorldPath(layout.pathCells);
    this.layout = layout;
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

  /** Torres construídas, somente para leitura (renderer). */
  getTowers(): readonly Tower[] {
    return this.towers;
  }

  getTowerAt(cell: GridPosition): Tower | null {
    return this.occupancy.get(cellKey(cell)) ?? null;
  }

  /** Consulta se a torre pode ser construída na célula agora (prévia), sem alterar estado. */
  checkPlacement(type: TowerType, cell: GridPosition): PlacementCheck {
    return checkPlacement(
      {
        cells: this.layout.cells,
        occupied: this.occupancy,
        gold: this.gold,
        phase: this.phase,
        paused: this.paused,
      },
      type,
      cell,
    );
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

  /** Entra no modo de construção do tipo (ou sai dele com `null`); desmarca a torre selecionada. */
  selectBuildType(type: TowerType | null): CommandResult {
    if (type !== null && !(type in TOWERS)) return fail("Torre desconhecida.");
    if (type !== null && (this.phase === "victory" || this.phase === "defeat")) {
      return fail("A partida terminou: não é possível construir.");
    }
    if (this.selectedBuildType === type && this.selectedTowerId === null) return OK;

    this.selectedBuildType = type;
    this.selectedTowerId = null;
    this.publish();
    return OK;
  }

  /**
   * Constrói a torre do modo de construção atual na célula. Valida tudo antes de mudar
   * qualquer coisa; ouro e ocupação mudam juntos, no mesmo passo. Sai do modo de construção.
   */
  placeTower(cell: GridPosition): CommandResult {
    const type = this.selectedBuildType;
    if (!type) return fail("Escolha uma torre para construir.");

    const check = this.checkPlacement(type, cell);
    if (!check.ok) return fail(check.reason);

    const tower = createTower(`tower-${this.nextTowerId++}`, type, cell);
    this.gold -= TOWERS[type].cost;
    this.towers = [...this.towers, tower];
    this.occupancy.set(cellKey(cell), tower);
    this.selectedBuildType = null;
    this.publish();
    return OK;
  }

  /** Seleciona uma torre construída (ou limpa a seleção com `null`); sai do modo de construção. */
  selectTower(id: string | null): CommandResult {
    if (id !== null && !this.towers.some((tower) => tower.id === id)) {
      return fail("Torre não encontrada.");
    }
    if (this.selectedTowerId === id && this.selectedBuildType === null) return OK;

    this.selectedTowerId = id;
    this.selectedBuildType = null;
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
    this.towers = [];
    this.occupancy = new Map();
    this.selectedBuildType = null;
    this.selectedTowerId = null;
    this.publish();
    return OK;
  }

  // --- Interno -------------------------------------------------------------------------------

  private buildSnapshot(): GameSnapshot {
    const selected = this.selectedTowerId
      ? this.towers.find((tower) => tower.id === this.selectedTowerId)
      : undefined;

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
      selectedTowerId: selected?.id ?? null,
      selectedTower: selected
        ? { id: selected.id, type: selected.type, level: selected.level, col: selected.col, row: selected.row }
        : null,
      selectedBuildType: this.selectedBuildType,
    };
  }

  private publish() {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) listener();
  }
}
