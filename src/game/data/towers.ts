import type { SpriteKey } from "@/lib/spriteManifest";
import type { TowerType } from "@/game/types/game";

/**
 * Torres do MVP (ROADMAP §6.1). Distâncias em unidades do mundo; intervalo em segundos de
 * simulação. Efeitos especiais (explosão, lentidão) entram com o combate na Etapa 07.
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
  },
};

export const TOWER_ORDER: readonly TowerType[] = ["archer", "cannon", "iceWizard"];
