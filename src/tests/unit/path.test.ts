import { describe, expect, it } from "vitest";
import { LEVEL_1 } from "@/game/data/levels";
import { createMapLayout } from "@/game/systems/MapLayout";
import { createWorldPath, expandWaypoints, positionAt } from "@/game/systems/PathSystem";

describe("expandWaypoints", () => {
  it("gera células contíguas sem duplicar os cantos", () => {
    const cells = expandWaypoints([
      { col: 0, row: 0 },
      { col: 2, row: 0 },
      { col: 2, row: 2 },
    ]);
    expect(cells).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 2, row: 1 },
      { col: 2, row: 2 },
    ]);
  });

  it("mantém cada passo a uma célula ortogonal de distância no mapa real", () => {
    const cells = expandWaypoints(LEVEL_1.pathWaypoints);
    for (let i = 1; i < cells.length; i++) {
      const step = Math.abs(cells[i].col - cells[i - 1].col) + Math.abs(cells[i].row - cells[i - 1].row);
      expect(step).toBe(1);
    }
    const keys = new Set(cells.map((c) => `${c.col},${c.row}`));
    expect(keys.size).toBe(cells.length);
  });

  it("rejeita segmentos diagonais", () => {
    expect(() => expandWaypoints([{ col: 0, row: 0 }, { col: 2, row: 1 }])).toThrow();
  });
});

describe("createWorldPath / positionAt", () => {
  const layout = createMapLayout(LEVEL_1);
  const path = createWorldPath(layout.pathCells);

  it("entra uma célula antes da borda e termina no portão (18,7)", () => {
    expect(path.points[0]).toEqual({ x: -8, y: 40 });
    expect(path.points[path.points.length - 1]).toEqual({ x: 296, y: 112 });
  });

  it("guarda só os cantos e mede o comprimento total", () => {
    // Entrada + 7 cantos + saída.
    expect(path.points).toHaveLength(9);
    expect(path.length).toBe(584);
  });

  it("interpola pelos centros das células, inclusive nas curvas", () => {
    expect(positionAt(path, 0)).toEqual({ x: -8, y: 40 });
    expect(positionAt(path, 16)).toEqual({ x: 8, y: 40 }); // centro de (0,2)
    expect(positionAt(path, 96)).toEqual({ x: 88, y: 40 }); // canto (5,2)
    expect(positionAt(path, 104)).toEqual({ x: 88, y: 48 }); // já descendo
    expect(positionAt(path, path.length)).toEqual({ x: 296, y: 112 });
  });

  it("limita distâncias fora do intervalo", () => {
    expect(positionAt(path, -50)).toEqual(path.points[0]);
    expect(positionAt(path, 10_000)).toEqual(path.points[path.points.length - 1]);
  });

  it("todo centro do percurso cai numa célula marcada como caminho", () => {
    for (let d = 16; d < path.length - 8; d += 4) {
      const p = positionAt(path, d);
      expect(layout.cells[Math.floor(p.y / 16)][Math.floor(p.x / 16)]).toBe("path");
    }
  });
});
