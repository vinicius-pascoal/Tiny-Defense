import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { getSpriteInfo, type SpriteKey } from "@/lib/spriteManifest";

type PixelSpriteProps = {
  sprite: SpriteKey;
  /** Reproduz os quadros da spritesheet em loop (respeita `prefers-reduced-motion`). */
  animated?: boolean;
  /** Duração de cada quadro, em milissegundos. */
  frameMs?: number;
  /** Texto alternativo. Sem ele, o sprite é decorativo. */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/** Desenha um sprite do manifesto em HTML, com recorte por quadro e escala inteira (`--px`). */
export function PixelSprite({
  sprite,
  animated = false,
  frameMs = 160,
  label,
  className,
  style,
}: PixelSpriteProps) {
  const info = getSpriteInfo(sprite);
  const isAnimated = animated && info.frames > 1;

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-animated={isAnimated ? "" : undefined}
      className={cn("pixel-sprite", className)}
      style={
        {
          "--sheet": `url(${info.src})`,
          "--sheet-w": info.width,
          "--frame-w": info.frameWidth,
          "--frame-h": info.frameHeight,
          "--frames": info.frames,
          "--frame-duration": `${info.frames * frameMs}ms`,
          ...style,
        } as CSSProperties
      }
    />
  );
}
