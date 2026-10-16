import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { UI_PANEL_SKINS, type UiPanelSkin } from "@/lib/assets";
import { cn } from "@/lib/cn";

type PanelElement = "div" | "section" | "nav" | "header" | "article" | "aside" | "footer";

type PixelPanelProps = ComponentPropsWithoutRef<"div"> & {
  as?: PanelElement;
  skin?: UiPanelSkin;
};

const SKIN_TEXT: Record<UiPanelSkin, string> = {
  paper: "text-ink-900",
  cover: "text-parchment-50",
  header: "text-ink-900",
  slot: "text-parchment-100",
};

/**
 * Estilo da moldura 9-slice de uma skin. Use com a classe `pixel-panel` em elementos
 * que o `PixelPanel` não cobre, como `<button>`.
 */
export function pixelPanelStyle(skin: UiPanelSkin): CSSProperties {
  const { src, slice } = UI_PANEL_SKINS[skin];

  return {
    borderWidth: `calc(${slice} * var(--px))`,
    borderImage: `url(${src}) ${slice} fill / calc(${slice} * var(--px)) stretch`,
  };
}

/** Painel em pixel art com moldura 9-slice dos sprites TravelBook. */
export function PixelPanel({
  as: Element = "div",
  skin = "paper",
  className,
  style,
  children,
  ...rest
}: PixelPanelProps) {
  return (
    <Element
      {...rest}
      className={cn("pixel-panel", SKIN_TEXT[skin], className)}
      style={{ ...pixelPanelStyle(skin), ...style }}
    >
      {children}
    </Element>
  );
}
