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

/** Recorte (em pixels da imagem) de um quadro de spritesheet horizontal; o índice dá a volta. */
export function getFrameRect(info: SpriteInfo, frame: number) {
  const index = ((Math.floor(frame) % info.frames) + info.frames) % info.frames;
  return { sx: index * info.frameWidth, sy: 0, sw: info.frameWidth, sh: info.frameHeight };
}
