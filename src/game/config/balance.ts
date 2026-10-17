/** Valores iniciais de balanceamento (ROADMAP §1.5). Ajustes de jogo devem acontecer aqui. */

export const INITIAL_LIVES = 20;
export const INITIAL_GOLD = 150;
export const TOTAL_WAVES = 10;
export const MAX_TOWER_LEVEL = 3;

/** Fração do total investido devolvida ao vender uma torre (arredondada para baixo). */
export const SELL_REFUND_RATIO = 0.6;

/**
 * Custo de melhoria como fração do custo base, arredondado para cima (ROADMAP §6.1):
 * índice 0 = nível 1 → 2, índice 1 = nível 2 → 3.
 */
export const UPGRADE_COST_FACTORS: readonly number[] = [0.75, 1.2];
/** Multiplicador de dano por nível acima do 1 (arredondado ao inteiro); a cadência não muda. */
export const UPGRADE_DAMAGE_MULTIPLIER = 1.4;
/** Alcance extra por nível acima do 1, em unidades do mundo. */
export const UPGRADE_RANGE_BONUS = 8;
