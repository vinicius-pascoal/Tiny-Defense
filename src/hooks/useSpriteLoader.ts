"use client";

import { useCallback, useEffect, useState } from "react";
import { spriteLoader, type SpriteLoadResult } from "@/game/engine/SpriteLoader";

export type SpriteLoadState =
  | { status: "loading"; loaded: number; total: number }
  | { status: "ready"; images: SpriteLoadResult["images"] }
  | { status: "error"; failed: readonly string[] };

/**
 * Carrega a lista de sprites (que deve ser estável, ex.: constante de módulo)
 * e expõe o progresso para a tela de carregamento.
 */
export function useSpriteLoader(sources: readonly string[]) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<SpriteLoadState>({
    status: "loading",
    loaded: 0,
    total: sources.length,
  });

  useEffect(() => {
    let cancelled = false;

    spriteLoader
      .loadAll(sources, ({ loaded, total }) => {
        if (!cancelled) setState({ status: "loading", loaded, total });
      })
      .then(({ images, failed }) => {
        if (cancelled) return;
        setState(failed.length > 0 ? { status: "error", failed } : { status: "ready", images });
      });

    return () => {
      cancelled = true;
    };
  }, [sources, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading", loaded: 0, total: sources.length });
    setAttempt((value) => value + 1);
  }, [sources.length]);

  return { state, retry };
}
