import manifest from "../../public/assets/meta/sprite-manifest.json";

/** Metadados de um sprite de gameplay, conforme `public/assets/meta/sprite-manifest.json`. */
export type SpriteInfo = {
  src: string;
  width: number;
  height: number;
  frames: number;
  frameWidth: number;
  frameHeight: number;
  direction: "horizontal";
};

export type SpriteKey = keyof typeof manifest.sprites;

const sprites: Record<SpriteKey, SpriteInfo> = manifest.sprites as Record<SpriteKey, SpriteInfo>;

export function getSpriteInfo(key: SpriteKey): SpriteInfo {
  return sprites[key];
}
