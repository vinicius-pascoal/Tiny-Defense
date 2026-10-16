import type { EnemyType } from "@/game/types/entities";

/** Grupo de inimigos iguais, gerados um a um com intervalo fixo (tempos em segundos de simulação). */
export type WaveGroup = {
  enemy: EnemyType;
  count: number;
  /** Atraso do primeiro inimigo do grupo, contado do início da onda. */
  delay: number;
  interval: number;
};

export type WaveDefinition = {
  groups: readonly WaveGroup[];
};

/**
 * Ondas configuradas (ROADMAP §6.3). Por enquanto só a onda 1, usada como onda de teste da
 * movimentação; as ondas 2–10 e os demais inimigos entram na Etapa 09.
 */
export const WAVES: readonly WaveDefinition[] = [
  { groups: [{ enemy: "normalSlime", count: 6, delay: 0, interval: 1.1 }] },
];
