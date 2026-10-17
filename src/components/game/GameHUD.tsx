"use client";

import { useState, type ReactNode } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelSprite } from "@/components/ui/PixelSprite";
import type { GameSnapshot } from "@/game/types/game";
import { cn } from "@/lib/cn";

type GameHUDProps = {
  snapshot: GameSnapshot;
};

/** Cabeçalho da partida: retorno ao menu e indicadores de vidas, moedas e onda. */
export function GameHUD({ snapshot }: GameHUDProps) {
  // Conta as perdas de vida para piscar o indicador (estado ajustado durante a renderização).
  const [lastLives, setLastLives] = useState(snapshot.lives);
  const [livesLost, setLivesLost] = useState(0);
  if (snapshot.lives !== lastLives) {
    setLastLives(snapshot.lives);
    if (snapshot.lives < lastLives) setLivesLost((count) => count + 1);
  }

  return (
    <header className="flex items-center gap-2 bg-ink-900/70 px-3 py-2 sm:gap-3 sm:px-4">
      <PixelButton href="/" icon="home" aria-label="Voltar ao menu" />
      <h1 className="text-outline hidden text-2xl font-bold text-gold-400 md:block">Tiny Defense</h1>

      <ul aria-label="Estado da partida" className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <HudStat label="Vidas" icon={<PixelIcon name="heart" />} flashKey={livesLost}>
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
  /** Muda a cada perda: remonta o painel e reinicia a animação de alerta. */
  flashKey?: number;
};

function HudStat({ label, icon, children, flashKey }: HudStatProps) {
  return (
    <li>
      <PixelPanel
        key={flashKey}
        skin="slot"
        className={cn("flex min-h-touch items-center gap-1.5 px-1.5 sm:gap-2 sm:px-2", Boolean(flashKey) && "hud-alert")}
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
