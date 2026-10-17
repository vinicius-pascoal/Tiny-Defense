import { PixelButton } from "@/components/ui/PixelButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelSprite } from "@/components/ui/PixelSprite";
import { TOWERS } from "@/game/data/towers";
import type { GameSnapshot } from "@/game/types/game";

type TowerDetailsProps = {
  snapshot: GameSnapshot;
  onDeselect: () => void;
};

/**
 * Painel contextual da torre selecionada. Atributos detalhados, melhoria e venda chegam na
 * Etapa 08; por ora identifica a torre e permite desmarcá-la.
 */
export function TowerDetails({ snapshot, onDeselect }: TowerDetailsProps) {
  const selected = snapshot.selectedTower;
  const tower = selected ? TOWERS[selected.type] : null;

  return (
    <PixelPanel
      as="section"
      skin="paper"
      aria-labelledby="tower-details-title"
      aria-live="polite"
      className="flex flex-col gap-1 p-2 sm:p-3"
    >
      <h2 id="tower-details-title" className="text-xl font-bold">
        Detalhes
      </h2>
      {selected && tower ? (
        <div className="flex items-center gap-3 lg:[--px:2px]">
          <PixelPanel
            skin="slot"
            aria-hidden
            className="flex h-[calc(38*var(--px))] w-[calc(26*var(--px))] shrink-0 items-end justify-center pb-0.5"
          >
            <PixelSprite sprite={tower.sprite} />
          </PixelPanel>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-lg font-semibold leading-tight">{tower.name}</p>
            <p className="text-ink-700">Nível {selected.level}</p>
          </div>
          <PixelButton icon="cross" aria-label="Desmarcar torre" onClick={onDeselect} />
        </div>
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
