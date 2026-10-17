import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPanel, pixelPanelStyle } from "@/components/ui/PixelPanel";
import { PixelSprite } from "@/components/ui/PixelSprite";
import { TOWER_ORDER, TOWERS, type TowerDefinition } from "@/game/data/towers";
import type { GameSnapshot, TowerType } from "@/game/types/game";
import { cn } from "@/lib/cn";

type TowerSelectorProps = {
  snapshot: GameSnapshot;
  /** Alterna o tipo a construir. Sem ele (mapa carregando), os cartões ficam desativados. */
  onSelect?: (type: TowerType) => void;
  /** Sai do modo de construção. */
  onCancel: () => void;
  /** Recebe o motivo quando o jogador toca numa torre que não pode ser escolhida. */
  onUnavailable: (reason: string) => void;
};

/** Cartões das torres construíveis, com custo e disponibilidade conforme o ouro atual. */
export function TowerSelector({ snapshot, onSelect, onCancel, onUnavailable }: TowerSelectorProps) {
  const buildAllowed = snapshot.phase === "preparing" || snapshot.phase === "running";
  const building = snapshot.selectedBuildType ? TOWERS[snapshot.selectedBuildType] : null;

  return (
    <PixelPanel as="section" skin="paper" aria-labelledby="tower-selector-title" className="p-2 sm:p-3">
      <div className="mb-2 flex min-h-touch items-center justify-between gap-2">
        <h2 id="tower-selector-title" className="text-xl font-bold">
          Torres
        </h2>
        {building && (
          <PixelButton icon="cross" onClick={onCancel} className="text-base">
            Cancelar
          </PixelButton>
        )}
      </div>
      {/* No desktop, a barra lateral usa escala 2× (ainda inteira) para caber sem rolagem. */}
      <ul className="grid grid-cols-3 gap-1.5 sm:gap-2 lg:[--px:2px]">
        {TOWER_ORDER.map((type) => {
          const tower = TOWERS[type];
          const missingGold = Math.max(tower.cost - snapshot.gold, 0);
          const reason = !buildAllowed
            ? "A partida terminou: não é possível construir."
            : missingGold > 0
              ? `Moedas insuficientes: faltam ${missingGold} para ${tower.name}.`
              : !onSelect
                ? "Aguarde o mapa ficar pronto."
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
      <p aria-live="polite" className="mt-2 text-sm leading-snug text-ink-700 lg:sr-only">
        {building
          ? `Toque numa casa livre do mapa para construir a ${building.name}.`
          : "Escolha uma torre e toque numa casa livre do mapa."}
      </p>
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
