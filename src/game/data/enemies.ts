import type { SpriteKey } from "@/lib/spriteManifest";
import type { EnemyType } from "@/game/types/entities";

/** Atributos dos inimigos (ROADMAP §6.2). Velocidade em unidades do mundo por segundo. */
export type EnemyDefinition = {
  type: EnemyType;
  name: string;
  health: number;
  speed: number;
  reward: number;
  castleDamage: number;
  sprite: SpriteKey;
  /** Quadros por segundo da animação de caminhada. */
  animationFps: number;
  /** Chefe: barra de vida sempre visível. */
  boss?: boolean;
};

export const ENEMIES: Record<EnemyType, EnemyDefinition> = {
  normalSlime: {
    type: "normalSlime",
    name: "Normal Slime",
    health: 32,
    speed: 16,
    reward: 10,
    castleDamage: 1,
    sprite: "game/enemies/normal_slime",
    animationFps: 6,
  },
  goblin: {
    type: "goblin",
    name: "Goblin",
    health: 22,
    speed: 25,
    reward: 12,
    castleDamage: 1,
    sprite: "game/enemies/goblin",
    animationFps: 10,
  },
  skeleton: {
    type: "skeleton",
    name: "Skeleton",
    health: 50,
    speed: 17,
    reward: 15,
    castleDamage: 1,
    sprite: "game/enemies/skeleton",
    animationFps: 7,
  },
  bigSlime: {
    type: "bigSlime",
    name: "Big Slime",
    health: 95,
    speed: 12,
    reward: 22,
    castleDamage: 1,
    sprite: "game/enemies/big_slime",
    animationFps: 5,
  },
  kingSlime: {
    type: "kingSlime",
    name: "King Slime",
    health: 420,
    speed: 9,
    reward: 120,
    castleDamage: 3,
    sprite: "game/enemies/king_slime",
    animationFps: 4,
    boss: true,
  },
};
