import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import type { GamePhase, GameSnapshot } from "@/game/types/game";

type WaveControlsProps = {
  snapshot: GameSnapshot;
  /** Comandos da engine; os ausentes ficam desativados com o motivo explicado ao toque. */
  onStartWave?: () => void;
  onTogglePause?: () => void;
  onToggleSpeed?: () => void;
  onUnavailable: (reason: string) => void;
};

const PHASE_TEXT: Record<GamePhase, string> = {
  preparing: "Preparação: posicione suas torres.",
  running: "Onda em andamento!",
  victory: "Vitória! O castelo resistiu.",
  defeat: "Derrota. O castelo caiu.",
};

/** Início de onda, pausa/retomada e velocidade da simulação. */
export function WaveControls({
  snapshot,
  onStartWave,
  onTogglePause,
  onToggleSpeed,
  onUnavailable,
}: WaveControlsProps) {
  const { phase, paused, speed, currentWave, totalWaves } = snapshot;

  const startReason =
    phase !== "preparing"
      ? phase === "running"
        ? "Termine a onda atual antes de iniciar outra."
        : "A partida terminou."
      : currentWave >= totalWaves
        ? "Não há mais ondas."
        : !onStartWave
          ? "O início das ondas ainda não está disponível."
          : null;
  const pauseReason = !onTogglePause ? "A pausa ainda não está disponível." : null;
  const speedReason = !onToggleSpeed ? "A troca de velocidade ainda não está disponível." : null;

  return (
    <PixelPanel
      as="section"
      skin="paper"
      aria-labelledby="wave-controls-title"
      className="flex flex-col gap-2 p-2 sm:p-3"
    >
      <div>
        <h2 id="wave-controls-title" className="text-xl font-bold">
          Onda {currentWave}/{totalWaves}
        </h2>
        <p className="leading-snug text-ink-700">{paused ? "Jogo pausado." : PHASE_TEXT[phase]}</p>
      </div>

      <div className="flex gap-2">
        <PixelButton
          icon="play"
          className="flex-1"
          aria-disabled={startReason !== null}
          onClick={() => (startReason ? onUnavailable(startReason) : onStartWave?.())}
        >
          Iniciar onda
        </PixelButton>
        <PixelButton
          icon={paused ? "play" : "pause"}
          aria-label={paused ? "Retomar" : "Pausar"}
          aria-disabled={pauseReason !== null}
          onClick={() => (pauseReason ? onUnavailable(pauseReason) : onTogglePause?.())}
        />
        <PixelButton
          aria-label={`Velocidade ${speed}×, alternar`}
          className="min-w-14 tabular-nums"
          aria-disabled={speedReason !== null}
          onClick={() => (speedReason ? onUnavailable(speedReason) : onToggleSpeed?.())}
        >
          {speed}×
        </PixelButton>
      </div>
    </PixelPanel>
  );
}
