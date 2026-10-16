import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelProgress } from "@/components/ui/PixelProgress";
import type { SpriteLoadState } from "@/hooks/useSpriteLoader";

type SceneLoadingProps = {
  state: Exclude<SpriteLoadState, { status: "ready" }>;
  onRetry: () => void;
};

/** Cobre o mapa enquanto os sprites da cena carregam, ou explica a falha com nova tentativa. */
export function SceneLoading({ state, onRetry }: SceneLoadingProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink-900/60 p-3">
      <PixelPanel
        skin="paper"
        role={state.status === "error" ? "alert" : "status"}
        // Cor de fundo garante leitura mesmo antes de a moldura (sprite) chegar.
        className="flex w-full max-w-xs flex-col items-center gap-2 bg-parchment-200 bg-clip-padding p-3 text-center"
      >
        {state.status === "loading" ? (
          <>
            <p className="text-lg font-semibold">Preparando o campo de batalha…</p>
            <PixelProgress
              value={state.loaded}
              max={state.total}
              label="Sprites carregados"
              className="w-full"
            />
            <p className="text-sm tabular-nums text-ink-700">
              {state.loaded}/{state.total} sprites
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold">Não foi possível carregar o mapa.</p>
            <p className="text-sm leading-snug text-ink-700">
              {state.failed.length === 1
                ? "1 imagem falhou ao carregar."
                : `${state.failed.length} imagens falharam ao carregar.`}{" "}
              Verifique a conexão e tente de novo.
            </p>
            <PixelButton icon="restart" onClick={onRetry}>
              Tentar novamente
            </PixelButton>
          </>
        )}
      </PixelPanel>
    </div>
  );
}
