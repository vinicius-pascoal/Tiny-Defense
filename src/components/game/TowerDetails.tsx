"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelSprite } from "@/components/ui/PixelSprite";
import { TOWERS } from "@/game/data/towers";
import type { GameSnapshot, SelectedTowerSummary } from "@/game/types/game";
import { cn } from "@/lib/cn";

type TowerDetailsProps = {
  snapshot: GameSnapshot;
  onDeselect: () => void;
  onUpgrade: (id: string) => void;
  onSell: (id: string) => void;
  /** Recebe o motivo quando o jogador toca numa ação indisponível. */
  onUnavailable: (reason: string) => void;
};

/** Tempo para confirmar a venda com o segundo toque, em ms (evita venda por toque acidental). */
const SELL_CONFIRM_MS = 3000;

const formatSeconds = (seconds: number) =>
  `${seconds.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} s`;

/** Painel contextual da torre selecionada: atributos, melhoria e venda. */
export function TowerDetails({ snapshot, onDeselect, onUpgrade, onSell, onUnavailable }: TowerDetailsProps) {
  const selected = snapshot.selectedTower;

  return (
    <PixelPanel
      as="section"
      skin="paper"
      aria-labelledby="tower-details-title"
      className="flex flex-col gap-1 p-2 sm:p-3"
    >
      <h2 id="tower-details-title" className="text-xl font-bold">
        Detalhes
      </h2>
      {selected ? (
        // `key` reinicia a confirmação de venda ao trocar de torre.
        <SelectedTower
          key={selected.id}
          tower={selected}
          snapshot={snapshot}
          onDeselect={onDeselect}
          onUpgrade={onUpgrade}
          onSell={onSell}
          onUnavailable={onUnavailable}
        />
      ) : (
        <div className="flex items-start gap-2">
          <PixelIcon name="star" className="mt-1" />
          <p className="leading-snug text-ink-700">
            Nenhuma torre selecionada. Toque numa torre construída para ver nível, dano e alcance.
          </p>
        </div>
      )}
    </PixelPanel>
  );
}

type SelectedTowerProps = Omit<TowerDetailsProps, "snapshot"> & {
  tower: SelectedTowerSummary;
  snapshot: GameSnapshot;
};

function SelectedTower({ tower, snapshot, onDeselect, onUpgrade, onSell, onUnavailable }: SelectedTowerProps) {
  const definition = TOWERS[tower.type];
  const [confirmingSell, setConfirmingSell] = useState(false);

  useEffect(() => {
    if (!confirmingSell) return;
    const timer = window.setTimeout(() => setConfirmingSell(false), SELL_CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [confirmingSell]);

  // Mesmas regras da engine, só para exibir o motivo; a engine continua validando o comando.
  const ended = snapshot.phase === "victory" || snapshot.phase === "defeat";
  const actionBlock = ended ? "A partida terminou." : snapshot.paused ? "Retome o jogo para mexer nas torres." : null;
  const upgradeBlock =
    actionBlock ??
    (tower.upgradeCost === null
      ? "Nível máximo atingido."
      : snapshot.gold < tower.upgradeCost
        ? `Faltam ${tower.upgradeCost - snapshot.gold} moedas para melhorar.`
        : null);
  const next = tower.nextStats;

  const handleUpgrade = () => (upgradeBlock ? onUnavailable(upgradeBlock) : onUpgrade(tower.id));
  const handleSell = () => {
    if (actionBlock) return onUnavailable(actionBlock);
    if (!confirmingSell) return setConfirmingSell(true);
    setConfirmingSell(false);
    onSell(tower.id);
  };

  return (
    <div className="flex flex-col gap-2 lg:[--px:2px]">
      <div className="flex items-center gap-3">
        <PixelPanel
          skin="slot"
          aria-hidden
          className="flex h-[calc(38*var(--px))] w-[calc(26*var(--px))] shrink-0 items-end justify-center pb-0.5"
        >
          <PixelSprite sprite={definition.sprite} />
        </PixelPanel>

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-lg font-semibold leading-tight">{definition.name}</p>
          <p className="flex flex-wrap items-center gap-x-1 text-ink-700">
            <span>
              Nível {tower.level}/{tower.maxLevel}
            </span>
            <span aria-hidden className="flex gap-0.5">
              {Array.from({ length: tower.maxLevel }, (_, i) => (
                <PixelIcon key={i} name="star" className={cn(i >= tower.level && "opacity-25 grayscale")} />
              ))}
            </span>
          </p>
        </div>
        <PixelButton icon="cross" aria-label="Fechar detalhes e voltar às torres" onClick={onDeselect} />
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center text-sm leading-snug">
        <Stat label="Dano" value={tower.stats.damage} next={next?.damage} />
        <Stat label="Intervalo" value={formatSeconds(tower.stats.attackInterval)} />
        <Stat label="Alcance" value={tower.stats.range} next={next?.range} />
      </dl>

      <div className="flex gap-2">
        <PixelButton
          className="flex-1 text-base"
          aria-disabled={upgradeBlock !== null}
          aria-describedby={upgradeBlock && !confirmingSell ? "tower-action-reason" : undefined}
          onClick={handleUpgrade}
        >
          {tower.upgradeCost === null ? (
            "Nível máximo"
          ) : (
            <>
              Melhorar
              <span className="flex items-center gap-1 text-gold-400">
                <PixelIcon name="coin" />
                {tower.upgradeCost}
              </span>
            </>
          )}
        </PixelButton>
        <PixelButton
          className="flex-1 text-base"
          icon={confirmingSell ? "tick" : undefined}
          aria-disabled={actionBlock !== null}
          aria-live="polite"
          onClick={handleSell}
        >
          {confirmingSell ? "Confirmar" : "Vender"}
          <span className="flex items-center gap-1 text-gold-400">
            +<PixelIcon name="coin" />
            {tower.sellRefund}
          </span>
        </PixelButton>
      </div>

      {(upgradeBlock || confirmingSell) && (
        <p id="tower-action-reason" className="text-sm leading-snug text-ink-700">
          {confirmingSell ? "Toque em Confirmar para vender." : upgradeBlock}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, next }: { label: string; value: ReactNode; next?: number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-ink-700">{label}</dt>
      <dd className="font-semibold tabular-nums">
        {value}
        {next !== undefined && (
          <span className="text-grass-800">
            {" "}
            → {next}
            <span className="sr-only"> no próximo nível</span>
          </span>
        )}
      </dd>
    </div>
  );
}
