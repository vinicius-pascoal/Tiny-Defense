import Image from "next/image";
import { UI_ICONS, type UiIconName } from "@/lib/assets";
import { cn } from "@/lib/cn";

type PixelIconProps = {
  name: UiIconName;
  /** Multiplicador inteiro sobre a escala de pixel global (`--px`). */
  scale?: number;
  /** Texto alternativo. Sem ele, o ícone é tratado como decorativo. */
  label?: string;
  className?: string;
};

export function PixelIcon({ name, scale = 1, label, className }: PixelIconProps) {
  const icon = UI_ICONS[name];

  return (
    <Image
      src={icon.src}
      width={icon.width}
      height={icon.height}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      unoptimized
      className={cn("pixelated shrink-0", className)}
      style={{
        width: `calc(${icon.width * scale} * var(--px))`,
        height: `calc(${icon.height * scale} * var(--px))`,
      }}
    />
  );
}
