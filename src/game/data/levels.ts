import type { SpriteKey } from "@/lib/spriteManifest";
import type { GridPosition } from "@/game/types/game";

/** Retângulo de células (inclusivo) na grade 20×12. */
export type CellArea = { col: number; row: number; cols: number; rows: number };

export type DecorationPlacement = GridPosition & { sprite: SpriteKey };

export type LevelDefinition = {
  /** Vértices do caminho ortogonal, na ordem do percurso (ROADMAP §5.2). */
  pathWaypoints: readonly GridPosition[];
  /** Quantas células finais do caminho são calçadas com o atlas de pedra (acesso ao castelo). */
  pavedCells: number;
  castle: {
    sprite: SpriteKey;
    /** Canto superior esquerdo do sprite, em unidades do mundo. */
    x: number;
    y: number;
    /** Células cobertas pelo castelo: bloqueadas para construção. */
    area: CellArea;
  };
  /** Decorações em células próprias, que também bloqueiam construção. */
  decorations: readonly DecorationPlacement[];
};

/**
 * Mapa inicial. Ajuste em relação ao §5.2: a coluna descendente final passou de 16 para 15 e o
 * caminho termina subindo até o portão do castelo (18,7). O castelo tem 52 px de largura e o
 * portão fica na base; na coluna 16 ele seria cortado pela borda ou cobriria a estrada.
 */
export const LEVEL_1: LevelDefinition = {
  pathWaypoints: [
    { col: 0, row: 2 },
    { col: 5, row: 2 },
    { col: 5, row: 7 },
    { col: 12, row: 7 },
    { col: 12, row: 3 },
    { col: 15, row: 3 },
    { col: 15, row: 9 },
    { col: 18, row: 9 },
    { col: 18, row: 7 },
  ],
  pavedCells: 3,
  castle: {
    sprite: "game/buildings/castles/castle_green",
    // Portão (centro do quadro, x = 26) alinhado à coluna 18; a base cobre 4 px da última célula.
    x: 268,
    y: 78,
    area: { col: 16, row: 4, cols: 4, rows: 4 },
  },
  decorations: [
    { col: 0, row: 0, sprite: "game/environment/decoration/tree_02_spruce" },
    { col: 1, row: 0, sprite: "game/environment/decoration/tree_01_normal" },
    { col: 0, row: 5, sprite: "game/environment/decoration/tree_01_autumn" },
    { col: 1, row: 10, sprite: "game/environment/decoration/tree_02_normal" },
    { col: 0, row: 11, sprite: "game/environment/decoration/tree_02_spruce" },
    { col: 3, row: 9, sprite: "game/environment/decoration/rock_02" },
    { col: 8, row: 4, sprite: "game/environment/decoration/mushroom_01" },
    { col: 8, row: 10, sprite: "game/environment/decoration/mushroom_02" },
    { col: 9, row: 0, sprite: "game/environment/decoration/tree_01_cherry_blossom" },
    { col: 10, row: 1, sprite: "game/environment/decoration/rock_01" },
    { col: 13, row: 11, sprite: "game/environment/decoration/rock_03" },
    { col: 18, row: 1, sprite: "game/environment/decoration/tree_02_autumn" },
    { col: 19, row: 0, sprite: "game/environment/decoration/tree_02_spruce" },
    { col: 19, row: 11, sprite: "game/environment/decoration/tree_01_normal" },
  ],
};
