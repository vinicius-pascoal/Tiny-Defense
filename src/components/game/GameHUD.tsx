import type { ReactNode } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelSprite } from "@/components/ui/PixelSprite";
import type { GameSnapshot } from "@/game/types/game";

type GameHUDProps = {
  snapshot: GameSnapshot;
};

/** Cabeçalho da partida: retorno ao menu e indicadores de vidas, moedas e onda. */
export function GameHUD({ snapshot }: GameHUDProps) {
  return (
    <header className="flex items-center gap-2 bg-ink-900/70 px-3 py-2 sm:gap-3 sm:px-4">
      <PixelButton href="/" icon="home" aria-label="Voltar ao menu" />
      <h1 className="text-outline hidden text-2xl font-bold text-gold-400 md:block">Tiny Defense</h1>

      <ul aria-label="Estado da partida" className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <HudStat label="Vidas" icon={<PixelIcon name="heart" />}>
          {snapshot.lives}
        </HudStat>
        <HudStat label="Moedas" icon={<PixelIcon name="coin" />}>
          {snapshot.gold}
        </HudStat>
        <HudStat label="Onda" icon={<PixelSprite sprite="game/enemies/normal_slime" />}>
          {snapshot.currentWave}/{snapshot.totalWaves}
        </HudStat>
      </ul>
    </header>
  );
}

type HudStatProps = {
  label: string;
  icon: ReactNode;
  children: ReactNode;
};

function HudStat({ label, icon, children }: HudStatProps) {
  return (
    <li>
      <PixelPanel
        skin="slot"
        className="flex min-h-touch items-center gap-1.5 px-1.5 sm:gap-2 sm:px-2"
      >
        {icon}
        <span className="flex flex-col leading-none">
          <span className="sr-only sm:not-sr-only sm:text-xs sm:font-medium sm:text-parchment-300">
            {label}
          </span>
          <span className="text-lg font-semibold tabular-nums sm:text-xl">{children}</span>
        </span>
      </PixelPanel>
    </li>
  );
}
