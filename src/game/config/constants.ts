/** Dimensões lógicas do mundo de jogo (ROADMAP §1.5 e §5.1). */

export const TILE_SIZE = 16;
export const GRID_COLS = 20;
export const GRID_ROWS = 12;

export const WORLD_WIDTH = GRID_COLS * TILE_SIZE; // 320
export const WORLD_HEIGHT = GRID_ROWS * TILE_SIZE; // 192

/** Passo fixo da simulação, em segundos (ROADMAP §3.4). */
export const SIM_STEP = 1 / 60;
/** Maior delta real aceito por quadro, em segundos: evita saltos ao voltar de abas inativas. */
export const MAX_FRAME_DELTA = 0.1;
/** Limite de passos por quadro; o excedente é descartado em vez de acumular atraso. */
export const MAX_STEPS_PER_FRAME = 16;
