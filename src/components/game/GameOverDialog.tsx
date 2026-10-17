"use client";

import { useEffect, useId, useRef, type ReactNode, type SyntheticEvent } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelSprite } from "@/components/ui/PixelSprite";
import type { GameSnapshot } from "@/game/types/game";

type GameOverDialogProps = {
  snapshot: GameSnapshot;
  onRestart: () => void;
  /** Chamado antes de voltar ao menu (a tela da partida é preservada, então ela é reiniciada). */
  onExit: () => void;
};

/**
 * Resultado da partida (vitória ou derrota) em diálogo modal, com resumo, "Jogar de novo" e
 * "Voltar ao menu". Abre sozinho quando a partida termina; não fecha com Esc, porque não há o
 * que fazer no mapa encerrado.
 */
export function GameOverDialog({ snapshot, onRestart, onExit }: GameOverDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { phase } = snapshot;
  const ended = phase === "victory" || phase === "defeat";

  // Abrir/fechar no efeito: ao esconder a tela (<Activity>) o diálogo também sai da camada superior.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!ended || !dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, [ended]);

  const preventCancel = (event: SyntheticEvent<HTMLDialogElement>) => event.preventDefault();

  const victory = phase === "victory";
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={preventCancel}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] overflow-visible bg-transparent p-0"
    >
      {ended && (
        <PixelPanel skin="cover">
          <PixelPanel skin="paper" className="flex flex-col items-center gap-3 p-3 text-center sm:p-4">
            <PixelSprite
              sprite={victory ? "game/buildings/castles/castle_green" : "game/enemies/king_slime"}
              animated
              frameMs={220}
            />
            <div className="flex flex-col gap-1">
              <h2 id={titleId} className="text-3xl font-bold">
                {victory ? "Vitória!" : "Derrota"}
              </h2>
              <p className="leading-snug text-ink-700">
                {victory
                  ? `O castelo resistiu às ${snapshot.totalWaves} ondas e o King Slime foi derrotado.`
                  : `O castelo caiu na onda ${snapshot.currentWave} de ${snapshot.totalWaves}.`}
              </p>
            </div>

            <dl className="grid w-full grid-cols-3 gap-2 text-sm leading-snug">
              <Stat label="Onda" icon={<PixelIcon name="star" />}>
                {snapshot.currentWave}/{snapshot.totalWaves}
              </Stat>
              <Stat label="Vidas" icon={<PixelIcon name="heart" />}>
                {snapshot.lives}
              </Stat>
              <Stat label="Derrotados" icon={<PixelSprite sprite="game/enemies/normal_slime" />}>
                {snapshot.enemiesDefeated}
              </Stat>
            </dl>

            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <PixelButton icon="restart" className="flex-1" onClick={onRestart} autoFocus>
                Jogar de novo
              </PixelButton>
              <PixelButton href="/" icon="home" className="flex-1" onClick={onExit}>
                Voltar ao menu
              </PixelButton>
            </div>
          </PixelPanel>
        </PixelPanel>
      )}
    </dialog>
  );
}

function Stat({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <PixelPanel skin="slot" className="flex min-w-0 flex-col items-center gap-1 px-1 py-1.5 text-parchment-100">
      {/* Ícone acima do rótulo, para "Derrotados" caber na caixa em qualquer largura. */}
      <dt className="flex flex-col items-center gap-1 text-parchment-300">
        {icon}
        {label}
      </dt>
      <dd className="text-xl font-semibold tabular-nums">{children}</dd>
    </PixelPanel>
  );
}
