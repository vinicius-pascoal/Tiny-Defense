import { UI_SPRITES } from "@/lib/assets";
import { cn } from "@/lib/cn";

type PixelProgressProps = {
  value: number;
  max: number;
  label: string;
  className?: string;
};

/** Barra de progresso com o trilho `Bar01a` (bordas 2×1 px) e o preenchimento `Fill01a`. */
export function PixelProgress({ value, max, label, className }: PixelProgressProps) {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("pixel-panel h-[calc(4*var(--px))]", className)}
      style={{
        borderWidth: "var(--px) calc(2 * var(--px))",
        borderImage: `url(${UI_SPRITES.bar}) 1 2 fill / var(--px) calc(2 * var(--px)) stretch`,
      }}
    >
      <div
        className="h-full transition-[width] duration-150 motion-reduce:transition-none"
        style={{
          width: `${ratio * 100}%`,
          backgroundImage: `url(${UI_SPRITES.fill})`,
          backgroundSize: "100% 100%",
        }}
      />
    </div>
  );
}
