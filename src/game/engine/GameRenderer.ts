import { TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "@/game/config/constants";
import type { LevelDefinition } from "@/game/data/levels";
import { ENEMIES } from "@/game/data/enemies";
import type { MapLayout, PathTile } from "@/game/systems/MapLayout";
import type { Enemy } from "@/game/types/entities";
import type { GridPosition } from "@/game/types/game";
import { GRASS_SPRITES, TILESET_SPRITES } from "@/lib/assets";
import { getFrameRect, getSpriteInfo, type SpriteKey } from "@/lib/spriteManifest";
import { frameAt } from "./SpriteAnimator";

/** Entidades da simulação, somente leitura (fornecidas pela engine). */
export type RenderScene = {
  enemies: readonly Enemy[];
};

/** Estado contextual desenhado por cima do mapa (preenchido pela interface). */
export type RenderOverlay = {
  pointerCell: GridPosition | null;
};

export type RenderOptions = {
  /** Reduz movimento decorativo (castelo parado no primeiro quadro). */
  reducedMotion: boolean;
};

const CASTLE_FRAME_MS = 220;

/**
 * Posição (coluna, linha) no atlas 3×3 de estrada para cada par de conexões.
 * O atlas é um anel: cantos nas pontas, trechos retos nas bordas e centro vazio.
 */
const ROAD_ATLAS: Record<string, readonly [number, number]> = {
  "left|right": [1, 0],
  "down|up": [0, 1],
  "down|right": [0, 0],
  "down|left": [2, 0],
  "right|up": [0, 2],
  "left|up": [2, 2],
};

function roadAtlasCell(tile: PathTile) {
  const key = [...tile.connects].sort().join("|");
  const cell = ROAD_ATLAS[key];
  if (!cell) throw new Error(`Conexão de estrada sem tile: ${key}`);
  return cell;
}

/** URLs de todas as imagens que o renderer precisa para desenhar o nível. */
export function getLevelSprites(level: LevelDefinition): string[] {
  return [
    GRASS_SPRITES.grass01,
    TILESET_SPRITES.ground,
    TILESET_SPRITES.stone,
    getSpriteInfo(level.castle.sprite).src,
    ...Object.values(ENEMIES).map((enemy) => getSpriteInfo(enemy.sprite).src),
    ...level.decorations.map((decoration) => getSpriteInfo(decoration.sprite).src),
  ];
}

/**
 * Desenha o estado do jogo no canvas; não decide regras nem altera estado.
 * Terreno, estrada e decorações ficam numa camada estática pré-renderizada em resolução
 * lógica (320×192) e são copiados a cada quadro; o restante é desenhado por cima, em ordem:
 * terreno → caminho → decorações → construções/unidades → efeitos → elementos contextuais.
 */
export class GameRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private staticLayer: HTMLCanvasElement;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly images: ReadonlyMap<string, HTMLImageElement>,
    private readonly level: LevelDefinition,
    private readonly layout: MapLayout,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D indisponível neste navegador.");
    this.ctx = ctx;
    this.staticLayer = this.buildStaticLayer();
    canvas.addEventListener("contextrestored", this.handleContextRestored);
  }

  /** Ajusta a resolução interna ao tamanho exibido (CSS px × devicePixelRatio). */
  resize(cssWidth: number, cssHeight: number, devicePixelRatio: number) {
    const width = Math.max(1, Math.round(cssWidth * devicePixelRatio));
    const height = Math.max(1, Math.round(cssHeight * devicePixelRatio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  render(timeMs: number, scene: RenderScene, overlay: RenderOverlay, options: RenderOptions) {
    const { ctx, canvas } = this;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.staticLayer, 0, 0, canvas.width, canvas.height);

    // A partir daqui, tudo é desenhado em unidades do mundo lógico.
    ctx.setTransform(canvas.width / WORLD_WIDTH, 0, 0, canvas.height / WORLD_HEIGHT, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // Unidades antes do castelo: ao chegar ao fim do caminho, o inimigo some atrás do portão.
    for (const enemy of scene.enemies) this.drawEnemy(enemy);

    const castleFrame = options.reducedMotion ? 0 : timeMs / CASTLE_FRAME_MS;
    this.drawSprite(this.level.castle.sprite, this.level.castle.x, this.level.castle.y, castleFrame);

    this.drawPointerCell(overlay.pointerCell);
  }

  destroy() {
    this.canvas.removeEventListener("contextrestored", this.handleContextRestored);
  }

  private readonly handleContextRestored = () => {
    this.staticLayer = this.buildStaticLayer();
  };

  private image(src: string): HTMLImageElement | null {
    return this.images.get(src) ?? null;
  }

  private drawSprite(key: SpriteKey, x: number, y: number, frame = 0, ctx = this.ctx) {
    const info = getSpriteInfo(key);
    const image = this.image(info.src);
    if (!image) return;

    const { sx, sy, sw, sh } = getFrameRect(info, frame);
    ctx.drawImage(image, sx, sy, sw, sh, Math.round(x), Math.round(y), sw, sh);
  }

  /** Inimigo centrado na estrada, com a base levemente abaixo do centro da célula. */
  private drawEnemy(enemy: Enemy) {
    const definition = ENEMIES[enemy.type];
    const info = getSpriteInfo(definition.sprite);
    // A animação usa o tempo de simulação do inimigo: congela junto com a pausa.
    const frame = frameAt(info, enemy.age, definition.animationFps);
    const x = enemy.position.x - info.frameWidth / 2;
    const y = enemy.position.y + 3 - info.frameHeight;
    this.drawSprite(definition.sprite, x, y, frame);
  }

  private buildStaticLayer(): HTMLCanvasElement {
    const layer = document.createElement("canvas");
    layer.width = WORLD_WIDTH;
    layer.height = WORLD_HEIGHT;
    const ctx = layer.getContext("2d");
    if (!ctx) return layer;
    ctx.imageSmoothingEnabled = false;

    // Terreno: grama 32×32 repetida.
    const grass = this.image(GRASS_SPRITES.grass01);
    if (grass) {
      const pattern = ctx.createPattern(grass, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      }
    }

    // Caminho: um recorte 16×16 do atlas por célula, escolhido pelas conexões.
    const ground = this.image(TILESET_SPRITES.ground);
    const stone = this.image(TILESET_SPRITES.stone);
    for (const tile of this.layout.pathTiles) {
      const atlas = tile.paved ? stone : ground;
      if (!atlas) continue;
      const [atlasCol, atlasRow] = roadAtlasCell(tile);
      ctx.drawImage(
        atlas,
        atlasCol * TILE_SIZE,
        atlasRow * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
        tile.col * TILE_SIZE,
        tile.row * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
      );
    }

    // Decorações: centradas na célula e apoiadas na base, sem esticar.
    for (const decoration of this.level.decorations) {
      const info = getSpriteInfo(decoration.sprite);
      const x = decoration.col * TILE_SIZE + Math.floor((TILE_SIZE - info.frameWidth) / 2);
      const y = (decoration.row + 1) * TILE_SIZE - info.frameHeight;
      this.drawSprite(decoration.sprite, x, y, 0, ctx);
    }

    return layer;
  }

  private drawPointerCell(cell: GridPosition | null) {
    if (!cell) return;
    const { ctx } = this;
    const x = cell.col * TILE_SIZE;
    const y = cell.row * TILE_SIZE;

    ctx.fillStyle = "rgb(251 243 223 / 0.25)";
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = "#fbf3df";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  }
}
