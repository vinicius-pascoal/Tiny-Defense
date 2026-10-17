/** Contratos de estado da partida compartilhados entre engine e interface (ROADMAP §3.3). */

export type GamePhase = "preparing" | "running" | "victory" | "defeat";
export type TowerType = "archer" | "cannon" | "iceWizard";
export type SpeedMultiplier = 1 | 2;

export type GridPosition = { col: number; row: number };
export type Vector2 = { x: number; y: number };

export type TowerStatsSummary = Readonly<{
  damage: number;
  attackInterval: number;
  range: number;
}>;

/** Resumo da torre selecionada, para o painel de detalhes (valores calculados pela engine). */
export type SelectedTowerSummary = Readonly<{
  id: string;
  type: TowerType;
  level: number;
  maxLevel: number;
  col: number;
  row: number;
  invested: number;
  stats: TowerStatsSummary;
  /** Atributos no próximo nível; `null` no nível máximo. */
  nextStats: TowerStatsSummary | null;
  /** Custo da próxima melhoria; `null` no nível máximo. */
  upgradeCost: number | null;
  sellRefund: number;
}>;

/** Onda concluída e bônus pago por ela (ondas 1–9; a última termina em vitória). */
export type WaveReward = Readonly<{ wave: number; bonus: number }>;

/** Retrato imutável do estado da partida, lido pelo HUD e pelos painéis React. */
export type GameSnapshot = Readonly<{
  phase: GamePhase;
  paused: boolean;
  speed: SpeedMultiplier;
  lives: number;
  gold: number;
  currentWave: number;
  totalWaves: number;
  activeEnemies: number;
  pendingEnemies: number;
  /** Inimigos derrotados na partida (resumo do fim de jogo). */
  enemiesDefeated: number;
  /** Última onda concluída e seu bônus; some ao iniciar a próxima onda ou reiniciar. */
  waveReward: WaveReward | null;
  selectedTowerId: string | null;
  selectedTower: SelectedTowerSummary | null;
  selectedBuildType: TowerType | null;
}>;
