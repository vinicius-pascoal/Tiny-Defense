import type { TowerType, Vector2 } from "./game";

export type Tower = {
  readonly id: string;
  readonly type: TowerType;
  readonly col: number;
  readonly row: number;
  level: number;
  /** Total já gasto na torre (construção + melhorias), base do reembolso na venda. */
  invested: number;
  /** Tempo restante até poder atacar de novo (segundos de simulação). */
  cooldown: number;
};

/** Inimigos disponíveis. Goblin, Skeleton, Big Slime e King Slime entram na Etapa 09. */
export type EnemyType = "normalSlime";

/** Morto e escapado são estados finais: o inimigo não recebe dano nem causa efeitos depois. */
export type EnemyState = "alive" | "dead" | "escaped";

export type Enemy = {
  readonly id: string;
  readonly type: EnemyType;
  state: EnemyState;
  /** Distância percorrida no caminho, em unidades do mundo. */
  distance: number;
  /** Posição atual no mundo (centro da célula do caminho). */
  position: Vector2;
  health: number;
  readonly maxHealth: number;
  /** Velocidade base, em unidades por segundo de simulação. */
  readonly speed: number;
  /** Lentidão ativa: fração removida da velocidade e tempo restante. Não acumula. */
  slowFactor: number;
  slowTimer: number;
  /** Tempo de simulação desde o surgimento, usado pela animação (congela na pausa). */
  age: number;
};

export type Projectile = {
  readonly id: string;
  /** Torre de origem: define sprite, dano e efeito. */
  readonly towerType: TowerType;
  readonly damage: number;
  position: Vector2;
  /** Alvo perseguido; `null` quando ele morreu/escapou durante o voo. */
  target: Enemy | null;
  /** Último destino conhecido (posição do alvo); o canhão explode aqui se o alvo sumir. */
  destination: Vector2;
  /** Direção do voo, em radianos (para sprites orientados). */
  angle: number;
};

/** Efeito visual passageiro, sem regra de jogo; avança no tempo de simulação. */
export type VisualEffect = {
  kind: "hit" | "explosion" | "frost" | "death";
  x: number;
  y: number;
  radius: number;
  age: number;
  duration: number;
};
