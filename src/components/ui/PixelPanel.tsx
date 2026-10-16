import type { ComponentPropsWithoutRef } from "react";
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

/** Painel em pixel art com moldura 9-slice dos sprites TravelBook. */
export function PixelPanel({
  as: Element = "div",
  skin = "paper",
  className,
  style,
  children,
  ...rest
}: PixelPanelProps) {
  const { src, slice } = UI_PANEL_SKINS[skin];

  return (
    <Element
      {...rest}
      className={cn("pixel-panel", SKIN_TEXT[skin], className)}
      style={{
        borderWidth: `calc(${slice} * var(--px))`,
        borderImage: `url(${src}) ${slice} fill / calc(${slice} * var(--px)) stretch`,
        ...style,
      }}
    >
      {children}
    </Element>
  );
}
