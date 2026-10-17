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
  /** Multiplicador da vida base dos inimigos desta onda (padrão 1). */
  healthMultiplier?: number;
};

/**
 * As 10 ondas do MVP (ROADMAP §6.3). Grupos com atrasos diferentes se intercalam na estrada em vez
 * de surgirem todos juntos; intervalos entre 0,8 e 1,4 s. Ajustes de dificuldade acontecem aqui.
 *
 * Balanceamento (Etapa 11): a vida dos inimigos cresce +50% por onda (1× → 5,5×). Simulando
 * partidas, sem isso 3 torres nível 1 venciam sem perder vidas; com isso, poucas torres ou
 * torres mal posicionadas perdem, 4–5 torres bem posicionadas e melhoradas vencem perdendo
 * algumas vidas, e só uma defesa completa termina intacta.
 */
export const WAVES: readonly WaveDefinition[] = [
  // 1 — 6 Normal Slimes: aprender construção e alcance.
  { groups: [{ enemy: "normalSlime", count: 6, delay: 0, interval: 1.1 }], healthMultiplier: 1 },
  // 2 — 8 Normal Slimes: posicionamento eficiente.
  { groups: [{ enemy: "normalSlime", count: 8, delay: 0, interval: 1 }], healthMultiplier: 1.5 },
  // 3 — 6 Normal Slimes + 4 Goblins: inimigos rápidos.
  {
    healthMultiplier: 2,
    groups: [
      { enemy: "normalSlime", count: 6, delay: 0, interval: 1.2 },
      { enemy: "goblin", count: 4, delay: 3, interval: 1.3 },
    ],
  },
  // 4 — 7 Goblins + 5 Normal Slimes: priorização.
  {
    healthMultiplier: 2.5,
    groups: [
      { enemy: "goblin", count: 7, delay: 0, interval: 0.9 },
      { enemy: "normalSlime", count: 5, delay: 1.5, interval: 1.2 },
    ],
  },
  // 5 — 5 Skeletons + 6 Normal Slimes: mais resistência.
  {
    healthMultiplier: 3,
    groups: [
      { enemy: "normalSlime", count: 6, delay: 0, interval: 1 },
      { enemy: "skeleton", count: 5, delay: 2, interval: 1.3 },
    ],
  },
  // 6 — 6 Skeletons + 5 Goblins: exigir evolução das torres.
  {
    healthMultiplier: 3.5,
    groups: [
      { enemy: "skeleton", count: 6, delay: 0, interval: 1.2 },
      { enemy: "goblin", count: 5, delay: 2.5, interval: 1 },
    ],
  },
  // 7 — 4 Big Slimes + 8 Normal Slimes: muita vida.
  {
    healthMultiplier: 4,
    groups: [
      { enemy: "normalSlime", count: 8, delay: 0, interval: 0.9 },
      { enemy: "bigSlime", count: 4, delay: 1.5, interval: 1.4 },
    ],
  },
  // 8 — 5 Big Slimes + 7 Goblins: tanques e velocidade.
  {
    healthMultiplier: 4.5,
    groups: [
      { enemy: "bigSlime", count: 5, delay: 0, interval: 1.4 },
      { enemy: "goblin", count: 7, delay: 2, interval: 0.9 },
    ],
  },
  // 9 — 6 Big Slimes + 6 Skeletons + 6 Goblins: pico de intensidade.
  {
    healthMultiplier: 5,
    groups: [
      { enemy: "bigSlime", count: 6, delay: 0, interval: 1.4 },
      { enemy: "skeleton", count: 6, delay: 1, interval: 1.2 },
      { enemy: "goblin", count: 6, delay: 4, interval: 1 },
    ],
  },
  // 10 — 1 King Slime + 6 Big Slimes + 8 Goblins: chefe final, depois da escolta.
  {
    healthMultiplier: 5.5,
    groups: [
      { enemy: "goblin", count: 8, delay: 0, interval: 0.9 },
      { enemy: "bigSlime", count: 6, delay: 2, interval: 1.4 },
      { enemy: "kingSlime", count: 1, delay: 6, interval: 1 },
    ],
  },
];
