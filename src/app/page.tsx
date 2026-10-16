import Image from "next/image";
import { TOWER_SPRITES, UI_SPRITES } from "@/lib/assets";

// Página provisória da Etapa 01: confirma fonte, tokens e carregamento dos assets reais.
// O menu definitivo (Jogar, Como jogar, Créditos) chega na Etapa 02.

const TOWERS = [
  { key: "archer", label: "Archer", width: 16, height: 23 },
  { key: "cannon", label: "Cannon", width: 18, height: 30 },
  { key: "iceWizard", label: "Ice Wizard", width: 16, height: 26 },
] as const;

const SPRITE_SCALE = 3;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      <header className="flex flex-col gap-2">
        <h1 className="text-5xl font-bold tracking-wide text-gold-400 sm:text-6xl">
          Tiny Defense
        </h1>
        <p className="text-lg text-parchment-100">
          Defenda o castelo. Em breve, o menu principal.
        </p>
      </header>

      <ul className="flex items-end gap-6" aria-label="Torres disponíveis">
        {TOWERS.map((tower) => (
          <li key={tower.key} className="flex flex-col items-center gap-2">
            <Image
              src={TOWER_SPRITES[tower.key]}
              alt={`Torre ${tower.label}`}
              width={tower.width * SPRITE_SCALE}
              height={tower.height * SPRITE_SCALE}
              unoptimized
              className="pixelated"
            />
            <span className="text-sm font-medium text-parchment-50">{tower.label}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-4 rounded-lg bg-ink-900/40 px-4 py-2 text-parchment-50">
        <span className="flex items-center gap-2">
          <Image
            src={UI_SPRITES.iconHeart}
            alt=""
            width={13 * SPRITE_SCALE}
            height={10 * SPRITE_SCALE}
            unoptimized
            className="pixelated"
          />
          20
        </span>
        <span className="flex items-center gap-2">
          <Image
            src={UI_SPRITES.iconCoin}
            alt=""
            width={11 * SPRITE_SCALE}
            height={12 * SPRITE_SCALE}
            unoptimized
            className="pixelated"
          />
          150
        </span>
      </div>
    </main>
  );
}
