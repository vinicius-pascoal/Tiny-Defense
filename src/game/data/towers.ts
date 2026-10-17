import type { SpriteKey } from "@/lib/spriteManifest";
import type { TowerType } from "@/game/types/game";

/** Efeito do impacto do projétil. */
export type TowerEffect =
  | { kind: "single" }
  /** Dano em todos os inimigos no raio do ponto de impacto, uma vez por inimigo. */
  | { kind: "splash"; radius: number }
  /** Reduz a velocidade em `factor` (0–1) por `duration` s; um novo impacto renova a duração. */
  | { kind: "slow"; factor: number; duration: number };

/**
 * Torres do MVP (ROADMAP §6.1). Distâncias em unidades do mundo; tempos em segundos de simulação.
 */
export type TowerDefinition = {
  type: TowerType;
  name: string;
  cost: number;
  sprite: SpriteKey;
  summary: string;
  damage: number;
  /** Intervalo entre ataques. */
  attackInterval: number;
  range: number;
  effect: TowerEffect;
  projectile: { sprite: SpriteKey; speed: number; /** Gira na direção do voo (flecha). */ oriented: boolean };
  /** Altura, acima da base da célula, de onde o projétil sai. */
  muzzleHeight: number;
};

export const TOWERS: Record<TowerType, TowerDefinition> = {
  archer: {
    type: "archer",
    name: "Archer",
    cost: 50,
    sprite: "game/buildings/towers/tower_archer",
    summary: "Flechas rápidas em um alvo",
    damage: 9,
    attackInterval: 0.8,
    range: 66,
    effect: { kind: "single" },
    projectile: { sprite: "game/projectiles/tower_archer_projectile", speed: 190, oriented: true },
    muzzleHeight: 18,
  },
  cannon: {
    type: "cannon",
    name: "Cannon",
    cost: 90,
    sprite: "game/buildings/towers/tower_cannon",
    summary: "Explosão lenta em área",
    damage: 20,
    attackInterval: 1.8,
    range: 62,
    effect: { kind: "splash", radius: 24 },
    projectile: { sprite: "game/projectiles/tower_cannon_projectile", speed: 120, oriented: false },
    muzzleHeight: 22,
  },
  iceWizard: {
    type: "iceWizard",
    name: "Ice Wizard",
    cost: 75,
    sprite: "game/buildings/towers/tower_ice_wizard",
    summary: "Deixa os inimigos lentos",
    damage: 4,
    attackInterval: 0.85,
    range: 75,
    effect: { kind: "slow", factor: 0.4, duration: 1.7 },
    projectile: { sprite: "game/projectiles/tower_ice_wizard_projectile", speed: 150, oriented: false },
    muzzleHeight: 21,
  },
};

export const TOWER_ORDER: readonly TowerType[] = ["archer", "cannon", "iceWizard"];
