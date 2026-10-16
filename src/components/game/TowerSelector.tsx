import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPanel, pixelPanelStyle } from "@/components/ui/PixelPanel";
import { PixelSprite } from "@/components/ui/PixelSprite";
import { TOWER_ORDER, TOWERS, type TowerDefinition } from "@/game/data/towers";
import type { GameSnapshot, TowerType } from "@/game/types/game";
import { cn } from "@/lib/cn";

type TowerSelectorProps = {
  snapshot: GameSnapshot;
  /** Seleciona o tipo a construir. Sem ele, a construção ainda não está disponível. */
  onSelect?: (type: TowerType) => void;
  /** Recebe o motivo quando o jogador toca numa torre que não pode ser escolhida. */
  onUnavailable: (reason: string) => void;
};

/** Cartões das torres construíveis, com custo e disponibilidade conforme o ouro atual. */
export function TowerSelector({ snapshot, onSelect, onUnavailable }: TowerSelectorProps) {
  const buildAllowed = snapshot.phase === "preparing" || snapshot.phase === "running";

  return (
    <PixelPanel as="section" skin="paper" aria-labelledby="tower-selector-title" className="p-2 sm:p-3">
      <h2 id="tower-selector-title" className="mb-2 text-xl font-bold">
        Torres
      </h2>
      <ul className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {TOWER_ORDER.map((type) => {
          const tower = TOWERS[type];
          const missingGold = Math.max(tower.cost - snapshot.gold, 0);
          const reason = !buildAllowed
            ? "A partida terminou: não é possível construir."
            : missingGold > 0
              ? `Moedas insuficientes: faltam ${missingGold} para ${tower.name}.`
              : !onSelect
                ? "A construção de torres ainda não está disponível."
                : null;

          return (
            <li key={type} className="min-w-0">
              <TowerCard
                tower={tower}
                affordable={missingGold === 0}
                missingGold={missingGold}
                selected={snapshot.selectedBuildType === type}
                disabled={reason !== null}
                onClick={() => (reason ? onUnavailable(reason) : onSelect?.(type))}
              />
            </li>
          );
        })}
      </ul>
    </PixelPanel>
  );
}

type TowerCardProps = {
  tower: TowerDefinition;
  affordable: boolean;
  missingGold: number;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
};

function TowerCard({ tower, affordable, missingGold, selected, disabled, onClick }: TowerCardProps) {
  return (
    <button
      type="button"
      // `aria-disabled` em vez de `disabled`: o toque ainda chega e explica o motivo.
      aria-disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      title={tower.summary}
      className={cn(
        "pixel-panel tower-card flex h-full w-full flex-col items-center gap-1 px-1 py-1.5 text-center text-parchment-100",
        !affordable && "tower-card--unaffordable",
      )}
      style={pixelPanelStyle("slot")}
    >
      <span className="flex h-[calc(30*var(--px))] items-end justify-center">
        <PixelSprite sprite={tower.sprite} className="tower-card__sprite" />
      </span>
      <span className="text-base font-semibold leading-tight">{tower.name}</span>
      <span className="flex items-center gap-1 font-semibold tabular-nums text-gold-400">
        <PixelIcon name="coin" />
        {tower.cost}
      </span>
      <span
        className={cn(
          "text-xs leading-tight sm:text-sm",
          affordable ? "text-grass-200" : "text-parchment-300",
        )}
      >
        {affordable ? "Disponível" : `Faltam ${missingGold}`}
      </span>
    </button>
  );
}
