"use client";

import type { ReactNode } from "react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelSprite } from "@/components/ui/PixelSprite";
import { TOTAL_WAVES } from "@/game/config/balance";
import { useSaveData } from "@/hooks/useSaveData";

/** Recordes salvos neste navegador: maior onda, vitórias e derrotas. */
export function RecordsPanel() {
  const { records } = useSaveData();
  const played = records.victories + records.defeats > 0 || records.bestWave > 0;

  return (
    <PixelPanel as="section" skin="paper" aria-labelledby="records-title" className="w-full max-w-xs p-3">
      <h2 id="records-title" className="mb-2 text-xl font-bold">
        Recordes
      </h2>
      {played ? (
        <dl className="grid grid-cols-3 gap-2 text-center text-sm leading-snug">
          <Record label="Melhor onda" icon={<PixelIcon name="star" />}>
            {records.bestWave}/{TOTAL_WAVES}
          </Record>
          <Record label="Vitórias" icon={<PixelSprite sprite="game/enemies/king_slime" />}>
            {records.victories}
          </Record>
          <Record label="Derrotas" icon={<PixelIcon name="heart" className="grayscale" />}>
            {records.defeats}
          </Record>
        </dl>
      ) : (
        <p className="leading-snug text-ink-700">Jogue uma partida para registrar seus recordes.</p>
      )}
    </PixelPanel>
  );
}

function Record({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <PixelPanel skin="slot" className="flex min-w-0 flex-col items-center gap-1 px-1 py-1.5 text-parchment-100">
      <dt className="flex flex-col items-center gap-1 text-parchment-300">
        {icon}
        {label}
      </dt>
      {/* `mt-auto`: valores alinhados na base mesmo quando um rótulo quebra em duas linhas. */}
      <dd className="mt-auto text-lg font-semibold tabular-nums">{children}</dd>
    </PixelPanel>
  );
}
