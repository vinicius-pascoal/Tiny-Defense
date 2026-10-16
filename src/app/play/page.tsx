import type { Metadata } from "next";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelSprite } from "@/components/ui/PixelSprite";

export const metadata: Metadata = {
  title: "Partida — Tiny Defense",
};

// Destino da navegação "Jogar". A cena de jogo (HUD, canvas e controles) chega na Etapa 03.
export default function PlayPage() {
  return (
    <ScreenShell className="justify-center">
      <PixelPanel
        as="section"
        skin="paper"
        aria-labelledby="play-title"
        className="flex w-full max-w-md flex-col items-center gap-4 p-4 text-center sm:p-5"
      >
        <PixelSprite sprite="game/buildings/castles/castle_green" animated frameMs={220} />
        <h1 id="play-title" className="text-3xl font-bold">
          Campo de batalha
        </h1>
        <p className="leading-snug text-ink-700">
          O mapa da partida ainda está sendo construído. Volte em breve para defender o castelo!
        </p>
        <PixelButton href="/" icon="home">
          Voltar ao menu
        </PixelButton>
      </PixelPanel>
    </ScreenShell>
  );
}
