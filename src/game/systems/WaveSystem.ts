import { TOTAL_WAVES, WAVE_BONUS_BASE, WAVE_BONUS_PER_WAVE } from "@/game/config/balance";
import type { WaveDefinition } from "@/game/data/waves";
import type { EnemyType } from "@/game/types/entities";

/** Um inimigo agendado, em segundos de simulação desde o início da onda. */
export type SpawnEvent = Readonly<{ time: number; enemy: EnemyType }>;

/** Onda em andamento: fila de gerações ainda pendentes e relógio da onda. */
export type WaveRun = {
  queue: SpawnEvent[];
  time: number;
  /** Multiplicador de vida aplicado a todos os inimigos gerados nesta onda. */
  healthMultiplier: number;
};

/** Expande os grupos da onda numa fila única, ordenada pelo tempo (empates mantêm a ordem dos grupos). */
export function buildSpawnQueue(wave: WaveDefinition): SpawnEvent[] {
  const queue: SpawnEvent[] = [];
  for (const group of wave.groups) {
    const count = Math.max(Math.floor(group.count), 0);
    for (let i = 0; i < count; i++) {
      queue.push({ time: Math.max(group.delay, 0) + i * Math.max(group.interval, 0), enemy: group.enemy });
    }
  }
  return queue.sort((a, b) => a.time - b.time);
}

export function startWaveRun(wave: WaveDefinition): WaveRun {
  const multiplier = wave.healthMultiplier ?? 1;
  return {
    queue: buildSpawnQueue(wave),
    time: 0,
    healthMultiplier: Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1,
  };
}

/** Avança o relógio da onda e retira da fila os inimigos que já devem surgir (pode ser nenhum). */
export function takeDueSpawns(run: WaveRun, dt: number): EnemyType[] {
  run.time += dt;
  const due: EnemyType[] = [];
  while (run.queue.length > 0 && run.queue[0].time <= run.time) due.push(run.queue.shift()!.enemy);
  return due;
}

/**
 * Bônus por concluir a onda `waveNumber` (1-based). A última onda leva à vitória e não paga
 * bônus; números fora de 1…TOTAL_WAVES−1 também não.
 */
export function getWaveBonus(waveNumber: number): number {
  if (!Number.isInteger(waveNumber) || waveNumber < 1 || waveNumber >= TOTAL_WAVES) return 0;
  return WAVE_BONUS_BASE + WAVE_BONUS_PER_WAVE * waveNumber;
}
