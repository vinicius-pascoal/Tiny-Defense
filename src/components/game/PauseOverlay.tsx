import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";

type PauseOverlayProps = {
  onResume: () => void;
};

/** Cobre o mapa enquanto o jogo está pausado (inclusive pela pausa automática) e oferece retomar. */
export function PauseOverlay({ onResume }: PauseOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink-900/55 p-3">
      <PixelPanel
        skin="paper"
        role="dialog"
        aria-label="Jogo pausado"
        className="flex flex-col items-center gap-2 bg-parchment-200 bg-clip-padding p-3 text-center"
      >
        <p className="text-xl font-bold">Jogo pausado</p>
        <PixelButton icon="play" onClick={onResume} autoFocus>
          Retomar
        </PixelButton>
      </PixelPanel>
    </div>
  );
}
