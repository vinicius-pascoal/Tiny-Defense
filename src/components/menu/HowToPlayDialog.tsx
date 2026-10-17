"use client";

import { useId, useRef, type MouseEvent, type ReactNode } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelSprite } from "@/components/ui/PixelSprite";
import {
  INITIAL_GOLD,
  INITIAL_LIVES,
  MAX_TOWER_LEVEL,
  SELL_REFUND_RATIO,
  TOTAL_WAVES,
} from "@/game/config/balance";

type Topic = { title: string; illustration: ReactNode; body: ReactNode };

const TOPICS: Topic[] = [
  {
    title: "Inimigos",
    illustration: <PixelSprite sprite="game/enemies/normal_slime" />,
    body: "Slimes, goblins e esqueletos seguem a estrada até o seu castelo. Detenha-os antes que cheguem lá.",
  },
  {
    title: "Vidas",
    illustration: <PixelIcon name="heart" />,
    body: `O castelo começa com ${INITIAL_LIVES} vidas. Cada inimigo que entra tira 1 vida — o chefe tira mais. Sem vidas, a partida acaba.`,
  },
  {
    title: "Moedas",
    illustration: <PixelIcon name="coin" />,
    body: `Você começa com ${INITIAL_GOLD} moedas. Derrotar inimigos e concluir ondas rende mais moedas.`,
  },
  {
    title: "Construção",
    illustration: <PixelSprite sprite="game/buildings/towers/tower_archer" />,
    body: (
      <>
        Escolha uma torre e toque numa casa livre fora da estrada. <strong>Archer</strong> atira
        rápido, <strong>Cannon</strong> explode em área e <strong>Ice Wizard</strong> deixa os
        inimigos lentos.
      </>
    ),
  },
  {
    title: "Melhorias",
    illustration: <PixelIcon name="star" />,
    body: `Toque numa torre construída para melhorá-la até o nível ${MAX_TOWER_LEVEL}: mais dano e mais alcance.`,
  },
  {
    title: "Venda",
    illustration: <PixelIcon name="coin" />,
    body: `Vender uma torre devolve ${Math.round(SELL_REFUND_RATIO * 100)}% de tudo o que você investiu nela e libera a casa.`,
  },
  {
    title: "Ondas",
    illustration: <PixelSprite sprite="game/enemies/king_slime" />,
    body: `São ${TOTAL_WAVES} ondas, cada uma com inimigos mais resistentes. Entre elas, reorganize a defesa e toque em Iniciar onda. A última traz o King Slime.`,
  },
];

/** Botão "Como jogar" e o diálogo modal com as regras básicas. */
export function HowToPlayDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  // Clique no fundo escurecido (fora do conteúdo) fecha o diálogo.
  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) close();
  };

  return (
    <>
      <PixelButton fullWidth onClick={open} aria-haspopup="dialog">
        Como jogar
      </PixelButton>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={handleBackdropClick}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100vw-2rem))] overflow-visible bg-transparent p-0"
      >
        <PixelPanel skin="cover" className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <PixelPanel skin="paper" className="flex min-h-0 flex-col gap-4 p-3 sm:p-4">
            <header className="flex items-center justify-between gap-3">
              <h2 id={titleId} className="text-2xl font-bold sm:text-3xl">
                Como jogar
              </h2>
              <PixelButton onClick={close} aria-label="Fechar" icon="cross" />
            </header>

            <ul className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
              {TOPICS.map((topic) => (
                <li key={topic.title} className="flex items-start gap-3">
                  <PixelPanel
                    skin="slot"
                    aria-hidden
                    className="flex size-[calc(30*var(--px))] shrink-0 items-center justify-center"
                  >
                    {topic.illustration}
                  </PixelPanel>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-lg font-semibold leading-tight">{topic.title}</h3>
                    <p className="text-base leading-snug text-ink-700">{topic.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <PixelButton onClick={close} icon="tick" className="self-center">
              Entendi
            </PixelButton>
          </PixelPanel>
        </PixelPanel>
      </dialog>
    </>
  );
}
