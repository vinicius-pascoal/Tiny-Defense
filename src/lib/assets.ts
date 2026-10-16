/**
 * Caminhos públicos dos sprites usados no MVP.
 *
 * Todos os arquivos ficam em `public/assets/` e são servidos a partir de `/assets/`.
 * Ao renomear ou mover um PNG, atualize apenas este módulo.
 */

const ASSETS_ROOT = "/assets";
const GAME = `${ASSETS_ROOT}/game`;
const UI = `${ASSETS_ROOT}/ui/travelbook/sprites`;
const UI_ANIMATED = `${ASSETS_ROOT}/ui/travelbook/animated`;

export const SPRITE_MANIFEST_URL = `${ASSETS_ROOT}/meta/sprite-manifest.json`;

export const TOWER_SPRITES = {
  archer: `${GAME}/buildings/towers/spr_tower_archer.png`,
  cannon: `${GAME}/buildings/towers/spr_tower_cannon.png`,
  iceWizard: `${GAME}/buildings/towers/spr_tower_ice_wizard.png`,
} as const;

export const PROJECTILE_SPRITES = {
  archer: `${GAME}/projectiles/spr_tower_archer_projectile.png`,
  cannon: `${GAME}/projectiles/spr_tower_cannon_projectile.png`,
  iceWizard: `${GAME}/projectiles/spr_tower_ice_wizard_projectile.png`,
} as const;

export const ENEMY_SPRITES = {
  normalSlime: `${GAME}/enemies/spr_normal_slime.png`,
  bigSlime: `${GAME}/enemies/spr_big_slime.png`,
  goblin: `${GAME}/enemies/spr_goblin.png`,
  skeleton: `${GAME}/enemies/spr_skeleton.png`,
  kingSlime: `${GAME}/enemies/spr_king_slime.png`,
} as const;

export const BUILDING_SPRITES = {
  castleGreen: `${GAME}/buildings/castles/spr_castle_green.png`,
} as const;

export const TILESET_SPRITES = {
  ground: `${GAME}/environment/tiles/spr_tile_set_ground.png`,
  stone: `${GAME}/environment/tiles/spr_tile_set_stone.png`,
} as const;

export const GRASS_SPRITES = {
  grass01: `${GAME}/environment/grass/spr_grass_01.png`,
} as const;

export const UI_SPRITES = {
  iconCoin: `${UI}/UI_TravelBook_IconCoin01a.png`,
  iconHeart: `${UI}/UI_TravelBook_IconHeart01a.png`,
  iconPause: `${UI}/UI_TravelBook_IconPause01a.png`,
  iconPlay: `${UI}/UI_TravelBook_IconPlay01a.png`,
  iconRestart: `${UI}/UI_TravelBook_IconRestart01a.png`,
  popup: `${UI}/UI_TravelBook_Popup01a.png`,
  frame: `${UI}/UI_TravelBook_Frame01a.png`,
  slot: `${UI}/UI_TravelBook_Slot01a.png`,
  bar: `${UI}/UI_TravelBook_Bar01a.png`,
} as const;

/** Ícones do TravelBook com o tamanho nativo em pixels, para escalar sem distorcer. */
export const UI_ICONS = {
  coin: { src: UI_SPRITES.iconCoin, width: 11, height: 12 },
  heart: { src: UI_SPRITES.iconHeart, width: 13, height: 10 },
  pause: { src: UI_SPRITES.iconPause, width: 10, height: 13 },
  play: { src: UI_SPRITES.iconPlay, width: 9, height: 13 },
  restart: { src: UI_SPRITES.iconRestart, width: 11, height: 13 },
  home: { src: `${UI}/UI_TravelBook_IconHome01a.png`, width: 14, height: 14 },
  cross: { src: `${UI}/UI_TravelBook_IconCross01a.png`, width: 14, height: 14 },
  arrow: { src: `${UI}/UI_TravelBook_IconArrow01a.png`, width: 16, height: 13 },
  gear: { src: `${UI}/UI_TravelBook_IconGear01a.png`, width: 14, height: 14 },
  star: { src: `${UI}/UI_TravelBook_IconStar01a.png`, width: 12, height: 11 },
  tick: { src: `${UI}/UI_TravelBook_IconTick01a.png`, width: 15, height: 12 },
} as const;

/**
 * Molduras 9-slice do TravelBook. `slice` é a borda, em pixels do sprite,
 * preservada sem esticar (cantos e detalhes).
 */
export const UI_PANEL_SKINS = {
  /** Papel claro com canto dobrado ("TextField" na folha do pacote). */
  paper: { src: UI_SPRITES.popup, slice: 4 },
  /** Capa vermelha do livro, com cantos dourados. */
  cover: { src: `${UI}/UI_TravelBook_BookCover01a.png`, slice: 12 },
  /** Faixa bege de cabeçalho ("Header"). */
  header: { src: UI_SPRITES.frame, slice: 3 },
  /** Slot escuro para itens. */
  slot: { src: UI_SPRITES.slot, slice: 3 },
} as const;

/**
 * Quadros do botão animado `Button01a` (30×31): o quadro 1 é o estado normal,
 * o 5 está elevado (hover) e o 3 está pressionado. Todos compartilham as fatias abaixo.
 */
export const UI_BUTTON_SKIN = {
  idle: `${UI_ANIMATED}/UI_TravelBook_Button01a_1.png`,
  raised: `${UI_ANIMATED}/UI_TravelBook_Button01a_5.png`,
  pressed: `${UI_ANIMATED}/UI_TravelBook_Button01a_3.png`,
  slice: { top: 5, right: 2, bottom: 4, left: 2 },
} as const;

export type TowerSpriteKey = keyof typeof TOWER_SPRITES;
export type EnemySpriteKey = keyof typeof ENEMY_SPRITES;
export type UiSpriteKey = keyof typeof UI_SPRITES;
export type UiIconName = keyof typeof UI_ICONS;
export type UiPanelSkin = keyof typeof UI_PANEL_SKINS;
