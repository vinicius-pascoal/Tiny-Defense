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
 * As 10 ondas do MVP (ROADMAP §6.3). Grupos com atrasos diferentes se intercalam na estrada em vez
 * de surgirem todos juntos; intervalos entre 0,8 e 1,4 s. Ajustes de dificuldade acontecem aqui.
 */
export const WAVES: readonly WaveDefinition[] = [
  // 1 — 6 Normal Slimes: aprender construção e alcance.
  { groups: [{ enemy: "normalSlime", count: 6, delay: 0, interval: 1.1 }] },
  // 2 — 8 Normal Slimes: posicionamento eficiente.
  { groups: [{ enemy: "normalSlime", count: 8, delay: 0, interval: 1 }] },
  // 3 — 6 Normal Slimes + 4 Goblins: inimigos rápidos.
  {
    groups: [
      { enemy: "normalSlime", count: 6, delay: 0, interval: 1.2 },
      { enemy: "goblin", count: 4, delay: 3, interval: 1.3 },
    ],
  },
  // 4 — 7 Goblins + 5 Normal Slimes: priorização.
  {
    groups: [
      { enemy: "goblin", count: 7, delay: 0, interval: 0.9 },
      { enemy: "normalSlime", count: 5, delay: 1.5, interval: 1.2 },
    ],
  },
  // 5 — 5 Skeletons + 6 Normal Slimes: mais resistência.
  {
    groups: [
      { enemy: "normalSlime", count: 6, delay: 0, interval: 1 },
      { enemy: "skeleton", count: 5, delay: 2, interval: 1.3 },
    ],
  },
  // 6 — 6 Skeletons + 5 Goblins: exigir evolução das torres.
  {
    groups: [
      { enemy: "skeleton", count: 6, delay: 0, interval: 1.2 },
      { enemy: "goblin", count: 5, delay: 2.5, interval: 1 },
    ],
  },
  // 7 — 4 Big Slimes + 8 Normal Slimes: muita vida.
  {
    groups: [
      { enemy: "normalSlime", count: 8, delay: 0, interval: 0.9 },
      { enemy: "bigSlime", count: 4, delay: 1.5, interval: 1.4 },
    ],
  },
  // 8 — 5 Big Slimes + 7 Goblins: tanques e velocidade.
  {
    groups: [
      { enemy: "bigSlime", count: 5, delay: 0, interval: 1.4 },
      { enemy: "goblin", count: 7, delay: 2, interval: 0.9 },
    ],
  },
  // 9 — 6 Big Slimes + 6 Skeletons + 6 Goblins: pico de intensidade.
  {
    groups: [
      { enemy: "bigSlime", count: 6, delay: 0, interval: 1.4 },
      { enemy: "skeleton", count: 6, delay: 1, interval: 1.2 },
      { enemy: "goblin", count: 6, delay: 4, interval: 1 },
    ],
  },
  // 10 — 1 King Slime + 6 Big Slimes + 8 Goblins: chefe final, depois da escolta.
  {
    groups: [
      { enemy: "goblin", count: 8, delay: 0, interval: 0.9 },
      { enemy: "bigSlime", count: 6, delay: 2, interval: 1.4 },
      { enemy: "kingSlime", count: 1, delay: 6, interval: 1 },
    ],
  },
];
