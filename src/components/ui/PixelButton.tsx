import Link from "next/link";
import { preload } from "react-dom";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import { UI_BUTTON_SKIN, type UiIconName } from "@/lib/assets";
import { cn } from "@/lib/cn";
import { PixelIcon } from "./PixelIcon";

type ButtonSize = "md" | "lg";

type CommonProps = {
  children?: ReactNode;
  icon?: UiIconName;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

type NativeButtonProps = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof CommonProps> & { href?: undefined };

type LinkButtonProps = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof CommonProps | "href"> & { href: string };

export type PixelButtonProps = NativeButtonProps | LinkButtonProps;

const { top, right, bottom, left } = UI_BUTTON_SKIN.slice;

const SKIN_STYLE = {
  "--btn-idle": `url(${UI_BUTTON_SKIN.idle})`,
  "--btn-raised": `url(${UI_BUTTON_SKIN.raised})`,
  "--btn-pressed": `url(${UI_BUTTON_SKIN.pressed})`,
  borderWidth: `calc(${top} * var(--px)) calc(${right} * var(--px)) calc(${bottom} * var(--px)) calc(${left} * var(--px))`,
  borderImageSlice: `${top} ${right} ${bottom} ${left} fill`,
} as CSSProperties;

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "px-3 text-lg",
  lg: "min-h-14 px-4 text-2xl",
};

/**
 * Botão em pixel art com estados padrão, hover, foco, pressionado e desativado.
 * Com `href`, renderiza um `Link` do Next.js com a mesma aparência.
 */
export function PixelButton({
  children,
  icon,
  size = "md",
  fullWidth,
  className,
  style,
  ...rest
}: PixelButtonProps) {
  // Evita o "piscar" na primeira troca de quadro em hover/pressionado.
  preload(UI_BUTTON_SKIN.raised, { as: "image" });
  preload(UI_BUTTON_SKIN.pressed, { as: "image" });

  const classes = cn("pixel-button", SIZE_CLASSES[size], fullWidth && "w-full", className);
  const mergedStyle = { ...SKIN_STYLE, ...style };
  const content = (
    <span className="pixel-button__content">
      {icon && <PixelIcon name={icon} />}
      {children}
    </span>
  );

  if (rest.href !== undefined) {
    return (
      <Link {...rest} className={classes} style={mergedStyle}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" {...rest} className={classes} style={mergedStyle}>
      {content}
    </button>
  );
}
