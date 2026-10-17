import { describe, expect, it } from "vitest";
import {
  DEFAULT_SAVE,
  STORAGE_KEY,
  parseSave,
  readSave,
  withMatchResult,
  withSpeed,
  withWaveReached,
  writeSave,
  type SaveData,
  type StorageLike,
} from "@/lib/storage";

function memoryStorage(initial?: string): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>(initial === undefined ? [] : [[STORAGE_KEY, initial]]);
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const throwing: StorageLike = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

const sample: SaveData = {
  version: 1,
  records: { bestWave: 7, victories: 2, defeats: 3 },
  preferences: { speed: 2 },
};

describe("Armazenamento local", () => {
  it("salva e lê de volta (sobrevive a recarregar a página)", () => {
    const storage = memoryStorage();
    expect(writeSave(sample, storage)).toBe(true);
    expect(readSave(storage)).toEqual(sample);
  });

  it("T19: storage inválido usa os padrões sem lançar erro", () => {
    for (const raw of [null, "", "{", "null", "[]", "42", '"texto"', '{"version":99}', '{"records":{}}']) {
      expect(parseSave(raw)).toEqual(DEFAULT_SAVE);
    }
    expect(readSave(throwing)).toEqual(DEFAULT_SAVE);
    expect(writeSave(sample, throwing)).toBe(false);
    expect(readSave(null)).toEqual(DEFAULT_SAVE);
    expect(writeSave(sample, null)).toBe(false);
  });

  it("campos inválidos são corrigidos individualmente", () => {
    const save = parseSave(
      JSON.stringify({
        version: 1,
        records: { bestWave: 99, victories: -1, defeats: "3" },
        preferences: { speed: 3 },
      }),
    );
    expect(save).toEqual({
      version: 1,
      records: { bestWave: 10, victories: 0, defeats: 0 },
      preferences: { speed: 1 },
    });
    expect(parseSave(JSON.stringify({ version: 1, records: { bestWave: 4.5, victories: 1 } }))).toMatchObject({
      records: { bestWave: 0, victories: 1, defeats: 0 },
      preferences: { speed: 1 },
    });
  });

  it("maior onda só sobe; vitória conta como onda 10", () => {
    const a = withWaveReached(DEFAULT_SAVE, 4);
    expect(a.records.bestWave).toBe(4);
    expect(withWaveReached(a, 2)).toBe(a);
    const won = withMatchResult(a, "victory", 10);
    expect(won.records).toEqual({ bestWave: 10, victories: 1, defeats: 0 });
    const lost = withMatchResult(won, "defeat", 3);
    expect(lost.records).toEqual({ bestWave: 10, victories: 1, defeats: 1 });
  });

  it("preferência de velocidade; sem mudança devolve o mesmo objeto", () => {
    const fast = withSpeed(DEFAULT_SAVE, 2);
    expect(fast.preferences.speed).toBe(2);
    expect(withSpeed(fast, 2)).toBe(fast);
    expect(DEFAULT_SAVE.preferences.speed).toBe(1);
  });
});
