import type { TowerType, Vector2 } from "./game";

export type Tower = {
  readonly id: string;
  readonly type: TowerType;
  readonly col: number;
  readonly row: number;
  level: number;
  /** Total já gasto na torre (construção + melhorias), base do reembolso na venda. */
  invested: number;
};

/** Inimigos disponíveis. Goblin, Skeleton, Big Slime e King Slime entram na Etapa 09. */
export type EnemyType = "normalSlime";

export type Enemy = {
  readonly id: string;
  readonly type: EnemyType;
  /** Distância percorrida no caminho, em unidades do mundo. */
  distance: number;
  /** Posição atual no mundo (centro da célula do caminho). */
  position: Vector2;
  health: number;
  readonly maxHealth: number;
  /** Velocidade base, em unidades por segundo de simulação. */
  readonly speed: number;
  /** Tempo de simulação desde o surgimento, usado pela animação (congela na pausa). */
  age: number;
};
