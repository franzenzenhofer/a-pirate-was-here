import type { GameState } from './game-state';

const MOD32 = 0x100000000;

export function nextRandom(gs: Pick<GameState, 'randState'>): number {
  gs.randState = (gs.randState * 1664525 + 1013904223) >>> 0;
  return gs.randState / MOD32;
}

export function randomFloat(gs: Pick<GameState, 'randState'>, min: number, max: number): number {
  return min + nextRandom(gs) * (max - min);
}

export function randomInt(gs: Pick<GameState, 'randState'>, min: number, max: number): number {
  return min + Math.floor(nextRandom(gs) * (max - min + 1));
}

export function randomChance(gs: Pick<GameState, 'randState'>, chance: number): boolean {
  return nextRandom(gs) < chance;
}

export function randomPick<T>(gs: Pick<GameState, 'randState'>, values: readonly T[]): T {
  return values[Math.floor(nextRandom(gs) * values.length)] as T;
}
