import {
  MAX_TOWER_LEVEL,
  SELL_REFUND_RATIO,
  UPGRADE_COST_FACTORS,
  UPGRADE_DAMAGE_MULTIPLIER,
  UPGRADE_RANGE_BONUS,
} from "@/game/config/balance";
import { TOWERS } from "@/game/data/towers";
import type { TowerType } from "@/game/types/game";

/** Atributos de combate de uma torre num nível. */
export type TowerStats = {
  damage: number;
  attackInterval: number;
  range: number;
};

const clampLevel = (level: number) => Math.min(Math.max(Math.floor(level), 1), MAX_TOWER_LEVEL);

/**
 * Atributos efetivos por nível: dano ≈ +40% a cada nível (arredondado ao inteiro, nunca menor que o
 * nível anterior), alcance +8 por nível e a mesma cadência. Fonte única para combate e interface.
 */
export function getTowerStats(type: TowerType, level: number): TowerStats {
  const base = TOWERS[type];
  const steps = clampLevel(level) - 1;
  return {
    damage: Math.max(Math.round(base.damage * UPGRADE_DAMAGE_MULTIPLIER ** steps), base.damage + steps),
    attackInterval: base.attackInterval,
    range: base.range + UPGRADE_RANGE_BONUS * steps,
  };
}

/** Custo para subir do `level` atual ao próximo; `null` no nível máximo. */
export function getUpgradeCost(type: TowerType, level: number): number | null {
  if (level >= MAX_TOWER_LEVEL) return null;
  const factor = UPGRADE_COST_FACTORS[clampLevel(level) - 1];
  return Math.ceil(TOWERS[type].cost * factor);
}

/** Reembolso da venda: 60% do total investido, arredondado para baixo; nunca maior que o investido. */
export function getSellRefund(invested: number): number {
  if (!Number.isFinite(invested) || invested <= 0) return 0;
  return Math.min(Math.floor(invested * SELL_REFUND_RATIO), invested);
}
