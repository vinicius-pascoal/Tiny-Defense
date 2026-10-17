/** Contratos de estado da partida compartilhados entre engine e interface (ROADMAP §3.3). */

export type GamePhase = "preparing" | "running" | "victory" | "defeat";
export type TowerType = "archer" | "cannon" | "iceWizard";
export type SpeedMultiplier = 1 | 2;

export type GridPosition = { col: number; row: number };
export type Vector2 = { x: number; y: number };

/** Resumo da torre selecionada, para o painel de detalhes. */
export type SelectedTowerSummary = Readonly<{
  id: string;
  type: TowerType;
  level: number;
  col: number;
  row: number;
}>;

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
  selectedTowerId: string | null;
  selectedTower: SelectedTowerSummary | null;
  selectedBuildType: TowerType | null;
}>;
