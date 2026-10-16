import { getFrameRect, type SpriteInfo } from "@/lib/spriteManifest";

/**
 * Quadro de uma spritesheet horizontal após `elapsedSeconds`, em laço.
 * O número de quadros vem do manifesto (4 na maioria, 8 no Ghost), nunca é presumido.
 */
export function frameAt(info: SpriteInfo, elapsedSeconds: number, fps: number): number {
  if (info.frames <= 1 || fps <= 0 || !Number.isFinite(elapsedSeconds)) return 0;
  return Math.floor(Math.max(elapsedSeconds, 0) * fps) % info.frames;
}

/** Recorte do quadro atual, pronto para `drawImage`. */
export function frameRectAt(info: SpriteInfo, elapsedSeconds: number, fps: number) {
  return getFrameRect(info, frameAt(info, elapsedSeconds, fps));
}
