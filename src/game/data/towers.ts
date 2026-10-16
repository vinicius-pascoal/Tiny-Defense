import type { SpriteKey } from "@/lib/spriteManifest";
import type { TowerType } from "@/game/types/game";

/**
 * Dados de apresentação das torres do MVP (ROADMAP §6.1).
 * Atributos de combate (dano, alcance, cadência) entram aqui na Etapa 06.
 */
export type TowerDefinition = {
  type: TowerType;
  name: string;
  cost: number;
  sprite: SpriteKey;
  summary: string;
};

export const TOWERS: Record<TowerType, TowerDefinition> = {
  archer: {
    type: "archer",
    name: "Archer",
    cost: 50,
    sprite: "game/buildings/towers/tower_archer",
    summary: "Flechas rápidas em um alvo",
  },
  cannon: {
    type: "cannon",
    name: "Cannon",
    cost: 90,
    sprite: "game/buildings/towers/tower_cannon",
    summary: "Explosão lenta em área",
  },
  iceWizard: {
    type: "iceWizard",
    name: "Ice Wizard",
    cost: 75,
    sprite: "game/buildings/towers/tower_ice_wizard",
    summary: "Deixa os inimigos lentos",
  },
};

export const TOWER_ORDER: readonly TowerType[] = ["archer", "cannon", "iceWizard"];
