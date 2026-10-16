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
};
