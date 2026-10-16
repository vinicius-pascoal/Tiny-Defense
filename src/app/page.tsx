import { ScreenShell } from "@/components/layout/ScreenShell";
import { HowToPlayDialog } from "@/components/menu/HowToPlayDialog";
import { MenuScene } from "@/components/menu/MenuScene";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";

export default function Home() {
  return (
    <ScreenShell className="justify-center">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-outline text-5xl font-bold tracking-wide text-gold-400 sm:text-7xl">
          Tiny Defense
        </h1>
        <p className="text-outline text-lg font-medium text-parchment-100 sm:text-xl">
          Construa torres e defenda o castelo, onda após onda.
        </p>
      </header>

      <MenuScene />

      <PixelPanel as="nav" skin="paper" aria-label="Menu principal" className="w-full max-w-xs p-3">
        <ul className="flex flex-col gap-3">
          <li>
            <PixelButton href="/play" size="lg" icon="play" fullWidth>
              Jogar
            </PixelButton>
          </li>
          <li>
            <HowToPlayDialog />
          </li>
          <li>
            <PixelButton href="/creditos" fullWidth>
              Créditos
            </PixelButton>
          </li>
        </ul>
      </PixelPanel>
    </ScreenShell>
  );
}
