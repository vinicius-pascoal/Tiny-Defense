import { describe, expect, it } from "vitest";
import { INITIAL_GOLD } from "@/game/config/balance";
import { LEVEL_1 } from "@/game/data/levels";
import { TOWERS } from "@/game/data/towers";
import { GameEngine } from "@/game/engine/GameEngine";
import { createMapLayout } from "@/game/systems/MapLayout";
import { checkPlacement, type PlacementContext } from "@/game/systems/PlacementSystem";

const layout = createMapLayout(LEVEL_1);
const GRASS = { col: 2, row: 4 };
const GRASS_2 = { col: 1, row: 1 };
const PATH = { col: 3, row: 2 };
const CASTLE = { col: 17, row: 5 };
const DECORATION = { col: 8, row: 4 };

function engineWithBuild(type: "archer" | "cannon" | "iceWizard" = "archer") {
  const engine = new GameEngine({ layout });
  engine.selectBuildType(type);
  return engine;
}

/** Estado relevante para comparar "nada mudou". */
const economyState = (engine: GameEngine) => ({
  gold: engine.getSnapshot().gold,
  towers: engine.getTowers().length,
});

describe("PlacementSystem", () => {
  it("as células do mapa têm os tipos esperados", () => {
    expect(layout.cells[GRASS.row][GRASS.col]).toBe("grass");
    expect(layout.cells[PATH.row][PATH.col]).toBe("path");
    expect(layout.cells[CASTLE.row][CASTLE.col]).toBe("castle");
    expect(layout.cells[DECORATION.row][DECORATION.col]).toBe("decoration");
  });

  it("explica cada bloqueio", () => {
    const base: PlacementContext = { cells: layout.cells, occupied: new Set<string>(), gold: 500, phase: "preparing", paused: false };
    const block = (over: Partial<typeof base>, cell = GRASS) => {
      const result = checkPlacement({ ...base, ...over }, "archer", cell);
      return result.ok ? "ok" : result.block;
    };
    expect(block({})).toBe("ok");
    expect(block({}, PATH)).toBe("path");
    expect(block({}, CASTLE)).toBe("castle");
    expect(block({}, DECORATION)).toBe("decoration");
    expect(block({}, { col: 20, row: 0 })).toBe("outOfBounds");
    expect(block({}, { col: -1, row: 3 })).toBe("outOfBounds");
    expect(block({}, { col: 1.5, row: 3 })).toBe("outOfBounds");
    expect(block({ occupied: new Set(["2,4"]) })).toBe("occupied");
    expect(block({ gold: 49 })).toBe("gold");
    expect(block({ paused: true })).toBe("paused");
    expect(block({ phase: "defeat" })).toBe("phase");
    expect(block({ phase: "running" })).toBe("ok");
  });
});

describe("GameEngine — construção e economia", () => {
  it("T01: construir Archer cria a torre e tira exatamente 50 moedas", () => {
    const engine = engineWithBuild("archer");
    expect(engine.placeTower(GRASS)).toEqual({ ok: true });
    expect(engine.getSnapshot().gold).toBe(INITIAL_GOLD - TOWERS.archer.cost);
    expect(engine.getTowers()).toHaveLength(1);
    expect(engine.getTowerAt(GRASS)).toMatchObject({ type: "archer", level: 1, invested: 50 });
    expect(engine.getSnapshot().selectedBuildType).toBeNull(); // sai do modo de construção
  });

  it("T02: sem ouro suficiente não cria nem altera o ouro", () => {
    const engine = engineWithBuild("cannon");
    engine.placeTower(GRASS); // 150 → 60
    engine.selectBuildType("cannon");
    const before = economyState(engine);
    const result = engine.placeTower(GRASS_2);
    expect(result).toEqual({ ok: false, reason: "Moedas insuficientes: faltam 30 para Cannon." });
    expect(economyState(engine)).toEqual(before);
  });

  it("T03: construir na estrada, no castelo ou numa decoração é rejeitado sem mudar o estado", () => {
    const engine = engineWithBuild();
    const before = economyState(engine);
    for (const cell of [PATH, CASTLE, DECORATION]) {
      expect(engine.placeTower(cell).ok).toBe(false);
      expect(economyState(engine)).toEqual(before);
    }
    expect(engine.getSnapshot().selectedBuildType).toBe("archer"); // segue no modo para tentar outra casa
  });

  it("T04: construir sobre uma torre existente é rejeitado", () => {
    const engine = engineWithBuild();
    engine.placeTower(GRASS);
    engine.selectBuildType("iceWizard");
    const before = economyState(engine);
    expect(engine.placeTower(GRASS)).toEqual({ ok: false, reason: "Já existe uma torre aqui." });
    expect(economyState(engine)).toEqual(before);
  });

  it("sem modo de construção, colocar torre não faz nada", () => {
    const engine = new GameEngine({ layout });
    expect(engine.placeTower(GRASS).ok).toBe(false);
    expect(economyState(engine)).toEqual({ gold: INITIAL_GOLD, towers: 0 });
  });

  it("pausado bloqueia a construção; durante a onda é permitido", () => {
    const engine = engineWithBuild();
    engine.pause();
    expect(engine.placeTower(GRASS).ok).toBe(false);
    engine.resume();
    engine.startWave();
    engine.selectBuildType("archer");
    expect(engine.placeTower(GRASS).ok).toBe(true);
  });

  it("gasta no máximo o saldo: nunca fica negativo", () => {
    const engine = new GameEngine({ layout });
    const cells = [{ col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }, { col: 4, row: 1 }];
    for (const cell of cells) {
      engine.selectBuildType("archer");
      engine.placeTower(cell);
    }
    expect(engine.getTowers()).toHaveLength(3);
    expect(engine.getSnapshot().gold).toBe(0);
  });

  it("IDs de torre são únicos", () => {
    const engine = new GameEngine({ layout });
    engine.selectBuildType("archer");
    engine.placeTower({ col: 1, row: 1 });
    engine.selectBuildType("archer");
    engine.placeTower({ col: 2, row: 1 });
    const ids = engine.getTowers().map((tower) => tower.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("GameEngine — seleção", () => {
  it("trocar ou cancelar o modo de construção", () => {
    const engine = new GameEngine({ layout });
    engine.selectBuildType("archer");
    engine.selectBuildType("cannon");
    expect(engine.getSnapshot().selectedBuildType).toBe("cannon");
    engine.selectBuildType(null);
    expect(engine.getSnapshot().selectedBuildType).toBeNull();
  });

  it("selecionar uma torre sai do modo de construção e expõe o resumo", () => {
    const engine = engineWithBuild("iceWizard");
    engine.placeTower(GRASS);
    const id = engine.getTowerAt(GRASS)!.id;
    engine.selectBuildType("archer");
    expect(engine.selectTower(id)).toEqual({ ok: true });
    expect(engine.getSnapshot()).toMatchObject({
      selectedTowerId: id,
      selectedBuildType: null,
      selectedTower: { id, type: "iceWizard", level: 1, col: 2, row: 4 },
    });
  });

  it("escolher um tipo de construção desmarca a torre selecionada", () => {
    const engine = engineWithBuild();
    engine.placeTower(GRASS);
    engine.selectTower(engine.getTowerAt(GRASS)!.id);
    engine.selectBuildType("cannon");
    expect(engine.getSnapshot()).toMatchObject({ selectedTowerId: null, selectedTower: null });
  });

  it("recusa selecionar torre inexistente e limpa com null", () => {
    const engine = new GameEngine({ layout });
    expect(engine.selectTower("tower-99").ok).toBe(false);
    expect(engine.selectTower(null)).toEqual({ ok: true });
  });

  it("reiniciar remove torres, ocupação e seleções", () => {
    const engine = engineWithBuild();
    engine.placeTower(GRASS);
    engine.restart();
    expect(engine.getTowers()).toHaveLength(0);
    expect(engine.getTowerAt(GRASS)).toBeNull();
    expect(engine.getSnapshot()).toMatchObject({ gold: INITIAL_GOLD, selectedTowerId: null, selectedBuildType: null });
  });
});
