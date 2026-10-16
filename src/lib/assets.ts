/**
 * Caminhos públicos dos sprites usados no MVP.
 *
 * Todos os arquivos ficam em `public/assets/` e são servidos a partir de `/assets/`.
 * Ao renomear ou mover um PNG, atualize apenas este módulo.
 */

const ASSETS_ROOT = "/assets";
const GAME = `${ASSETS_ROOT}/game`;
const UI = `${ASSETS_ROOT}/ui/travelbook/sprites`;

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

export type TowerSpriteKey = keyof typeof TOWER_SPRITES;
export type EnemySpriteKey = keyof typeof ENEMY_SPRITES;
export type UiSpriteKey = keyof typeof UI_SPRITES;
