import type { ReactNode } from "react";
import { GRASS_SPRITES } from "@/lib/assets";
import { cn } from "@/lib/cn";

type ScreenShellProps = {
  children: ReactNode;
  className?: string;
};

/** Tela cheia com fundo de grama em pixel art e conteúdo centralizado. */
export function ScreenShell({ children, className }: ScreenShellProps) {
  return (
    <main
      className={cn(
        "flex w-full flex-1 flex-col items-center gap-6 px-4 py-8 sm:gap-8 sm:py-10",
        className,
      )}
      style={{
        backgroundImage: `url(${GRASS_SPRITES.grass01})`,
        backgroundSize: "calc(32 * var(--px))",
      }}
    >
      {children}
    </main>
  );
}
