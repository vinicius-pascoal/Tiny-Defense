import type { CSSProperties } from "react";
import { PixelSprite } from "@/components/ui/PixelSprite";
import type { SpriteKey } from "@/lib/spriteManifest";

/*
 * Cenário decorativo do menu: inimigos atravessam a grama rumo ao castelo,
 * passando por torres. Coordenadas em pixels de sprite (multiplicados por --px).
 */

const SCENE_WIDTH = 176;
const SCENE_HEIGHT = 56;
const WALK_DISTANCE = 128;

type Prop = { sprite: SpriteKey; x: number; y: number; animated?: boolean };

/** Elementos atrás da trilha dos inimigos (y = distância da base da cena). */
const BACKDROP: Prop[] = [
  { sprite: "game/environment/decoration/tree_02_spruce", x: 2, y: 34 },
  { sprite: "game/environment/decoration/tree_01_normal", x: 16, y: 30 },
  { sprite: "game/buildings/towers/tower_archer", x: 44, y: 18 },
  { sprite: "game/environment/decoration/tree_01_cherry_blossom", x: 62, y: 34 },
  { sprite: "game/buildings/towers/tower_ice_wizard", x: 82, y: 18 },
  { sprite: "game/environment/decoration/tree_02_normal", x: 102, y: 32 },
];

/** Elementos à frente da trilha. */
const FOREGROUND: Prop[] = [
  { sprite: "game/environment/decoration/rock_01", x: 24, y: 0 },
  { sprite: "game/environment/decoration/mushroom_01", x: 66, y: 1 },
  { sprite: "game/environment/decoration/rock_02", x: 100, y: 0 },
];

type Walker = { sprite: SpriteKey; durationS: number; delayS: number; rest: number; y: number };

const WALKERS: Walker[] = [
  { sprite: "game/enemies/normal_slime", durationS: 14, delayS: 0, rest: 8, y: 9 },
  { sprite: "game/enemies/goblin", durationS: 9, delayS: -3, rest: 36, y: 10 },
  { sprite: "game/enemies/normal_slime", durationS: 14, delayS: -7, rest: 60, y: 9 },
  { sprite: "game/enemies/skeleton", durationS: 13, delayS: -10, rest: 92, y: 10 },
];

const CASTLE: Prop = { sprite: "game/buildings/castles/castle_green", x: 122, y: 4, animated: true };

function place(x: number, y: number): CSSProperties {
  return {
    position: "absolute",
    left: `calc(${x} * var(--px))`,
    bottom: `calc(${y} * var(--px))`,
  };
}

export function MenuScene() {
  return (
    <div
      aria-hidden
      className="relative shrink-0"
      style={{
        width: `calc(${SCENE_WIDTH} * var(--px))`,
        height: `calc(${SCENE_HEIGHT} * var(--px))`,
      }}
    >
      {BACKDROP.map((prop) => (
        <PixelSprite key={`${prop.sprite}-${prop.x}`} sprite={prop.sprite} style={place(prop.x, prop.y)} />
      ))}

      {WALKERS.map((walker, index) => (
        <div
          key={index}
          className="menu-walker"
          style={
            {
              ...place(0, walker.y),
              "--walk-duration": `${walker.durationS}s`,
              "--walk-delay": `${walker.delayS}s`,
              "--walk-distance": WALK_DISTANCE,
              "--walk-rest": walker.rest,
            } as CSSProperties
          }
        >
          <PixelSprite sprite={walker.sprite} animated />
        </div>
      ))}

      <PixelSprite sprite={CASTLE.sprite} animated frameMs={220} style={place(CASTLE.x, CASTLE.y)} />

      {FOREGROUND.map((prop) => (
        <PixelSprite key={`${prop.sprite}-${prop.x}`} sprite={prop.sprite} style={place(prop.x, prop.y)} />
      ))}
    </div>
  );
}
