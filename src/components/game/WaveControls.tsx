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

/** Situação da onda em uma frase: bônus recebido, inimigos restantes ou chefe a caminho. */
function statusText(snapshot: GameSnapshot) {
  const { phase, paused, currentWave, totalWaves, activeEnemies, pendingEnemies, waveReward } = snapshot;
  if (paused) return "Jogo pausado.";
  if (phase === "running") {
    const remaining = `${activeEnemies} no mapa, ${pendingEnemies} a caminho.`;
    return currentWave === totalWaves ? `Onda final: o King Slime vem aí! ${remaining}` : `Inimigos: ${remaining}`;
  }
  if (phase === "preparing" && waveReward) {
    return `Onda ${waveReward.wave} concluída: +${waveReward.bonus} moedas de bônus. Prepare a próxima.`;
  }
  return PHASE_TEXT[phase];
}

/** Início de onda, pausa/retomada e velocidade da simulação. */
export function WaveControls({
  snapshot,
  onStartWave,
  onTogglePause,
  onToggleSpeed,
  onUnavailable,
}: WaveControlsProps) {
  const { phase, paused, speed, currentWave, totalWaves } = snapshot;

  // Mesmas regras de `engine.startWave`, para explicar o bloqueio; a engine continua validando.
  const startReason =
    phase !== "preparing"
      ? phase === "running"
        ? "Termine a onda atual antes de iniciar outra."
        : "A partida terminou."
      : currentWave >= totalWaves
        ? "Não há mais ondas."
        : paused
          ? "Retome o jogo para iniciar a onda."
          : !onStartWave
            ? "Aguarde o mapa ficar pronto."
            : null;
  const pauseReason = !onTogglePause
    ? "Aguarde o mapa ficar pronto."
    : phase === "victory" || phase === "defeat"
      ? "A partida terminou."
      : null;
  const speedReason = !onToggleSpeed
    ? "Aguarde o mapa ficar pronto."
    : phase === "victory" || phase === "defeat"
      ? "A partida terminou."
      : null;

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
        <p className="leading-snug text-ink-700">{statusText(snapshot)}</p>
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
          title={paused ? "Retomar" : "Pausar"}
          aria-disabled={pauseReason !== null}
          onClick={() => (pauseReason ? onUnavailable(pauseReason) : onTogglePause?.())}
        />
        <PixelButton
          aria-label={`Velocidade ${speed}×. Alternar para ${speed === 1 ? 2 : 1}×`}
          title={`Alternar para ${speed === 1 ? 2 : 1}×`}
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
