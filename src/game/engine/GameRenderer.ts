import { TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from "@/game/config/constants";
import type { LevelDefinition } from "@/game/data/levels";
import { ENEMIES } from "@/game/data/enemies";
import { TOWERS } from "@/game/data/towers";
import { getTowerStats } from "@/game/systems/EconomySystem";
import type { MapLayout, PathTile } from "@/game/systems/MapLayout";
import type { Enemy, Projectile, Tower, VisualEffect } from "@/game/types/entities";
import type { GridPosition, TowerType } from "@/game/types/game";
import { GRASS_SPRITES, TILESET_SPRITES } from "@/lib/assets";
import { getFrameRect, getSpriteInfo, type SpriteKey } from "@/lib/spriteManifest";
import { frameAt } from "./SpriteAnimator";

/** Prévia de construção na célula apontada; a validade vem da engine. */
export type BuildPreview = { type: TowerType; cell: GridPosition; valid: boolean };

/** Estado da simulação a desenhar, somente leitura (fornecido pela engine). */
export type RenderScene = {
  enemies: readonly Enemy[];
  towers: readonly Tower[];
  projectiles: readonly Projectile[];
  effects: readonly VisualEffect[];
  selectedTowerId: string | null;
  buildPreview: BuildPreview | null;
};

/** Item desenhado em ordem de profundidade: quem tem a base mais abaixo fica na frente. */
type Drawable =
  | { baseY: number; kind: "enemy"; enemy: Enemy }
  | { baseY: number; kind: "tower"; tower: Tower }
  | { baseY: number; kind: "castle" };

const COLORS = {
  valid: "rgb(185 217 122 / 0.45)",
  validStroke: "#b9d97a",
  invalid: "rgb(200 68 58 / 0.45)",
  invalidStroke: "#c8443a",
  range: "rgb(251 243 223 / 0.12)",
  rangeStroke: "rgb(251 243 223 / 0.85)",
  selected: "#f4c542",
  selectedRange: "rgb(244 197 66 / 0.12)",
  pointer: "rgb(251 243 223 / 0.25)",
  pointerStroke: "#fbf3df",
  healthBack: "#2b1d12",
  health: "#b9d97a",
  healthLow: "#c8443a",
  frost: "rgb(159 216 240 / 0.75)",
};

/** Cor e opacidade máxima de cada efeito procedural (apoio visual; não substitui sprites). */
const EFFECT_STYLE: Record<VisualEffect["kind"], { fill: string; stroke: string }> = {
  hit: { fill: "rgb(251 243 223 / 0.9)", stroke: "rgb(251 243 223 / 0.9)" },
  explosion: { fill: "rgb(244 197 66 / 0.35)", stroke: "rgb(201 143 28 / 0.9)" },
  frost: { fill: "rgb(159 216 240 / 0.45)", stroke: "rgb(58 139 189 / 0.9)" },
  death: { fill: "rgb(251 243 223 / 0.5)", stroke: "rgb(251 243 223 / 0)" },
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
    ...Object.values(TOWERS).map((tower) => getSpriteInfo(tower.sprite).src),
    ...Object.values(TOWERS).map((tower) => getSpriteInfo(tower.projectile.sprite).src),
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
  /** Lista reutilizada a cada quadro para a ordenação por profundidade. */
  private readonly drawables: Drawable[] = [];

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

    // Construções e unidades ordenadas pela base: torres altas cobrem o que está atrás delas
    // e o inimigo que chega ao fim do caminho some atrás do portão do castelo.
    const castle = this.level.castle;
    const castleBase = castle.y + getSpriteInfo(castle.sprite).frameHeight;
    const drawables = this.drawables;
    drawables.length = 0;
    drawables.push({ baseY: castleBase, kind: "castle" });
    for (const tower of scene.towers) drawables.push({ baseY: (tower.row + 1) * TILE_SIZE, kind: "tower", tower });
    for (const enemy of scene.enemies) drawables.push({ baseY: enemy.position.y + 3, kind: "enemy", enemy });
    drawables.sort((a, b) => a.baseY - b.baseY);

    const castleFrame = options.reducedMotion ? 0 : timeMs / CASTLE_FRAME_MS;
    for (const item of drawables) {
      if (item.kind === "enemy") this.drawEnemy(item.enemy);
      else if (item.kind === "tower") {
        this.drawTower(item.tower.type, item.tower);
        this.drawLevelPips(item.tower);
      }
      else this.drawSprite(castle.sprite, castle.x, castle.y, castleFrame);
    }

    // Efeitos: projéteis, impactos e barras de vida acima das unidades.
    for (const projectile of scene.projectiles) this.drawProjectile(projectile);
    for (const effect of scene.effects) this.drawEffect(effect);
    for (const enemy of scene.enemies) this.drawHealthBar(enemy);

    // Elementos contextuais por último.
    const selected = scene.selectedTowerId
      ? scene.towers.find((tower) => tower.id === scene.selectedTowerId)
      : undefined;
    if (selected) this.drawSelection(selected);

    if (scene.buildPreview) this.drawBuildPreview(scene.buildPreview);
    else this.drawPointerCell(overlay.pointerCell);
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

    // Lentidão: anel de gelo aos pés do inimigo (o sprite continua o original).
    if (enemy.slowTimer > 0) {
      const { ctx } = this;
      ctx.beginPath();
      ctx.ellipse(enemy.position.x, enemy.position.y + 3, info.frameWidth / 2 + 1, 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.frost;
      ctx.fill();
    }
    this.drawSprite(definition.sprite, x, y, frame);
  }

  /** Barra discreta acima do inimigo, só depois de sofrer dano. */
  private drawHealthBar(enemy: Enemy) {
    if (enemy.health >= enemy.maxHealth) return;
    const { ctx } = this;
    const info = getSpriteInfo(ENEMIES[enemy.type].sprite);
    const width = Math.max(info.frameWidth, 10);
    const x = Math.round(enemy.position.x - width / 2);
    const y = Math.round(enemy.position.y + 3 - info.frameHeight - 3);
    const ratio = enemy.health / enemy.maxHealth;

    ctx.fillStyle = COLORS.healthBack;
    ctx.fillRect(x - 0.5, y - 0.5, width + 1, 2);
    ctx.fillStyle = ratio > 0.35 ? COLORS.health : COLORS.healthLow;
    ctx.fillRect(x, y, Math.max(width * ratio, 0.5), 1);
  }

  private drawProjectile(projectile: Projectile) {
    const { sprite, oriented } = TOWERS[projectile.towerType].projectile;
    const info = getSpriteInfo(sprite);
    const image = this.image(info.src);
    if (!image) return;

    const { ctx } = this;
    const { x, y } = projectile.position;
    if (oriented) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(projectile.angle);
      ctx.drawImage(image, -info.frameWidth / 2, -info.frameHeight / 2);
      ctx.restore();
    } else {
      ctx.drawImage(image, Math.round(x - info.frameWidth / 2), Math.round(y - info.frameHeight / 2));
    }
  }

  /** Círculo que cresce e some; a explosão mostra o raio real da área atingida. */
  private drawEffect(effect: VisualEffect) {
    const { ctx } = this;
    const t = Math.min(effect.age / effect.duration, 1);
    const style = EFFECT_STYLE[effect.kind];
    const radius = effect.kind === "explosion" ? effect.radius * (0.5 + 0.5 * t) : effect.radius * (0.4 + 0.6 * t);

    ctx.globalAlpha = 1 - t;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = style.fill;
    ctx.fill();
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /** Torre centrada na célula e apoiada na base dela, sem esticar (sprites de 16–18 px). */
  private drawTower(type: TowerType, cell: GridPosition) {
    const info = getSpriteInfo(TOWERS[type].sprite);
    const x = cell.col * TILE_SIZE + Math.floor((TILE_SIZE - info.frameWidth) / 2);
    const y = (cell.row + 1) * TILE_SIZE - info.frameHeight;
    this.drawSprite(TOWERS[type].sprite, x, y);
  }

  private drawRange(cell: GridPosition, range: number, fill: string, stroke: string) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.arc((cell.col + 0.5) * TILE_SIZE, (cell.row + 0.5) * TILE_SIZE, range, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }

  private drawCellFrame(cell: GridPosition, fill: string, stroke: string) {
    const { ctx } = this;
    const x = cell.col * TILE_SIZE;
    const y = cell.row * TILE_SIZE;
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  }

  /** Nível 2+ ganha pontinhos dourados na base da célula (um por nível). */
  private drawLevelPips(tower: Tower) {
    if (tower.level < 2) return;
    const { ctx } = this;
    const size = 2;
    const gap = 1;
    const width = tower.level * size + (tower.level - 1) * gap;
    const x0 = Math.round((tower.col + 0.5) * TILE_SIZE - width / 2);
    const y = (tower.row + 1) * TILE_SIZE - size - 1;
    for (let i = 0; i < tower.level; i++) {
      const x = x0 + i * (size + gap);
      ctx.fillStyle = COLORS.healthBack;
      ctx.fillRect(x - 0.5, y - 0.5, size + 1, size + 1);
      ctx.fillStyle = COLORS.selected;
      ctx.fillRect(x, y, size, size);
    }
  }

  private drawSelection(tower: Tower) {
    const { range } = getTowerStats(tower.type, tower.level);
    this.drawRange(tower, range, COLORS.selectedRange, COLORS.selected);
    const { ctx } = this;
    ctx.strokeStyle = COLORS.selected;
    ctx.lineWidth = 1;
    ctx.strokeRect(tower.col * TILE_SIZE + 0.5, tower.row * TILE_SIZE + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  }

  /**
   * Prévia de construção: célula verde ou vermelha (a vermelha também ganha um ✗, para não
   * depender só da cor), alcance e a torre translúcida.
   */
  private drawBuildPreview({ type, cell, valid }: BuildPreview) {
    const { ctx } = this;
    this.drawRange(
      cell,
      TOWERS[type].range,
      valid ? COLORS.range : "rgb(200 68 58 / 0.08)",
      valid ? COLORS.rangeStroke : COLORS.invalidStroke,
    );
    this.drawCellFrame(cell, valid ? COLORS.valid : COLORS.invalid, valid ? COLORS.validStroke : COLORS.invalidStroke);

    ctx.globalAlpha = valid ? 0.7 : 0.35;
    this.drawTower(type, cell);
    ctx.globalAlpha = 1;

    if (!valid) {
      const x = cell.col * TILE_SIZE;
      const y = cell.row * TILE_SIZE;
      ctx.strokeStyle = COLORS.invalidStroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.lineTo(x + TILE_SIZE - 4, y + TILE_SIZE - 4);
      ctx.moveTo(x + TILE_SIZE - 4, y + 4);
      ctx.lineTo(x + 4, y + TILE_SIZE - 4);
      ctx.stroke();
    }
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
    if (cell) this.drawCellFrame(cell, COLORS.pointer, COLORS.pointerStroke);
  }
}
