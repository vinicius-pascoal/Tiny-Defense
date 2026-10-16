import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPanel } from "@/components/ui/PixelPanel";
import type { GameSnapshot } from "@/game/types/game";

type TowerDetailsProps = {
  snapshot: GameSnapshot;
};

/**
 * Painel contextual da torre selecionada. Nível, atributos, melhoria e venda
 * chegam com as torres construídas (Etapas 06 e 08); por ora mostra o estado vazio.
 */
export function TowerDetails({ snapshot }: TowerDetailsProps) {
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
      {snapshot.selectedTowerId === null && (
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
