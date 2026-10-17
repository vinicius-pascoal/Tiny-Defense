import { INITIAL_GOLD, INITIAL_LIVES, MAX_TOWER_LEVEL, TOTAL_WAVES } from "@/game/config/balance";
import { MAX_FRAME_DELTA, MAX_STEPS_PER_FRAME, SIM_STEP } from "@/game/config/constants";
import { ENEMIES } from "@/game/data/enemies";
import { TOWERS } from "@/game/data/towers";
import { WAVES, type WaveDefinition } from "@/game/data/waves";
import { advanceEnemy, createEnemy } from "@/game/entities/Enemy";
import { createTower } from "@/game/entities/Tower";
import { updateProjectiles, updateTowers, type CombatHooks } from "@/game/systems/CombatSystem";
import { getSellRefund, getTowerStats, getUpgradeCost } from "@/game/systems/EconomySystem";
import type { MapLayout } from "@/game/systems/MapLayout";
import { createWorldPath, type WorldPath } from "@/game/systems/PathSystem";
import { cellKey, checkPlacement, type PlacementCheck } from "@/game/systems/PlacementSystem";
import { getWaveBonus, startWaveRun, takeDueSpawns, type WaveRun } from "@/game/systems/WaveSystem";
import type { Enemy, Projectile, Tower, VisualEffect } from "@/game/types/entities";
import type {
  GamePhase,
  GameSnapshot,
  GridPosition,
  SpeedMultiplier,
  TowerType,
  WaveReward,
} from "@/game/types/game";

/** Resultado estruturado de um comando: a engine valida tudo, não só a interface. */
export type CommandResult = { ok: true } | { ok: false; reason: string };

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
  /** Onda em andamento (fila de gerações); `null` fora de `running`. */
  private waveRun: WaveRun | null = null;
  private waveReward: WaveReward | null = null;
  private enemiesDefeated = 0;
  private nextEnemyId = 1;
  private accumulator = 0;

  private towers: Tower[] = [];
  /** Ocupação da grade: `cellKey` → torre. */
  private occupancy = new Map<string, Tower>();
  private nextTowerId = 1;
  private selectedBuildType: TowerType | null = null;
  private selectedTowerId: string | null = null;

  private projectiles: Projectile[] = [];
  private effects: VisualEffect[] = [];
  private nextProjectileId = 1;
  /** Marca mudanças visíveis no HUD durante um passo (ex.: ouro de uma morte). */
  private dirty = false;

  private readonly combatHooks: CombatHooks = {
    onKill: (enemy) => {
      this.gold += ENEMIES[enemy.type].reward;
      this.enemiesDefeated += 1;
      this.dirty = true;
    },
    onEffect: (effect) => this.effects.push({ ...effect, age: 0 }),
    nextProjectileId: () => `projectile-${this.nextProjectileId++}`,
  };

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

  /** Projéteis em voo, somente para leitura (renderer). */
  getProjectiles(): readonly Projectile[] {
    return this.projectiles;
  }

  /** Efeitos visuais ativos, somente para leitura (renderer). */
  getEffects(): readonly VisualEffect[] {
    return this.effects;
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
    this.dirty = false;

    // 1. Geração pela fila da onda.
    const run = this.waveRun;
    if (run) {
      for (const type of takeDueSpawns(run, dt)) {
        this.enemies.push(createEnemy(`enemy-${this.nextEnemyId++}`, type, this.path));
        this.dirty = true;
      }
    }

    // 2. Movimento e escapes. Quem escapa sai da lista antes do combate: não é mais atacado.
    const remaining: Enemy[] = [];
    for (const enemy of this.enemies) {
      if (advanceEnemy(enemy, dt, this.path)) {
        enemy.state = "escaped";
        this.lives = Math.max(this.lives - ENEMIES[enemy.type].castleDamage, 0);
        this.dirty = true;
      } else {
        remaining.push(enemy);
      }
    }
    this.enemies = remaining;

    // 3. Combate: torres disparam e projéteis atingem. Mortes pagam a recompensa uma única vez.
    updateTowers(this.towers, this.enemies, dt, this.projectiles, this.combatHooks);
    this.projectiles = updateProjectiles(this.projectiles, this.enemies, dt, this.combatHooks);
    this.enemies = this.enemies.filter((enemy) => enemy.state === "alive");

    // 4. Efeitos visuais envelhecem no tempo de simulação (congelam na pausa).
    for (const effect of this.effects) effect.age += dt;
    this.effects = this.effects.filter((effect) => effect.age < effect.duration);

    // 5. Fim de onda ou de partida, avaliado uma vez por passo, depois de escapes e mortes.
    // Derrota tem precedência: se o último inimigo morre (mesmo o chefe) no mesmo passo em que
    // as vidas zeram, a partida é perdida e nenhum bônus é pago.
    if (this.lives <= 0) this.endMatch("defeat");
    else if (this.pendingEnemies() === 0 && this.enemies.length === 0) this.completeWave();

    if (this.dirty) this.publish();
  }

  // --- Comandos ------------------------------------------------------------------------------

  startWave(): CommandResult {
    if (this.phase === "running") return fail("Termine a onda atual antes de iniciar outra.");
    if (this.phase !== "preparing") return fail("A partida terminou.");
    if (this.paused) return fail("Retome o jogo para iniciar a onda.");
    if (this.currentWave >= TOTAL_WAVES) return fail("Não há mais ondas.");

    const wave = this.waves[this.currentWave];
    if (!wave) return fail(`A onda ${this.currentWave + 1} ainda não está disponível.`);

    const run = startWaveRun(wave);
    if (run.queue.length === 0) return fail("A onda está vazia.");

    this.waveRun = run;
    this.waveReward = null;
    this.currentWave += 1;
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

  /** Sobe a torre um nível, gastando o custo uma única vez. Bloqueado em pausa e após o fim. */
  upgradeTower(id: string): CommandResult {
    const tower = this.towers.find((candidate) => candidate.id === id);
    if (!tower) return fail("Torre não encontrada.");
    const blocked = this.towerActionBlock();
    if (blocked) return fail(blocked);

    const cost = getUpgradeCost(tower.type, tower.level);
    if (cost === null || tower.level >= MAX_TOWER_LEVEL) return fail("Essa torre já está no nível máximo.");
    if (this.gold < cost) return fail(`Moedas insuficientes: faltam ${cost - this.gold} para melhorar.`);

    this.gold -= cost;
    tower.level += 1;
    tower.invested += cost;
    this.publish();
    return OK;
  }

  /**
   * Vende a torre: devolve 60% do total investido, remove-a, libera a célula e desmarca a seleção.
   * Uma torre vendida deixa de existir, então vendê-la de novo falha.
   */
  sellTower(id: string): CommandResult {
    const tower = this.towers.find((candidate) => candidate.id === id);
    if (!tower) return fail("Torre não encontrada.");
    const blocked = this.towerActionBlock();
    if (blocked) return fail(blocked);

    this.gold += getSellRefund(tower.invested);
    this.towers = this.towers.filter((candidate) => candidate !== tower);
    this.occupancy.delete(cellKey(tower));
    if (this.selectedTowerId === id) this.selectedTowerId = null;
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
    this.waveRun = null;
    this.waveReward = null;
    this.enemiesDefeated = 0;
    this.accumulator = 0;
    this.towers = [];
    this.occupancy = new Map();
    this.selectedBuildType = null;
    this.selectedTowerId = null;
    this.projectiles = [];
    this.effects = [];
    this.publish();
    return OK;
  }

  // --- Interno -------------------------------------------------------------------------------

  private pendingEnemies(): number {
    return this.waveRun?.queue.length ?? 0;
  }

  /**
   * Onda concluída (fila vazia E campo vazio — ROADMAP §6.4, regra 4). Ondas 1–9 pagam o bônus
   * uma única vez e voltam à preparação; a última leva à vitória.
   */
  private completeWave() {
    if (this.currentWave >= TOTAL_WAVES) return this.endMatch("victory");

    const bonus = getWaveBonus(this.currentWave);
    this.gold += bonus;
    this.waveReward = { wave: this.currentWave, bonus };
    this.phase = "preparing";
    this.waveRun = null;
    // Sem alvos, projéteis restantes não têm efeito; não ficam parados no ar entre ondas.
    this.projectiles = [];
    this.effects = [];
    this.dirty = true;
  }

  /** Encerra a partida: cancela gerações pendentes, combate e modos de interação. */
  private endMatch(result: "victory" | "defeat") {
    this.phase = result;
    this.waveRun = null;
    this.projectiles = [];
    this.effects = [];
    this.selectedBuildType = null;
    this.selectedTowerId = null;
    this.dirty = true;
  }

  /** Motivo que impede melhorar/vender agora, ou `null`. */
  private towerActionBlock(): string | null {
    if (this.phase === "victory" || this.phase === "defeat") return "A partida terminou.";
    if (this.paused) return "Retome o jogo para mexer nas torres.";
    return null;
  }

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
      pendingEnemies: this.pendingEnemies(),
      enemiesDefeated: this.enemiesDefeated,
      waveReward: this.waveReward,
      selectedTowerId: selected?.id ?? null,
      selectedTower: selected
        ? {
            id: selected.id,
            type: selected.type,
            level: selected.level,
            maxLevel: MAX_TOWER_LEVEL,
            col: selected.col,
            row: selected.row,
            invested: selected.invested,
            stats: getTowerStats(selected.type, selected.level),
            nextStats:
              selected.level < MAX_TOWER_LEVEL ? getTowerStats(selected.type, selected.level + 1) : null,
            upgradeCost: getUpgradeCost(selected.type, selected.level),
            sellRefund: getSellRefund(selected.invested),
          }
        : null,
      selectedBuildType: this.selectedBuildType,
    };
  }

  private publish() {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) listener();
  }
}
