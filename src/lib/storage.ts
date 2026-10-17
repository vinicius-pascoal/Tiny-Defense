import { TOTAL_WAVES } from "@/game/config/balance";
import type { SpeedMultiplier } from "@/game/types/game";

/**
 * Armazenamento local versionado de recordes e preferências (sem retomada de partida — fora do MVP).
 * Todo acesso ao `localStorage` passa por `try/catch`: modo privado, cota cheia, storage bloqueado
 * ou JSON corrompido resultam nos valores padrão, nunca em erro na tela.
 */

export const STORAGE_KEY = "tiny-defense:save";
export const SAVE_VERSION = 1;

export type SaveData = Readonly<{
  version: typeof SAVE_VERSION;
  records: Readonly<{
    /** Maior onda iniciada (0 = nenhuma partida). Vitória conta como a última onda. */
    bestWave: number;
    victories: number;
    defeats: number;
  }>;
  preferences: Readonly<{ speed: SpeedMultiplier }>;
}>;

export const DEFAULT_SAVE: SaveData = {
  version: SAVE_VERSION,
  records: { bestWave: 0, victories: 0, defeats: 0 },
  preferences: { speed: 1 },
};

/** Subconjunto de `Storage` usado aqui (injetável nos testes). */
export type StorageLike = Pick<Storage, "getItem" | "setItem">;

const count = (value: unknown, max = Number.MAX_SAFE_INTEGER) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 ? Math.min(value, max) : 0;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Interpreta o texto salvo; qualquer coisa inválida vira o valor padrão do campo. */
export function parseSave(raw: string | null): SaveData {
  if (!raw) return DEFAULT_SAVE;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return DEFAULT_SAVE;
  }
  // Versões desconhecidas (futuras ou antigas sem migração) são ignoradas.
  if (!isObject(data) || data.version !== SAVE_VERSION) return DEFAULT_SAVE;

  const records = isObject(data.records) ? data.records : {};
  const preferences = isObject(data.preferences) ? data.preferences : {};
  return {
    version: SAVE_VERSION,
    records: {
      bestWave: count(records.bestWave, TOTAL_WAVES),
      victories: count(records.victories),
      defeats: count(records.defeats),
    },
    preferences: { speed: preferences.speed === 2 ? 2 : 1 },
  };
}

/** `localStorage` do navegador, ou `null` no servidor / quando o acesso é bloqueado. */
export function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readRaw(storage: StorageLike | null = browserStorage()): string | null {
  try {
    return storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function readSave(storage: StorageLike | null = browserStorage()): SaveData {
  return parseSave(readRaw(storage));
}

/** Grava; devolve `false` se não foi possível (o jogo segue normalmente). */
export function writeSave(data: SaveData, storage: StorageLike | null = browserStorage()): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// --- Atualizações puras ------------------------------------------------------------------------

export function withWaveReached(save: SaveData, wave: number): SaveData {
  const bestWave = Math.max(save.records.bestWave, count(wave, TOTAL_WAVES));
  return bestWave === save.records.bestWave ? save : { ...save, records: { ...save.records, bestWave } };
}

export function withMatchResult(save: SaveData, result: "victory" | "defeat", wave: number): SaveData {
  const reached = withWaveReached(save, result === "victory" ? TOTAL_WAVES : wave);
  const { records } = reached;
  return {
    ...reached,
    records:
      result === "victory"
        ? { ...records, victories: records.victories + 1 }
        : { ...records, defeats: records.defeats + 1 },
  };
}

export function withSpeed(save: SaveData, speed: SpeedMultiplier): SaveData {
  return save.preferences.speed === speed ? save : { ...save, preferences: { ...save.preferences, speed } };
}

// --- Assinatura para a interface (useSyncExternalStore) ----------------------------------------

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSave: SaveData = DEFAULT_SAVE;

/** Snapshot estável: só muda de referência quando o texto salvo muda. */
export function getSaveSnapshot(): SaveData {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSave = parseSave(raw);
  }
  return cachedSave;
}

export function getServerSaveSnapshot(): SaveData {
  return DEFAULT_SAVE;
}

export function subscribeSave(listener: () => void): () => void {
  listeners.add(listener);
  // Outras abas gravando o mesmo jogo.
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

/** Lê, aplica a atualização e grava; avisa a interface só se algo mudou. */
export function updateSave(update: (save: SaveData) => SaveData): void {
  const current = readSave();
  const next = update(current);
  if (next === current) return;
  if (writeSave(next)) for (const listener of listeners) listener();
}
